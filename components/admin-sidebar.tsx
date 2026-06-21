import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  const isActive = (path: string) => pathname.startsWith(path);

  const menuItems = [
    { label: 'Dashboard', href: '/admin', icon: '📊' },
    { label: 'Courses', href: '/admin/courses', icon: '📚' },
    { label: 'Users', href: '/admin/users', icon: '👥' },
  ];

  return (
    <div className={`${isOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white min-h-screen transition-all duration-300 flex flex-col`}>
      <div className='p-4 flex items-center justify-between border-b border-slate-700'>
        {isOpen && <h1 className='font-bold text-lg'>Obin Admin</h1>}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className='p-2 hover:bg-slate-800 rounded transition'
        >
          {isOpen ? '←' : '→'}
        </button>
      </div>

      <nav className='flex-1 p-4 space-y-2'>
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              isActive(item.href)
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-slate-800'
            }`}
          >
            <span className='text-xl'>{item.icon}</span>
            {isOpen && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className='p-4 border-t border-slate-700'>
        <Link
          href='/'
          className='flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-slate-800 transition'
        >
          <span className='text-xl'>🏠</span>
          {isOpen && <span>Back to App</span>}
        </Link>
      </div>
    </div>
  );
}
