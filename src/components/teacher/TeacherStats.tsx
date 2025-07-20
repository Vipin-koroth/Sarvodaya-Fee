import React from 'react';
import { Users, CreditCard, TrendingUp, BookOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

const TeacherStats: React.FC = () => {
  const { user } = useAuth();
  const { students, payments } = useData();

  // Filter data for current teacher's class
  const classStudents = students.filter(
    student => student.class === user?.class && student.division === user?.division
  );

  const classPayments = payments.filter(
    payment => payment.class === user?.class && payment.division === user?.division
  );

  const totalAmount = classPayments.reduce((sum, payment) => sum + payment.totalAmount, 0);
  
  const todayPayments = classPayments.filter(payment => 
    new Date(payment.paymentDate).toDateString() === new Date().toDateString()
  );
  const todayAmount = todayPayments.reduce((sum, payment) => sum + payment.totalAmount, 0);

  const stats = [
    {
      title: 'My Students',
      value: classStudents.length.toString(),
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'Total Payments',
      value: classPayments.length.toString(),
      icon: CreditCard,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'Total Collection',
      value: `₹${totalAmount.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    {
      title: "Today's Collection",
      value: `₹${todayAmount.toLocaleString()}`,
      icon: BookOpen,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    }
  ];

  // Recent payments for this class
  const recentPayments = classPayments
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    .slice(0, 5);

  // Students without recent payments (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const studentsWithoutRecentPayments = classStudents.filter(student => {
    const studentPayments = classPayments.filter(p => p.studentId === student.id);
    const recentPayment = studentPayments.find(p => new Date(p.paymentDate) > thirtyDaysAgo);
    return !recentPayment;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Class {user?.class}-{user?.division} Dashboard
        </h1>
        <p className="text-gray-600">Overview of your class fee collections and student data</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`${stat.bgColor} rounded-lg p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${stat.textColor}`}>{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 ${stat.color} rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h2>
        {recentPayments.length > 0 ? (
          <div className="space-y-4">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{payment.studentName}</p>
                  <p className="text-sm text-gray-600">
                    {payment.admissionNo} • {new Date(payment.paymentDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">₹{payment.totalAmount}</p>
                  <p className="text-sm text-gray-600">
                    {payment.developmentFee > 0 && 'Dev'} 
                    {payment.busFee > 0 && (payment.developmentFee > 0 ? ' + Bus' : 'Bus')}
                    {payment.specialFee > 0 && ' + Special'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No payments recorded yet</p>
        )}
      </div>

      {/* Class Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Students Needing Attention */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Students Without Recent Payments
          </h3>
          {studentsWithoutRecentPayments.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {studentsWithoutRecentPayments.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">{student.admissionNo}</p>
                  </div>
                  <div className="text-sm text-yellow-700">
                    No payment (30+ days)
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-green-600 text-center py-4">All students have recent payments!</p>
          )}
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Development Fees</span>
              <span className="font-medium">
                ₹{classPayments.reduce((sum, p) => sum + p.developmentFee, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Bus Fees</span>
              <span className="font-medium">
                ₹{classPayments.reduce((sum, p) => sum + p.busFee, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Special Fees</span>
              <span className="font-medium">
                ₹{classPayments.reduce((sum, p) => sum + p.specialFee, 0).toLocaleString()}
              </span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center font-semibold">
                <span className="text-gray-900">Total Collection</span>
                <span className="text-green-600">₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 text-left rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
            <div className="font-medium">Add New Student</div>
            <div className="text-sm text-blue-600">Register a new student to your class</div>
          </button>
          <button className="p-4 text-left rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
            <div className="font-medium">Record Payment</div>
            <div className="text-sm text-green-600">Add fee payment for a student</div>
          </button>
          <button className="p-4 text-left rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors">
            <div className="font-medium">View All Students</div>
            <div className="text-sm text-purple-600">Manage your class student list</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherStats;