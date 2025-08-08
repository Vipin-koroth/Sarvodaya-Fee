import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Download, Users, MapPin, Calendar, AlertCircle } from 'lucide-react';

interface ReportData {
  class: string;
  division: string;
  totalStudents: number;
  developmentBalance: number;
  busBalance: number;
  totalBalance: number;
}

interface BusStopReportData {
  busStop: string;
  totalStudents: number;
  developmentBalance: number;
  busBalance: number;
  totalBalance: number;
}

interface MonthlyReportData {
  month: string;
  year: number;
  totalCollection: number;
  developmentFee: number;
  busFee: number;
  specialFee: number;
  totalPayments: number;
}

const Reports: React.FC = () => {
  const { students, payments, feeConfig } = useData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('class-wise');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedBusStop, setSelectedBusStop] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Get unique classes and divisions
  const classes = [...new Set(students.map(s => s.class))].sort();
  const divisions = selectedClass 
    ? [...new Set(students.filter(s => s.class === selectedClass).map(s => s.division))].sort()
    : [];
  const busStops = [...new Set(students.map(s => s.bus_stop))].sort();

  // Helper function to get student balance
  const getStudentBalance = (student: any) => {
    const studentPayments = payments.filter(p => p.student_id === student.id);
    
    // Get fee configuration
    const developmentFeeConfig = feeConfig.find(f => f.config_type === 'development_fee' && f.config_key === student.class);
    const busFeeConfig = feeConfig.find(f => f.config_type === 'bus_fee' && f.config_key === student.bus_stop);
    
    const requiredDevelopmentFee = developmentFeeConfig?.config_value || 0;
    const requiredBusFeeOriginal = busFeeConfig?.config_value || 0;
    
    // Apply bus fee discount
    const busDiscount = student.bus_fee_discount || 0;
    const requiredBusFee = Math.max(0, requiredBusFeeOriginal - busDiscount);
    
    // Calculate total paid amounts
    const totalDevelopmentPaid = studentPayments.reduce((sum, p) => sum + (p.development_fee || 0), 0);
    const totalBusPaid = studentPayments.reduce((sum, p) => sum + (p.bus_fee || 0), 0);
    
    // Calculate remaining balances (what student still owes)
    const developmentBalance = Math.max(0, requiredDevelopmentFee - totalDevelopmentPaid);
    const busBalance = Math.max(0, requiredBusFee - totalBusPaid);
    const totalBalance = developmentBalance + busBalance;
    
    return {
      developmentBalance,
      busBalance,
      totalBalance,
      requiredDevelopmentFee,
      requiredBusFee,
      totalDevelopmentPaid,
      totalBusPaid
    };
  };

  // Generate class-wise report
  const generateClassWiseReport = (): ReportData[] => {
    const classGroups = students.reduce((acc, student) => {
      const key = `${student.class}-${student.division}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(student);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(classGroups).map(([key, classStudents]) => {
      const [className, division] = key.split('-');
      let totalDevelopmentBalance = 0;
      let totalBusBalance = 0;

      classStudents.forEach(student => {
        const balance = getStudentBalance(student);
        totalDevelopmentBalance += balance.developmentBalance;
        totalBusBalance += balance.busBalance;
      });

      return {
        class: className,
        division,
        totalStudents: classStudents.length,
        developmentBalance: totalDevelopmentBalance,
        busBalance: totalBusBalance,
        totalBalance: totalDevelopmentBalance + totalBusBalance
      };
    }).sort((a, b) => a.class.localeCompare(b.class) || a.division.localeCompare(b.division));
  };

  // Generate bus stop-wise report
  const generateBusStopReport = (): BusStopReportData[] => {
    const busStopGroups = students.reduce((acc, student) => {
      if (!acc[student.bus_stop]) {
        acc[student.bus_stop] = [];
      }
      acc[student.bus_stop].push(student);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(busStopGroups).map(([busStop, busStudents]) => {
      let totalDevelopmentBalance = 0;
      let totalBusBalance = 0;

      busStudents.forEach(student => {
        const balance = getStudentBalance(student);
        totalDevelopmentBalance += balance.developmentBalance;
        totalBusBalance += balance.busBalance;
      });

      return {
        busStop,
        totalStudents: busStudents.length,
        developmentBalance: totalDevelopmentBalance,
        busBalance: totalBusBalance,
        totalBalance: totalDevelopmentBalance + totalBusBalance
      };
    }).sort((a, b) => a.busStop.localeCompare(b.busStop));
  };

  // Generate monthly collection report
  const generateMonthlyReport = (): MonthlyReportData[] => {
    const monthlyGroups = payments.reduce((acc, payment) => {
      const date = new Date(payment.payment_date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(payment);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(monthlyGroups).map(([key, monthPayments]) => {
      const [year, month] = key.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const totalDevelopmentFee = monthPayments.reduce((sum, p) => sum + (p.development_fee || 0), 0);
      const totalBusFee = monthPayments.reduce((sum, p) => sum + (p.bus_fee || 0), 0);
      const totalSpecialFee = monthPayments.reduce((sum, p) => sum + (p.special_fee || 0), 0);

      return {
        month: monthNames[parseInt(month)],
        year: parseInt(year),
        totalCollection: totalDevelopmentFee + totalBusFee + totalSpecialFee,
        developmentFee: totalDevelopmentFee,
        busFee: totalBusFee,
        specialFee: totalSpecialFee,
        totalPayments: monthPayments.length
      };
    }).sort((a, b) => b.year - a.year || b.month.localeCompare(a.month));
  };

  // Get students with no payments (fee not paid)
  const getStudentsWithNoPayments = () => {
    return students.filter(student => {
      const studentPayments = payments.filter(p => p.student_id === student.id);
      const balance = getStudentBalance(student);
      return balance.totalBalance > 0;
    });
  };

  // Export to CSV
  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const key = header.toLowerCase().replace(/\s+/g, '');
        return `"${row[key] || ''}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const classWiseData = generateClassWiseReport();
  const busStopData = generateBusStopReport();
  const monthlyData = generateMonthlyReport();
  const feeNotPaidStudents = getStudentsWithNoPayments();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <FileText className="mr-2" />
          Reports
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'class-wise', label: 'Class-wise Report', icon: Users },
            { id: 'bus-stop', label: 'Bus Stop Report', icon: MapPin },
            { id: 'monthly', label: 'Monthly Collection', icon: Calendar },
            { id: 'fee-not-paid', label: 'Fee Not Paid', icon: AlertCircle }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Class-wise Report */}
      {activeTab === 'class-wise' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Class-wise Fee Balance Report</h2>
              <button
                onClick={() => exportToCSV(
                  classWiseData.map(item => ({
                    class: item.class,
                    division: item.division,
                    totalstudents: item.totalStudents,
                    developmentbalance: item.developmentBalance,
                    busbalance: item.busBalance,
                    totalbalance: item.totalBalance
                  })),
                  'class-wise-report',
                  ['Class', 'Division', 'Total Students', 'Development Balance', 'Bus Balance', 'Total Balance']
                )}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Division</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Development Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Balance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classWiseData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.class}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.division}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalStudents}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.developmentBalance.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.busBalance.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{item.totalBalance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bus Stop Report */}
      {activeTab === 'bus-stop' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Bus Stop-wise Fee Balance Report</h2>
              <button
                onClick={() => exportToCSV(
                  busStopData.map(item => ({
                    busstop: item.busStop,
                    totalstudents: item.totalStudents,
                    developmentbalance: item.developmentBalance,
                    busbalance: item.busBalance,
                    totalbalance: item.totalBalance
                  })),
                  'bus-stop-report',
                  ['Bus Stop', 'Total Students', 'Development Balance', 'Bus Balance', 'Total Balance']
                )}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus Stop</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Development Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Balance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {busStopData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.busStop}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalStudents}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.developmentBalance.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.busBalance.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{item.totalBalance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly Collection Report */}
      {activeTab === 'monthly' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Monthly Collection Report</h2>
              <button
                onClick={() => exportToCSV(
                  monthlyData.map(item => ({
                    month: item.month,
                    year: item.year,
                    totalcollection: item.totalCollection,
                    developmentfee: item.developmentFee,
                    busfee: item.busFee,
                    specialfee: item.specialFee,
                    totalpayments: item.totalPayments
                  })),
                  'monthly-collection-report',
                  ['Month', 'Year', 'Total Collection', 'Development Fee', 'Bus Fee', 'Special Fee', 'Total Payments']
                )}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Collection</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Development Fee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus Fee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Special Fee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Payments</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.month}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.year}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{item.totalCollection.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.developmentFee.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.busFee.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.specialFee.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalPayments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fee Not Paid Students */}
      {activeTab === 'fee-not-paid' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Students with Outstanding Fees</h2>
              <button
                onClick={() => exportToCSV(
                  feeNotPaidStudents.map(student => {
                    const balance = getStudentBalance(student);
                    return {
                      admissionno: student.admission_no,
                      name: student.name,
                      class: student.class,
                      division: student.division,
                      busstop: student.bus_stop,
                      developmentbalance: balance.developmentBalance,
                      busbalance: balance.busBalance,
                      totalbalance: balance.totalBalance
                    };
                  }),
                  'fee-not-paid-students',
                  ['Admission No', 'Name', 'Class', 'Division', 'Bus Stop', 'Development Balance', 'Bus Balance', 'Total Balance']
                )}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Division</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus Stop</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Development Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Balance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feeNotPaidStudents.map((student, index) => {
                  const balance = getStudentBalance(student);
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.admission_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.class}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.division}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.bus_stop}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{balance.developmentBalance.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{balance.busBalance.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{balance.totalBalance.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;