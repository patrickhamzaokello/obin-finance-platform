'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  payment, course, school, courseEnrollment, courseAccessCode,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  initiateCollection, getCollectionStatus, IotecStatus,
} from '@/lib/iotec';
import {
  sendPaymentReceiptEmail, sendEnrollmentConfirmation,
} from '@/lib/plunk';

function rand(n = 6) {
  return Math.random().toString(36).slice(2, 2 + n);
}

// ─── Initiate a mobile money payment for a course ────────────────────────────
export async function initiateCoursePayment(courseId: string, phone: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: 'Please sign in to purchase this course.' };
    const userId = session.user.id;

    // Load course + school
    const [courseRow] = await db.select().from(course).where(eq(course.id, courseId)).limit(1);
    if (!courseRow) return { success: false, error: 'Course not found.' };
    if (!courseRow.isPublished) return { success: false, error: 'This course is not available.' };

    // Compute effective price
    const base = courseRow.price ?? 0;
    if (base === 0) return { success: false, error: 'This course is free — use the enroll button.' };

    const effectivePrice = (courseRow.discountActive && (courseRow.discountPercent ?? 0) > 0)
      ? Math.round(base * (1 - (courseRow.discountPercent ?? 0) / 100))
      : base;

    if (effectivePrice < 500) {
      return { success: false, error: 'Course price is below minimum transaction amount (UGX 500).' };
    }

    // Check already enrolled
    const existing = await db.select({ id: courseEnrollment.id })
      .from(courseEnrollment)
      .where(and(eq(courseEnrollment.userId, userId), eq(courseEnrollment.courseId, courseId)))
      .limit(1);
    if (existing.length) return { success: false, error: 'You are already enrolled in this course.' };

    // Check pending/successful payment
    const existingPayment = await db.select({ id: payment.id, status: payment.status })
      .from(payment)
      .where(and(eq(payment.userId, userId), eq(payment.courseId, courseId)))
      .orderBy(payment.createdAt)
      .limit(1);
    if (existingPayment.some(p => p.status === 'success')) {
      return { success: false, error: 'You have already paid for this course. Refresh the page.' };
    }
    if (existingPayment.some(p => p.status === 'pending')) {
      return { success: false, error: 'A payment is already in progress for this course. Please wait.' };
    }

    // Create payment record
    const externalId = `pay-${Date.now()}-${rand()}`;
    const paymentId  = `payment-${Date.now()}-${rand()}`;
    const courseTitle = courseRow.title;

    await db.insert(payment).values({
      id: paymentId,
      userId,
      courseId,
      schoolId: courseRow.schoolId,
      phone,
      amount: effectivePrice,
      status: 'pending',
      externalId,
    });

    // Initiate ioTec collection
    let iotecResp;
    try {
      iotecResp = await initiateCollection(
        effectivePrice,
        phone,
        externalId,
        `Payment for: ${courseTitle}`,
      );
    } catch (err) {
      // Mark payment failed and surface the error
      await db.update(payment).set({ status: 'failed', statusMessage: String(err) })
        .where(eq(payment.id, paymentId));
      console.error('[payments] ioTec initiation failed:', err);
      return { success: false, error: 'Could not connect to payment service. Please try again.' };
    }

    // Save ioTec transaction ID
    await db.update(payment)
      .set({ iotecTransactionId: iotecResp.id })
      .where(eq(payment.id, paymentId));

    return {
      success: true,
      data: {
        paymentId,
        iotecTransactionId: iotecResp.id,
        externalId,
        status: iotecResp.status,
        amount: effectivePrice,
      },
    };
  } catch (error) {
    console.error('[payments] initiateCoursePayment error:', error);
    return { success: false, error: 'Payment initiation failed. Please try again.' };
  }
}

