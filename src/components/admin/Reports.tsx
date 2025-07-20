import React, { useState } from 'react';
import { FileText, Download, Users, Bus, TrendingUp, Calendar } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const Reports: React.FC = () => {
  const { students, payments } = useData();
  const [reportType, setReportType] = useState('class-wise');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Class-wise report data
  const getClassWiseReport = () => {
    const report: Record<string, any> = {};
    
    for (let classNum = 1; classNum <= 12; classNum++) {
      for (const division of ['A', 'B', 'C', 'D', 'E']) {
        const key = `${classNum}-${division}`;
        const classStudents = students.filter(s => s.class === classNum.toString() && s.division === division);
        const classPayments = payments.filter(p => p.class === classNum.toString() && p.division === division);
        
        if (classStudents.length > 0) {
          report[key] = {
            totalStudents: classStudents.length,
            totalPayments: classPayments.length,
            developmentFees: classPayments.reduce((sum, p) => sum + p.developmentFee, 0),
            busFees: classPayments.reduce((sum, p) => sum + p.busFee, 0),
            specialFees: classPayments.reduce((sum, p) => sum + p.specialFee, 0),
            totalCollection: classPayments.reduce((sum, p) => sum + p.totalAmount, 0)
          };
        }
      }
    }
    
    return report;
  };

  // Bus stop-wise report data
  const getBusStopReport = () => {
    const report: Record<string, any> = {};
    
    students.forEach(student => {
      if (!report[student.busStop]) {
        report[student.busStop] = {
          totalStudents: 0,
          students: [],
          busNumbers: new Set(),
          tripNumbers: new Set(),
          classSummary: {}
        };
      }
      
      report[student.busStop].totalStudents++;
      report[student.busStop].students.push(student);
      report[student.busStop].busNumbers.add(student.busNumber);
      report[student.busStop].tripNumbers.add(student.tripNumber);
      
      // Add class-wise breakdown
      const classKey = `${student.class}-${student.division}`;
      if (!report[student.busStop].classSummary[classKey]) {
        report[student.busStop].classSummary[classKey] = 0;
      }
      report[student.busStop].classSummary[classKey]++;
    });
    
    return report;
  };

  // Monthly collection report
  const getMonthlyReport = () => {
    const monthPayments = payments.filter(payment => {
      const paymentMonth = new Date(payment.paymentDate).toISOString().slice(0, 7);
      return paymentMonth === selectedMonth;
    });

    return {
      totalPayments: monthPayments.length,
      developmentFees: monthPayments.reduce((sum, p) => sum + p.developmentFee, 0),
      busFees: monthPayments.reduce((sum, p) => sum + p.busFee, 0),
      specialFees: monthPayments.reduce((sum, p) => sum + p.specialFee, 0),
      totalCollection: monthPayments.reduce((sum, p) => sum + p.totalAmount, 0),
      dailyBreakdown: monthPayments.reduce((acc: Record<string, number>, payment) => {
        const date = new Date(payment.paymentDate).toLocaleDateString();
        acc[date] = (acc[date] || 0) + payment.totalAmount;
        return acc;
      }, {})
    };
  };

  const downloadReport = (reportData: any, filename: string) => {
    const csvContent = generateCSV(reportData, reportType);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateCSV = (data: any, type: string) => {
    let headers: string[] = [];
    let rows: string[][] = [];

    switch (type) {
      case 'class-wise':
        headers = ['Class', 'Total Students', 'Total Payments', 'Development Fees', 'Bus Fees', 'Special Fees', 'Total Collection'];
        rows = Object.entries(data).map(([key, value]: [string, any]) => [
          key,
          value.totalStudents.toString(),
          value.totalPayments.toString(),
          value.developmentFees.toString(),
          value.busFees.toString(),
          value.specialFees.toString(),
          value.totalCollection.toString()
        ]);
        break;
      case 'bus-stop':
        headers = ['Bus Stop', 'Total Students', 'Bus Numbers', 'Trip Numbers'];
        rows = Object.entries(data).map(([key, value]: [string, any]) => [
          key,
          value.totalStudents.toString(),
          Array.from(value.busNumbers).join(';'),
          Array.from(value.tripNumbers).join(';')
        ]);
        break;
      case 'monthly':
        headers = ['Date', 'Amount'];
        rows = Object.entries(data.dailyBreakdown).map(([date, amount]) => [date, amount.toString()]);
        break;
    }

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const classWiseData = getClassWiseReport();
  const busStopData = getBusStopReport();
  const monthlyData = getMonthlyReport();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600">Generate comprehensive reports for fee collection and student data</p>
      </div>

      {/* Report Type Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4 mb-4">
          <FileText className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Select Report Type</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setReportType('class-wise')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              reportType === 'class-wise' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Users className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">Class-wise Report</div>
            <div className="text-sm text-gray-600">Fee collection by class and division</div>
          </button>
          
          <button
            onClick={() => setReportType('bus-stop')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              reportType === 'bus-stop' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Bus className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">Bus Stop Report</div>
            <div className="text-sm text-gray-600">Students by bus stops and routes</div>
          </button>
          
          <button
            onClick={() => setReportType('monthly')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              reportType === 'monthly' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Calendar className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">Monthly Report</div>
            <div className="text-sm text-gray-600">Collection summary by month</div>
          </button>
        </div>
      </div>

      {/* Report Content */}
      {reportType === 'class-wise' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Class-wise Collection Report</h3>
            <button
              onClick={() => downloadReport(classWiseData, 'class_wise_report')}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              <span>Download CSV</span>
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payments</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Development</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bus Fees</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Special</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(classWiseData).map(([className, data]: [string, any]) => (
                  <tr key={className}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      Class {className}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{data.totalStudents}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{data.totalPayments}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">₹{data.developmentFees.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">₹{data.busFees.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">₹{data.specialFees.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">₹{data.totalCollection.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'bus-stop' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Bus Stop-wise Student Report</h3>
            <button
              onClick={() => downloadReport(busStopData, 'bus_stop_report')}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              <span>Download CSV</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(busStopData).map(([stopName, data]: [string, any]) => (
              <div key={stopName} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">{stopName}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Students:</span>
                    <span className="font-medium">{data.totalStudents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bus Numbers:</span>
                    <span className="font-medium">{Array.from(data.busNumbers).join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trip Numbers:</span>
                    <span className="font-medium">{Array.from(data.tripNumbers).join(', ')}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="text-gray-600 font-medium mb-1">Class-wise Distribution:</div>
                    <div className="space-y-1">
                      {Object.entries(data.classSummary).map(([classKey, count]) => (
                        <div key={classKey} className="flex justify-between text-xs">
                          <span className="text-gray-500">Class {classKey}:</span>
                          <span className="font-medium">{count as number} students</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reportType === 'monthly' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Collection Report</h3>
            <div className="flex items-center space-x-4">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => downloadReport(monthlyData, `monthly_report_${selectedMonth}`)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="h-4 w-4" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-blue-600 text-sm font-medium">Total Payments</div>
              <div className="text-2xl font-bold text-gray-900">{monthlyData.totalPayments}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-green-600 text-sm font-medium">Development Fees</div>
              <div className="text-2xl font-bold text-gray-900">₹{monthlyData.developmentFees.toLocaleString()}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-purple-600 text-sm font-medium">Bus Fees</div>
              <div className="text-2xl font-bold text-gray-900">₹{monthlyData.busFees.toLocaleString()}</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-orange-600 text-sm font-medium">Total Collection</div>
              <div className="text-2xl font-bold text-gray-900">₹{monthlyData.totalCollection.toLocaleString()}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collection Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(monthlyData.dailyBreakdown).map(([date, amount]) => (
                  <tr key={date}>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{date}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">₹{(amount as number).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;