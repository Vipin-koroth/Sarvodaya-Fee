import React from 'react';
import { Users, CreditCard, TrendingUp, Bus } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const DashboardStats: React.FC = () => {
  const { students, payments } = useData();

  const totalStudents = students.length;
  const totalPayments = payments.length;
  const totalAmount = payments.reduce((sum, payment) => sum + payment.totalAmount, 0);
  const todayPayments = payments.filter(payment => 
    new Date(payment.paymentDate).toDateString() === new Date().toDateString()
  );
  const todayAmount = todayPayments.reduce((sum, payment) => sum + payment.totalAmount, 0);

  const stats = [
    {
      title: 'Total Students',
      value: totalStudents.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'Total Payments',
      value: totalPayments.toLocaleString(),
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
      icon: Bus,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    }
  ];

  // Recent payments
  const recentPayments = payments
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of school fee collections and student data</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`${stat.bgColor} rounded-lg p-4 lg:p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${stat.textColor}`}>{stat.title}</p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
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
              <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                <div>
                  <p className="font-medium text-gray-900">{payment.studentName}</p>
                  <p className="text-sm text-gray-600">
                    {payment.admissionNo} • Class {payment.class}-{payment.division}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">₹{payment.totalAmount}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No payments recorded yet</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
              Add New Student
            </button>
            <button className="w-full text-left p-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
              Record Payment
            </button>
            <button className="w-full text-left p-3 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors">
              Generate Report
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Class Distribution</h3>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(classNum => {
              const classStudents = students.filter(s => s.class === classNum.toString());
              return (
                <div key={classNum} className="flex justify-between items-center">
                  <span className="text-gray-600">Class {classNum}</span>
                  <span className="font-medium">{classStudents.length} students</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Development Fees</span>
              <span className="font-medium">
                ₹{payments.reduce((sum, p) => sum + p.developmentFee, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Bus Fees</span>
              <span className="font-medium">
                ₹{payments.reduce((sum, p) => sum + p.busFee, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Special Fees</span>
              <span className="font-medium">
                ₹{payments.reduce((sum, p) => sum + p.specialFee, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;