// ─── Poll payment status (called by client every few seconds) ────────────────
export async function getPaymentStatus(paymentId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const [row] = await db.select().from(payment)
      .where(and(eq(payment.id, paymentId), eq(payment.userId, session.user.id)))
      .limit(1);

    if (!row) return { success: false, error: 'Payment not found' };

    // Already resolved — return cached status
    if (row.status === 'success' || row.status === 'failed') {
      return { success: true, data: { status: row.status, statusMessage: row.statusMessage } };
    }

    // Still pending — poll ioTec
    if (!row.iotecTransactionId) {
      return { success: true, data: { status: 'pending', statusMessage: 'Initialising...' } };
    }

    const iotecResp = await getCollectionStatus(row.iotecTransactionId);
    const newStatus = resolveStatus(iotecResp.status);

    if (newStatus !== 'pending') {
      await db.update(payment)
        .set({ status: newStatus, statusMessage: iotecResp.statusMessage ?? null, updatedAt: new Date() })
        .where(eq(payment.id, paymentId));

      if (newStatus === 'success') {
        await fulfillPayment(row, session.user);
      }
    }

    return { success: true, data: { status: newStatus, statusMessage: iotecResp.statusMessage } };
  } catch (error) {
    console.error('[payments] getPaymentStatus error:', error);
    return { success: false, error: 'Failed to check payment status.' };
  }
}

// ─── Fulfillment — called on Success from both poll & webhook ────────────────
export async function fulfillPayment(
  row: { id: string; userId: string; courseId: string; schoolId: string | null; phone: string; amount: number },
  user: { id: string; name?: string | null; email: string },
) {
  // 1. Create enrollment
  const [courseRow] = await db.select().from(course).where(eq(course.id, row.courseId)).limit(1);
  const [schoolRow] = row.schoolId
    ? await db.select().from(school).where(eq(school.id, row.schoolId)).limit(1)
    : [null];

  const commissionPercent = schoolRow?.commissionPercent ?? 0;
  const platformFee = Math.round(row.amount * commissionPercent / 100);

  // Upsert enrollment (idempotent)
  const existingEnroll = await db.select({ id: courseEnrollment.id })
    .from(courseEnrollment)
    .where(and(eq(courseEnrollment.userId, row.userId), eq(courseEnrollment.courseId, row.courseId)))
    .limit(1);

  if (!existingEnroll.length) {
    await db.insert(courseEnrollment).values({
      id:                `enrollment-${Date.now()}-${rand()}`,
      userId:            row.userId,
      courseId:          row.courseId,
      priceAtEnrollment: row.amount,
      platformFee,
    });
  }

  // 2. Auto-generate and activate an access code
  const codeValue = `AUTO-${Date.now()}-${rand(8).toUpperCase()}`;
  await db.insert(courseAccessCode).values({
    id:        `code-${Date.now()}-${rand()}`,
    courseId:  row.courseId,
    code:      codeValue,
    createdBy: 'system',
    usedBy:    row.userId,
    usedAt:    new Date(),
    label:     `Auto-generated on payment ${row.id}`,
  });

  revalidatePath('/dashboard');

  // 3. Send confirmation email (non-blocking)
  const courseUrl = `${process.env.BETTER_AUTH_URL ?? ''}/course/${row.courseId}`;

  sendPaymentReceiptEmail({
    email:       user.email,
    name:        user.name ?? user.email,
    courseTitle: courseRow?.title ?? 'your course',
    amount:      row.amount,
    phone:       row.phone,
    courseUrl,
  }).catch(console.error);

  if (schoolRow) {
    sendEnrollmentConfirmation({
      email:       user.email,
      name:        user.name ?? user.email,
      courseTitle: courseRow?.title ?? 'your course',
      schoolName:  schoolRow.name,
      courseUrl,
    }).catch(console.error);
  }
}

// Map ioTec statuses to our simplified set
function resolveStatus(iotecStatus: IotecStatus): 'pending' | 'success' | 'failed' {
  if (iotecStatus === 'Success')      return 'success';
  if (iotecStatus === 'Failed')       return 'failed';
  return 'pending'; // Pending | SentToVendor both stay pending
}
