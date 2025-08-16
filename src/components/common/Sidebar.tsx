import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings, 
  FileText, 
  Receipt, 
  MessageSquare,
  Database,
  UserCog,
  Lock,
  X,
  Menu
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: 'admin' | 'clerk' | 'sarvodaya';
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}) => {
  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Student Management', icon: Users },
    { id: 'payments', label: 'Payment Management', icon: CreditCard },
    { id: 'fees', label: 'Fee Configuration', icon: Settings },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'receipt-wise-report', label: 'Receipt Wise Report', icon: Receipt },
    { id: 'print-receipt', label: 'Bulk Print Bills', icon: Receipt },
    { id: 'sms-config', label: 'SMS Configuration', icon: MessageSquare },
    { id: 'data-management', label: 'Data Management', icon: Database },
    { id: 'user-management', label: 'User Management', icon: UserCog },
    { id: 'password', label: 'Change Password', icon: Lock },
  ];

  const clerkMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Student Management', icon: Users },
    { id: 'payments', label: 'Payment Management', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'receipt-wise-report', label: 'Receipt Wise Report', icon: Receipt },
    { id: 'print-receipt', label: 'Bulk Print Bills', icon: Receipt },
    { id: 'password', label: 'Change Password', icon: Lock },
  ];

  const sarvodayaMenuItems = [
    { id: 'dashboard', label: 'Reports', icon: FileText },
    { id: 'receipt-wise-report', label: 'Receipt Wise Report', icon: Receipt },
    { id: 'password', label: 'Change Password', icon: Lock },
  ];

  const getMenuItems = () => {
    switch (userRole) {
      case 'admin':
        return adminMenuItems;
      case 'clerk':
        return clerkMenuItems;
      case 'sarvodaya':
        return sarvodayaMenuItems;
      default:
        return clerkMenuItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Fee Management</h1>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`
                      w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200
                      ${activeTab === item.id
                        ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;