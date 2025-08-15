import React, { useState, useEffect } from 'react';
import { Plus, Users, TrendingUp, Calendar, FileText, Edit, Trash2, Save, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

interface CollectionEntry {
  id: string;
  sectionHead: string;
  feeType: 'bus_fee' | 'development_fund' | 'others';
  amount: number;
  date: string;
  addedBy: string;
  description?: string;
  created_at: string;
}

const SarvodayaCollection: React.FC = () => {
  const { user } = useAuth();
  const { students, payments } = useData();
  const [activeView, setActiveView] = useState<'section-wise' | 'class-wise'>('section-wise');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CollectionEntry | null>(null);
  const [collectionEntries, setCollectionEntries] = useState<CollectionEntry[]>([]);
  
  // Form state for adding/editing collection entries
  const [formData, setFormData] = useState({
    sectionHead: '',
    feeType: 'development_fund' as 'bus_fee' | 'development_fund' | 'others',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Helper function to check if user is a section user
  const isSectionUser = () => {
    return user?.role === 'sarvodaya' && ['lp', 'up', 'hs', 'hss'].includes(user.username);
  };

  // Load collection entries from localStorage
  useEffect(() => {
    const savedEntries = localStorage.getItem('sectionCollectionEntries');
    if (savedEntries) {
      setCollectionEntries(JSON.parse(savedEntries));
    }
  }, []);

  // Save collection entries to localStorage
  const saveCollectionEntries = (entries: CollectionEntry[]) => {
    localStorage.setItem('sectionCollectionEntries', JSON.stringify(entries));
    setCollectionEntries(entries);
  };

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
    if (!classRange) return { students, payments }; // Full access for sarvodaya/admin/clerk
    
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
  // Get available class teachers for section user
  const getAvailableClassTeachers = () => {
    const classRange = getClassRangeForUser();
    if (!classRange) return [];
    
    const classTeachers = [];
    for (let classNum = classRange.min; classNum <= classRange.max; classNum++) {
      for (let division of ['A', 'B', 'C', 'D', 'E']) {
        // Check if there are students in this class-division
        const hasStudents = students.some(s => 
          s.class === classNum.toString() && s.division === division
        );
        if (hasStudents) {
          classTeachers.push({
            value: `class${classNum}${division.toLowerCase()}`,
            label: `Class ${classNum}-${division} Teacher`,
            class: classNum.toString(),
            division: division
          });
        }
      }
    }
    return classTeachers;
  };

  // Calculate section totals from actual payments
  const getSectionTotals = () => {
    const sectionTotals = {
      lp: { busFee: 0, developmentFund: 0, others: 0, total: 0 },
      up: { busFee: 0, developmentFund: 0, others: 0, total: 0 },
      hs: { busFee: 0, developmentFund: 0, others: 0, total: 0 },
      hss: { busFee: 0, developmentFund: 0, others: 0, total: 0 }
    };

    payments.forEach(payment => {
      const classNum = parseInt(payment.class);
      let section: 'lp' | 'up' | 'hs' | 'hss';
      
      if (classNum >= 1 && classNum <= 4) section = 'lp';
      else if (classNum >= 5 && classNum <= 7) section = 'up';
      else if (classNum >= 8 && classNum <= 10) section = 'hs';
      else if (classNum >= 11 && classNum <= 12) section = 'hss';
      else return;

      sectionTotals[section].busFee += payment.busFee;
      sectionTotals[section].developmentFund += payment.developmentFee;
      sectionTotals[section].others += payment.specialFee;
      sectionTotals[section].total += payment.totalAmount;
    });

    return sectionTotals;
  };

  // Calculate collection entries by section and fee type
  const getCollectionEntriesBySection = () => {
    const sectionCollections = {
      lp: { busFee: 0, developmentFund: 0, others: 0, total: 0, entries: 0 },
      up: { busFee: 0, developmentFund: 0, others: 0, total: 0, entries: 0 },
      hs: { busFee: 0, developmentFund: 0, others: 0, total: 0, entries: 0 },
      hss: { busFee: 0, developmentFund: 0, others: 0, total: 0, entries: 0 }
    };

    collectionEntries.forEach(entry => {
      const section = entry.sectionHead as 'lp' | 'up' | 'hs' | 'hss';
      if (sectionCollections[section]) {
        sectionCollections[section][entry.feeType === 'bus_fee' ? 'busFee' : 
                                    entry.feeType === 'development_fund' ? 'developmentFund' : 'others'] += entry.amount;
        sectionCollections[section].total += entry.amount;
        sectionCollections[section].entries += 1;
      }
    });

    return sectionCollections;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const sectionHead = isSectionUser() ? user?.username || '' : formData.sectionHead;
    
    if (!sectionHead || formData.amount <= 0) {
      alert('Please fill all required fields');
      return;
    }

    const newEntry: CollectionEntry = {
      id: editingEntry?.id || Date.now().toString(),
      sectionHead: sectionHead,
      feeType: formData.feeType,
      amount: formData.amount,
      date: formData.date,
      addedBy: user?.username || '',
      description: formData.description,
      created_at: editingEntry?.created_at || new Date().toISOString()
    };

    let updatedEntries;
    if (editingEntry) {
      updatedEntries = collectionEntries.map(entry => 
        entry.id === editingEntry.id ? newEntry : entry
      );
    } else {
      updatedEntries = [...collectionEntries, newEntry];
    }

    saveCollectionEntries(updatedEntries);
    resetForm();
    setShowAddModal(false);
    setEditingEntry(null);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      sectionHead: '',
      feeType: 'development_fund',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
  };

  // Handle edit
  const handleEdit = (entry: CollectionEntry) => {
    setEditingEntry(entry);
    setFormData({
      sectionHead: entry.sectionHead,
      feeType: entry.feeType,
      amount: entry.amount,
      date: entry.date,
      description: entry.description || ''
    });
    setShowAddModal(true);
  };

  // Handle delete
  const handleDelete = (entryId: string) => {
    if (confirm('Are you sure you want to delete this collection entry?')) {
      const updatedEntries = collectionEntries.filter(entry => entry.id !== entryId);
      saveCollectionEntries(updatedEntries);
    }
  };

  // Get fee type display name
  const getFeeTypeDisplay = (feeType: string) => {
    switch (feeType) {
      case 'bus_fee': return 'Bus Fee';
      case 'development_fund': return 'Development Fund';
      case 'others': return 'Others';
      default: return feeType;
    }
  };

  // Get section display name
  const getSectionDisplay = (section: string) => {
    switch (section) {
      case 'lp': return 'LP (Classes 1-4)';
      case 'up': return 'UP (Classes 5-7)';
      case 'hs': return 'HS (Classes 8-10)';
      case 'hss': return 'HSS (Classes 11-12)';
      default: return section.toUpperCase();
    }
  };

  const sectionTotals = getSectionTotals();
  const collectionsBySection = getCollectionEntriesBySection();

  // Check if user has access to collection entry
  const canAccessCollectionEntry = () => {
    return user?.role === 'admin' || user?.role === 'clerk' || user?.role === 'sarvodaya';
  };

  if (!canAccessCollectionEntry()) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Access restricted to admin, clerk, and sarvodaya users only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'sarvodaya' && user.username !== 'sarvodaya' 
              ? `${getSectionDisplay(user.username)} Collection Entry`
              : 'Section Collection Entry'
            }
          </h1>
          <p className="text-gray-600">
            3-Tier Collection System: Teacher → Section Head → Admin/Clerk/Sarvodaya
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Add Collection Entry</span>
        </button>
      </div>

      {/* Collection System Overview */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">3-Tier Collection System</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div className="bg-white rounded p-3">
            <div className="font-medium">Tier 1: Teacher Collection</div>
            <div>Teachers collect fees from students</div>
          </div>
          <div className="bg-white rounded p-3">
            <div className="font-medium">Tier 2: Section Head Collection</div>
            <div>Section heads (LP/UP/HS/HSS) collect from teachers</div>
          </div>
          <div className="bg-white rounded p-3">
            <div className="font-medium">Tier 3: Final Collection</div>
            <div>Admin/Clerk/Sarvodaya collect from section heads</div>
          </div>
        </div>
      </div>

      {/* Fee Types Overview */}
      <div className="bg-green-50 rounded-lg p-4">
        <h3 className="font-medium text-green-900 mb-2">Fee Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-800">
          <div className="bg-white rounded p-3">
            <div className="font-medium">Bus Fee</div>
            <div>Transportation charges</div>
          </div>
          <div className="bg-white rounded p-3">
            <div className="font-medium">Development Fund</div>
            <div>School development fees</div>
          </div>
          <div className="bg-white rounded p-3">
            <div className="font-medium">Others</div>
            <div>Special fees and miscellaneous</div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setActiveView('section-wise')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'section-wise'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Section-wise View
          </button>
          <button
            onClick={() => setActiveView('class-wise')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeView === 'class-wise'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Collection Entries
          </button>
        </div>

        {activeView === 'section-wise' ? (
          <div className="space-y-6">
            {/* Section-wise Collection Summary */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Section-wise Collection Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(['lp', 'up', 'hs', 'hss'] as const).map((section) => {
                  const actualTotal = sectionTotals[section];
                  const collectedTotal = collectionsBySection[section];
                  
                  return (
                    <div key={section} className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{getSectionDisplay(section)}</h4>
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Received:</span>
                          <span className="font-medium">₹{actualTotal.total.toLocaleString()}</span>
                        </div>
                        
                        <div className="border-t pt-2">
                          <div className="text-xs font-medium text-gray-700 mb-1">Fee Type Breakdown:</div>
                          <div className="flex justify-between text-xs">
                            <span>Bus Fee:</span>
                            <span>₹{actualTotal.busFee.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Development:</span>
                            <span>₹{actualTotal.developmentFund.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Others:</span>
                            <span>₹{actualTotal.others.toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <div className="border-t pt-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Section Total Entered amount:</span>
                            <span className="font-medium text-green-600">₹{collectedTotal.total.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Entries:</span>
                            <span className="font-medium">{collectedTotal.entries}</span>
                          </div>
                        </div>
                        
                        <div className="border-t pt-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Balance Due:</span>
                            <div className={`font-medium ${
                              actualTotal.total - collectedTotal.total === 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              ₹{Math.abs(actualTotal.total - collectedTotal.total).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Collection Entries Table */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Collection Entries</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Section Head
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fee Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Added By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {collectionEntries
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(entry.date).toLocaleDateString('en-GB')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {entry.sectionHead.startsWith('class') ? (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                {entry.sectionHead.replace('class', 'Class ').replace(/(\d+)([a-z])/, '$1-$2').toUpperCase()}
                              </span>
                            ) : (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                entry.sectionHead === 'lp' ? 'bg-blue-100 text-blue-800' :
                                entry.sectionHead === 'up' ? 'bg-green-100 text-green-800' :
                                entry.sectionHead === 'hs' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {getSectionDisplay(entry.sectionHead)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              entry.feeType === 'bus_fee' ? 'bg-orange-100 text-orange-800' :
                              entry.feeType === 'development_fund' ? 'bg-indigo-100 text-indigo-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {getFeeTypeDisplay(entry.feeType)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                            ₹{entry.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                            {entry.description || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entry.addedBy}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(entry)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit Entry"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete Entry"
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
              
              {collectionEntries.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No collection entries</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by adding a collection entry from section heads.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Collection Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingEntry ? 'Edit Collection Entry' : 'Add Collection Entry'}
              </h2>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingEntry(null);
                  resetForm();
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isSectionUser() ? 'Class Teacher' : 'Section Head'}
                </label>
                {isSectionUser() ? (
                  <select
                    value={formData.sectionHead}
                    onChange={(e) => setFormData(prev => ({ ...prev, sectionHead: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Class Teacher</option>
                    {getAvailableClassTeachers().map(teacher => (
                      <option key={teacher.value} value={teacher.value}>
                        {teacher.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={formData.sectionHead}
                    onChange={(e) => setFormData(prev => ({ ...prev, sectionHead: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Section Head</option>
                    <option value="lp">LP (Classes 1-4)</option>
                    <option value="up">UP (Classes 5-7)</option>
                    <option value="hs">HS (Classes 8-10)</option>
                    <option value="hss">HSS (Classes 11-12)</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fee Type
                </label>
                <select
                  value={formData.feeType}
                  onChange={(e) => setFormData(prev => ({ ...prev, feeType: e.target.value as 'bus_fee' | 'development_fund' | 'others' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="development_fund">Development Fund</option>
                  <option value="bus_fee">Bus Fee</option>
                  <option value="others">Others</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Additional notes about this collection..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingEntry(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingEntry ? 'Update' : 'Add'} Entry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SarvodayaCollection;