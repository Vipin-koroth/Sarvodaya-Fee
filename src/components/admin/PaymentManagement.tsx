import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Receipt, Calendar } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import AddPaymentModal from './AddPaymentModal';
import ReceiptPrint from '../common/ReceiptPrint';

const PaymentManagement: React.FC = () => {
  const { payments, deletePayment, students } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.admissionNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !filterDate || new Date(payment.paymentDate).toDateString() === new Date(filterDate).toDateString();
    const matchesClass = !filterClass || payment.class === filterClass;
    
    return matchesSearch && matchesDate && matchesClass;
  });

  const todayPayments = payments.filter(payment => 
    new Date(payment.paymentDate).toDateString() === new Date().toDateString()
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600">Manage fee payments and generate receipts</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Payment</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or admission no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Classes</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(cls => (
              <option key={cls} value={cls.toString()}>Class {cls}</option>
            ))}
          </select>
          <div className="text-sm text-gray-600 flex items-center sm:col-span-2 lg:col-span-1">
            Total: ₹{filteredPayments.reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Details
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Fee Breakdown
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Payment Date
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-4 lg:px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{payment.studentName}</div>
                      <div className="text-sm text-gray-500">
                        {payment.admissionNo} • Class {payment.class}-{payment.division}
                      </div>
                      <div className="text-sm text-gray-500 md:hidden mt-1">
                        {payment.developmentFee > 0 && <div>Dev: ₹{payment.developmentFee}</div>}
                        {payment.busFee > 0 && <div>Bus: ₹{payment.busFee}</div>}
                        {payment.specialFee > 0 && <div>{payment.specialFeeType}: ₹{payment.specialFee}</div>}
                      </div>
                      <div className="text-sm text-gray-500 sm:hidden mt-1">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="text-sm text-gray-900">
                      {payment.developmentFee > 0 && (
                        <div>Development: ₹{payment.developmentFee}</div>
                      )}
                      {payment.busFee > 0 && (
                        <div>Bus: ₹{payment.busFee}</div>
                      )}
                      {payment.specialFee > 0 && (
                        <div>{payment.specialFeeType}: ₹{payment.specialFee}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-semibold text-green-600">
                      ₹{payment.totalAmount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Print Receipt"
                      >
                        <Receipt className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this payment?')) {
                            deletePayment(payment.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Payment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No payments found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddPaymentModal onClose={() => setShowAddModal(false)} />
      )}

      {selectedPayment && (
        <ReceiptPrint
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  );
};

export default PaymentManagement;