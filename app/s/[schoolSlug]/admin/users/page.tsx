'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllUsers, updateUserRole } from '@/app/actions/admin';
import { BookOpen, LayoutDashboard, Users } from 'lucide-react';

export default function UsersList() {
  const [users, setUsers]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllUsers().then((r) => {
      if (r.success) setUsers(r.data);
      setLoading(false);
    });
  }, []);

  const handleRoleChange = async (memberId: string, newRole: 'school_admin' | 'learner') => {
    const result = await updateUserRole(memberId, newRole);
    if (result.success) {
      setUsers(users.map((u) => (u.id === memberId ? { ...u, role: newRole } : u)));
    }
  };

  const navLinks = [
    { href: '/admin',         label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/courses', label: 'Courses',   icon: BookOpen },
    { href: '/admin/users',   label: 'Users',     icon: Users },
  ];

  if (loading) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3' />
          <p className='text-sm text-muted-foreground'>Loading members…</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#f9fafb]'>
      <header className='bg-white border-b border-border'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-4'>
          <div className='w-[3px] h-9 bg-primary rounded-full' />
          <div>
            <h1 className='text-xl font-bold text-foreground tracking-tight'>Member Management</h1>
            <p className='text-xs text-muted-foreground mt-0.5'>{users.length} registered member{users.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </header>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>

        <nav className='flex gap-1 mb-8 bg-white border border-border rounded p-1 w-fit'>
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition-colors ${
                href === '/admin/users'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Icon size={14} /> {label}
            </Link>
          ))}
        </nav>

        {users.length === 0 ? (
          <div className='card-accent p-10 text-center'>
            <Users className='w-8 h-8 text-border mx-auto mb-3' />
            <p className='text-sm text-muted-foreground'>No members yet.</p>
          </div>
        ) : (
          <div className='bg-white border border-border rounded overflow-hidden'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-border bg-secondary'>
                  <th className='px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider'>Name</th>
                  <th className='px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell'>Email</th>
                  <th className='px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider'>Role</th>
                  <th className='px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell'>Verified</th>
                  <th className='px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell'>Joined</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border'>
                {users.map((member) => (
                  <tr key={member.id} className='hover:bg-secondary/40 transition-colors'>
                    <td className='px-5 py-4'>
                      <p className='text-sm font-medium text-foreground'>{member.name || '—'}</p>
                      <p className='text-xs text-muted-foreground sm:hidden mt-0.5'>{member.email}</p>
                    </td>
                    <td className='px-5 py-4 text-sm text-muted-foreground hidden sm:table-cell'>{member.email}</td>
                    <td className='px-5 py-4'>
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as 'school_admin' | 'learner')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold border appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30 ${
                          member.role === 'school_admin'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-secondary text-muted-foreground border-border'
                        }`}
                      >
                        <option value='learner'>Learner</option>
                        <option value='school_admin'>Admin</option>
                      </select>
                    </td>
                    <td className='px-5 py-4 hidden md:table-cell'>
                      {member.emailVerified ? (
                        <span className='text-xs font-semibold text-accent'>Verified</span>
                      ) : (
                        <span className='text-xs text-muted-foreground'>Pending</span>
                      )}
                    </td>
                    <td className='px-5 py-4 text-sm text-muted-foreground hidden lg:table-cell'>
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className='mt-8'>
          <Link href='/admin' className='text-sm font-semibold text-primary hover:underline'>← Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
