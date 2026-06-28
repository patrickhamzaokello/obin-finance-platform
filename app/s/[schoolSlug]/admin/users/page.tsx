'use client';

import { useEffect, useState } from 'react';
import { getAllUsers, updateUserRole } from '@/app/actions/admin';
import { Users } from 'lucide-react';

export default function UsersList() {
  const [users, setUsers]     = useState<any[]>([]);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground mt-1">{users.length} registered member{users.length !== 1 ? 's' : ''}</p>
      </div>

      {users.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <Users className="w-8 h-8 text-border mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No members yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.05]">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Member</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {users.map((member) => {
                const initials = member.name
                  ? member.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
                  : member.email?.[0]?.toUpperCase() ?? '?';
                return (
                  <tr key={member.id} className="hover:bg-black/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{member.name || '—'}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell">{member.email}</td>
                    <td className="px-6 py-4">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as 'school_admin' | 'learner')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${
                          member.role === 'school_admin'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        <option value="learner">Learner</option>
                        <option value="school_admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">
                      {new Date(member.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
