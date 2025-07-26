import React, { useState } from 'react';
import { Trash2, AlertTriangle, Download, RefreshCw, Mail, Calendar } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const DataManagement: React.FC = () => {
  const { students, payments, importStudents } = useData();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState<'students' | 'payments' | 'all'>('all');
  const [emailBackupEnabled, setEmailBackupEnabled] = useState(false);
  const [backupEmail, setBackupEmail] = useState('kvipin00@gmail.com');
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);

  // Load backup settings on component mount
  React.useEffect(() => {
    const savedBackupEnabled = localStorage.getItem('emailBackupEnabled') === 'true';
    const savedBackupEmail = localStorage.getItem('backupEmail') || 'kvipin00@gmail.com';
    const savedLastBackup = localStorage.getItem('lastBackupDate');
    
    setEmailBackupEnabled(savedBackupEnabled);
    setBackupEmail(savedBackupEmail);
    setLastBackupDate(savedLastBackup);
    
    // Setup weekly backup if enabled
    if (savedBackupEnabled) {
      setupWeeklyBackup();
    }
  }, []);

  const setupWeeklyBackup = () => {
    // Clear any existing backup interval
    const existingInterval = localStorage.getItem('backupIntervalId');
    if (existingInterval) {
      clearInterval(parseInt(existingInterval));
    }

    // Set up new weekly backup (every 7 days = 604800000 ms)
    const intervalId = setInterval(() => {
      sendWeeklyBackup();
    }, 604800000); // 7 days in milliseconds

    localStorage.setItem('backupIntervalId', intervalId.toString());
    
    // Also check if we need to send backup now
    const lastBackup = localStorage.getItem('lastBackupDate');
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 604800000);
    
    if (!lastBackup || new Date(lastBackup) < oneWeekAgo) {
      sendWeeklyBackup();
    }
  };

  const sendWeeklyBackup = async () => {
    try {
      console.log('Starting backup process...');
      
      const backupData = {
        students: students,
        payments: payments,
        timestamp: new Date().toISOString(),
        totalStudents: students.length,
        totalPayments: payments.length,
        totalCollection: payments.reduce((sum, p) => sum + p.totalAmount, 0)
      };

      console.log('Backup data prepared:', backupData);

      // Create CSV content for students
      const studentsCSV = generateStudentsCSV();
      const paymentsCSV = generatePaymentsCSV();
      
      console.log('CSV data generated, students length:', studentsCSV.length, 'payments length:', paymentsCSV.length);
      
      // Send email using EmailJS
      const emailData = {
        to_email: backupEmail,
        subject: `Sarvodaya School Weekly Backup - ${new Date().toLocaleDateString('en-GB')}`,
        message: `
Weekly Backup Report for Sarvodaya School Fee Management System

Backup Date: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}

Summary:
- Total Students: ${backupData.totalStudents}
- Total Payments: ${backupData.totalPayments}
- Total Collection: ₹${backupData.totalCollection.toLocaleString()}

CSV files are attached with complete data.

This is an automated backup from your school management system.
        `,
        students_csv: studentsCSV,
        payments_csv: paymentsCSV
      };

      console.log('Attempting to send email to:', backupEmail);
      
      const { EmailService } = await import('../../lib/emailService');
      const success = await EmailService.sendBackupEmail(emailData);
      
      if (success) {
        const now = new Date().toISOString();
        localStorage.setItem('lastBackupDate', now);
        setLastBackupDate(now);
        
        console.log('Weekly backup sent successfully');
        alert('✅ Weekly backup sent successfully via email!');
      } else {
        throw new Error('Email service returned false');
      }
      
    } catch (error) {
      console.error('Failed to send weekly backup:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Detailed error:', errorMessage);
      
      alert(`❌ Failed to send weekly backup via email: ${errorMessage}\n\nPlease check:\n1. EmailJS service is configured\n2. Template exists\n3. Internet connection\n\nFalling back to file download...`);
      
      // Fallback to manual download
      console.log('Falling back to manual download...');
      const studentsCSV = generateStudentsCSV();
      const paymentsCSV = generatePaymentsCSV();
      
      const studentsBlob = new Blob([studentsCSV], { type: 'text/csv' });
      const paymentsBlob = new Blob([paymentsCSV], { type: 'text/csv' });
      
      const studentsUrl = URL.createObjectURL(studentsBlob);
      const paymentsUrl = URL.createObjectURL(paymentsBlob);
      
      // Auto-download backup files
      const studentsLink = document.createElement('a');
      studentsLink.href = studentsUrl;
      studentsLink.download = `students_backup_${new Date().toISOString().slice(0, 10)}.csv`;
      studentsLink.click();
      
      const paymentsLink = document.createElement('a');
      paymentsLink.href = paymentsUrl;
      paymentsLink.download = `payments_backup_${new Date().toISOString().slice(0, 10)}.csv`;
      paymentsLink.click();
      
      URL.revokeObjectURL(studentsUrl);
      URL.revokeObjectURL(paymentsUrl);
    }
  };

  const generateStudentsCSV = () => {
    const headers = ['Admission No', 'Name', 'Mobile', 'Class', 'Division', 'Bus Stop', 'Bus Number', 'Trip Number'];
    const csvData = students.map(student => [
      student.admissionNo,
      student.name,
      student.mobile,
      student.class,
      student.division,
      student.busStop,
      student.busNumber,
      student.tripNumber
    ]);
    return [headers, ...csvData].map(row => row.join(',')).join('\n');
  };

  const generatePaymentsCSV = () => {
    const headers = [
      'Payment ID', 'Student Name', 'Admission No', 'Class', 'Division',
      'Development Fee', 'Bus Fee', 'Special Fee', 'Special Fee Type',
      'Total Amount', 'Payment Date', 'Added By'
    ];
    const csvData = payments.map(payment => [
      payment.id,
      payment.studentName,
      payment.admissionNo,
      payment.class,
      payment.division,
      payment.developmentFee,
      payment.busFee,
      payment.specialFee,
      payment.specialFeeType,
      payment.totalAmount,
      new Date(payment.paymentDate).toLocaleDateString('en-GB'),
      payment.addedBy
    ]);
    return [headers, ...csvData].map(row => row.join(',')).join('\n');
  };


  const toggleEmailBackup = () => {
    const newState = !emailBackupEnabled;
    setEmailBackupEnabled(newState);
    localStorage.setItem('emailBackupEnabled', newState.toString());
    localStorage.setItem('backupEmail', backupEmail);
    
    if (newState) {
      setupWeeklyBackup();
      alert('Weekly email backup enabled! Backups will be sent every Sunday.');
    } else {
      const intervalId = localStorage.getItem('backupIntervalId');
      if (intervalId) {
        clearInterval(parseInt(intervalId));
        localStorage.removeItem('backupIntervalId');
      }
      alert('Weekly email backup disabled.');
    }
  };

  const clearData = () => {
    switch (actionType) {
      case 'students':
        clearStudentsData();
        break;
      case 'payments':
        clearPaymentsData();
        break;
      case 'all':
        clearAllDataToDefault();
        break;
    }
  };

  const clearStudentsData = async () => {
    try {
      // Check if using Supabase
      const isSupabaseConfigured = !!(
        import.meta.env.VITE_SUPABASE_URL && 
        import.meta.env.VITE_SUPABASE_ANON_KEY &&
        import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_project_url' &&
        import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your_supabase_anon_key'
      );

      if (isSupabaseConfigured) {
        // Clear from Supabase
        const { supabase } = await import('../../lib/supabase');
        const { error } = await supabase
          .from('students')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
        
        if (error) {
          console.error('Error clearing students from Supabase:', error);
          alert('Failed to clear students from database: ' + error.message);
          return;
        }
        console.log('Students cleared from Supabase successfully');
      } else {
        // Clear from localStorage
        localStorage.removeItem('students');
        console.log('Students cleared from localStorage');
      }
      
      alert('All students cleared successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error clearing students:', error);
      alert('Failed to clear students: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const clearPaymentsData = async () => {
    try {
      // Check if using Supabase
      const isSupabaseConfigured = !!(
        import.meta.env.VITE_SUPABASE_URL && 
        import.meta.env.VITE_SUPABASE_ANON_KEY &&
        import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_project_url' &&
        import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your_supabase_anon_key'
      );

      if (isSupabaseConfigured) {
        // Clear from Supabase
        const { supabase } = await import('../../lib/supabase');
        const { error } = await supabase
          .from('payments')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
        
        if (error) {
          console.error('Error clearing payments from Supabase:', error);
          alert('Failed to clear payments from database: ' + error.message);
          return;
        }
        console.log('Payments cleared from Supabase successfully');
      } else {
        // Clear from localStorage
        localStorage.removeItem('payments');
        console.log('Payments cleared from localStorage');
      }
      
      alert('All payments cleared successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error clearing payments:', error);
      alert('Failed to clear payments: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const clearAllDataToDefault = async () => {
    try {
      // Check if using Supabase
      const isSupabaseConfigured = !!(
        import.meta.env.VITE_SUPABASE_URL && 
        import.meta.env.VITE_SUPABASE_ANON_KEY &&
        import.meta.env.VITE_SUPABASE_URL !== 'your_supabase_project_url' &&
        import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your_supabase_anon_key'
      );

      if (isSupabaseConfigured) {
        // Clear from Supabase
        const { supabase } = await import('../../lib/supabase');
        
        // Clear payments first (due to foreign key constraints)
        const { error: paymentsError } = await supabase
          .from('payments')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (paymentsError) {
          console.error('Error clearing payments:', paymentsError);
          alert('Failed to clear payments: ' + paymentsError.message);
          return;
        }

        // Clear students
        const { error: studentsError } = await supabase
          .from('students')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (studentsError) {
          console.error('Error clearing students:', studentsError);
          alert('Failed to clear students: ' + studentsError.message);
          return;
        }

        // Clear fee config
        const { error: feeConfigError } = await supabase
          .from('fee_config')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (feeConfigError) {
          console.error('Error clearing fee config:', feeConfigError);
          // Don't return here as fee config clearing is less critical
        }

        console.log('All data cleared from Supabase successfully');
      } else {
        // Clear from localStorage
        localStorage.removeItem('students');
        localStorage.removeItem('payments');
        localStorage.removeItem('feeConfig');
        console.log('All data cleared from localStorage');
      }
      
      // Also clear user credentials and SMS config
      localStorage.clear();
      
      // Reset to default state with admin user only
      const defaultUsers = {
        admin: { password: 'admin', role: 'admin' }
      };
      
      // Generate class teacher accounts
      for (let classNum = 1; classNum <= 12; classNum++) {
        for (let division of ['a', 'b', 'c', 'd', 'e']) {
          const teacherUsername = `class${classNum}${division}`;
          defaultUsers[teacherUsername] = {
            password: 'admin',
            role: 'teacher',
            class: classNum.toString(),
            division: division.toUpperCase()
          };
        }
      }
      
      localStorage.setItem('users', JSON.stringify(defaultUsers));
      
      // Restore backup settings if they were enabled
      if (emailBackupEnabled) {
        localStorage.setItem('emailBackupEnabled', 'true');
        localStorage.setItem('backupEmail', backupEmail);
      }
      
      alert('All system data cleared to default state successfully!\n\nDefault login: admin/admin\nTeacher logins: class[X][Y]/admin');
      window.location.reload();
    } catch (error) {
      console.error('Error clearing all data:', error);
      alert('Failed to clear all data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const downloadAllStudentsCSV = () => {
    if (students.length === 0) {
      alert('No students data to download');
      return;
    }

    const headers = ['Admission No', 'Name', 'Mobile', 'Class', 'Division', 'Bus Stop', 'Bus Number', 'Trip Number'];
    const csvData = students.map(student => [
      student.admissionNo,
      student.name,
      student.mobile,
      student.class,
      student.division,
      student.busStop,
      student.busNumber,
      student.tripNumber
    ]);

    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_students_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadClassWiseCSV = (classNum: string) => {
    const classStudents = students.filter(s => s.class === classNum);
    
    if (classStudents.length === 0) {
      alert(`No students found for Class ${classNum}`);
      return;
    }

    const headers = ['Admission No', 'Name', 'Mobile', 'Class', 'Division', 'Bus Stop', 'Bus Number', 'Trip Number'];
    const csvData = classStudents.map(student => [
      student.admissionNo,
      student.name,
      student.mobile,
      student.class,
      student.division,
      student.busStop,
      student.busNumber,
      student.tripNumber
    ]);

    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `class_${classNum}_students_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllPaymentsCSV = () => {
    if (payments.length === 0) {
      alert('No payments data to download');
      return;
    }

    const headers = [
      'Payment ID', 'Student Name', 'Admission No', 'Class', 'Division',
      'Development Fee', 'Bus Fee', 'Special Fee', 'Special Fee Type',
      'Total Amount', 'Payment Date', 'Added By'
    ];
    
    const csvData = payments.map(payment => [
      payment.id,
      payment.studentName,
      payment.admissionNo,
      payment.class,
      payment.division,
      payment.developmentFee,
      payment.busFee,
      payment.specialFee,
      payment.specialFeeType,
      payment.totalAmount,
      new Date(payment.paymentDate).toLocaleDateString('en-GB'),
      payment.addedBy
    ]);

    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_payments_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getClassStudentCount = (classNum: string) => {
    return students.filter(s => s.class === classNum).length;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>
        <p className="text-gray-600">Manage system data, downloads, and year-end cleanup</p>
      </div>

      {/* Email Backup Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Mail className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Weekly Email Backup</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <h3 className="font-medium text-blue-900">Automatic Weekly Backup</h3>
              <p className="text-sm text-blue-700">
                {emailBackupEnabled 
                  ? `Enabled - Sending to ${backupEmail}` 
                  : 'Disabled - No automatic backups'
                }
              </p>
              {lastBackupDate && (
                <p className="text-xs text-blue-600">
                  Last backup: {new Date(lastBackupDate).toLocaleDateString('en-GB')}
                </p>
              )}
            </div>
            <button
              onClick={toggleEmailBackup}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                emailBackupEnabled
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {emailBackupEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup Email Address
              </label>
              <input
                type="email"
                value={backupEmail}
                onChange={(e) => setBackupEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email address"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={sendWeeklyBackup}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Send Backup Now
              </button>
            </div>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">Backup Information</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Backups are sent every Sunday at midnight</li>
              <li>• Includes complete student and payment data in CSV format</li>
              <li>• Email contains summary statistics and downloadable files</li>
              <li>• Configure EmailJS service for automatic email delivery</li>
            </ul>
          </div>
        </div>
      </div>
      {/* Data Export Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Export</h2>
        
        {/* All Data Downloads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={downloadAllStudentsCSV}
            className="flex items-center justify-center space-x-2 p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Download className="h-5 w-5" />
            <span>Download All Students CSV</span>
            <span className="text-sm">({students.length} students)</span>
          </button>
          
          <button
            onClick={downloadAllPaymentsCSV}
            className="flex items-center justify-center space-x-2 p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Download className="h-5 w-5" />
            <span>Download All Payments CSV</span>
            <span className="text-sm">({payments.length} payments)</span>
          </button>
        </div>

        {/* Class-wise Downloads */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-3">Class-wise Student Downloads</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(classNum => (
              <button
                key={classNum}
                onClick={() => downloadClassWiseCSV(classNum.toString())}
                disabled={getClassStudentCount(classNum.toString()) === 0}
                className="flex flex-col items-center p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="font-medium">Class {classNum}</span>
                <span className="text-xs">({getClassStudentCount(classNum.toString())} students)</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Data Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{students.length}</div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{payments.length}</div>
            <div className="text-sm text-gray-600">Total Payments</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              ₹{payments.reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Collection</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {new Set(students.map(s => `${s.class}-${s.division}`)).size}
            </div>
            <div className="text-sm text-gray-600">Active Classes</div>
          </div>
        </div>
      </div>

      {/* Data Cleanup Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Year-End Data Cleanup</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Warning: Data Deletion</h3>
              <p className="text-sm text-yellow-700 mt-1">
                These actions will permanently delete data from the system. Make sure to download backups before proceeding.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              setActionType('students');
              setShowConfirmDialog(true);
            }}
            className="flex items-center justify-center space-x-2 p-4 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Trash2 className="h-5 w-5" />
            <span>Clear All Students</span>
          </button>
          
          <button
            onClick={() => {
              setActionType('payments');
              setShowConfirmDialog(true);
            }}
            className="flex items-center justify-center space-x-2 p-4 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Trash2 className="h-5 w-5" />
            <span>Clear All Payments</span>
          </button>
          
          <button
            onClick={() => {
              setActionType('all');
              setShowConfirmDialog(true);
            }}
            className="flex items-center justify-center space-x-2 p-4 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Reset to Default</span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <h2 className="text-xl font-bold text-gray-900">Confirm Data Deletion</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to {actionType === 'all' ? 'reset all system data to default state' : `clear all ${actionType}`}? 
              {actionType === 'all' 
                ? ' This will clear all data and restore default user accounts (admin/admin).' 
                : ' This action cannot be undone.'
              }
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearData();
                  setShowConfirmDialog(false);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {actionType === 'all' ? 'Reset to Default' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagement;