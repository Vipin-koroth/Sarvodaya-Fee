            {(() => {
              const { unpaidStudents, groupedByClass } = getFeeUnpaidStudentsReport();
              
              if (unpaidStudents.length === 0) {
                return (
                  <div className="text-center py-12">
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                    <h3 className="text-xl font-semibold text-green-900 mb-2">All Fees Paid!</h3>
                    <p className="text-green-700">Every student has paid their required fees.</p>
                  </div>
                );
              }

              const totalDevBalance = unpaidStudents.reduce((sum, student) => {
                const studentPayments = payments.filter(p => p.studentId === student.id);
                const classKey = (['11', '12'].includes(student.class)) 
                  ? `${student.class}-${student.division}` 
                  : student.class;
                const requiredDevFee = feeConfig.developmentFees[classKey] || 0;
                const paidDevFee = studentPayments.reduce((sum, p) => sum + p.developmentFee, 0);
                return sum + Math.max(0, requiredDevFee - paidDevFee);
              }, 0);

              const totalBusBalance = unpaidStudents.reduce((sum, student) => {
                const studentPayments = payments.filter(p => p.studentId === student.id);
                const requiredBusFee = feeConfig.busStops[student.busStop] || 0;
                const paidBusFee = studentPayments.reduce((sum, p) => sum + p.busFee, 0);
                return sum + Math.max(0, requiredBusFee - paidBusFee);
              }, 0);

              return (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="text-red-600 text-sm font-medium">Total Students</div>
                      <div className="text-2xl font-bold text-gray-900">{unpaidStudents.length}</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="text-orange-600 text-sm font-medium">Development Balance</div>
                      <div className="text-2xl font-bold text-gray-900">₹{totalDevBalance.toLocaleString()}</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="text-yellow-600 text-sm font-medium">Bus Balance</div>
                      <div className="text-2xl font-bold text-gray-900">₹{totalBusBalance.toLocaleString()}</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="text-red-600 text-sm font-medium">Total Outstanding</div>
                      <div className="text-2xl font-bold text-gray-900">₹{(totalDevBalance + totalBusBalance).toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Class-wise breakdown */}
                  <div className="space-y-6">
                    {Object.entries(groupedByClass).map(([classKey, classStudents]) => (
                      <div key={classKey} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Class {classKey} ({classStudents.length} students)
                        </h3>
                        
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Development Fee</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bus Fee</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Balance</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Payment</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {classStudents.map((student) => {
                                const studentPayments = payments.filter(p => p.studentId === student.id);
                                
                                // Calculate development fee status
                                const classKey = (['11', '12'].includes(student.class)) 
                                  ? `${student.class}-${student.division}` 
                                  : student.class;
                                const requiredDevFee = feeConfig.developmentFees[classKey] || 0;
                                const paidDevFee = studentPayments.reduce((sum, p) => sum + p.developmentFee, 0);
                                const devBalance = Math.max(0, requiredDevFee - paidDevFee);
                                
                                // Calculate bus fee status
                                const requiredBusFee = feeConfig.busStops[student.busStop] || 0;
                                const paidBusFee = studentPayments.reduce((sum, p) => sum + p.busFee, 0);
                                const busBalance = Math.max(0, requiredBusFee - paidBusFee);
                                
                                const totalBalance = devBalance + busBalance;
                                const lastPayment = studentPayments.length > 0 
                                  ? new Date(Math.max(...studentPayments.map(p => new Date(p.paymentDate).getTime())))
                                  : null;
                                
                                return (
                                  <tr key={student.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4">
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                        <div className="text-sm text-gray-500">{student.admissionNo}</div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4">
                                      <div>
                                        <div className="text-sm text-gray-900">{student.mobile}</div>
                                        <div className="text-sm text-gray-500">{student.busStop}</div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4">
                                      <div className="text-sm">
                                        <div className="text-gray-600">Required: ₹{requiredDevFee}</div>
                                        <div className="text-green-600">Paid: ₹{paidDevFee}</div>
                                        <div className="text-red-600 font-medium">Balance: ₹{devBalance}</div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4">
                                      <div className="text-sm">
                                        <div className="text-gray-600">Required: ₹{requiredBusFee}</div>
                                        <div className="text-green-600">Paid: ₹{paidBusFee}</div>
                                        <div className="text-red-600 font-medium">Balance: ₹{busBalance}</div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4">
                                      <span className="text-lg font-semibold text-red-600">
                                        ₹{totalBalance.toLocaleString()}
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-900">
                                      {lastPayment ? lastPayment.toLocaleDateString('en-GB') : 'Never'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
import React, { useState } from 'react';
import { FileText, Download, Users, Bus, TrendingUp, Calendar, Receipt, AlertTriangle } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const Reports: React.FC = () => {
  const { students, payments, feeConfig } = useData();
  const [reportType, setReportType] = useState('receipt-wise');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateFilter, setDateFilter] = useState<'single' | 'range'>('single');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

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
        const date = new Date(payment.paymentDate).toLocaleDateString('en-GB');
        acc[date] = (acc[date] || 0) + payment.totalAmount;
        return acc;
      }, {})
    };
  };

  // Class monthly collection report
  const getClassMonthlyCollectionReport = () => {
    const report: Record<string, any> = {};
    
    // Get all months from payments
    const allMonths = [...new Set(payments.map(p => 
      new Date(p.paymentDate).toISOString().slice(0, 7)
    ))].sort();
    
    // Group students by class
    for (let classNum = 1; classNum <= 12; classNum++) {
      for (const division of ['A', 'B', 'C', 'D', 'E']) {
        const classKey = `${classNum}-${division}`;
        const classStudents = students.filter(s => 
          s.class === classNum.toString() && s.division === division
        );
        
        if (classStudents.length > 0) {
          report[classKey] = {
            students: classStudents.map(student => {
              const studentPayments = payments.filter(p => p.studentId === student.id);
              
              // Calculate monthly collections
              const monthlyCollections: Record<string, {
                developmentFee: number;
                busFee: number;
                specialFee: number;
                total: number;
              }> = {};
              
              allMonths.forEach(month => {
                const monthPayments = studentPayments.filter(p => 
                  new Date(p.paymentDate).toISOString().slice(0, 7) === month
                );
                
                monthlyCollections[month] = {
                  developmentFee: monthPayments.reduce((sum, p) => sum + p.developmentFee, 0),
                  busFee: monthPayments.reduce((sum, p) => sum + p.busFee, 0),
                  specialFee: monthPayments.reduce((sum, p) => sum + p.specialFee, 0),
                  total: monthPayments.reduce((sum, p) => sum + p.totalAmount, 0)
                };
              });
              
              return {
                ...student,
                monthlyCollections,
                totalCollected: studentPayments.reduce((sum, p) => sum + p.totalAmount, 0)
              };
            }),
            allMonths
          };
        }
      }
    }
    
    return report;
  const getFeeUnpaidStudentsReport = () => {
    const unpaidStudents = students.filter(student => {
      const studentPayments = payments.filter(p => p.studentId === student.id);
      
      // Calculate required fees
      const classKey = (['11', '12'].includes(student.class)) 
        ? `${student.class}-${student.division}` 
        : student.class;
      const requiredDevFee = feeConfig.developmentFees[classKey] || 0;
      const requiredBusFee = feeConfig.busStops[student.busStop] || 0;
      
      // Calculate paid amounts
      const paidDevFee = studentPayments.reduce((sum, p) => sum + p.developmentFee, 0);
      const paidBusFee = studentPayments.reduce((sum, p) => sum + p.busFee, 0);
      
      // Check if there's any outstanding balance
      const devBalance = Math.max(0, requiredDevFee - paidDevFee);
      const busBalance = Math.max(0, requiredBusFee - paidBusFee);
      
      return devBalance > 0 || busBalance > 0;
    });

    // Group by class
    const groupedByClass = unpaidStudents.reduce((acc, student) => {
      const classKey = `${student.class}-${student.division}`;
      if (!acc[classKey]) {
        acc[classKey] = [];
      }
      acc[classKey].push(student);
      return acc;
    }, {} as Record<string, typeof students>);

    return { unpaidStudents, groupedByClass };
  };

  };
  // Receipt-wise report data
  const getReceiptWiseReport = () => {
    let filteredPayments = payments;

    // Apply date filter
    if (dateFilter === 'single') {
      filteredPayments = payments.filter(payment => 
        new Date(payment.paymentDate).toISOString().split('T')[0] === selectedDate
      );
    } else {
      filteredPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.paymentDate).toISOString().split('T')[0];
        const matchesFromDate = !fromDate || paymentDate >= fromDate;
        const matchesToDate = !toDate || paymentDate <= toDate;
        return matchesFromDate && matchesToDate;
      });
    }

    // Apply class filter if selected
    if (selectedClass) {
      filteredPayments = filteredPayments.filter(payment => payment.class === selectedClass);
    }

    return filteredPayments.sort((a, b) => 
      new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
  };

  const getStudentBalance = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return { devBalance: 0, busBalance: 0 };

    const classKey = (['11', '12'].includes(student.class)) 
      ? `${student.class}-${student.division}` 
      : student.class;

    const totalDevFee = feeConfig.developmentFees[classKey] || 0;
    const totalBusFee = feeConfig.busStops[student.busStop] || 0;

    const studentPayments = payments.filter(p => p.studentId === studentId);
    const paidDevFee = studentPayments.reduce((sum, p) => sum + (p.developmentFee || 0), 0);
    const paidBusFee = studentPayments.reduce((sum, p) => sum + (p.busFee || 0), 0);

    return {
      devBalance: Math.max(0, totalDevFee - paidDevFee),
      busBalance: Math.max(0, totalBusFee - paidBusFee)
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

  const downloadClassMonthlyReport = (reportData: any) => {
    // Create separate CSV files for each fee type
    const allMonths = Object.values(reportData)[0]?.allMonths || [];
    
    // Combined report with all fees
    const combinedHeaders = ['Class', 'Student Name', 'Admission No', ...allMonths.map(month => `${month} Total`), 'Grand Total'];
    const combinedRows: string[][] = [];
    
    // Development fee report
    const devHeaders = ['Class', 'Student Name', 'Admission No', ...allMonths.map(month => `${month} Dev Fee`), 'Total Dev Fee'];
    const devRows: string[][] = [];
    
    // Bus fee report
    const busHeaders = ['Class', 'Student Name', 'Admission No', ...allMonths.map(month => `${month} Bus Fee`), 'Total Bus Fee'];
    const busRows: string[][] = [];
    
    // Special fee report
    const splHeaders = ['Class', 'Student Name', 'Admission No', ...allMonths.map(month => `${month} Special Fee`), 'Total Special Fee'];
    const splRows: string[][] = [];
    
    Object.entries(reportData).forEach(([classKey, classData]: [string, any]) => {
      classData.students.forEach((student: any) => {
        // Combined row
        const combinedRow = [
          classKey,
          student.name,
          student.admissionNo,
          ...allMonths.map(month => student.monthlyCollections[month]?.total || 0),
          student.totalCollected
        ];
        combinedRows.push(combinedRow.map(String));
        
        // Development fee row
        const devRow = [
          classKey,
          student.name,
          student.admissionNo,
          ...allMonths.map(month => student.monthlyCollections[month]?.developmentFee || 0),
          allMonths.reduce((sum, month) => sum + (student.monthlyCollections[month]?.developmentFee || 0), 0)
        ];
        devRows.push(devRow.map(String));
        
        // Bus fee row
        const busRow = [
          classKey,
          student.name,
          student.admissionNo,
          ...allMonths.map(month => student.monthlyCollections[month]?.busFee || 0),
          allMonths.reduce((sum, month) => sum + (student.monthlyCollections[month]?.busFee || 0), 0)
        ];
        busRows.push(busRow.map(String));
        
        // Special fee row
        const splRow = [
          classKey,
          student.name,
          student.admissionNo,
          ...allMonths.map(month => student.monthlyCollections[month]?.specialFee || 0),
          allMonths.reduce((sum, month) => sum + (student.monthlyCollections[month]?.specialFee || 0), 0)
        ];
        splRows.push(splRow.map(String));
      });
    });
    
    // Create and download CSV files
    const timestamp = new Date().toISOString().slice(0, 10);
    
    // Combined report
    const combinedCSV = [combinedHeaders, ...combinedRows].map(row => row.join(',')).join('\n');
    downloadCSVFile(combinedCSV, `class_monthly_collection_combined_${timestamp}.csv`);
    
    // Development fee report
    const devCSV = [devHeaders, ...devRows].map(row => row.join(',')).join('\n');
    downloadCSVFile(devCSV, `class_monthly_collection_development_fee_${timestamp}.csv`);
    
    // Bus fee report
    const busCSV = [busHeaders, ...busRows].map(row => row.join(',')).join('\n');
    downloadCSVFile(busCSV, `class_monthly_collection_bus_fee_${timestamp}.csv`);
    
    // Special fee report
    const splCSV = [splHeaders, ...splRows].map(row => row.join(',')).join('\n');
    downloadCSVFile(splCSV, `class_monthly_collection_special_fee_${timestamp}.csv`);
  };
  
  const downloadCSVFile = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  const generateCSV = (data: any, type: string) => {
    let headers: string[] = [];
    let rows: string[][] = [];

    switch (type) {
      case 'receipt-wise':
        headers = ['Receipt ID', 'Date', 'Student Name', 'Admission No', 'Class', 'Development Fee', 'Bus Fee', 'Special Fee', 'Special Fee Type', 'Total Amount', 'Added By', 'Dev Balance', 'Bus Balance'];
        rows = data.map((payment: any) => {
          const student = students.find(s => s.id === payment.studentId);
          const balance = getStudentBalance(payment.studentId);
          return [
            payment.id.slice(-6),
            new Date(payment.paymentDate).toLocaleDateString('en-GB'),
            payment.studentName,
            payment.admissionNo,
            `${payment.class}-${payment.division}`,
            payment.developmentFee.toString(),
            payment.busFee.toString(),
            payment.specialFee.toString(),
            payment.specialFeeType || '',
            payment.totalAmount.toString(),
            payment.addedBy,
            balance.devBalance.toString(),
            balance.busBalance.toString()
          ];
        });
        break;
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
      case 'fee-unpaid':
        headers = ['Class', 'Student Name', 'Admission No', 'Mobile', 'Bus Stop', 'Dev Fee Required', 'Dev Fee Paid', 'Dev Balance', 'Bus Fee Required', 'Bus Fee Paid', 'Bus Balance', 'Total Balance', 'Last Payment'];
        rows = [];
        Object.entries(data).forEach(([classKey, classData]: [string, any]) => {
          classData.students.forEach((student: any) => {
            rows.push([
              classKey,
              student.name,
              student.admissionNo,
              student.mobile,
              student.busStop,
              student.totalDevRequired.toString(),
              student.paidDev.toString(),
              student.devBalance.toString(),
              student.totalBusRequired.toString(),
              student.paidBus.toString(),
              student.busBalance.toString(),
              student.totalBalance.toString(),
              student.lastPaymentDate ? new Date(student.lastPaymentDate).toLocaleDateString('en-GB') : 'Never'
            ]);
          });
        });
        break;
    }

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const classWiseData = getClassWiseReport();
  const busStopData = getBusStopReport();
  const monthlyData = getMonthlyReport();
  const receiptWiseData = getReceiptWiseReport();
  const classMonthlyCollectionData = getClassMonthlyCollectionReport();
  const feeUnpaidStudentsData = getFeeUnpaidStudentsReport();

  // Fee unpaid students report data
  const getFeeUnpaidStudentsReport = () => {
    const report: Record<string, any> = {};
    
    students.forEach(student => {
      const balance = getStudentBalance(student.id);
      
      // Only include students with outstanding balances
      if (balance.devBalance > 0 || balance.busBalance > 0) {
        const classKey = `${student.class}-${student.division}`;
        
        if (!report[classKey]) {
          report[classKey] = {
            className: classKey,
            students: []
          };
        }
        
        // Get fee configuration for this student
        const feeKey = (['11', '12'].includes(student.class)) 
          ? `${student.class}-${student.division}` 
          : student.class;
        const totalDevRequired = feeConfig.developmentFees[feeKey] || 0;
        const totalBusRequired = feeConfig.busStops[student.busStop] || 0;
        
        // Calculate paid amounts
        const studentPayments = payments.filter(p => p.studentId === student.id);
        const paidDev = studentPayments.reduce((sum, p) => sum + (p.developmentFee || 0), 0);
        const paidBus = studentPayments.reduce((sum, p) => sum + (p.busFee || 0), 0);
        
        // Get last payment date
        const lastPayment = studentPayments.length > 0 
          ? studentPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0]
          : null;
        
        report[classKey].students.push({
          ...student,
          totalDevRequired,
          totalBusRequired,
          paidDev,
          paidBus,
          devBalance: balance.devBalance,
          busBalance: balance.busBalance,
          totalBalance: balance.devBalance + balance.busBalance,
          lastPaymentDate: lastPayment?.paymentDate || null
        });
      }
    });
    
    // Sort students within each class by total balance (highest first)
    Object.values(report).forEach((classData: any) => {
      classData.students.sort((a: any, b: any) => b.totalBalance - a.totalBalance);
    });
    
    return report;
  };

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
            onClick={() => setReportType('receipt-wise')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              reportType === 'receipt-wise' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Receipt className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">Receipt-wise Report</div>
            <div className="text-sm text-gray-600">Individual payment receipts</div>
          </button>
          
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
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
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
          
          <button
            onClick={() => setReportType('class-monthly-collection')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              reportType === 'class-monthly-collection' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <TrendingUp className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">Class Monthly Collection</div>
            <div className="text-sm text-gray-600">Students with monthly collections by fee type</div>
          </button>
          
          <button
            onClick={() => setReportType('fee-unpaid')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              reportType === 'fee-unpaid' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">Fee Unpaid Students</div>
            <div className="text-sm text-gray-600">Students with outstanding fee balances</div>
          </button>
        </div>
      </div>

      {/* Report Content */}
      {reportType === 'receipt-wise' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Receipt-wise Payment Report</h3>
            <button
              onClick={() => downloadReport(receiptWiseData, 'receipt_wise_report')}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              <span>Download CSV</span>
            </button>
          </div>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Filter
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as 'single' | 'range')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="single">Single Date</option>
                <option value="range">Date Range</option>
              </select>
            </div>
            
            {dateFilter === 'single' ? (
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
            ) : (
              <>
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
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class Filter
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
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-blue-600 text-sm font-medium">Total Receipts</div>
              <div className="text-2xl font-bold text-gray-900">{receiptWiseData.length}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-green-600 text-sm font-medium">Total Collection</div>
              <div className="text-2xl font-bold text-gray-900">₹{receiptWiseData.reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString()}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-purple-600 text-sm font-medium">Development Fees</div>
              <div className="text-2xl font-bold text-gray-900">₹{receiptWiseData.reduce((sum, p) => sum + p.developmentFee, 0).toLocaleString()}</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-orange-600 text-sm font-medium">Bus Fees</div>
              <div className="text-2xl font-bold text-gray-900">₹{receiptWiseData.reduce((sum, p) => sum + p.busFee, 0).toLocaleString()}</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Breakdown</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added By</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receiptWiseData.map((payment) => {
                  const balance = getStudentBalance(payment.studentId);
                  return (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-900">
                        #{payment.id.slice(-6)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payment.paymentDate).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{payment.studentName}</div>
                        <div className="text-sm text-gray-500">{payment.admissionNo} • Class {payment.class}-{payment.division}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.developmentFee > 0 && <div>Dev: ₹{payment.developmentFee}</div>}
                        {payment.busFee > 0 && <div>Bus: ₹{payment.busFee}</div>}
                        {payment.specialFee > 0 && <div>{payment.specialFeeType}: ₹{payment.specialFee}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">
                        ₹{payment.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {balance.devBalance > 0 && <div className="text-red-600">Dev: ₹{balance.devBalance}</div>}
                        {balance.busBalance > 0 && <div className="text-red-600">Bus: ₹{balance.busBalance}</div>}
                        {balance.devBalance === 0 && balance.busBalance === 0 && (
                          <div className="text-green-600">✓ Paid</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.addedBy}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {receiptWiseData.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No receipts found</h3>
              <p className="mt-1 text-sm text-gray-500">No payments match your selected criteria.</p>
            </div>
          )}
        </div>
      )}

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

      {reportType === 'class-monthly-collection' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Class-wise Monthly Collection Report</h3>
            <button
              onClick={() => downloadClassMonthlyReport(classMonthlyCollectionData)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              <span>Download All Reports</span>
            </button>
          </div>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Report Information</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Combined Report:</strong> All students with total monthly collections</p>
              <p>• <strong>Development Fee Report:</strong> Monthly development fee collections per student</p>
              <p>• <strong>Bus Fee Report:</strong> Monthly bus fee collections per student</p>
              <p>• <strong>Special Fee Report:</strong> Monthly special fee collections per student</p>
              <p>• <strong>Format:</strong> Each class shows students with their monthly payment breakdown</p>
            </div>
          </div>
          
          {Object.keys(classMonthlyCollectionData).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(classMonthlyCollectionData).map(([classKey, classData]: [string, any]) => (
                <div key={classKey} className="border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Class {classKey}</h4>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission No</th>
                          {classData.allMonths.map((month: string) => (
                            <th key={month} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              {new Date(month + '-01').toLocaleDateString('en-GB', { year: 'numeric', month: 'short' })}
                            </th>
                          ))}
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {classData.students.map((student: any) => (
                          <tr key={student.id}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {student.name}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {student.admissionNo}
                            </td>
                            {classData.allMonths.map((month: string) => (
                              <td key={month} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                {student.monthlyCollections[month]?.total > 0 ? (
                                  <div className="space-y-1">
                                    <div className="font-semibold text-green-600">
                                      ₹{student.monthlyCollections[month].total}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {student.monthlyCollections[month].developmentFee > 0 && (
                                        <div>Dev: ₹{student.monthlyCollections[month].developmentFee}</div>
                                      )}
                                      {student.monthlyCollections[month].busFee > 0 && (
                                        <div>Bus: ₹{student.monthlyCollections[month].busFee}</div>
                                      )}
                                      {student.monthlyCollections[month].specialFee > 0 && (
                                        <div>Spl: ₹{student.monthlyCollections[month].specialFee}</div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            ))}
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                              ₹{student.totalCollected.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
              <p className="mt-1 text-sm text-gray-500">No students or payments found to generate the report.</p>
            </div>
          )}
        </div>
      )}

      {reportType === 'fee-not-paid' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Fee Not Paid Students Report</h3>
            <button
              onClick={() => downloadReport(feeNotPaidData, 'fee_not_paid_students')}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              <span>Download CSV</span>
            </button>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-red-600 text-sm font-medium">Total Students with Pending Fees</div>
              <div className="text-2xl font-bold text-gray-900">
                {Object.values(feeNotPaidData).reduce((sum: number, classData: any) => sum + classData.students.length, 0)}
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-orange-600 text-sm font-medium">Total Development Balance</div>
              <div className="text-2xl font-bold text-gray-900">
                ₹{Object.values(feeNotPaidData).reduce((sum: number, classData: any) => 
                  sum + classData.students.reduce((classSum: number, student: any) => classSum + student.devBalance, 0), 0
                ).toLocaleString()}
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-yellow-600 text-sm font-medium">Total Bus Balance</div>
              <div className="text-2xl font-bold text-gray-900">
                ₹{Object.values(feeNotPaidData).reduce((sum: number, classData: any) => 
                  sum + classData.students.reduce((classSum: number, student: any) => classSum + student.busBalance, 0), 0
                ).toLocaleString()}
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-red-600 text-sm font-medium">Total Outstanding Amount</div>
              <div className="text-2xl font-bold text-gray-900">
                ₹{Object.values(feeNotPaidData).reduce((sum: number, classData: any) => 
                  sum + classData.students.reduce((classSum: number, student: any) => classSum + student.totalBalance, 0), 0
                ).toLocaleString()}
              </div>
            </div>
          </div>
          
          {Object.keys(feeNotPaidData).length > 0 ? (
        {reportType === 'fee-unpaid-students' && (
            <div className="space-y-8">
          <div className="bg-white rounded-lg shadow p-6">
                  </div>
            <div className="flex items-center justify-between mb-6">
                </div>
              <div className="flex items-center space-x-3">
              ))}
                <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
                <div>
          ) : (
                  <h2 className="text-xl font-bold text-gray-900">Fee Unpaid Students Report</h2>
            <div className="text-center py-12">
                  <p className="text-sm text-gray-600">Students with outstanding fee balances</p>
              <Users className="mx-auto h-12 w-12 text-green-400" />
                </div>
              <h3 className="mt-2 text-sm font-medium text-green-900">All Fees Paid!</h3>
              </div>
              <p className="mt-1 text-sm text-green-600">No students have pending fee payments.</p>
              <button
            </div>
                onClick={downloadFeeUnpaidStudentsCSV}
          )}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        </div>
              >
      )}
                <Download className="h-4 w-4" />
    </div>
                <span>Download CSV</span>
  );
              </button>
};
            </div>


export default Reports;