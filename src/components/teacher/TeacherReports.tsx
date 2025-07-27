import React, { useState } from 'react';
import { FileText, Download, Calendar, Users, TrendingUp, Bus, Eye, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

const TeacherReports: React.FC = () => {
  const { user } = useAuth();
  const { students, payments, feeConfig } = useData();
  const [activeReport, setActiveReport] = useState('class-wise');
  const [dateFilter, setDateFilter] = useState<'all' | 'month' | 'custom'>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<string | null>(null);

  // Filter data for current teacher's class
  const classStudents = students.filter(
    student => student.class === user?.class && student.division === user?.division
  );

  const classPayments = payments.filter(
    payment => payment.class === user?.class && payment.division === user?.division
  );

  // Get student payment details with proper discount calculation
  const getStudentPaymentDetails = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    const studentPayments = payments.filter(p => p.studentId === studentId);
    
    // Calculate fee structure with discount
    const classKey = (['11', '12'].includes(student.class)) 
      ? `${student.class}-${student.division}` 
      : student.class;
    const totalDevFee = feeConfig.developmentFees[classKey] || 0;
    const originalBusFee = feeConfig.busStops[student.busStop] || 0;
    const busFeeDiscount = student.busFeeDiscount || 0;
    const discountedBusFee = Math.max(0, originalBusFee - busFeeDiscount);
    
    // Calculate totals
    const totalPaidDev = studentPayments.reduce((sum, p) => sum + p.developmentFee, 0);
    const totalPaidBus = studentPayments.reduce((sum, p) => sum + p.busFee, 0);
    const totalPaidSpecial = studentPayments.reduce((sum, p) => sum + p.specialFee, 0);
    const totalPaidAll = studentPayments.reduce((sum, p) => sum + p.totalAmount, 0);
    
    return {
      student,
      payments: studentPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()),
      feeStructure: {
        developmentFee: {
          total: totalDevFee,
          paid: totalPaidDev,
          remaining: Math.max(0, totalDevFee - totalPaidDev)
        },
        busFee: {
          original: originalBusFee,
          discount: busFeeDiscount,
          total: discountedBusFee,
          paid: totalPaidBus,
          remaining: Math.max(0, discountedBusFee - totalPaidBus)
        },
        specialFee: {
          paid: totalPaidSpecial
        },
        grandTotal: {
          required: totalDevFee + discountedBusFee,
          paid: totalPaidAll,
          remaining: Math.max(0, (totalDevFee + discountedBusFee) - (totalPaidDev + totalPaidBus))
        }
      }
    };
  };

  // Get student payment details with proper discount calculation
  const getStudentPaymentDetails = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    const studentPayments = payments.filter(p => p.studentId === studentId);
    
    // Calculate fee structure with discount
    const classKey = (['11', '12'].includes(student.class)) 
      ? `${student.class}-${student.division}` 
      : student.class;
    const totalDevFee = feeConfig.developmentFees[classKey] || 0;
    const originalBusFee = feeConfig.busStops[student.busStop] || 0;
    const busFeeDiscount = student.busFeeDiscount || 0;
    const discountedBusFee = Math.max(0, originalBusFee - busFeeDiscount);
    
    // Calculate totals
    const totalPaidDev = studentPayments.reduce((sum, p) => sum + p.developmentFee, 0);
    const totalPaidBus = studentPayments.reduce((sum, p) => sum + p.busFee, 0);
    const totalPaidSpecial = studentPayments.reduce((sum, p) => sum + p.specialFee, 0);
    const totalPaidAll = studentPayments.reduce((sum, p) => sum + p.totalAmount, 0);
    
    return {
      student,
      payments: studentPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()),
      feeStructure: {
        developmentFee: {
          total: totalDevFee,
          paid: totalPaidDev,
          remaining: Math.max(0, totalDevFee - totalPaidDev)
        },
        busFee: {
          original: originalBusFee,
          discount: busFeeDiscount,
          total: discountedBusFee,
          paid: totalPaidBus,
          remaining: Math.max(0, discountedBusFee - totalPaidBus)
        },
        specialFee: {
          paid: totalPaidSpecial
        },
        grandTotal: {
          required: totalDevFee + discountedBusFee,
          paid: totalPaidAll,
          remaining: Math.max(0, (totalDevFee + discountedBusFee) - (totalPaidDev + totalPaidBus))
        }
      }
    };
  };

  const getFilteredPayments = () => {
    let filteredPayments = classPayments;

    if (dateFilter === 'month') {
      const [year, month] = selectedMonth.split('-');
      filteredPayments = filteredPayments.filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate.getFullYear() === parseInt(year) && 
               paymentDate.getMonth() === parseInt(month) - 1;
      });
    } else if (dateFilter === 'custom') {
      filteredPayments = filteredPayments.filter(payment => {
        const paymentDate = new Date(payment.paymentDate).toISOString().split('T')[0];
        const matchesFromDate = !fromDate || paymentDate >= fromDate;
        const matchesToDate = !toDate || paymentDate <= toDate;
        return matchesFromDate && matchesToDate;
      });
    }

    return filteredPayments;
  };

  // Get student payment details
  const getStudentPaymentDetails = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    const studentPayments = payments.filter(p => p.studentId === studentId);
    
    // Calculate fee structure
    const classKey = (['11', '12'].includes(student.class)) 
      ? `${student.class}-${student.division}` 
      : student.class;
    const totalDevFee = feeConfig.developmentFees[classKey] || 0;
    const originalBusFee = feeConfig.busStops[student.busStop] || 0;
    const busFeeDiscount = student.busFeeDiscount || 0;
    const discountedBusFee = Math.max(0, originalBusFee - busFeeDiscount);
    
    // Calculate totals
    const totalPaidDev = studentPayments.reduce((sum, p) => sum + p.developmentFee, 0);
    const totalPaidBus = studentPayments.reduce((sum, p) => sum + p.busFee, 0);
    const totalPaidSpecial = studentPayments.reduce((sum, p) => sum + p.specialFee, 0);
    const totalPaidAll = studentPayments.reduce((sum, p) => sum + p.totalAmount, 0);
    
    return {
      student,
      payments: studentPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()),
      feeStructure: {
        developmentFee: {
          total: totalDevFee,
          paid: totalPaidDev,
          remaining: Math.max(0, totalDevFee - totalPaidDev)
        },
        busFee: {
          original: originalBusFee,
          discount: busFeeDiscount,
          total: discountedBusFee,
          paid: totalPaidBus,
          remaining: Math.max(0, discountedBusFee - totalPaidBus)
        },
        specialFee: {
          paid: totalPaidSpecial
        },
        grandTotal: {
          required: totalDevFee + discountedBusFee,
          paid: totalPaidAll,
          remaining: Math.max(0, (totalDevFee + discountedBusFee) - (totalPaidDev + totalPaidBus))
        }
      }
    };
  };

  // Student Details Modal Component
  const StudentDetailsModal: React.FC<{ studentId: string; onClose: () => void }> = ({ studentId, onClose }) => {
    const details = getStudentPaymentDetails(studentId);
    
    if (!details) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Student Payment Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Student Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-3">Student Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Name:</span>
                <div className="text-gray-900">{details.student.name}</div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Admission No:</span>
                <div className="text-gray-900">{details.student.admissionNo}</div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Class:</span>
                <div className="text-gray-900">{details.student.class}-{details.student.division}</div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Bus Stop:</span>
                <div className="text-gray-900">{details.student.busStop}</div>
              </div>
            </div>
          </div>

          {/* Fee Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Development Fee */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-3">Development Fee</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-700">Total Required:</span>
                  <span className="font-medium">₹{details.feeStructure.developmentFee.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Paid:</span>
                  <span className="font-medium text-green-600">₹{details.feeStructure.developmentFee.paid}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-purple-700 font-medium">Remaining:</span>
                  <span className="font-bold text-red-600">₹{details.feeStructure.developmentFee.remaining}</span>
                </div>
              </div>
            </div>

            {/* Bus Fee */}
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-3">Bus Fee</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Original Amount:</span>
                  <span className="font-medium">₹{details.feeStructure.busFee.original}</span>
                </div>
                {details.feeStructure.busFee.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-green-700">Discount:</span>
                    <span className="font-medium text-orange-600">-₹{details.feeStructure.busFee.discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-green-700">After Discount:</span>
                  <span className="font-medium">₹{details.feeStructure.busFee.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Paid:</span>
                  <span className="font-medium text-green-600">₹{details.feeStructure.busFee.paid}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-green-700 font-medium">Remaining:</span>
                  <span className="font-bold text-red-600">₹{details.feeStructure.busFee.remaining}</span>
                </div>
              </div>
            </div>

            {/* Grand Total */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Grand Total</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Total Required:</span>
                  <span className="font-medium">₹{details.feeStructure.grandTotal.required}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Total Paid:</span>
                  <span className="font-medium text-green-600">₹{details.feeStructure.grandTotal.paid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Special Fees:</span>
                  <span className="font-medium text-blue-600">₹{details.feeStructure.specialFee.paid}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-700 font-medium">Balance:</span>
                  <span className="font-bold text-red-600">₹{details.feeStructure.grandTotal.remaining}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Payment History ({details.payments.length} payments)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receipt #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Development Fee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bus Fee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Special Fee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {details.payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payment.paymentDate).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        #{payment.id.slice(-6)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.developmentFee > 0 ? `₹${payment.developmentFee}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.busFee > 0 ? `₹${payment.busFee}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.specialFee > 0 ? (
                          <div>
                            <div className="text-sm text-gray-900">₹{payment.specialFee}</div>
                            <div className="text-xs text-gray-500">{payment.specialFeeType}</div>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-green-600">
                          ₹{payment.totalAmount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.addedBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {details.payments.length === 0 && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This student has not made any payments yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  const ClassWiseReport: React.FC = () => {
    const filteredPayments = getFilteredPayments();
    const totalCollection = filteredPayments.reduce((sum, payment) => sum + payment.totalAmount, 0);
    const developmentFees = filteredPayments.reduce((sum, payment) => sum + payment.developmentFee, 0);
    const busFees = filteredPayments.reduce((sum, payment) => sum + payment.busFee, 0);
    const specialFees = filteredPayments.reduce((sum, payment) => sum + payment.specialFee, 0);

    const downloadCSV = () => {
      const headers = [
        'Student Name', 'Admission No', 'Development Fee', 'Bus Fee', 'Special Fee', 
        'Special Fee Type', 'Total Amount', 'Payment Date', 'Added By'
      ];
      
      const csvData = filteredPayments.map(payment => [
        payment.studentName,
        payment.admissionNo,
        payment.developmentFee,
        payment.busFee,
        payment.specialFee,
        payment.specialFeeType || '',
        payment.totalAmount,
        new Date(payment.paymentDate).toLocaleDateString('en-GB'),
        payment.addedBy
      ]);

      const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `class_${user?.class}${user?.division}_report_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{classStudents.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900">₹{classStudents.reduce((sum, student) => {
                  const details = getStudentPaymentDetails(student.id);
                  return sum + (details?.feeStructure.grandTotal.paid || 0);
                }, 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Total Required</p>
                <p className="text-2xl font-bold text-gray-900">₹{classStudents.reduce((sum, student) => {
                  const details = getStudentPaymentDetails(student.id);
                  return sum + (details?.feeStructure.grandTotal.required || 0);
                }, 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <Bus className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Total Balance</p>
                <p className="text-2xl font-bold text-gray-900">₹{classStudents.reduce((sum, student) => {
                  const details = getStudentPaymentDetails(student.id);
                  return sum + (details?.feeStructure.grandTotal.remaining || 0);
                }, 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Download Button */}
        <div className="flex justify-end">
          <button
            onClick={downloadCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            <span>Download Student Balance Report</span>
          </button>
        </div>

        {/* Students Balance Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Student Balance Report</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Development Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bus Fee (After Discount)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classStudents.map((student) => {
                  const details = getStudentPaymentDetails(student.id);
                  if (!details) return null;
                  
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.admissionNo} • {student.busStop}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="text-sm">
                        <div className="text-gray-900">Required: ₹{details.feeStructure.developmentFee.total}</div>
                        <div className="text-green-600">Paid: ₹{details.feeStructure.developmentFee.paid}</div>
                        <div className="text-red-600 font-medium">Balance: ₹{details.feeStructure.developmentFee.remaining}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="text-sm">
                        <div className="text-gray-900">
                          Required: ₹{details.feeStructure.busFee.total}
                          {details.feeStructure.busFee.discount > 0 && (
                            <span className="text-orange-600 ml-1">(₹{details.feeStructure.busFee.original} - ₹{details.feeStructure.busFee.discount})</span>
                          )}
                        </div>
                        <div className="text-green-600">Paid: ₹{details.feeStructure.busFee.paid}</div>
                        <div className="text-red-600 font-medium">Balance: ₹{details.feeStructure.busFee.remaining}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-red-600">
                        ₹{details.feeStructure.grandTotal.remaining}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedStudentForDetails(student.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Student Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                  );
                }).filter(Boolean)}
              </tbody>
            </table>
          </div>
          
          {classStudents.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No students are registered in this class.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const MonthlyCollectionReport: React.FC = () => {
    // Get all unique months from class payments
    const months = [...new Set(classPayments.map(p => {
      const date = new Date(p.paymentDate);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }))].sort();

    const monthNames = months.map(month => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    });

    const downloadCSV = () => {
      const headers = ['Student Name', 'Admission No', ...monthNames, 'Total'];
      const csvData: string[][] = [];
      
      classStudents.forEach(student => {
        const studentPayments = classPayments.filter(p => p.studentId === student.id);
        
        const monthlyAmounts = months.map(month => {
          const monthPayments = studentPayments.filter(p => {
            const paymentMonth = new Date(p.paymentDate);
            const paymentMonthStr = `${paymentMonth.getFullYear()}-${String(paymentMonth.getMonth() + 1).padStart(2, '0')}`;
            return paymentMonthStr === month;
          });
          return monthPayments.reduce((sum, p) => sum + p.totalAmount, 0);
        });
        
        const totalAmount = monthlyAmounts.reduce((sum, amount) => sum + amount, 0);
        
        // Skip students with zero total amount
        if (totalAmount === 0) {
          return;
        }
        
        csvData.push([
          student.name,
          student.admissionNo,
          ...monthlyAmounts.map(amount => amount.toString()),
          totalAmount.toString()
        ]);
      });
      
      const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `class_${user?.class}${user?.division}_monthly_collection_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Collection Report</h3>
          <button
            onClick={downloadCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            <span>Download CSV</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                    Student Details
                  </th>
                  {monthNames.map((monthName, index) => (
                    <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {monthName}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classStudents.map(student => {
                  const studentPayments = classPayments.filter(p => p.studentId === student.id);
                  
                  const monthlyAmounts = months.map(month => {
                    const monthPayments = studentPayments.filter(p => {
                      const paymentMonth = new Date(p.paymentDate);
                      const paymentMonthStr = `${paymentMonth.getFullYear()}-${String(paymentMonth.getMonth() + 1).padStart(2, '0')}`;
                      return paymentMonthStr === month;
                    });
                    return monthPayments.reduce((sum, p) => sum + p.totalAmount, 0);
                  });
                  
                  const totalAmount = monthlyAmounts.reduce((sum, amount) => sum + amount, 0);
                  
                  // Skip students with zero total amount
                  if (totalAmount === 0) {
                    return null;
                  }
                  
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.admissionNo}</div>
                        </div>
                      </td>
                      {monthlyAmounts.map((amount, index) => (
                        <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {amount > 0 ? `₹${amount}` : '-'}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-green-600">
                          ₹{totalAmount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedStudentForDetails(student.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Student Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                }).filter(Boolean)}
              </tbody>
            </table>
          </div>
          
          {classStudents.filter(student => {
            const studentPayments = classPayments.filter(p => p.studentId === student.id);
            const totalAmount = studentPayments.reduce((sum, p) => sum + p.totalAmount, 0);
            return totalAmount > 0;
          }).length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No students in this class have made any payments yet.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Class {user?.class}-{user?.division} Reports
        </h1>
        <p className="text-gray-600">Generate and download reports for your class</p>
      </div>

      {/* Report Type Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-4">
          <FileText className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Report Type</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setActiveReport('class-wise')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              activeReport === 'class-wise'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Users className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">Class Payment Report</div>
            <div className="text-sm text-gray-600">All payments for your class</div>
          </button>
          
          <button
            onClick={() => setActiveReport('monthly-collection')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              activeReport === 'monthly-collection'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Calendar className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">Monthly Collection</div>
            <div className="text-sm text-gray-600">Month-wise payment breakdown</div>
          </button>
        </div>
      </div>

      {/* Date Filter */}
      {activeReport === 'class-wise' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="h-6 w-6 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Date Filter</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex space-x-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="all"
                  checked={dateFilter === 'all'}
                  onChange={(e) => setDateFilter(e.target.value as 'all')}
                  className="mr-2"
                />
                All Time
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="month"
                  checked={dateFilter === 'month'}
                  onChange={(e) => setDateFilter(e.target.value as 'month')}
                  className="mr-2"
                />
                Specific Month
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="custom"
                  checked={dateFilter === 'custom'}
                  onChange={(e) => setDateFilter(e.target.value as 'custom')}
                  className="mr-2"
                />
                Custom Range
              </label>
            </div>

            {dateFilter === 'month' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Month
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {dateFilter === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Content */}
      {activeReport === 'class-wise' && <ClassWiseReport />}
      {activeReport === 'monthly-collection' && <MonthlyCollectionReport />}

      {/* Student Details Modal */}
      {selectedStudentForDetails && (
        <StudentDetailsModal
          studentId={selectedStudentForDetails}
          onClose={() => setSelectedStudentForDetails(null)}
        />
      )}
    </div>
  );
};

export default TeacherReports;