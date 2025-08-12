import React, { useState } from 'react';
import { TrendingUp, Users, FileText, Calendar, Download, Eye, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

const SectionWiseCollection: React.FC = () => {
  const { students, payments } = useData();
  const { user } = useAuth();
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'month' | 'custom'>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Define sections with their class ranges
  const sections = [
    { id: 'lp', name: 'LP (Lower Primary)', classes: [1, 2, 3, 4], color: 'bg-blue-50', textColor: 'text-blue-700', iconColor: 'bg-blue-500' },
    { id: 'up', name: 'UP (Upper Primary)', classes: [5, 6, 7], color: 'bg-green-50', textColor: 'text-green-700', iconColor: 'bg-green-500' },
    { id: 'hs', name: 'HS (High School)', classes: [8, 9, 10], color: 'bg-purple-50', textColor: 'text-purple-700', iconColor: 'bg-purple-500' },
    { id: 'hss', name: 'HSS (Higher Secondary)', classes: [11, 12], color: 'bg-orange-50', textColor: 'text-orange-700', iconColor: 'bg-orange-500' }
  ];

  // Get filtered payments based on date filter
  const getFilteredPayments = () => {
    let filteredPayments = payments;

    if (dateFilter === 'month') {
      const [year, month] = selectedMonth.split('-');
      filteredPayments = filteredPayments.filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate.getFullYear() === parseInt(year) && 
               paymentDate.getMonth() === parseInt(month) - 1;
      });
    } else if (dateFilter === 'custom') {
      filteredPayments = filteredPayments.filter(payment => {
        const paymentDate = new Date(payment.paymentDate).toISOString().split('T')[0];
        const matchesFromDate = !fromDate || paymentDate >= fromDate;
        const matchesToDate = !toDate || paymentDate <= toDate;
        return matchesFromDate && matchesToDate;
      });
    }

    return filteredPayments;
  };

  // Calculate section-wise data
  const getSectionData = () => {
    const filteredPayments = getFilteredPayments();
    
    return sections.map(section => {
      const sectionStudents = students.filter(student => 
        section.classes.includes(parseInt(student.class))
      );
      
      const sectionPayments = filteredPayments.filter(payment => 
        section.classes.includes(parseInt(payment.class))
      );
      
      const totalCollection = sectionPayments.reduce((sum, payment) => sum + payment.totalAmount, 0);
      const developmentFees = sectionPayments.reduce((sum, payment) => sum + payment.developmentFee, 0);
      const busFees = sectionPayments.reduce((sum, payment) => sum + payment.busFee, 0);
      const specialFees = sectionPayments.reduce((sum, payment) => sum + payment.specialFee, 0);
      
      // Class-wise breakdown
      const classWiseData = section.classes.map(classNum => {
        const classStudents = sectionStudents.filter(s => parseInt(s.class) === classNum);
        const classPayments = sectionPayments.filter(p => parseInt(p.class) === classNum);
        const classCollection = classPayments.reduce((sum, p) => sum + p.totalAmount, 0);
        
        return {
          class: classNum,
          students: classStudents.length,
          payments: classPayments.length,
          collection: classCollection
        };
      });
      
      return {
        ...section,
        totalStudents: sectionStudents.length,
        totalPayments: sectionPayments.length,
        totalCollection,
        developmentFees,
        busFees,
        specialFees,
        classWiseData,
        payments: sectionPayments
      };
    });
  };

  const sectionData = getSectionData();
  const grandTotal = sectionData.reduce((sum, section) => sum + section.totalCollection, 0);

  // Download CSV for all sections
  const downloadSectionWiseCSV = () => {
    const headers = ['Section', 'Class', 'Students', 'Payments', 'Development Fee', 'Bus Fee', 'Special Fee', 'Total Collection'];
    const csvData: string[][] = [];
    
    sectionData.forEach(section => {
      section.classWiseData.forEach(classData => {
        const classPayments = section.payments.filter(p => parseInt(p.class) === classData.class);
        const classDevelopmentFees = classPayments.reduce((sum, p) => sum + p.developmentFee, 0);
        const classBusFees = classPayments.reduce((sum, p) => sum + p.busFee, 0);
        const classSpecialFees = classPayments.reduce((sum, p) => sum + p.specialFee, 0);
        
        csvData.push([
          section.name,
          `Class ${classData.class}`,
          classData.students.toString(),
          classData.payments.toString(),
          classDevelopmentFees.toString(),
          classBusFees.toString(),
          classSpecialFees.toString(),
          classData.collection.toString()
        ]);
      });
      
      // Add section total row
      csvData.push([
        `${section.name} - TOTAL`,
        '',
        section.totalStudents.toString(),
        section.totalPayments.toString(),
        section.developmentFees.toString(),
        section.busFees.toString(),
        section.specialFees.toString(),
        section.totalCollection.toString()
      ]);
      
      // Add empty row for separation
      csvData.push(['', '', '', '', '', '', '', '']);
    });
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `section_wise_collection_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Section Details Modal
  const SectionDetailsModal: React.FC<{ section: any; onClose: () => void }> = ({ section, onClose }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">{section.name} - Detailed Report</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Section Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-blue-600 text-sm font-medium">Total Students</div>
              <div className="text-2xl font-bold text-gray-900">{section.totalStudents}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-green-600 text-sm font-medium">Total Payments</div>
              <div className="text-2xl font-bold text-gray-900">{section.totalPayments}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-purple-600 text-sm font-medium">Total Collection</div>
              <div className="text-2xl font-bold text-gray-900">₹{section.totalCollection.toLocaleString()}</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-orange-600 text-sm font-medium">Avg per Student</div>
              <div className="text-2xl font-bold text-gray-900">
                ₹{section.totalStudents > 0 ? Math.round(section.totalCollection / section.totalStudents).toLocaleString() : 0}
              </div>
            </div>
          </div>

          {/* Class-wise Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Class-wise Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payments</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Development Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Special Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Collection</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {section.classWiseData.map((classData: any) => {
                    const classPayments = section.payments.filter((p: any) => parseInt(p.class) === classData.class);
                    const classDevelopmentFees = classPayments.reduce((sum: number, p: any) => sum + p.developmentFee, 0);
                    const classBusFees = classPayments.reduce((sum: number, p: any) => sum + p.busFee, 0);
                    const classSpecialFees = classPayments.reduce((sum: number, p: any) => sum + p.specialFee, 0);
                    
                    return (
                      <tr key={classData.class} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">Class {classData.class}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{classData.students}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{classData.payments}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{classDevelopmentFees.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{classBusFees.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{classSpecialFees.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-green-600">₹{classData.collection.toLocaleString()}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Fee Type Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">₹{section.developmentFees.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Development Fees</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">₹{section.busFees.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Bus Fees</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">₹{section.specialFees.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Special Fees</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Section-wise Collection Summary</h1>
          <p className="text-gray-600">View collection amounts by sections (LP, UP, HS, HSS)</p>
        </div>
        <button
          onClick={downloadSectionWiseCSV}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Download className="h-4 w-4" />
          <span>Download Report</span>
        </button>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Date Filter</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex space-x-6">
            <label className="flex items-center">
              <input
                type="radio"
                value="all"
                checked={dateFilter === 'all'}
                onChange={(e) => setDateFilter(e.target.value as 'all')}
                className="mr-2"
              />
              All Time
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="month"
                checked={dateFilter === 'month'}
                onChange={(e) => setDateFilter(e.target.value as 'month')}
                className="mr-2"
              />
              Specific Month
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="custom"
                checked={dateFilter === 'custom'}
                onChange={(e) => setDateFilter(e.target.value as 'custom')}
                className="mr-2"
              />
              Custom Range
            </label>
          </div>

          {dateFilter === 'month' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Month
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {dateFilter === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grand Total Summary */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Grand Total Collection</h2>
            <p className="text-blue-100">All sections combined</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">₹{grandTotal.toLocaleString()}</div>
            <div className="text-blue-100">
              {sectionData.reduce((sum, section) => sum + section.totalPayments, 0)} payments
            </div>
          </div>
        </div>
      </div>

      {/* Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sectionData.map((section) => (
          <div key={section.id} className={`${section.color} rounded-lg p-6 border border-gray-200`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 ${section.iconColor} rounded-lg`}>
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{section.name}</h3>
                  <p className="text-sm text-gray-600">Classes {section.classes.join(', ')}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSection(section)}
                className={`p-2 ${section.textColor} hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors`}
                title="View Details"
              >
                <Eye className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Main Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Students</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{section.totalStudents}</div>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Payments</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{section.totalPayments}</div>
                </div>
              </div>

              {/* Collection Amount */}
              <div className="border-t pt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">₹{section.totalCollection.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Collection</div>
                </div>
              </div>

              {/* Class-wise Quick View */}
              <div className="border-t pt-4">
                <div className="text-sm text-gray-600 mb-2">Class-wise Collection:</div>
                <div className="grid grid-cols-2 gap-2">
                  {section.classWiseData.map((classData: any) => (
                    <div key={classData.class} className="flex justify-between text-sm">
                      <span className="text-gray-700">Class {classData.class}:</span>
                      <span className="font-medium text-gray-900">₹{classData.collection.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-medium text-blue-600">₹{section.developmentFees.toLocaleString()}</div>
                    <div className="text-gray-600">Development</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-green-600">₹{section.busFees.toLocaleString()}</div>
                    <div className="text-gray-600">Bus</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-purple-600">₹{section.specialFees.toLocaleString()}</div>
                    <div className="text-gray-600">Special</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section Details Modal */}
      {selectedSection && (
        <SectionDetailsModal
          section={selectedSection}
          onClose={() => setSelectedSection(null)}
        />
      )}
    </div>
  );
};

export default SectionWiseCollection;