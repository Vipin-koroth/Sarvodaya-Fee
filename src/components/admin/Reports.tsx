import React, { useState } from 'react';
import { FileText, Download, Calendar, Users, TrendingUp, DollarSign } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const Reports: React.FC = () => {
  const { students, payments, feeConfig } = useData();
  const [reportType, setReportType] = useState<'class' | 'busStop' | 'monthly' | 'summary'>('summary');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedBusStop, setSelectedBusStop] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const generateClassReport = () => {
    const classStudents = students.filter(s => 
      (!selectedClass || s.class === selectedClass) &&
      (!selectedDivision || s.division === selectedDivision)
    );
    
    const classPayments = payments.filter(p => 
      (!selectedClass || p.class === selectedClass) &&
      (!selectedDivision || p.division === selectedDivision)
    );

    const headers = [
      'Student Name', 'Admission No', 'Class', 'Division', 'Mobile',
      'Total Paid', 'Development Fee Paid', 'Bus Fee Paid', 'Special Fee Paid'
    ];

    const csvData = classStudents.map(student => {
      const studentPayments = classPayments.filter(p => p.studentId === student.id);
      const totalPaid = studentPayments.reduce((sum, p) => sum + p.totalAmount, 0);
      const devFeePaid = studentPayments.reduce((sum, p) => sum + p.developmentFee, 0);
      const busFeePaid = studentPayments.reduce((sum, p) => sum + p.busFee, 0);
      const specialFeePaid = studentPayments.reduce((sum, p) => sum + p.specialFee, 0);

      return [
        student.name,
        student.admissionNo,
        student.class,
        student.division,
        student.mobile,
        totalPaid,
        devFeePaid,
        busFeePaid,
        specialFeePaid
      ];
    });

    return { headers, data: csvData };
  };

  const generateBusStopReport = () => {
    const busStopStudents = students.filter(s => 
      !selectedBusStop || s.busStop === selectedBusStop
    );
    
    const busStopPayments = payments.filter(p => {
      const student = students.find(s => s.id === p.studentId);
      return student && (!selectedBusStop || student.busStop === selectedBusStop);
    });

    const headers = [
      'Student Name', 'Admission No', 'Class', 'Bus Stop', 'Bus Number',
      'Total Bus Fee Paid', 'Payment Dates'
    ];

    const csvData = busStopStudents.map(student => {
      const studentBusPayments = busStopPayments.filter(p => p.studentId === student.id && p.busFee > 0);
      const totalBusFeePaid = studentBusPayments.reduce((sum, p) => sum + p.busFee, 0);
      const paymentDates = studentBusPayments.map(p => new Date(p.paymentDate).toLocaleDateString('en-GB')).join(', ');

      return [
        student.name,
        student.admissionNo,
        `${student.class}-${student.division}`,
        student.busStop,
        student.busNumber,
        totalBusFeePaid,
        paymentDates || 'No payments'
      ];
    });

    return { headers, data: csvData };
  };

  const generateMonthlyReport = () => {
    const monthPayments = payments.filter(p => {
      const paymentMonth = new Date(p.paymentDate).toISOString().slice(0, 7);
      return paymentMonth === selectedMonth;
    });

    const headers = [
      'Date', 'Student Name', 'Admission No', 'Class', 'Division',
      'Development Fee', 'Bus Fee', 'Special Fee', 'Total Amount', 'Added By'
    ];

    const csvData = monthPayments.map(payment => [
      new Date(payment.paymentDate).toLocaleDateString('en-GB'),
      payment.studentName,
      payment.admissionNo,
      payment.class,
      payment.division,
      payment.developmentFee,
      payment.busFee,
      payment.specialFee,
      payment.totalAmount,
      payment.addedBy
    ]);

    return { headers, data: csvData };
  };

  const downloadReport = () => {
    let reportData;
    let filename;

    switch (reportType) {
      case 'class':
        reportData = generateClassReport();
        filename = `class_report_${selectedClass || 'all'}_${selectedDivision || 'all'}_${new Date().toISOString().slice(0, 10)}.csv`;
        break;
      case 'busStop':
        reportData = generateBusStopReport();
        filename = `bus_stop_report_${selectedBusStop || 'all'}_${new Date().toISOString().slice(0, 10)}.csv`;
        break;
      case 'monthly':
        reportData = generateMonthlyReport();
        filename = `monthly_report_${selectedMonth}_${new Date().toISOString().slice(0, 10)}.csv`;
        break;
      default:
        return;
    }

    const csvContent = [reportData.headers, ...reportData.data]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSummaryStats = () => {
    const totalStudents = students.length;
    const totalPayments = payments.length;
    const totalCollection = payments.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalDevelopmentFees = payments.reduce((sum, p) => sum + p.developmentFee, 0);
    const totalBusFees = payments.reduce((sum, p) => sum + p.busFee, 0);
    const totalSpecialFees = payments.reduce((sum, p) => sum + p.specialFee, 0);

    return {
      totalStudents,
      totalPayments,
      totalCollection,
      totalDevelopmentFees,
      totalBusFees,
      totalSpecialFees
    };
  };

  const stats = getSummaryStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600">Generate and download various reports</p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPayments}</p>
            </div>
            <FileText className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total Collection</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalCollection.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Avg Payment</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{stats.totalPayments > 0 ? Math.round(stats.totalCollection / stats.totalPayments).toLocaleString() : 0}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Report Generation */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <FileText className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Generate Reports</h2>
        </div>

        <div className="space-y-6">
          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Report Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={() => setReportType('class')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  reportType === 'class'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Users className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Class Report</div>
                <div className="text-sm text-gray-600">Student-wise data by class</div>
              </button>

              <button
                onClick={() => setReportType('busStop')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  reportType === 'busStop'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Bus Stop Report</div>
                <div className="text-sm text-gray-600">Bus fee collection by stop</div>
              </button>

              <button
                onClick={() => setReportType('monthly')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  reportType === 'monthly'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Calendar className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Monthly Report</div>
                <div className="text-sm text-gray-600">All payments in a month</div>
              </button>

              <button
                onClick={() => setReportType('summary')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  reportType === 'summary'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Summary Report</div>
                <div className="text-sm text-gray-600">Overall statistics</div>
              </button>
            </div>
          </div>

          {/* Report Filters */}
          {reportType === 'class' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class (Optional)
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Classes</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(cls => (
                    <option key={cls} value={cls.toString()}>Class {cls}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Division (Optional)
                </label>
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Divisions</option>
                  {['A', 'B', 'C', 'D', 'E'].map(div => (
                    <option key={div} value={div}>Division {div}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {reportType === 'busStop' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bus Stop (Optional)
              </label>
              <select
                value={selectedBusStop}
                onChange={(e) => setSelectedBusStop(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Bus Stops</option>
                {Object.keys(feeConfig.busStops).map(stop => (
                  <option key={stop} value={stop}>{stop}</option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'monthly' && (
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
          )}

          {/* Download Button */}
          {reportType !== 'summary' && (
            <button
              onClick={downloadReport}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-5 w-5" />
              <span>Download {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Fee Collection Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">₹{stats.totalDevelopmentFees.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Development Fees</div>
            <div className="text-xs text-gray-500">
              {stats.totalCollection > 0 ? Math.round((stats.totalDevelopmentFees / stats.totalCollection) * 100) : 0}% of total
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">₹{stats.totalBusFees.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Bus Fees</div>
            <div className="text-xs text-gray-500">
              {stats.totalCollection > 0 ? Math.round((stats.totalBusFees / stats.totalCollection) * 100) : 0}% of total
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">₹{stats.totalSpecialFees.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Special Fees</div>
            <div className="text-xs text-gray-500">
              {stats.totalCollection > 0 ? Math.round((stats.totalSpecialFees / stats.totalCollection) * 100) : 0}% of total
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;