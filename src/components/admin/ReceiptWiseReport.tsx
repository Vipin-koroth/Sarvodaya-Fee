import React, { useState } from 'react';
import { FileText, Download, Calendar, Users, Search, Filter, Receipt } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const ReceiptWiseReport: React.FC = () => {
  const { payments, students } = useData();
  const [dateFilter, setDateFilter] = useState<'single' | 'range'>('single');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const getFilteredPayments = () => {
    let filteredPayments = payments;

    // Apply date filter
    if (dateFilter === 'single') {
      filteredPayments = filteredPayments.filter(payment => 
        new Date(payment.paymentDate).toISOString().split('T')[0] === selectedDate
      );
    } else {
      filteredPayments = filteredPayments.filter(payment => {
        const paymentDate = new Date(payment.paymentDate).toISOString().split('T')[0];
        const matchesFromDate = !fromDate || paymentDate >= fromDate;
        const matchesToDate = !toDate || paymentDate <= toDate;
        return matchesFromDate && matchesToDate;
      });
    }

    // Apply class filter
    if (selectedClass) {
      filteredPayments = filteredPayments.filter(payment => payment.class === selectedClass);
    }

    // Apply division filter
    if (selectedDivision) {
      filteredPayments = filteredPayments.filter(payment => payment.division === selectedDivision);
    }

    // Apply search filter
    if (searchTerm) {
      filteredPayments = filteredPayments.filter(payment =>
        payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.admissionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filteredPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  };

  const downloadCSV = () => {
    const filteredPayments = getFilteredPayments();
    
    if (filteredPayments.length === 0) {
      alert('No payments found for the selected criteria.');
      return;
    }

    const headers = [
      'Receipt ID', 'Receipt Date', 'Student Name', 'Admission No', 'Class', 'Division',
      'Mobile', 'Bus Stop', 'Development Fee', 'Bus Fee', 'Special Fee', 'Special Fee Type',
      'Total Amount', 'Added By'
    ];
    
    const csvData = filteredPayments.map(payment => {
      const student = students.find(s => s.id === payment.studentId);
      return [
        payment.id.slice(-6), // Receipt number
        new Date(payment.paymentDate).toLocaleDateString('en-GB'),
        payment.studentName,
        payment.admissionNo,
        payment.class,
        payment.division,
        student?.mobile || '',
        student?.busStop || '',
        payment.developmentFee,
        payment.busFee,
        payment.specialFee,
        payment.specialFeeType || '',
        payment.totalAmount,
        payment.addedBy
      ];
    });
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_wise_payment_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const filteredPayments = getFilteredPayments();
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.totalAmount, 0);
  const totalDevelopmentFee = filteredPayments.reduce((sum, payment) => sum + payment.developmentFee, 0);
  const totalBusFee = filteredPayments.reduce((sum, payment) => sum + payment.busFee, 0);
  const totalSpecialFee = filteredPayments.reduce((sum, payment) => sum + payment.specialFee, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Receipt-wise Payment Report</h1>
        <p className="text-gray-600">Generate detailed receipt-wise payment reports with advanced filters</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <Filter className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">Report Filters</h2>
        </div>

        <div className="space-y-6">
          {/* Date Filter */}
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date Filter
            </h3>
            <div className="space-y-4">
              <div className="flex space-x-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="single"
                    checked={dateFilter === 'single'}
                    onChange={(e) => setDateFilter(e.target.value as 'single')}
                    className="mr-2"
                  />
                  Single Date
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="range"
                    checked={dateFilter === 'range'}
                    onChange={(e) => setDateFilter(e.target.value as 'range')}
                    className="mr-2"
                  />
                  Date Range
                </label>
              </div>

              {dateFilter === 'single' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Class Filter */}
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Class Filter
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Classes</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>Class {i + 1}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Division
                </label>
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!selectedClass}
                >
                  <option value="">All Divisions</option>
                  {['A', 'B', 'C', 'D', 'E'].map(division => (
                    <option key={division} value={division}>Division {division}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, admission no, or receipt ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <Receipt className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Receipts</p>
              <p className="text-2xl font-bold text-gray-900">{filteredPayments.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Development Fee</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalDevelopmentFee.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600">Bus Fee</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalBusFee.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <div className="flex justify-end">
        <button
          onClick={downloadCSV}
          disabled={filteredPayments.length === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" />
          <span>Download CSV Report</span>
        </button>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Receipt-wise Payment Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receipt Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Details
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
              {filteredPayments.map((payment) => {
                const student = students.find(s => s.id === payment.studentId);
                return (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">#{payment.id.slice(-6)}</div>
                        <div className="text-sm text-gray-500">{formatDate(payment.paymentDate)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{payment.studentName}</div>
                        <div className="text-sm text-gray-500">
                          {payment.admissionNo} • Class {payment.class}-{payment.division}
                        </div>
                        {student && (
                          <div className="text-sm text-gray-500">
                            {student.mobile} • {student.busStop}
                          </div>
                        )}
                      </div>
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
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No receipts found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No payment receipts match your selected criteria.
            </p>
          </div>
        )}
      </div>

      {/* Fee Breakdown Summary */}
      {filteredPayments.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Breakdown Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">₹{totalDevelopmentFee.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Development Fees</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">₹{totalBusFee.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Bus Fees</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">₹{totalSpecialFee.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Special Fees</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">₹{totalAmount.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Collection</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptWiseReport;