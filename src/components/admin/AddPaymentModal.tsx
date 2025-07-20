import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Payment } from '../../contexts/DataContext';

interface AddPaymentModalProps {
  onClose: () => void;
}

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ onClose }) => {
  const { students, addPayment, feeConfig, payments } = useData();
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    developmentFee: 0,
    busFee: 0,
    specialFee: 0,
    specialFeeType: ''
  });
  const [paidAmounts, setPaidAmounts] = useState({
    developmentFee: 0,
    busFee: 0
  });

  // Filter students based on user role
  const availableStudents = user?.role === 'admin' 
    ? students 
    : students.filter(s => s.class === user?.class && s.division === user?.division);

  const filteredStudents = availableStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admissionNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedStudentData = students.find(s => s.id === selectedStudent);

  // Calculate already paid amounts for the selected student
  const calculatePaidAmounts = (studentId: string) => {
    const studentPayments = payments.filter(p => p.studentId === studentId);
    
    const totalPaidDevelopment = studentPayments.reduce((sum, p) => sum + p.developmentFee, 0);
    const totalPaidBus = studentPayments.reduce((sum, p) => sum + p.busFee, 0);
    
    return {
      developmentFee: totalPaidDevelopment,
      busFee: totalPaidBus
    };
  };

  useEffect(() => {
    if (selectedStudentData) {
      const paid = calculatePaidAmounts(selectedStudentData.id);
      setPaidAmounts(paid);
      
      // Auto-populate development fee based on class (handle classes 11-12 with divisions)
      const feeKey = (selectedStudentData.class === '11' || selectedStudentData.class === '12') 
        ? `${selectedStudentData.class}-${selectedStudentData.division}` 
        : selectedStudentData.class;
      const totalDevelopmentFee = feeConfig.developmentFees[feeKey] || 0;
      const remainingDevelopmentFee = Math.max(0, totalDevelopmentFee - paid.developmentFee);
      
      // Auto-populate bus fee based on bus stop
      const totalBusFee = feeConfig.busStops[selectedStudentData.busStop] || 0;
      const remainingBusFee = Math.max(0, totalBusFee - paid.busFee);
      
      setFormData(prev => ({
        ...prev,
        developmentFee: remainingDevelopmentFee,
        busFee: remainingBusFee,
        specialFee: 0,
        specialFeeType: ''
      }));
    }
  }, [selectedStudentData, feeConfig, payments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudentData) {
      alert('Please select a student');
      return;
    }

    const totalAmount = formData.developmentFee + formData.busFee + formData.specialFee;
    
    if (totalAmount <= 0) {
      alert('Please enter at least one fee amount');
      return;
    }

    addPayment({
      studentId: selectedStudentData.id,
      studentName: selectedStudentData.name,
      admissionNo: selectedStudentData.admissionNo,
      developmentFee: formData.developmentFee,
      busFee: formData.busFee,
      specialFee: formData.specialFee,
      specialFeeType: formData.specialFeeType,
      totalAmount,
      addedBy: user?.username || '',
      class: selectedStudentData.class,
      division: selectedStudentData.division
    });

    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'developmentFee' || name === 'busFee' || name === 'specialFee') {
      const numValue = parseInt(value) || 0;
      
      // Calculate maximum allowed amount
      let maxAmount = 0;
      if (name === 'developmentFee') {
        const totalRequired = feeConfig.developmentFees[selectedStudentData?.class || ''] || 0;
        maxAmount = Math.max(0, totalRequired - paidAmounts.developmentFee);
      } else if (name === 'busFee') {
        const totalRequired = feeConfig.busStops[selectedStudentData?.busStop || ''] || 0;
        maxAmount = Math.max(0, totalRequired - paidAmounts.busFee);
      } else if (name === 'specialFee') {
        maxAmount = 999999; // No limit for special fees
      }
      
      // Don't allow amount greater than remaining (except for special fees)
      const finalValue = name === 'specialFee' ? numValue : Math.min(numValue, maxAmount);
      
      setFormData(prev => ({
        ...prev,
        [name]: finalValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Calculate fee status for display
  const getFeeStatus = () => {
    if (!selectedStudentData) return null;
    
    // Get the correct fee key for classes 11 and 12 (class-division) or regular classes (class only)
    const feeKey = (selectedStudentData.class === '11' || selectedStudentData.class === '12') 
      ? `${selectedStudentData.class}-${selectedStudentData.division}` 
      : selectedStudentData.class;
    const totalDevelopmentRequired = feeConfig.developmentFees[feeKey] || 0;
    const totalBusRequired = feeConfig.busStops[selectedStudentData.busStop] || 0;
    
    return {
      development: {
        total: totalDevelopmentRequired,
        paid: paidAmounts.developmentFee,
        remaining: Math.max(0, totalDevelopmentRequired - paidAmounts.developmentFee)
      },
      bus: {
        total: totalBusRequired,
        paid: paidAmounts.busFee,
        remaining: Math.max(0, totalBusRequired - paidAmounts.busFee)
      }
    };
  };

  const feeStatus = getFeeStatus();
  const totalAmount = formData.developmentFee + formData.busFee + formData.specialFee;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-4 lg:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Add Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Student
            </label>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or admission number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="max-h-32 sm:max-h-40 overflow-y-auto border border-gray-300 rounded-lg">
                {filteredStudents.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => setSelectedStudent(student.id)}
                    className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                      selectedStudent === student.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-600">
                      {student.admissionNo} • Class {student.class}-{student.division} • {student.busStop}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {selectedStudentData && feeStatus && (
            <>
              {/* Selected Student Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Selected Student</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Name:</span> {selectedStudentData.name}
                  </div>
                  <div>
                    <span className="text-blue-700">Admission No:</span> {selectedStudentData.admissionNo}
                  </div>
                  <div>
                    <span className="text-blue-700">Class:</span> {selectedStudentData.class}-{selectedStudentData.division}
                  </div>
                  <div>
                    <span className="text-blue-700">Bus Stop:</span> {selectedStudentData.busStop}
                  </div>
                </div>
              </div>

              {/* Fee Status Display */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="font-medium text-yellow-900 mb-3">Fee Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="font-medium text-yellow-800">Development Fee</div>
                    <div className="text-yellow-700">
                      Total Required: ₹{feeStatus.development.total}
                    </div>
                    <div className="text-yellow-700">
                      Already Paid: ₹{feeStatus.development.paid}
                    </div>
                    <div className="font-semibold text-yellow-900">
                      Remaining: ₹{feeStatus.development.remaining}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium text-yellow-800">Bus Fee</div>
                    <div className="text-yellow-700">
                      Total Required: ₹{feeStatus.bus.total}
                    </div>
                    <div className="text-yellow-700">
                      Already Paid: ₹{feeStatus.bus.paid}
                    </div>
                    <div className="font-semibold text-yellow-900">
                      Remaining: ₹{feeStatus.bus.remaining}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fee Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Development Fee (Max: ₹{feeStatus.development.remaining})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      name="developmentFee"
                      value={formData.developmentFee}
                      onChange={handleChange}
                      max={feeStatus.development.remaining}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      disabled={feeStatus.development.remaining === 0}
                    />
                  </div>
                  {feeStatus.development.remaining === 0 && (
                    <p className="text-xs text-green-600 mt-1">✓ Fully Paid</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bus Fee (Max: ₹{feeStatus.bus.remaining})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      name="busFee"
                      value={formData.busFee}
                      onChange={handleChange}
                      max={feeStatus.bus.remaining}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      disabled={feeStatus.bus.remaining === 0}
                    />
                  </div>
                  {feeStatus.bus.remaining === 0 && (
                    <p className="text-xs text-green-600 mt-1">✓ Fully Paid</p>
                  )}
                </div>
              </div>

              {/* Special Fee (Admin Only) */}
              {user?.role === 'admin' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Fee Type
                    </label>
                    <select
                      name="specialFeeType"
                      value={formData.specialFeeType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Type</option>
                      <option value="Educational Tour">Educational Tour</option>
                      <option value="Exam Fee">Exam Fee</option>
                      <option value="Sports Fee">Sports Fee</option>
                      <option value="Library Fee">Library Fee</option>
                      <option value="Lab Fee">Lab Fee</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Fee Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                      <input
                        type="number"
                        name="specialFee"
                        value={formData.specialFee}
                        onChange={handleChange}
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        disabled={!formData.specialFeeType}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Total Amount */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-green-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-green-600">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedStudent || totalAmount <= 0}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPaymentModal;