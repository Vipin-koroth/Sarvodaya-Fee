import React from 'react';
import { X, Printer, MessageCircle } from 'lucide-react';
import { Payment, useData } from '../../contexts/DataContext';

interface ReceiptPrintProps {
  payment: Payment;
  onClose: () => void;
}

const ReceiptPrint: React.FC<ReceiptPrintProps> = ({ payment, onClose }) => {
  const { students, feeConfig, payments } = useData();
  
  // Get all payments for the student and calculate totals
  const getStudentPaymentDetails = () => {
    const student = students.find(s => s.id === payment.studentId);
    if (!student) return { 
      developmentPayments: [], 
      busPayments: [], 
      developmentBalance: 0, 
      busBalance: 0 
    };
    
    const studentPayments = payments.filter(p => p.studentId === payment.studentId);
    
    // Get individual payments for each fee type
    const developmentPayments = studentPayments
      .filter(p => p.developmentFee > 0)
      .map(p => ({ date: p.paymentDate, amount: p.developmentFee, id: p.id }));
    
    const busPayments = studentPayments
      .filter(p => p.busFee > 0)
      .map(p => ({ date: p.paymentDate, amount: p.busFee, id: p.id }));
    
    const totalPaidDevelopment = developmentPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPaidBus = busPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Get the correct fee key for classes 11 and 12 (class-division) or regular classes (class only)
    const feeKey = (student.class === '11' || student.class === '12') 
      ? `${student.class}-${student.division}` 
      : student.class;
    const totalDevelopmentRequired = feeConfig.developmentFees[feeKey] || 0;
    const totalBusRequired = feeConfig.busStops[student.busStop] || 0;
    
    return {
      developmentPayments,
      busPayments,
      developmentBalance: Math.max(0, totalDevelopmentRequired - totalPaidDevelopment),
      busBalance: Math.max(0, totalBusRequired - totalPaidBus)
    };
  };
  
  const paymentDetails = getStudentPaymentDetails();
  
  const sendViaWhatsAppWeb = () => {
    const student = students.find(s => s.id === payment.studentId);
    if (!student) return;
    
    // Format receipt details for WhatsApp
    const receiptText = `*SARVODAYA HIGHER SECONDARY SCHOOL*
*Fee Payment Receipt*

📋 *Student Details:*
Name: ${payment.studentName}
Admission No: ${payment.admissionNo}
Class: ${payment.class}-${payment.division}
Date: ${new Date(payment.paymentDate).toLocaleDateString()}
Receipt #: ${payment.id.slice(-6)}

💰 *Fee Details:*
${payment.developmentFee > 0 ? `Development Fee: ₹${payment.developmentFee}\n` : ''}${payment.busFee > 0 ? `Bus Fee: ₹${payment.busFee}\n` : ''}${payment.specialFee > 0 ? `${payment.specialFeeType || 'Other Fee'}: ₹${payment.specialFee}\n` : ''}
*TOTAL PAID: ₹${payment.totalAmount}*

${(paymentDetails.developmentBalance > 0 || paymentDetails.busBalance > 0) ? `📊 *Remaining Balance:*\n${paymentDetails.developmentBalance > 0 ? `Development: ₹${paymentDetails.developmentBalance}\n` : ''}${paymentDetails.busBalance > 0 ? `Bus Fee: ₹${paymentDetails.busBalance}\n` : ''}` : '✅ *All fees paid in full*\n'}
Thank you for your payment! 🙏
Keep this receipt for your records.

- Sarvodaya School, Eachome`;

    // Open WhatsApp Web with pre-filled message
    const whatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(receiptText)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  const handlePrint = () => {
    const printContent = document.getElementById('professional-a6-receipt');
    if (!printContent) {
      alert('Print content not found. Please try again.');
      return;
    }
    
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      alert('Please allow popups for printing');
      return;
    }
    
    newWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt - ${payment.studentName}</title>
          <style>
            @page { 
              size: A6; 
              margin: 8mm; 
            }
            
            body { 
              font-family: 'Arial', sans-serif; 
              margin: 0; 
              padding: 0; 
              background: white;
              font-size: 14px;
              line-height: 1.4;
              color: #333;
            }
            
            @media print {
              body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
              }
            }
            
            .receipt-container {
              position: relative;
              width: 105mm;
              min-height: 148mm;
              padding: 5mm;
              background: white;
              overflow: hidden;
              border: 2px solid #000;
            }
            
            .receipt-content {
              position: relative;
              z-index: 2;
            }
            
            .receipt-header {
              text-align: center;
              margin-bottom: 3mm;
              padding-bottom: 2mm;
              border-bottom: 2px solid #000;
            }
            
            .school-name {
              font-size: 18px;
              font-weight: bold;
              color: #000;
              margin-bottom: 1mm;
              letter-spacing: 0.5px;
            }
            
            .school-subtitle {
              font-size: 16px;
              font-weight: 600;
              color: #000;
              margin-bottom: 1mm;
            }
            
            .location {
              font-size: 14px;
              color: #333;
              margin-bottom: 2mm;
            }
            
            .receipt-title {
              font-size: 13px;
              font-weight: 600;
              color: #000;
              margin-top: 2mm;
              text-decoration: underline;
            }
            
            .receipt-content {
              margin: 3mm 0;
              font-size: 13px;
              line-height: 1.4;
            }
            
            .receipt-content div {
              margin-bottom: 2px;
              display: flex;
              justify-content: space-between;
            }
            
            .receipt-content div strong {
              font-weight: bold;
            }
            
            .total-amount {
              font-weight: bold;
              border-top: 2px solid #000;
              padding-top: 2mm;
              margin-top: 2mm;
              font-size: 15px;
              text-align: center;
            }
            
            .balance-section {
              margin: 3mm 0;
              padding-top: 2mm;
              border-top: 2px solid #000;
              font-size: 12px;
            }
            
            .balance-section div {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1px;
            }
            
            .footer {
              margin-top: 3mm;
              text-align: center;
              font-size: 11px;
              font-style: italic;
              border-top: 1px dashed #000;
              padding-top: 3mm;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    newWindow.document.close();
    
    setTimeout(() => {
      try {
        newWindow.print();
        setTimeout(() => {
          newWindow.close();
        }, 1000);
      } catch (error) {
        console.error('Print error:', error);
        alert('Print failed. Please try again.');
      }
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Payment Receipt</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Professional A6 Receipt Preview */}
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4 text-center">A6 Receipt Preview</h4>
          <div className="flex justify-center">
            <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}>
              <div id="professional-a6-receipt">
                <div style={{
                  width: '105mm',
                  minHeight: '148mm',
                  padding: '5mm',
                  background: 'white',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '18px',
                  lineHeight: '1.4',
                  color: '#000',
                  border: 'none'
                }}>
                  {/* Receipt Number */}
                  <div style={{ textAlign: 'left', fontSize: '10px', marginBottom: '2mm' }}>
                    #{payment.id.slice(-6)}
                  </div>
                  
                  {/* Header */}
                  <div style={{ textAlign: 'center', marginBottom: '3mm' }}>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '1mm' }}>
                      Sarvodaya
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '1mm' }}>
                      Higher Secondary School
                    </div>
                    <div style={{ fontSize: '16px', marginBottom: '1mm' }}>
                      Eachome
                    </div>
                    <div style={{ fontSize: '12px', textDecoration: 'underline', fontWeight: 'bold' }}>
                      Fee Payment Receipt
                    </div>
                  </div>
                  
                  <hr style={{ border: '0.5px solid #000', margin: '2mm 0' }} />
                  
                  {/* Student Details */}
                  <div style={{ marginBottom: '2mm' }}>
                    <table style={{ width: '100%', fontSize: '12px' }}>
                      <tr>
                        <td style={{ paddingBottom: '1mm' }}><strong>Name:</strong></td>
                        <td style={{ textAlign: 'right', paddingBottom: '1mm' }}>{payment.studentName}</td>
                      </tr>
                      <tr>
                        <td style={{ paddingBottom: '1mm' }}><strong>Adm No:</strong></td>
                        <td style={{ textAlign: 'right', paddingBottom: '1mm' }}>{payment.admissionNo}</td>
                      </tr>
                      <tr>
                        <td style={{ paddingBottom: '1mm' }}><strong>Class:</strong></td>
                        <td style={{ textAlign: 'right', paddingBottom: '1mm' }}>{payment.class}{payment.division ? `-${payment.division}` : ''}</td>
                      </tr>
                      <tr>
                        <td style={{ paddingBottom: '1mm' }}><strong>Date:</strong></td>
                        <td style={{ textAlign: 'right', paddingBottom: '1mm' }}>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                      </tr>
                      <tr>
                        <td><strong>Receipt #:</strong></td>
                        <td style={{ textAlign: 'right' }}>{payment.id.slice(-6)}</td>
                      </tr>
                    </table>
                  </div>
                  
                  <hr style={{ border: '0.5px solid #000', margin: '2mm 0' }} />
                  
                  {/* Fee Details */}
                  <div style={{ marginBottom: '2mm' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '1mm' }}>
                      Fee Details
                    </div>
                    
                    <table style={{ width: '100%', fontSize: '12px' }}>
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
                  
                  <hr style={{ border: '0.5px solid #000', margin: '2mm 0' }} />
                  
                  {/* Total Amount */}
                  <div style={{ 
                    textAlign: 'center', 
                    fontSize: '16px', 
                    fontWeight: 'bold', 
                    marginBottom: '2mm',
                    padding: '2mm 0'
                  }}>
                    TOTAL PAID: ₹{payment.totalAmount}
                  </div>
                  
                  <hr style={{ border: '0.5px solid #000', margin: '2mm 0' }} />
                  
                  {/* Remaining Balance */}
                  {(paymentDetails.developmentBalance > 0 || paymentDetails.busBalance > 0) && (
                    <>
                      <div style={{ marginBottom: '2mm' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '1mm' }}>
                          Remaining Balance
                        </div>
                        
                        <table style={{ width: '100%', fontSize: '12px' }}>
                          {paymentDetails.developmentBalance > 0 && (
                            <tr>
                              <td style={{ paddingBottom: '1mm' }}><strong>Development:</strong></td>
                              <td style={{ textAlign: 'right', paddingBottom: '1mm' }}>₹{paymentDetails.developmentBalance}</td>
                            </tr>
                          )}
                          {paymentDetails.busBalance > 0 && (
                            <tr>
                              <td><strong>Bus Fee:</strong></td>
                              <td style={{ textAlign: 'right' }}>₹{paymentDetails.busBalance}</td>
                            </tr>
                          )}
                        </table>
                      </div>
                      
                      <div style={{ borderTop: '0.5px dotted #000', paddingTop: '1mm', marginTop: '1mm' }}></div>
                    </>
                  )}
                  
                  {/* Footer */}
                  <div style={{ 
                    textAlign: 'center', 
                    fontSize: '10px', 
                    fontStyle: 'italic',
                    marginTop: '2mm'
                  }}>
                    <div>Thank you for your payment!</div>
                    <div>Keep this receipt for your records</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mb-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
          <button
            onClick={sendViaWhatsAppWeb}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Send via WhatsApp</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Printer className="h-4 w-4" />
            <span>Print Receipt</span>
          </button>
        </div>

        {/* Print Instructions */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">A6 Receipt Features:</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>A6 Size:</strong> 105mm × 148mm (standard A6 paper)</li>
            <li>• <strong>Compact Layout:</strong> Matches bulk print receipt format</li>
            <li>• <strong>Grayscale Compatible:</strong> Optimized for black & white printing</li>
            <li>• <strong>Balance Display:</strong> Shows remaining fee balance</li>
            <li>• <strong>Clean Design:</strong> Simple layout with clear borders</li>
            <li>• <strong>Print Settings:</strong> A6 paper, 8mm margins, portrait orientation</li>
          </ul>
        </div>
        
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <h5 className="font-medium text-green-900 mb-2">WhatsApp Sharing:</h5>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• <strong>Instant Share:</strong> Opens WhatsApp Web with formatted receipt</li>
            <li>• <strong>Professional Format:</strong> Clean, readable receipt layout</li>
            <li>• <strong>Complete Details:</strong> All payment and balance information included</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPrint;