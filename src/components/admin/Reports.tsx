import React, { useState } from 'react';
import { FileText, Download, Calendar, Users, TrendingUp, Bus, Eye, X, Receipt } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import ReceiptWiseReport from './ReceiptWiseReport';

const Reports: React.FC = () => {
  const { students, payments, feeConfig } = useData();
  const [activeReport, setActiveReport] = useState('class-wise');
  const [dateFilter, setDateFilter] = useState<'all' | 'month' | 'custom'>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<string | null>(null);

  const getFilteredPayments = () => {
    let filteredPayments = payments;

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

    // Calculate class-wise totals
    const getClassWiseTotals = () => {
      const classTotals: Record<string, {
        students: number;
        developmentCollected: number;
        busCollected: number;
        totalCollected: number;
        developmentBalance: number;
        busBalance: number;
        totalBalance: number;
      }> = {};

      // Group students by class
      const studentsByClass = students.reduce((acc, student) => {
        const classKey = `${student.class}-${student.division}`;
        if (!acc[classKey]) acc[classKey] = [];
        acc[classKey].push(student);
        return acc;
      }, {} as Record<string, typeof students>);

      Object.entries(studentsByClass).forEach(([classKey, classStudents]) => {
        const [classNum, division] = classKey.split('-');
        
        // Calculate totals for this class
        let developmentCollected = 0;
        let busCollected = 0;
        let developmentBalance = 0;
        let busBalance = 0;

        classStudents.forEach(student => {
          // Get fee structure for this student
          const feeKey = (['11', '12'].includes(student.class)) 
            ? `${student.class}-${student.division}` 
            : student.class;
          const totalDevFee = feeConfig.developmentFees[feeKey] || 0;
          const originalBusFee = feeConfig.busStops[student.busStop] || 0;
          const discountedBusFee = Math.max(0, originalBusFee - (student.busFeeDiscount || 0));

          // Get payments for this student
          const studentPayments = payments.filter(p => p.studentId === student.id);
          const paidDevFee = studentPayments.reduce((sum, p) => sum + p.developmentFee, 0);
          const paidBusFee = studentPayments.reduce((sum, p) => sum + p.busFee, 0);

          // Add to class totals
          developmentCollected += paidDevFee;
          busCollected += paidBusFee;
          developmentBalance += Math.max(0, totalDevFee - paidDevFee);
          busBalance += Math.max(0, discountedBusFee - paidBusFee);
        });

        classTotals[classKey] = {
          students: classStudents.length,
          developmentCollected,
          busCollected,
          totalCollected: developmentCollected + busCollected,
          developmentBalance,
          busBalance,
          totalBalance: developmentBalance + busBalance
        };
      });

      return classTotals;
    };

    const classWiseTotals = getClassWiseTotals();

    const downloadCSV = () => {
      const headers = [
        'Student Name', 'Admission No', 'Class', 'Division', 'Development Fee', 'Bus Fee', 'Special Fee', 
        'Special Fee Type', 'Total Amount', 'Payment Date', 'Added By'
      ];
      
      const csvData = filteredPayments.map(payment => [
        payment.studentName,
        payment.admissionNo,
        payment.class,
        payment.division,
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
      a.download = `class_wise_report_${new Date().toISOString().slice(0, 10)}.csv`;
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
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Total Collection</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalCollection.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{filteredPayments.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <Bus className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-600">Bus Fees</p>
                <p className="text-2xl font-bold text-gray-900">₹{busFees.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Class-wise Summary Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Class-wise Summary (This Year)</h3>
            <button
              onClick={downloadCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              <span>Download CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Development Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bus Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Collected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Development Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bus Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(classWiseTotals)
                  .sort(([a], [b]) => {
                    const [classA] = a.split('-');
                    const [classB] = b.split('-');
                    return parseInt(classA) - parseInt(classB);
                  })
                  .map(([classKey, totals]) => (
                    <tr key={classKey} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Class {classKey}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {totals.students}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-green-600 font-medium">₹{totals.developmentCollected.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Collected</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-green-600 font-medium">₹{totals.busCollected.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Collected</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-blue-600">
                          ₹{totals.totalCollected.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-red-600 font-medium">₹{totals.developmentBalance.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Pending</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-red-600 font-medium">₹{totals.busBalance.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Pending</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-red-600">
                          ₹{totals.totalBalance.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    TOTAL
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {Object.values(classWiseTotals).reduce((sum, totals) => sum + totals.students, 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-green-600">
                      ₹{Object.values(classWiseTotals).reduce((sum, totals) => sum + totals.developmentCollected, 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-green-600">
                      ₹{Object.values(classWiseTotals).reduce((sum, totals) => sum + totals.busCollected, 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                    ₹{Object.values(classWiseTotals).reduce((sum, totals) => sum + totals.totalCollected, 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-red-600">
                      ₹{Object.values(classWiseTotals).reduce((sum, totals) => sum + totals.developmentBalance, 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-red-600">
                      ₹{Object.values(classWiseTotals).reduce((sum, totals) => sum + totals.busBalance, 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                    ₹{Object.values(classWiseTotals).reduce((sum, totals) => sum + totals.totalBalance, 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Fee Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">₹{developmentFees.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Development Fees</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">₹{busFees.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Bus Fees</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">₹{specialFees.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Special Fees</div>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
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
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{payment.studentName}</div>
                        <div className="text-sm text-gray-500">{payment.admissionNo}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {payment.class}-{payment.division}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{payment.developmentFee}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{payment.busFee}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{payment.specialFee}</div>
                      {payment.specialFeeType && (
                        <div className="text-sm text-gray-500">{payment.specialFeeType}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-600">
                        ₹{payment.totalAmount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payment.paymentDate).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedStudentForDetails(payment.studentId)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Student Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No payments match your selected criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const BusStopWiseReport: React.FC = () => {
    const filteredPayments = getFilteredPayments();
    
    // Group payments by bus stop
    const busStopPayments = filteredPayments.reduce((acc, payment) => {
      const student = students.find(s => s.id === payment.studentId);
      const busStop = student?.busStop || 'Unknown';
      
      if (!acc[busStop]) {
        acc[busStop] = [];
      }
      acc[busStop].push(payment);
      return acc;
    }, {} as Record<string, typeof filteredPayments>);

    const downloadCSV = () => {
      const headers = [
        'Bus Stop', 'Student Name', 'Admission No', 'Class', 'Division', 'Bus Number', 'Trip Number',
        'Development Fee', 'Bus Fee', 'Special Fee', 'Total Amount', 'Payment Date'
      ];
      
      const csvData: string[][] = [];
      Object.entries(busStopPayments).forEach(([busStop, payments]) => {
        payments.forEach(payment => {
          const student = students.find(s => s.id === payment.studentId);
          csvData.push([
            busStop,
            payment.studentName,
            payment.admissionNo,
            payment.class,
            payment.division,
            student?.busNumber || '',
            student?.tripNumber || '',
            payment.developmentFee.toString(),
            payment.busFee.toString(),
            payment.specialFee.toString(),
            payment.totalAmount.toString(),
            new Date(payment.paymentDate).toLocaleDateString('en-GB')
          ]);
        });
      });

      const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bus_stop_wise_report_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Bus Stop-wise Report</h3>
          <button
            onClick={downloadCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            <span>Download CSV</span>
          </button>
        </div>

        {Object.entries(busStopPayments).map(([busStop, payments]) => {
          const totalAmount = payments.reduce((sum, p) => sum + p.totalAmount, 0);
          const busFeeTotal = payments.reduce((sum, p) => sum + p.busFee, 0);
          
          return (
            <div key={busStop} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold text-gray-900">{busStop}</h4>
                  <div className="text-sm text-gray-600">
                    {payments.length} payments • ₹{totalAmount.toLocaleString()} total • ₹{busFeeTotal.toLocaleString()} bus fees
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bus Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Development Fee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bus Fee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => {
                      const student = students.find(s => s.id === payment.studentId);
                      return (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{payment.studentName}</div>
                              <div className="text-sm text-gray-500">
                                {payment.admissionNo} • Class {payment.class}-{payment.division}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              Bus {student?.busNumber} • Trip {student?.tripNumber}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{payment.developmentFee}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{payment.busFee}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-green-600">
                              ₹{payment.totalAmount}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(payment.paymentDate).toLocaleDateString('en-GB')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => setSelectedStudentForDetails(payment.studentId)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Student Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {Object.keys(busStopPayments).length === 0 && (
          <div className="text-center py-12">
            <Bus className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No payments match your selected criteria.
            </p>
          </div>
        )}
      </div>
    );
  };

  const MonthlyCollectionReport: React.FC = () => {
    // Get all unique months from payments
    const months = [...new Set(payments.map(p => {
      const date = new Date(p.paymentDate);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }))].sort();

    const monthNames = months.map(month => {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    });

    const downloadCSV = () => {
      const headers = ['Student Name', 'Admission No', 'Class', 'Division', ...monthNames, 'Total'];
      const csvData: string[][] = [];
      
      students.forEach(student => {
        const studentPayments = payments.filter(p => p.studentId === student.id);
        
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
          student.class,
          student.division,
          ...monthlyAmounts.map(amount => amount.toString()),
          totalAmount.toString()
        ]);
      });
      
      const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monthly_collection_report_${new Date().toISOString().slice(0, 10)}.csv`;
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
                {students.map(student => {
                  const studentPayments = payments.filter(p => p.studentId === student.id);
                  
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
                          <div className="text-sm text-gray-500">
                            {student.admissionNo} • Class {student.class}-{student.division}
                          </div>
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
          
          {students.filter(student => {
            const studentPayments = payments.filter(p => p.studentId === student.id);
            const totalAmount = studentPayments.reduce((sum, p) => sum + p.totalAmount, 0);
            return totalAmount > 0;
          }).length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No students have made any payments yet.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const FeeNotPaidStudentsReport: React.FC = () => {
    const studentsWithBalance = students.filter(student => {
      const classKey = (['11', '12'].includes(student.class)) 
        ? `${student.class}-${student.division}` 
        : student.class;
      const totalDevFee = feeConfig.developmentFees[classKey] || 0;
      const originalBusFee = feeConfig.busStops[student.busStop] || 0;
      const busFee = Math.max(0, originalBusFee - (student.busFeeDiscount || 0));
      
      const studentPayments = payments.filter(p => p.studentId === student.id);
      const paidDevFee = studentPayments.reduce((sum, p) => sum + p.developmentFee, 0);
      const paidBusFee = studentPayments.reduce((sum, p) => sum + p.busFee, 0);
      
      const devBalance = Math.max(0, totalDevFee - paidDevFee);
      const busBalance = Math.max(0, busFee - paidBusFee);
      
      return devBalance > 0 || busBalance > 0;
    });

    const downloadCSV = () => {
      const headers = [
        'Student Name', 'Admission No', 'Class', 'Division', 'Mobile', 'Bus Stop',
        'Development Fee Due', 'Bus Fee Due', 'Total Outstanding'
      ];
      
      const csvData = studentsWithBalance.map(student => {
        const classKey = (['11', '12'].includes(student.class)) 
          ? `${student.class}-${student.division}` 
          : student.class;
        const totalDevFee = feeConfig.developmentFees[classKey] || 0;
        const originalBusFee = feeConfig.busStops[student.busStop] || 0;
        const busFee = Math.max(0, originalBusFee - (student.busFeeDiscount || 0));
        
        const studentPayments = payments.filter(p => p.studentId === student.id);
        const paidDevFee = studentPayments.reduce((sum, p) => sum + p.developmentFee, 0);
        const paidBusFee = studentPayments.reduce((sum, p) => sum + p.busFee, 0);
        
        const devBalance = Math.max(0, totalDevFee - paidDevFee);
        const busBalance = Math.max(0, busFee - paidBusFee);
        
        return [
          student.name,
          student.admissionNo,
          student.class,
          student.division,
          student.mobile,
          student.busStop,
          devBalance,
          busBalance,
          devBalance + busBalance
        ];
      });

      const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fee_not_paid_students_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Fee Not Paid Students</h3>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Development Fee Due
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bus Fee Due
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Outstanding
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentsWithBalance.map((student) => {
                  const classKey = (['11', '12'].includes(student.class)) 
                    ? `${student.class}-${student.division}` 
                    : student.class;
                  const totalDevFee = feeConfig.developmentFees[classKey] || 0;
                  const originalBusFee = feeConfig.busStops[student.busStop] || 0;
                  const busFee = Math.max(0, originalBusFee - (student.busFeeDiscount || 0));
                  
                  const studentPayments = payments.filter(p => p.studentId === student.id);
                  const paidDevFee = studentPayments.reduce((sum, p) => sum + p.developmentFee, 0);
                  const paidBusFee = studentPayments.reduce((sum, p) => sum + p.busFee, 0);
                  
                  const devBalance = Math.max(0, totalDevFee - paidDevFee);
                  const busBalance = Math.max(0, busFee - paidBusFee);
                  
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">
                            {student.admissionNo} • Class {student.class}-{student.division}
                          </div>
                          <div className="text-sm text-gray-500">{student.busStop}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.mobile}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${devBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {devBalance > 0 ? `₹${devBalance}` : 'Paid'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${busBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {busBalance > 0 ? `₹${busBalance}` : 'Paid'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-red-600">
                          ₹{devBalance + busBalance}
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
                })}
              </tbody>
            </table>
          </div>
          
          {studentsWithBalance.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">All fees paid!</h3>
              <p className="mt-1 text-sm text-gray-500">
                All students have completed their fee payments.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const NoPaymentStudentsReport: React.FC = () => {
    const studentsWithNoPayments = students.filter(student => {
      const studentPayments = payments.filter(p => p.studentId === student.id);
      return studentPayments.length === 0;
    });

    const downloadCSV = () => {
      const headers = [
        'Student Name', 'Admission No', 'Class', 'Division', 'Mobile', 'Bus Stop',
        'Development Fee Due', 'Bus Fee Due', 'Total Outstanding'
      ];
      
      const csvData = studentsWithNoPayments.map(student => {
        const classKey = (['11', '12'].includes(student.class)) 
          ? `${student.class}-${student.division}` 
          : student.class;
        const developmentFee = feeConfig.developmentFees[classKey] || 0;
        const originalBusFee = feeConfig.busStops[student.busStop] || 0;
        const busFee = Math.max(0, originalBusFee - (student.busFeeDiscount || 0));
        
        return [
          student.name,
          student.admissionNo,
          student.class,
          student.division,
          student.mobile,
          student.busStop,
          developmentFee,
          busFee,
          developmentFee + busFee
        ];
      });

      const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `no_payment_students_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">No Payment Students</h3>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Development Fee Due
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bus Fee Due
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Outstanding
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentsWithNoPayments.map((student) => {
                  const classKey = (['11', '12'].includes(student.class)) 
                    ? `${student.class}-${student.division}` 
                    : student.class;
                  const developmentFee = feeConfig.developmentFees[classKey] || 0;
                  const originalBusFee = feeConfig.busStops[student.busStop] || 0;
                  const busFee = Math.max(0, originalBusFee - (student.busFeeDiscount || 0));
                  
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">
                            {student.admissionNo} • Class {student.class}-{student.division}
                          </div>
                          <div className="text-sm text-gray-500">{student.busStop}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.mobile}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                        ₹{developmentFee}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                        ₹{busFee}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                        ₹{developmentFee + busFee}
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
                })}
              </tbody>
            </table>
          </div>
          
          {studentsWithNoPayments.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">All students have made payments!</h3>
              <p className="mt-1 text-sm text-gray-500">
                Every student has made at least one payment.
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
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600">Generate comprehensive reports and analyze fee collection data</p>
      </div>

      {/* Report Type Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-4">
          <FileText className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Report Type</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveReport('class-wise')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              activeReport === 'class-wise'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Users className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">Class-wise Report</div>
            <div className="text-sm text-gray-600">Payments grouped by class</div>
          </button>
          
          <button
            onClick={() => setActiveReport('bus-stop-wise')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              activeReport === 'bus-stop-wise'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Bus className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">Bus Stop-wise Report</div>
            <div className="text-sm text-gray-600">Payments grouped by bus stop</div>
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
          
          <button
            onClick={() => setActiveReport('receipt-wise')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              activeReport === 'receipt-wise'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Receipt className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">Receipt-wise Report</div>
            <div className="text-sm text-gray-600">Detailed receipt-wise payments</div>
          </button>
          
          <button
            onClick={() => setActiveReport('fee-not-paid')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              activeReport === 'fee-not-paid'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <TrendingUp className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">Fee Not Paid Students</div>
            <div className="text-sm text-gray-600">Students with pending fees</div>
          </button>
          
          <button
            onClick={() => setActiveReport('no-payment')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              activeReport === 'no-payment'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Users className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">No Payment Students</div>
            <div className="text-sm text-gray-600">Students with zero payments</div>
          </button>
        </div>
      </div>

      {/* Date Filter */}
      {(activeReport === 'class-wise' || activeReport === 'bus-stop-wise') && (
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
      {activeReport === 'bus-stop-wise' && <BusStopWiseReport />}
      {activeReport === 'monthly-collection' && <MonthlyCollectionReport />}
      {activeReport === 'receipt-wise' && <ReceiptWiseReport />}
      {activeReport === 'fee-not-paid' && <FeeNotPaidStudentsReport />}
      {activeReport === 'no-payment' && <NoPaymentStudentsReport />}

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

export default Reports;