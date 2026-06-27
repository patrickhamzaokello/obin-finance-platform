import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAllCourses, getAllUsers } from '@/app/actions/admin';
import { isPlatformOwner, getCurrentMembership, getCurrentSchool } from '@/lib/school-context';
import { BookOpen, Users, LayoutDashboard, ChevronRight } from 'lucide-react';
import { SignOutButton } from '@/components/sign-out-button';

export default async function AdminDashboard() {
  const [isOwner, membership] = await Promise.all([isPlatformOwner(), getCurrentMembership()]);
  const isAdmin = isOwner || membership?.role === 'school_admin';
  if (!isAdmin) redirect('/sign-in');

  const s = await getCurrentSchool();

  const coursesResult = await getAllCourses();
  const usersResult   = await getAllUsers();

  const courses       = coursesResult.success ? coursesResult.data : [];
  const members       = usersResult.success   ? usersResult.data   : [];
  const publishedCount = courses.filter((c: any) => c.isPublished).length;
  const adminCount     = members.filter((m: any) => m.role === 'school_admin').length;

  const stats = [
    { label: 'Total Courses', value: courses.length },
    { label: 'Published',     value: publishedCount },
    { label: 'Members',       value: members.length },
    { label: 'Admins',        value: adminCount },
  ];

  const navLinks = [
    { href: '/admin',         label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/courses', label: 'Courses',   icon: BookOpen },
    { href: '/admin/users',   label: 'Users',     icon: Users },
  ];

  return (
    <div className='min-h-screen bg-[#f9fafb]'>
      <header className='bg-white border-b border-border'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div className='w-[3px] h-9 bg-primary rounded-full' />
            <div>
              <h1 className='text-xl font-bold text-foreground tracking-tight'>Admin Panel</h1>
              <p className='text-xs text-muted-foreground mt-0.5'>{s?.name ?? 'School'} Learning Platform</p>
            </div>
          </div>
          <SignOutButton className='px-4 py-2 text-sm font-semibold border border-border text-foreground rounded hover:bg-secondary transition-colors' />
        </div>
      </header>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>

        <nav className='flex gap-1 mb-8 bg-white border border-border rounded p-1 w-fit'>
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition-colors ${
                href === '/admin'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Icon size={14} /> {label}
            </Link>
          ))}
        </nav>

        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10'>
          {stats.map(({ label, value }) => (
            <div key={label} className='card-accent p-5'>
              <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>{label}</p>
              <p className='text-3xl font-bold text-foreground mt-2'>{value}</p>
            </div>
          ))}
        </div>

        <section className='mb-10'>
          <div className='flex items-center justify-between mb-5'>
            <h2 className='text-base font-semibold text-foreground'>Recent Courses</h2>
            <Link href='/admin/courses/new'
              className='inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded hover:bg-primary/90 transition-colors'>
              + New Course
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className='card-accent p-8 text-center'>
              <p className='text-sm text-muted-foreground mb-3'>No courses yet.</p>
              <Link href='/admin/courses/new' className='text-sm font-semibold text-primary hover:underline'>
                Create your first course →
              </Link>
            </div>
          ) : (
            <div className='bg-white border border-border rounded overflow-hidden'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-border bg-secondary'>
                    <th className='px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider'>Title</th>
                    <th className='px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell'>Instructor</th>
                    <th className='px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider'>Status</th>
                    <th className='px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider'>Action</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border'>
                  {courses.slice(0, 5).map((c: any) => (
                    <tr key={c.id} className='hover:bg-secondary/50 transition-colors'>
                      <td className='px-5 py-4 text-sm font-medium text-foreground'>{c.title}</td>
                      <td className='px-5 py-4 text-sm text-muted-foreground hidden sm:table-cell'>{c.instructor || '—'}</td>
                      <td className='px-5 py-4'>
                        <span className={c.isPublished ? 'badge-published' : 'badge-draft'}>
                          {c.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className='px-5 py-4'>
                        <Link href={`/admin/courses/${c.id}`} className='text-sm font-semibold text-primary hover:underline'>Edit</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='card-accent p-6'>
            <div className='flex items-center gap-3 mb-3'>
              <BookOpen size={16} className='text-primary' />
              <h3 className='font-semibold text-foreground'>Course Management</h3>
            </div>
            <p className='text-sm text-muted-foreground mb-4'>Create, edit, and manage courses and content.</p>
            <Link href='/admin/courses' className='inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline'>
              Go to Courses <ChevronRight size={14} />
            </Link>
          </div>
          <div className='card-accent p-6'>
            <div className='flex items-center gap-3 mb-3'>
              <Users size={16} className='text-primary' />
              <h3 className='font-semibold text-foreground'>Member Management</h3>
            </div>
            <p className='text-sm text-muted-foreground mb-4'>Manage school members and admin roles.</p>
            <Link href='/admin/users' className='inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline'>
              Go to Members <ChevronRight size={14} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
