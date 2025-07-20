import React, { useState } from 'react';
import { Trash2, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const DataManagement: React.FC = () => {
  const { students, payments, importStudents } = useData();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState<'students' | 'payments' | 'all'>('all');

  const clearData = () => {
    switch (actionType) {
      case 'students':
        localStorage.removeItem('students');
        window.location.reload();
        break;
      case 'payments':
        localStorage.removeItem('payments');
        window.location.reload();
        break;
      case 'all':
        localStorage.removeItem('students');
        localStorage.removeItem('payments');
        localStorage.removeItem('feeConfig');
        window.location.reload();
        break;
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
      new Date(payment.paymentDate).toLocaleDateString(),
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
            <span>Reset All Data</span>
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
              Are you sure you want to {actionType === 'all' ? 'reset all system data' : `clear all ${actionType}`}? 
              This action cannot be undone.
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagement;