import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Wrench,
  Car,
  Settings,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const getMenuItems = () => {
    if (profile?.role === 'admin') {
      return [
        { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/admin/service-requests', icon: FileText, label: 'Service Requests' },
        { to: '/admin/mechanics', icon: Wrench, label: 'Mechanics' },
        { to: '/admin/customers', icon: Users, label: 'Customers' },
        { to: '/admin/vehicles', icon: Car, label: 'Vehicles' },
      ];
    } else if (profile?.role === 'mechanic') {
      return [
        { to: '/mechanic', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/mechanic/queue', icon: FileText, label: 'Service Queue' },
        { to: '/mechanic/completed', icon: FileText, label: 'Completed' },
      ];
    } else {
      return [
        { to: '/customer', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/customer/new-request', icon: FileText, label: 'New Service Request' },
        { to: '/customer/my-requests', icon: FileText, label: 'My Requests' },
        { to: '/customer/vehicles', icon: Car, label: 'My Vehicles' },
      ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-64 bg-gray-900 dark:bg-gray-950
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static
        `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center space-x-2">
              <Wrench className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold text-white">AutoService</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-3">
              {menuItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="border-t border-gray-800 p-4">
            <div className="mb-3 px-4">
              <p className="text-sm font-medium text-white">{profile?.full_name}</p>
              <p className="text-xs text-gray-400 capitalize">{profile?.role}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 px-4 py-3 w-full text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
