import React, { useState } from 'react';
import { Plus, Save, Users, TrendingUp, DollarSign, Calendar, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

interface CollectionEntry {
  id: string;
  section: string;
  class: string;
  division: string;
  busFee: number;
  developmentFee: number;
  othersFee: number;
  totalAmount: number;
  date: string;
  addedBy: string;
}

const SarvodayaCollection: React.FC = () => {
  const { user } = useAuth();
  const { students, payments } = useData();
  const [activeView, setActiveView] = useState<'class-wise' | 'section-wise'>('class-wise');
  const [showAddModal, setShowAddModal] = useState(false);
  const [collections, setCollections] = useState<CollectionEntry[]>([]);
  
  // Form state for adding new collection
  const [formData, setFormData] = useState({
    section: '',
    class: '',
    division: '',
    busFee: 0,
    developmentFee: 0,
    othersFee: 0,
    date: new Date().toISOString().split('T')[0]
  });

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

  // Get filtered data based on user's class range
  const getFilteredData = () => {
    const classRange = getClassRangeForUser();
    if (!classRange) return { students, payments }; // Full access for admin/clerk/sarvodaya
    
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

  const { students: filteredStudents, payments: filteredPayments } = getFilteredData();

  // Calculate class-wise collection data
  const getClassWiseData = () => {
    const classData: Record<string, {
      totalStudents: number;
      receivedBusFee: number;
      receivedDevelopmentFee: number;
      receivedOthersFee: number;
      reportedBusFee: number;
      reportedDevelopmentFee: number;
      reportedOthersFee: number;
    }> = {};

    // Initialize class data
    const classRange = getClassRangeForUser();
    const classes = classRange 
      ? Array.from({ length: classRange.max - classRange.min + 1 }, (_, i) => classRange.min + i)
      : Array.from({ length: 12 }, (_, i) => i + 1);

    classes.forEach(classNum => {
      ['A', 'B', 'C', 'D', 'E'].forEach(division => {
        const key = `${classNum}-${division}`;
        const classStudents = filteredStudents.filter(s => s.class === classNum.toString() && s.division === division);
        
        if (classStudents.length > 0) {
          const classPayments = filteredPayments.filter(p => p.class === classNum.toString() && p.division === division);
          
          classData[key] = {
            totalStudents: classStudents.length,
            receivedBusFee: classPayments.reduce((sum, p) => sum + p.busFee, 0),
            receivedDevelopmentFee: classPayments.reduce((sum, p) => sum + p.developmentFee, 0),
            receivedOthersFee: classPayments.reduce((sum, p) => sum + p.specialFee, 0),
            reportedBusFee: 0, // This would come from collection entries
            reportedDevelopmentFee: 0, // This would come from collection entries
            reportedOthersFee: 0, // This would come from collection entries
          };
        }
      });
    });

    return classData;
  };

  // Calculate section-wise data
  const getSectionWiseData = () => {
    const sections = ['LP', 'UP', 'HS', 'HSS'];
    const sectionData: Record<string, {
      classes: string[];
      totalBusFee: number;
      totalDevelopmentFee: number;
      totalOthersFee: number;
      totalAmount: number;
    }> = {};

    sections.forEach(section => {
      let classRange;
      switch (section) {
        case 'LP': classRange = { min: 1, max: 4 }; break;
        case 'UP': classRange = { min: 5, max: 7 }; break;
        case 'HS': classRange = { min: 8, max: 10 }; break;
        case 'HSS': classRange = { min: 11, max: 12 }; break;
        default: continue;
      }

      const sectionPayments = filteredPayments.filter(p => {
        const classNum = parseInt(p.class);
        return classNum >= classRange.min && classNum <= classRange.max;
      });

      const sectionCollections = collections.filter(c => c.section === section);

      sectionData[section] = {
        classes: Array.from({ length: classRange.max - classRange.min + 1 }, (_, i) => `${classRange.min + i}`),
        totalBusFee: sectionPayments.reduce((sum, p) => sum + p.busFee, 0) + sectionCollections.reduce((sum, c) => sum + c.busFee, 0),
        totalDevelopmentFee: sectionPayments.reduce((sum, p) => sum + p.developmentFee, 0) + sectionCollections.reduce((sum, c) => sum + c.developmentFee, 0),
        totalOthersFee: sectionPayments.reduce((sum, p) => sum + p.specialFee, 0) + sectionCollections.reduce((sum, c) => sum + c.othersFee, 0),
        totalAmount: 0
      };

      sectionData[section].totalAmount = sectionData[section].totalBusFee + sectionData[section].totalDevelopmentFee + sectionData[section].totalOthersFee;
    });

    return sectionData;
  };

  const handleAddCollection = () => {
    const totalAmount = formData.busFee + formData.developmentFee + formData.othersFee;
    
    if (totalAmount <= 0) {
      alert('Please enter at least one fee amount');
      return;
    }

    if (!formData.section || !formData.class || !formData.division) {
      alert('Please fill all required fields');
      return;
    }

    const newCollection: CollectionEntry = {
      id: Date.now().toString(),
      section: formData.section,
      class: formData.class,
      division: formData.division,
      busFee: formData.busFee,
      developmentFee: formData.developmentFee,
      othersFee: formData.othersFee,
      totalAmount,
      date: formData.date,
      addedBy: user?.username || ''
    };

    setCollections(prev => [...prev, newCollection]);
    setFormData({
      section: '',
      class: '',
      division: '',
      busFee: 0,
      developmentFee: 0,
      othersFee: 0,
      date: new Date().toISOString().split('T')[0]
    });
    setShowAddModal(false);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? value : Number(value)
    }));
  };

  const classWiseData = getClassWiseData();
  const sectionWiseData = getSectionWiseData();
  const totalAmount = formData.busFee + formData.developmentFee + formData.othersFee;

  const getPageTitle = () => {
    const classRange = getClassRangeForUser();
    if (classRange) {
      return `${classRange.name} Collection Entry`;
    }
    return 'Collection Entry';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
        <p className="text-gray-600">
          {getClassRangeForUser() 
            ? `Manage fee collections for ${getClassRangeForUser()?.name} section`
            : 'Manage fee collections and track payments'
          }
        </p>
      </div>

      {/* View Toggle */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => setActiveView('class-wise')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'class-wise'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Class-wise Entry
          </button>
          <button
            onClick={() => setActiveView('section-wise')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'section-wise'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Section-wise Entry
          </button>
        </div>
      </div>

      {/* Class-wise View */}
      {activeView === 'class-wise' && (
        <div className="space-y-6">
          {Object.entries(classWiseData).map(([classKey, data]) => {
            const [classNum, division] = classKey.split('-');
            const busDifference = data.receivedBusFee - data.reportedBusFee;
            const devDifference = data.receivedDevelopmentFee - data.reportedDevelopmentFee;
            const othersDifference = data.receivedOthersFee - data.reportedOthersFee;

            return (
              <div key={classKey} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Class {classNum}-{division} ({data.totalStudents} students)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Bus Fee */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-3">Bus Fee</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Received:</span>
                        <span className="font-medium">₹{data.receivedBusFee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Reported:</span>
                        <span className="font-medium">₹{data.reportedBusFee}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-blue-700 font-medium">
                          {busDifference > 0 ? 'Pending:' : busDifference < 0 ? 'Excess:' : 'Balanced:'}
                        </span>
                        <span className={`font-bold ${
                          busDifference > 0 ? 'text-orange-600' : 
                          busDifference < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          ₹{Math.abs(busDifference)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Development Fee */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-3">Development Fee</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700">Received:</span>
                        <span className="font-medium">₹{data.receivedDevelopmentFee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Reported:</span>
                        <span className="font-medium">₹{data.reportedDevelopmentFee}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-green-700 font-medium">
                          {devDifference > 0 ? 'Pending:' : devDifference < 0 ? 'Excess:' : 'Balanced:'}
                        </span>
                        <span className={`font-bold ${
                          devDifference > 0 ? 'text-orange-600' : 
                          devDifference < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          ₹{Math.abs(devDifference)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Others Fee */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-medium text-purple-900 mb-3">Others Fee</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-purple-700">Received:</span>
                        <span className="font-medium">₹{data.receivedOthersFee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Reported:</span>
                        <span className="font-medium">₹{data.reportedOthersFee}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-purple-700 font-medium">
                          {othersDifference > 0 ? 'Pending:' : othersDifference < 0 ? 'Excess:' : 'Balanced:'}
                        </span>
                        <span className={`font-bold ${
                          othersDifference > 0 ? 'text-orange-600' : 
                          othersDifference < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          ₹{Math.abs(othersDifference)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Section-wise View */}
      {activeView === 'section-wise' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Section-wise Collections</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Section Entry</span>
            </button>
          </div>

          {Object.entries(sectionWiseData).map(([section, data]) => (
            <div key={section} className="bg-white rounded-lg shadow p-6">
              {/* Section Totals Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{section} Section Totals</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">₹{data.totalBusFee.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Bus Fee Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">₹{data.totalDevelopmentFee.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Development Fee Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">₹{data.totalOthersFee.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Others Fee Total</div>
                  </div>
                </div>
                <div className="text-center border-t pt-4">
                  <div className="text-3xl font-bold text-gray-900">₹{data.totalAmount.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Grand Total</div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {section} Section (Classes {data.classes.join(', ')})
              </h3>

              {/* Collection Entries Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bus Fee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Development Fee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Others Fee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {collections
                      .filter(c => c.section === section)
                      .map((collection) => (
                        <tr key={collection.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {collection.class}-{collection.division}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-blue-600 font-medium">
                              ₹{collection.busFee.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-green-600 font-medium">
                              ₹{collection.developmentFee.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-purple-600 font-medium">
                              ₹{collection.othersFee.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900">
                              ₹{collection.totalAmount.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(collection.date).toLocaleDateString('en-GB')}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {collections.filter(c => c.section === section).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No collection entries for {section} section yet.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Collection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add Section Entry</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Section Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section
                </label>
                <select
                  value={formData.section}
                  onChange={(e) => handleInputChange('section', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Section</option>
                  <option value="LP">LP (Classes 1-4)</option>
                  <option value="UP">UP (Classes 5-7)</option>
                  <option value="HS">HS (Classes 8-10)</option>
                  <option value="HSS">HSS (Classes 11-12)</option>
                </select>
              </div>

              {/* Class and Division */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class
                  </label>
                  <select
                    value={formData.class}
                    onChange={(e) => handleInputChange('class', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Class</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Division
                  </label>
                  <select
                    value={formData.division}
                    onChange={(e) => handleInputChange('division', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Division</option>
                    {['A', 'B', 'C', 'D', 'E'].map(div => (
                      <option key={div} value={div}>{div}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fee Amount Inputs */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bus Fee (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      value={formData.busFee}
                      onChange={(e) => handleInputChange('busFee', parseInt(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-blue-50"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Development Fee (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      value={formData.developmentFee}
                      onChange={(e) => handleInputChange('developmentFee', parseInt(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-green-50"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Others Fee (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      value={formData.othersFee}
                      onChange={(e) => handleInputChange('othersFee', parseInt(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-purple-50"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Total Amount Display */}
              {totalAmount > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-green-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-600">₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCollection}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SarvodayaCollection;