'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllUsers, updateUserRole } from '@/app/actions/admin';

export default function UsersList() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      const result = await getAllUsers();
      if (result.success) {
        setUsers(result.data);
      }
      setLoading(false);
    };

    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'learner' | 'admin') => {
    const result = await updateUserRole(userId, newRole);
    if (result.success) {
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-lg text-gray-600'>Loading users...</div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='bg-white shadow'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <h1 className='text-3xl font-bold text-gray-900'>User Management</h1>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='mb-6'>
          <h2 className='text-2xl font-bold text-gray-900'>All Users</h2>
          <p className='text-gray-600 mt-1'>Total: {users.length}</p>
        </div>

        {users.length === 0 ? (
          <div className='bg-white rounded-lg shadow p-8 text-center'>
            <p className='text-gray-600'>No users found.</p>
          </div>
        ) : (
          <div className='bg-white rounded-lg shadow overflow-hidden'>
            <table className='w-full'>
              <thead className='bg-gray-100 border-b'>
                <tr>
                  <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Name</th>
                  <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Email</th>
                  <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Role</th>
                  <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Email Verified</th>
                  <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Joined</th>
                  <th className='px-6 py-3 text-left text-sm font-semibold text-gray-900'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {users.map((user) => (
                  <tr key={user.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 text-sm text-gray-900'>{user.name || 'N/A'}</td>
                    <td className='px-6 py-4 text-sm text-gray-600'>{user.email}</td>
                    <td className='px-6 py-4 text-sm'>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as 'learner' | 'admin')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 border-purple-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                        }`}
                      >
                        <option value='learner'>Learner</option>
                        <option value='admin'>Admin</option>
                      </select>
                    </td>
                    <td className='px-6 py-4 text-sm'>
                      {user.emailVerified ? (
                        <span className='text-green-600 font-semibold'>Yes</span>
                      ) : (
                        <span className='text-yellow-600'>No</span>
                      )}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className='px-6 py-4 text-sm'>
                      <button className='text-blue-600 hover:text-blue-700 font-semibold'>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className='mt-8'>
          <Link href='/admin' className='text-blue-600 hover:text-blue-700 font-semibold'>
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
