// apps/frontend/src/components/layout/Topbar.jsx
import { useLocation } from 'react-router';
import { useAuth } from '../../App.jsx';

function getPageTitle(pathname) {
  if (pathname === '/') return 'Dashboard';
  if (pathname === '/jobs') return 'Jobs';
  if (pathname.startsWith('/jobs/')) return 'Job Detail';
  return 'Taskwave';
}

export default function Topbar() {
  const location = useLocation();
  const { user } = useAuth();
  const title = getPageTitle(location.pathname);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-medium">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <span className="text-sm text-gray-700 font-medium hidden sm:inline">{user?.name || 'User'}</span>
      </div>
    </header>
  );
}