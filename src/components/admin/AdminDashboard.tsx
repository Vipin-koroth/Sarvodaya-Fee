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
import SarvodayaCollection from './SarvodayaCollection';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return user?.role === 'sarvodaya' ? <Reports /> : <DashboardStats />;
      case 'collection':
        return user?.role === 'sarvodaya' ? <SarvodayaCollection /> : <div className="text-center py-12"><p className="text-gray-500">Access restricted</p></div>;
      case 'students':
        return user?.role === 'sarvodaya' ? <div className="text-center py-12"><p className="text-gray-500">Access restricted</p></div> : <StudentManagement />;
      case 'payments':
        return user?.role === 'sarvodaya' ? <div className="text-center py-12"><p className="text-gray-500">Access restricted</p></div> : <PaymentManagement />;
      case 'fees':
        return user?.role === 'admin' ? <FeeConfiguration /> : <div className="text-center py-12"><p className="text-gray-500">Access restricted to administrators only</p></div>;
      case 'reports':
        return <Reports />;
      case 'receipt-wise-report':
        return <ReceiptWiseReport />;
      case 'print-receipt':
        return user?.role === 'sarvodaya' ? <div className="text-center py-12"><p className="text-gray-500">Access restricted</p></div> : <PrintReceipt />;
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
        return user?.role === 'sarvodaya' ? <Reports /> : <DashboardStats />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userRole={user?.role === 'admin' ? 'admin' : user?.role === 'clerk' ? 'clerk' : user?.role === 'sarvodaya' ? 'sarvodaya' : 'clerk'}
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