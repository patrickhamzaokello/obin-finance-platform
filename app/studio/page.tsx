import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Creator Studio' };

import Link from 'next/link';
import { getAllCourses, getAllUsers } from '@/app/actions/admin';
import { getCurrentSchool } from '@/lib/school-context';
import { BookOpen, Users, TrendingUp, Heart, ChevronRight, Plus, ExternalLink } from 'lucide-react';

export default async function AdminDashboard() {
  const [s, coursesResult, usersResult] = await Promise.all([
    getCurrentSchool(),
    getAllCourses(),
    getAllUsers(),
  ]);

  const courses        = (coursesResult.success ? coursesResult.data : []) ?? [];
  const members        = (usersResult.success   ? usersResult.data   : []) ?? [];
  const publishedCount = courses.filter((c: any) => c.isPublished).length;
  const fanCount       = members.filter((m: any) => m.role === 'learner').length;

  const stats = [
    { label: 'Classes',    value: courses.length, icon: BookOpen,   color: 'bg-blue-50 text-blue-600' },
    { label: 'Published',  value: publishedCount, icon: TrendingUp, color: 'bg-green-50 text-green-600' },
    { label: 'Total Fans', value: members.length, icon: Users,      color: 'bg-purple-50 text-purple-600' },
    { label: 'Active Fans',value: fanCount,       icon: Heart,      color: 'bg-pink-50 text-pink-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Page title */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{s?.name ?? 'Creator'} Studio</h1>
          <p className="text-sm text-muted-foreground mt-1">Your creator dashboard</p>
        </div>
        {s?.slug && (
          <a href={`/creator/${s.slug}`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white shadow-sm text-xs font-semibold text-muted-foreground rounded-xl hover:text-primary transition-colors border border-black/[0.06]">
            <ExternalLink size={12} /> View public profile
          </a>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={17} />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent courses */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between border-b border-black/[0.05]">
          <div>
            <h2 className="text-base font-semibold text-foreground">Your Classes</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{courses.length} total</p>
          </div>
          <Link href="/studio/courses/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors">
            <Plus size={13} /> New Class
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <BookOpen className="w-8 h-8 text-border mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">No classes yet. Create your first class to start earning.</p>
            <Link href="/studio/courses/new" className="text-sm font-semibold text-primary hover:underline">
              Create your first class →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.05]">
            {courses.slice(0, 6).map((c: any) => (
              <div key={c.id} className="flex items-center gap-5 px-6 py-5 hover:bg-black/[0.015] transition-colors group">

                {/* Thumbnail — 16:9 YouTube-style */}
                <div className="shrink-0 w-48 rounded-xl overflow-hidden shadow-sm bg-secondary" style={{ aspectRatio: '16/9' }}>
                  {c.thumbnail
                    ? <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
                        <BookOpen size={28} className="text-primary/40" />
                      </div>
                  }
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-foreground leading-snug mb-1">{c.title}</p>
                  {c.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{c.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {c.instructor && (
                      <p className="text-xs text-muted-foreground">By {c.instructor}</p>
                    )}
                    {(c.price ?? 0) === 0 ? (
                      <span className="text-xs font-semibold text-primary">Free</span>
                    ) : (
                      <span className="text-xs font-semibold text-foreground">
                        UGX {(c.discountActive && (c.discountPercent ?? 0) > 0
                          ? Math.round((c.price ?? 0) * (1 - (c.discountPercent ?? 0) / 100))
                          : (c.price ?? 0)
                        ).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status + action */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    c.isPublished ? 'bg-green-50 text-green-700' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {c.isPublished ? 'Live' : 'Draft'}
                  </span>
                  <Link
                    href={`/studio/courses/${c.id}`}
                    className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {courses.length > 6 && (
          <div className="px-6 py-4 border-t border-black/[0.05]">
            <Link href="/studio/courses" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              View all classes <ChevronRight size={14} />
            </Link>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/studio/courses" className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
            <BookOpen size={18} className="text-blue-600" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Manage Classes</h3>
          <p className="text-sm text-muted-foreground mb-4">Create, edit, and publish class content for your fans.</p>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
            Go to Classes <ChevronRight size={14} />
          </span>
        </Link>
        <Link href="/studio/users" className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
            <Users size={18} className="text-purple-600" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Your Fans</h3>
          <p className="text-sm text-muted-foreground mb-4">See who has joined and is learning from your classes.</p>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
            View Fans <ChevronRight size={14} />
          </span>
        </Link>
        <Link href="/studio/messages" className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center mb-4">
            <Heart size={18} className="text-pink-600" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Feedback</h3>
          <p className="text-sm text-muted-foreground mb-4">Read messages and reviews from your fans.</p>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
            View Feedback <ChevronRight size={14} />
          </span>
        </Link>
      </div>
    </div>
  );
}
