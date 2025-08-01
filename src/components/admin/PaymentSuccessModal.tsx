import React from 'react';
import { CheckCircle, Receipt, X, MessageCircle } from 'lucide-react';
import { Payment, useData } from '../../contexts/DataContext';

interface PaymentSuccessModalProps {
  payment: Payment;
  onClose: () => void;
  onPrintReceipt: (payment: Payment) => void;
}

const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({ 
  payment, 
  onClose, 
  onPrintReceipt 
}) => {
  const { students, payments, feeConfig } = useData();

  // Calculate remaining balance for the student
  const getStudentBalance = () => {
    const student = students.find(s => s.id === payment.studentId);
    if (!student) return { devBalance: 0, busBalance: 0 };

    const classKey = (['11', '12'].includes(student.class)) 
      ? `${student.class}-${student.division}` 
      : student.class;

    const totalDevFee = feeConfig.developmentFees[classKey] || 0;
    const originalBusFee = feeConfig.busStops[student.busStop] || 0;
    const discountedBusFee = Math.max(0, originalBusFee - (student.busFeeDiscount || 0));

    const studentPayments = payments.filter(p => p.studentId === payment.studentId);
    const paidDevFee = studentPayments.reduce((sum, p) => sum + p.developmentFee, 0);
    const paidBusFee = studentPayments.reduce((sum, p) => sum + p.busFee, 0);

    return {
      devBalance: Math.max(0, totalDevFee - paidDevFee),
      busBalance: Math.max(0, discountedBusFee - paidBusFee)
    };
  };

  const handlePrintReceipt = () => {
    onPrintReceipt(payment);
  };

  const sendViaWhatsAppWeb = () => {
    const balanceInfo = getStudentBalance();
    const hasRemainingBalance = balanceInfo.devBalance > 0 || balanceInfo.busBalance > 0;

    // Format receipt details for WhatsApp
    const receiptText = `*SARVODAYA HIGHER SECONDARY SCHOOL*
*Fee Payment Receipt*

📋 *Student Details:*
Name: ${payment.studentName}
Admission No: ${payment.admissionNo}
Class: ${payment.class}-${payment.division}
Date: ${new Date(payment.paymentDate).toLocaleDateString()}

💰 *Fee Details:*
${payment.developmentFee > 0 ? `Development Fee: ₹${payment.developmentFee}\n` : ''}${payment.busFee > 0 ? `Bus Fee: ₹${payment.busFee}\n` : ''}${payment.specialFee > 0 ? `${payment.specialFeeType || 'Other Fee'}: ₹${payment.specialFee}\n` : ''}
*TOTAL PAID: ₹${payment.totalAmount}*

Thank you for your payment! 🙏
Keep this receipt for your records.

- Sarvodaya School, Eachome`;

    // Detect if user is on mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Use appropriate WhatsApp URL based on device
    const whatsappUrl = isMobile 
      ? `whatsapp://send?text=${encodeURIComponent(receiptText)}`
      : `https://web.whatsapp.com/send?text=${encodeURIComponent(receiptText)}`;
    
    // Try to open WhatsApp
    if (isMobile) {
      window.location.href = whatsappUrl;
      setTimeout(() => {
        const fallbackUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(receiptText)}`;
        window.open(fallbackUrl, '_blank');
      }, 1500);
    } else {
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Payment Successful!</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Payment Summary */}
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              ₹{payment.totalAmount.toLocaleString()} Paid Successfully
            </h3>
            <div className="text-sm text-green-800 space-y-1">
              <div><strong>Student:</strong> {payment.studentName}</div>
              <div><strong>Admission No:</strong> {payment.admissionNo}</div>
              <div><strong>Class:</strong> {payment.class}-{payment.division}</div>
              <div><strong>Date:</strong> {new Date(payment.paymentDate).toLocaleDateString('en-GB')}</div>
            </div>
          </div>
        </div>

        {/* Fee Breakdown */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Payment Breakdown</h4>
          <div className="space-y-2 text-sm">
            {payment.developmentFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Development Fee:</span>
                <span className="font-medium">₹{payment.developmentFee}</span>
              </div>
            )}
            {payment.busFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Bus Fee:</span>
                <span className="font-medium">₹{payment.busFee}</span>
              </div>
            )}
            {payment.specialFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">{payment.specialFeeType || 'Special Fee'}:</span>
                <span className="font-medium">₹{payment.specialFee}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total Amount:</span>
              <span className="text-green-600">₹{payment.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handlePrintReceipt}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Receipt className="h-5 w-5" />
            <span>Print Receipt</span>
          </button>
          
          <button
            onClick={sendViaWhatsAppWeb}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Send via WhatsApp</span>
          </button>
          
          <button
            onClick={onClose}
            className="w-full px-4 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>

        {/* Success Message */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 text-center">
            💡 <strong>Tip:</strong> SMS and WhatsApp notifications have been sent automatically to the parent's mobile number.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessModal;