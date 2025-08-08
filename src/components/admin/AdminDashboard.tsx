import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../common/Sidebar';
import Header from '../common/Header';
import DashboardStats from './DashboardStats';
import StudentManagement from './StudentManagement';
import PaymentManagement from './PaymentManagement';
import FeeConfiguration from './FeeConfiguration';
import Reports from './Reports';
import ChangePassword from '../common/ChangePassword';
import PrintReceipt from './BulkPrintBills';
import SMSConfiguration from './SMSConfiguration';
import DataManagement from './DataManagement';
import UserManagement from './UserManagement';
import ReceiptWiseReport from './ReceiptWiseReport';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardStats />;
      case 'students':
        return <StudentManagement />;
      case 'payments':
        return <PaymentManagement />;
      case 'fees':
        return user?.role === 'admin' ? <FeeConfiguration /> : <div className="text-center py-12"><p className="text-gray-500">Access restricted to administrators only</p></div>;
      case 'reports':
        return <Reports />;
      case 'receipt-wise-report':
        return <ReceiptWiseReport />;
      case 'print-receipt':
        return <PrintReceipt />;
      case 'sms-config':
        return user?.role === 'admin' ? <SMSConfiguration /> : <div className="text-center py-12"><p className="text-gray-500">Access restricted to administrators only</p></div>;
      case 'data-management':
        return user?.role === 'admin' ? <DataManagement /> : <div className="text-center py-12"><p className="text-gray-500">Access restricted to administrators only</p></div>;
      case 'user-management':
        return user?.role === 'admin' ? <UserManagement /> : <div className="text-center py-12"><p className="text-gray-500">Access restricted to administrators only</p></div>;
      case 'receipt-wise-report':
        return <ReceiptWiseReport />;
      case 'password':
        return <ChangePassword />;
      default:
        return <DashboardStats />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userRole={user?.role === 'admin' ? 'admin' : 'clerk'}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header 
          user={user!} 
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;