import React, { useState } from 'react';
import { Plus, Search, Receipt, Calendar, Users, TrendingUp, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData, Payment } from '../../contexts/DataContext';
import AddPaymentModal from './AddPaymentModal';
import ReceiptPrint from '../common/ReceiptPrint';
import PaymentSuccessModal from './PaymentSuccessModal';

const SarvodayaCollection: React.FC = () => {
  const { user } = useAuth();
  const { payments, students } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [successPayment, setSuccessPayment] = useState<Payment | null>(null);

  // Helper function to get class range for user
  const getClassRangeForUser = () => {
    if (!user || user.role !== 'sarvodaya') return null;
    
    switch (user.username) {
      case 'lp':
        return { min: 1, max: 4, name: 'LP (Classes 1-4)' };
      case 'up':
        return { min: 5, max: 7, name: 'UP (Classes 5-7)' };
      case 'hs':
        return { min: 8, max: 10, name: 'HS (Classes 8-10)' };
      case 'hss':
        return { min: 11, max: 12, name: 'HSS (Classes 11-12)' };
      case 'sarvodaya':
        return null; // Full access
      default:
        return null;
    }
  };

  // Filter data based on user's class range
  const getFilteredData = () => {
    const classRange = getClassRangeForUser();
    if (!classRange) return { students, payments }; // Full access for sarvodaya
    
    const filteredStudents = students.filter(student => {
      const classNum = parseInt(student.class);
      return classNum >= classRange.min && classNum <= classRange.max;
    });
    
    const filteredPayments = payments.filter(payment => {
      const classNum = parseInt(payment.class);
      return classNum >= classRange.min && classNum <= classRange.max;
    });
    
    return { students: filteredStudents, payments: filteredPayments };
  };

  const { students: sectionStudents, payments: sectionPayments } = getFilteredData();

  const filteredPayments = sectionPayments.filter(payment => {
    const matchesSearch = payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.admissionNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !filterDate || new Date(payment.paymentDate).toDateString() === new Date(filterDate).toDateString();
    const matchesClass = !filterClass || payment.class === filterClass;
    
    return matchesSearch && matchesDate && matchesClass;
  });

  const todayPayments = sectionPayments.filter(payment => 
    new Date(payment.paymentDate).toDateString() === new Date().toDateString()
  );

  const totalCollection = filteredPayments.reduce((sum, payment) => sum + payment.totalAmount, 0);
  const todayCollection = todayPayments.reduce((sum, payment) => sum + payment.totalAmount, 0);

  // Get available classes for the user's section
  const getAvailableClasses = () => {
    if (!userClassRange) {
      return Array.from({ length: 12 }, (_, i) => i + 1);
    }
    
    const classes = [];
    for (let i = userClassRange.min; i <= userClassRange.max; i++) {
      classes.push(i);
    }
    return classes;
  };

  const availableClasses = getAvailableClasses();

  const getPageTitle = () => {
    return userClassRange ? `${userClassRange.name} Collection Entry` : 'Collection Entry';
  };

  const getPageDescription = () => {
    return userClassRange 
      ? `Manage fee collections for ${userClassRange.name} section`
      : 'Manage fee collections for all classes';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
          <p className="text-gray-600">{getPageDescription()}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Add Payment</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{sectionStudents.length}</p>
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
            <Receipt className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600">Today's Collection</p>
              <p className="text-2xl font-bold text-gray-900">₹{todayCollection.toLocaleString()}</p>
            </div>
          </div>
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
            {availableClasses.map(cls => (
              <option key={cls} value={cls.toString()}>Class {cls}</option>
            ))}
          </select>
          <div className="text-sm text-gray-600 flex items-center">
            Showing: {filteredPayments.length} payments
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
                        {new Date(payment.paymentDate).toLocaleDateString('en-GB')}
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
                    {new Date(payment.paymentDate).toLocaleDateString('en-GB')}
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterDate || filterClass 
                ? 'No payments match your search criteria.' 
                : 'Get started by adding a payment.'
              }
            </p>
            {!searchTerm && !filterDate && !filterClass && (
              <div className="mt-6">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fee Breakdown Summary */}
      {filteredPayments.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Breakdown Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ₹{filteredPayments.reduce((sum, p) => sum + p.developmentFee, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Development Fees</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ₹{filteredPayments.reduce((sum, p) => sum + p.busFee, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Bus Fees</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ₹{filteredPayments.reduce((sum, p) => sum + p.specialFee, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Special Fees</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">₹{totalCollection.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Collection</div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddPaymentModal 
          onClose={() => setShowAddModal(false)}
          onPaymentSuccess={(payment) => {
            setSuccessPayment(payment);
            setShowAddModal(false);
          }}
        />
      )}

      {selectedPayment && (
        <ReceiptPrint
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}

      {successPayment && (
        <PaymentSuccessModal
          payment={successPayment}
          onClose={() => setSuccessPayment(null)}
          onPrintReceipt={(payment) => {
            setSelectedPayment(payment);
            setSuccessPayment(null);
          }}
        />
      )}
    </div>
  );
};

export default SarvodayaCollection;