import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
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

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { students, payments } = useData();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardStats />;
      case 'students':
        return <StudentManagement />;
      case 'payments':
        return <PaymentManagement />;
      case 'fees':
        return <FeeConfiguration />;
      case 'reports':
        return <Reports />;
      case 'print-receipt':
        return <PrintReceipt />;
      case 'sms-config':
        return <SMSConfiguration />;
      case 'whatsapp-config':
        return <WhatsAppConfiguration />;
      case 'data-management':
        return <DataManagement />;
      case 'user-management':
        return <UserManagement />;
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
        userRole="admin"
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