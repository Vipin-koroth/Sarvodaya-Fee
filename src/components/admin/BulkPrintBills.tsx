import React, { useState } from 'react';
import { Printer, Calendar, Users, FileText } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const BulkPrintBills: React.FC = () => {
  const { payments, students, feeConfig } = useData();
  const [printCriteria, setPrintCriteria] = useState<'date' | 'class'>('date');
  const [dateFilter, setDateFilter] = useState<'single' | 'range'>('single');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');

  const getStudentBalance = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return { devBalance: 0, busBalance: 0 };

    const classKey = ['11', '12'].includes(student.class) 
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const getFilteredPayments = () => {
    let filteredPayments = payments;

    // Apply class filter if selected
    if (printCriteria === 'class' && selectedClass) {
      filteredPayments = filteredPayments.filter(payment => {
        const matchesClass = payment.class === selectedClass;
        const matchesDivision = !selectedDivision || payment.division === selectedDivision;
        return matchesClass && matchesDivision;
      });
    }

    // Apply date filter
    if (dateFilter === 'single') {
      return filteredPayments.filter(payment => 
        new Date(payment.paymentDate).toISOString().split('T')[0] === selectedDate
      );
    } else {
      return filteredPayments.filter(payment => {
        const paymentDate = new Date(payment.paymentDate).toISOString().split('T')[0];
        const matchesFromDate = !fromDate || paymentDate >= fromDate;
        const matchesToDate = !toDate || paymentDate <= toDate;
        return matchesFromDate && matchesToDate;
      });
    }
  };

  const handlePrint = () => {
    const filteredPayments = getFilteredPayments();
    if (filteredPayments.length === 0) {
      alert('No payments found for the selected criteria.');
      return;
    }

    const printContent = document.getElementById('bulk-bills-print-a6');
    if (!printContent) {
      alert('Print content not found. Please try again.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this site to enable printing.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Receipt</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; }
            @media print {
              body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .no-print { display: none; }
            }
            @page { size: A6; margin: 3mm; }
            .receipt { 
              width: calc(105mm - 6mm); 
              height: calc(148mm - 6mm); 
              padding: 4mm; 
              font-size: 14px; 
              line-height: 1.2; 
              page-break-after: always; 
              margin: 3mm; 
              overflow: hidden; 
              font-family: Arial, sans-serif;
              border: none;
            }
            .receipt-number { text-align: left; font-size: 10px; margin-bottom: 1mm; color: #666; }
            .receipt-header { text-align: center; margin-bottom: 3mm; }
            .receipt-header .school-name { font-size: 22px; font-weight: bold; margin-bottom: 1mm; }
            .receipt-header .school-subtitle { font-size: 20px; font-weight: bold; margin-bottom: 1mm; }
            .receipt-header .location { font-size: 16px; margin-bottom: 1mm; }
            .receipt-header .receipt-title { font-size: 12px; margin-top: 1mm; font-weight: bold; text-decoration: underline; }
            .student-details { margin-bottom: 2mm; font-size: 12px; }
            .student-details table { width: 100%; }
            .student-details td { padding-bottom: 1px; }
            .fee-details { margin-bottom: 2mm; font-size: 12px; }
            .fee-details table { width: 100%; }
            .fee-details td { padding-bottom: 1px; }
            .fee-details-title { font-weight: bold; text-decoration: underline; margin-bottom: 2mm; }
            .payment-line { font-size: 10px; color: #666; margin-left: 6px; }
            .balance-section { margin-bottom: 2mm; font-size: 12px; }
            .balance-section table { width: 100%; }
            .balance-section td { padding-bottom: 1px; }
            .balance-title { font-weight: bold; margin-bottom: 2mm; }
            .total-amount { font-weight: bold; text-align: center; padding: 1mm 0; margin: 1mm 0; font-size: 16px; }
            .footer { text-align: center; margin-top: 1mm; font-size: 10px; font-style: italic; }
            hr { border: 0.5px solid #000; margin: 2mm 0; }
            .dotted-line { border-top: 0.5px dotted #000; margin: 2mm 0; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const filteredPayments = getFilteredPayments();
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Print Receipt</h1>
        <p className="text-gray-600">Print receipts with date and class filtering options</p>
      </div>

      {/* Print Criteria Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">Print Criteria</h2>
        </div>

        <div className="space-y-4">
          {/* Criteria Type Selection */}
          <div className="flex space-x-6">
            <label className="flex items-center">
              <input
                type="radio"
                value="date"
                checked={printCriteria === 'date'}
                onChange={(e) => setPrintCriteria(e.target.value as 'date')}
                className="mr-2"
              />
              <Calendar className="w-4 h-4 mr-1" />
              Date-wise
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="class"
                checked={printCriteria === 'class'}
                onChange={(e) => setPrintCriteria(e.target.value as 'class')}
                className="mr-2"
              />
              <Users className="w-4 h-4 mr-1" />
              Class-wise
            </label>
          </div>

          {/* Class Selection (if class-wise selected) */}
          {printCriteria === 'class' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          )}
        </div>
      </div>

      {/* Date Filter Options */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">Date Filter</h2>
        </div>

        <div className="space-y-4">
          {/* Filter Type Selection */}
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

          {/* Date Inputs */}
          {dateFilter === 'single' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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


      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-800 mb-2">Print Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Criteria:</span>
            <span className="ml-2 font-medium">
              {printCriteria === 'date' ? 'Date-wise' : 'Class-wise'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Filter:</span>
            <span className="ml-2 font-medium">
              {printCriteria === 'class' && selectedClass 
                ? `Class ${selectedClass}${selectedDivision ? `-${selectedDivision}` : ''}`
                : dateFilter === 'single' 
                  ? formatDate(selectedDate)
                  : `${fromDate ? formatDate(fromDate) : 'Start'} - ${toDate ? formatDate(toDate) : 'End'}`
              }
            </span>
          </div>
          <div>
            <span className="text-gray-600">Total Bills:</span>
            <span className="ml-2 font-medium">{filteredPayments.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Total Amount:</span>
            <span className="ml-2 font-medium">₹{totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Print Button */}
      <button
        onClick={handlePrint}
        disabled={filteredPayments.length === 0}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg font-medium"
      >
        <Printer className="w-5 h-5" />
        Print {filteredPayments.length} A6 Receipts
      </button>

      {filteredPayments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>No payments found for the selected criteria.</p>
        </div>
      )}

      {/* Hidden Print Content */}
      <div style={{ display: 'none' }}>
        <div id="bulk-bills-print-a6">
          {filteredPayments.map((payment) => {
            const student = students.find(s => s.id === payment.studentId);
            const paymentDetails = getStudentBalance(payment.studentId);
            
            return (
              <div key={payment.id} className="receipt">
                <div className="receipt-number">#{payment.id.slice(-6)}</div>
                
                <div className="receipt-header">
                  <div className="school-name">Sarvodaya</div>
                  <div className="school-subtitle">Higher Secondary School</div>
                  <div className="location">Eachome</div>
                  <div className="receipt-title">Fee Payment Receipt</div>
                </div>
                
                <hr />
                
                <div className="student-details">
                  <table>
                    <tr><td><strong>Name:</strong></td><td style={{textAlign: 'right'}}>{student?.name}</td></tr>
                    <tr><td><strong>Adm No:</strong></td><td style={{textAlign: 'right'}}>{payment.admissionNo}</td></tr>
                    <tr><td><strong>Class:</strong></td><td style={{textAlign: 'right'}}>{student?.class}{student?.division ? `-${student.division}` : ''}</td></tr>
                    <tr><td><strong>Date:</strong></td><td style={{textAlign: 'right'}}>{formatDate(payment.paymentDate)}</td></tr>
                    <tr><td><strong>Receipt #:</strong></td><td style={{textAlign: 'right'}}>{payment.id.slice(-6)}</td></tr>
                  </table>
                </div>
                
                <hr />
                
                <div className="fee-details">
                  <div className="fee-details-title">Fee Details</div>
                  
                  <table>
                    {payment.developmentFee > 0 && (
                      <tr>
                        <td style={{ paddingBottom: '1mm' }}><strong>Development Fee:</strong></td>
                        <td style={{ textAlign: 'right', paddingBottom: '1mm' }}>₹{payment.developmentFee}</td>
                      </tr>
                    )}
                    {payment.busFee > 0 && (
                      <tr>
                        <td style={{ paddingBottom: '1mm' }}><strong>Bus Fee:</strong></td>
                        <td style={{ textAlign: 'right', paddingBottom: '1mm' }}>₹{payment.busFee}</td>
                      </tr>
                    )}
                    {payment.specialFee > 0 && (
                      <tr>
                        <td style={{ paddingBottom: '1mm' }}><strong>{payment.specialFeeType || 'Other Fee'}:</strong></td>
                        <td style={{ textAlign: 'right', paddingBottom: '1mm' }}>₹{payment.specialFee}</td>
                      </tr>
                    )}
                  </table>
                </div>
                
                <hr />
                
                <div className="total-amount">
                  TOTAL PAID: ₹{payment.totalAmount}
                </div>
                
                <hr />
                
                {(paymentDetails.devBalance > 0 || paymentDetails.busBalance > 0) && (
                  <>
                    <div className="balance-section">
                      <div className="balance-title">Remaining Balance</div>
                      <table>
                        {paymentDetails.devBalance > 0 && (
                          <tr><td><strong>Development:</strong></td><td style={{textAlign: 'right'}}>₹{paymentDetails.devBalance}</td></tr>
                        )}
                        {paymentDetails.busBalance > 0 && (
                          <tr><td><strong>Bus Fee:</strong></td><td style={{textAlign: 'right'}}>₹{paymentDetails.busBalance}</td></tr>
                        )}
                      </table>
                    </div>
                    <div className="dotted-line"></div>
                  </>
                )}
                
                <div className="footer">
                  <div>Thank you for your payment!</div>
                  <div>Keep this receipt for your records</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BulkPrintBills;