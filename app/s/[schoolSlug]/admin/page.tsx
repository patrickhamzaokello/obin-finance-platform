import Link from 'next/link';
import { getAllCourses, getAllUsers } from '@/app/actions/admin';
import { getCurrentSchool } from '@/lib/school-context';
import { BookOpen, Users, TrendingUp, GraduationCap, ChevronRight, Plus } from 'lucide-react';

export default async function AdminDashboard() {
  const [s, coursesResult, usersResult] = await Promise.all([
    getCurrentSchool(),
    getAllCourses(),
    getAllUsers(),
  ]);

  const courses        = coursesResult.success ? coursesResult.data : [];
  const members        = usersResult.success   ? usersResult.data   : [];
  const publishedCount = courses.filter((c: any) => c.isPublished).length;
  const learnerCount   = members.filter((m: any) => m.role === 'learner').length;

  const stats = [
    { label: 'Total Courses',     value: courses.length,   icon: BookOpen,     color: 'bg-blue-50 text-blue-600' },
    { label: 'Published',         value: publishedCount,   icon: TrendingUp,   color: 'bg-green-50 text-green-600' },
    { label: 'Members',           value: members.length,   icon: Users,        color: 'bg-purple-50 text-purple-600' },
    { label: 'Active Learners',   value: learnerCount,     icon: GraduationCap, color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{s?.name ?? 'School'}</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your learning platform</p>
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
            <h2 className="text-base font-semibold text-foreground">Courses</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{courses.length} total</p>
          </div>
          <Link
            href="/admin/courses/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus size={13} /> New Course
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <BookOpen className="w-8 h-8 text-border mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">No courses yet.</p>
            <Link href="/admin/courses/new" className="text-sm font-semibold text-primary hover:underline">
              Create your first course →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04]">
            {courses.slice(0, 6).map((c: any) => (
              <div key={c.id} className="flex items-center gap-4 px-6 py-4 hover:bg-black/[0.02] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-secondary overflow-hidden shrink-0">
                  {c.thumbnail
                    ? <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><BookOpen size={15} className="text-border" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.instructor || 'No instructor'}</p>
                </div>
                <span className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                  c.isPublished ? 'bg-green-50 text-green-700' : 'bg-secondary text-muted-foreground'
                }`}>
                  {c.isPublished ? 'Live' : 'Draft'}
                </span>
                <Link href={`/admin/courses/${c.id}`} className="shrink-0 text-xs font-semibold text-primary hover:underline">
                  Edit
                </Link>
              </div>
            ))}
          </div>
        )}

        {courses.length > 6 && (
          <div className="px-6 py-4 border-t border-black/[0.05]">
            <Link href="/admin/courses" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              View all courses <ChevronRight size={14} />
            </Link>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/courses" className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
            <BookOpen size={18} className="text-blue-600" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Course Management</h3>
          <p className="text-sm text-muted-foreground mb-4">Create, edit, and manage course content.</p>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
            Go to Courses <ChevronRight size={14} />
          </span>
        </Link>
        <Link href="/admin/users" className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
            <Users size={18} className="text-purple-600" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Member Management</h3>
          <p className="text-sm text-muted-foreground mb-4">Manage school members and roles.</p>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
            Go to Members <ChevronRight size={14} />
          </span>
        </Link>
      </div>
    </div>
  );
}
