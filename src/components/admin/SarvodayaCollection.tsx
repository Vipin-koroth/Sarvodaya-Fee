import React, { useState } from 'react';
import { Plus, Calendar, Users, TrendingUp, CreditCard, Search, Edit, Trash2, Save, BookOpen } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

interface SectionCollectionEntry {
  id: string;
  section: 'LP' | 'UP' | 'HS' | 'HSS';
  sectionHead: string;
  collectionDate: string;
  amount: number;
  remarks: string;
  addedBy: string;
  createdAt: string;
}

const SarvodayaCollection: React.FC = () => {
  const { students, payments } = useData();
  const { user } = useAuth();
  const [sectionCollections, setSectionCollections] = useState<SectionCollectionEntry[]>(() => {
    const saved = localStorage.getItem('sectionCollections');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<SectionCollectionEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');

  const [formData, setFormData] = useState({
    section: '' as 'LP' | 'UP' | 'HS' | 'HSS' | '',
    sectionHead: '',
    collectionDate: new Date().toISOString().split('T')[0],
    amount: 0,
    remarks: ''
  });

  // Save collections to localStorage
  const saveSectionCollections = (newCollections: SectionCollectionEntry[]) => {
    setSectionCollections(newCollections);
    localStorage.setItem('sectionCollections', JSON.stringify(newCollections));
  };

  // Generate ID
  const generateId = () => {
    return 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  // Get section configuration
  const getSectionConfig = () => {
    return {
      LP: { name: 'Lower Primary', classes: [1, 2, 3, 4], head: 'LP Section Head' },
      UP: { name: 'Upper Primary', classes: [5, 6, 7], head: 'UP Section Head' },
      HS: { name: 'High School', classes: [8, 9, 10], head: 'HS Section Head' },
      HSS: { name: 'Higher Secondary', classes: [11, 12], head: 'HSS Section Head' }
    };
  };

  // Calculate actual collections by section
  const getActualSectionCollections = () => {
    const sectionConfig = getSectionConfig();
    const sectionCollections: Record<string, number> = {};
    
    Object.entries(sectionConfig).forEach(([sectionKey, config]) => {
      sectionCollections[sectionKey] = 0;
      
      payments.forEach(payment => {
        const classNum = parseInt(payment.class);
        if (config.classes.includes(classNum)) {
          sectionCollections[sectionKey] += payment.totalAmount;
        }
      });
    });
    
    return sectionCollections;
  };

  // Calculate reported collections by section
  const getReportedSectionCollections = () => {
    const reportedCollections: Record<string, number> = {};
    
    ['LP', 'UP', 'HS', 'HSS'].forEach(section => {
      reportedCollections[section] = sectionCollections
        .filter(c => c.section === section)
        .reduce((sum, c) => sum + c.amount, 0);
    });
    
    return reportedCollections;
  };

  // Get section balance data
  const getSectionBalanceData = () => {
    const actualCollections = getActualSectionCollections();
    const reportedCollections = getReportedSectionCollections();
    const sectionConfig = getSectionConfig();
    
    return Object.entries(sectionConfig).map(([sectionKey, config]) => ({
      section: sectionKey,
      name: config.name,
      classes: config.classes.join(', '),
      actual: actualCollections[sectionKey] || 0,
      reported: reportedCollections[sectionKey] || 0,
      balance: (actualCollections[sectionKey] || 0) - (reportedCollections[sectionKey] || 0)
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.section || !formData.sectionHead || formData.amount <= 0) {
      alert('Please fill all required fields');
      return;
    }

    const newCollection: SectionCollectionEntry = {
      id: editingCollection ? editingCollection.id : generateId(),
      section: formData.section,
      sectionHead: formData.sectionHead,
      collectionDate: formData.collectionDate,
      amount: formData.amount,
      remarks: formData.remarks,
      addedBy: user?.username || 'sarvodaya',
      createdAt: editingCollection ? editingCollection.createdAt : new Date().toISOString()
    };

    if (editingCollection) {
      const updatedCollections = sectionCollections.map(c => 
        c.id === editingCollection.id ? newCollection : c
      );
      saveSectionCollections(updatedCollections);
      setEditingCollection(null);
    } else {
      saveSectionCollections([newCollection, ...sectionCollections]);
      setShowAddModal(false);
    }

    // Reset form
    setFormData({
      section: '' as 'LP' | 'UP' | 'HS' | 'HSS' | '',
      sectionHead: '',
      collectionDate: new Date().toISOString().split('T')[0],
      amount: 0,
      remarks: ''
    });
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this collection entry?')) {
      const updatedCollections = sectionCollections.filter(c => c.id !== id);
      saveSectionCollections(updatedCollections);
    }
  };

  // Filter collections
  const filteredCollections = sectionCollections.filter(collection => {
    const matchesSearch = collection.sectionHead.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         collection.section.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || collection.collectionDate === dateFilter;
    const matchesSection = !sectionFilter || collection.section === sectionFilter;
    
    return matchesSearch && matchesDate && matchesSection;
  });

  // Calculate totals
  const totalReported = filteredCollections.reduce((sum, c) => sum + c.amount, 0);
  const todayCollections = sectionCollections.filter(c => 
    c.collectionDate === new Date().toISOString().split('T')[0]
  );
  const todayTotal = todayCollections.reduce((sum, c) => sum + c.amount, 0);

  // Get balance data
  const balanceData = getSectionBalanceData();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Section-wise Collection Management</h1>
          <p className="text-gray-600">Track section head collections and balances (LP, UP, HS, HSS)</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Add Section Collection</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Entries</p>
              <p className="text-2xl font-bold text-gray-900">{sectionCollections.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Total Reported</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalReported.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Today's Entries</p>
              <p className="text-2xl font-bold text-gray-900">{todayCollections.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600">Today's Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{todayTotal.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Balance Report */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Section-wise Collection Balance</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Section
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actual Collection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reported Collection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {balanceData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.section}</div>
                      <div className="text-sm text-gray-500">{item.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      Classes {item.classes}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{item.actual.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{item.reported.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-semibold ${
                      item.balance > 0 ? 'text-red-600' : 
                      item.balance < 0 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      ₹{Math.abs(item.balance).toLocaleString()}
                      {item.balance > 0 && ' (Pending)'}
                      {item.balance < 0 && ' (Excess)'}
                      {item.balance === 0 && ' (Balanced)'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by section or head..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Sections</option>
            <option value="LP">LP (Classes 1-4)</option>
            <option value="UP">UP (Classes 5-7)</option>
            <option value="HS">HS (Classes 8-10)</option>
            <option value="HSS">HSS (Classes 11-12)</option>
          </select>
          <div className="text-sm text-gray-600 flex items-center">
            Showing: {filteredCollections.length} entries
          </div>
        </div>
      </div>

      {/* Section Collections Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Section Collection Entries</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Section & Head
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collection Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remarks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCollections.map((collection) => {
                const sectionConfig = getSectionConfig();
                const config = sectionConfig[collection.section];
                
                return (
                  <tr key={collection.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {collection.section} - {config?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {collection.sectionHead} • Classes {config?.classes.join(', ')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(collection.collectionDate).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-semibold text-green-600">
                        ₹{collection.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {collection.remarks || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingCollection(collection);
                            setFormData({
                              section: collection.section,
                              sectionHead: collection.sectionHead,
                              collectionDate: collection.collectionDate,
                              amount: collection.amount,
                              remarks: collection.remarks
                            });
                            setShowAddModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Collection"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(collection.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Collection"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredCollections.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No section collections found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || dateFilter || sectionFilter ? 'No collections match your search criteria.' : 'Get started by adding a section collection entry.'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Section Collection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCollection ? 'Edit Section Collection' : 'Add Section Collection'}
              </h2>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCollection(null);
                  setFormData({
                    section: '' as 'LP' | 'UP' | 'HS' | 'HSS' | '',
                    sectionHead: '',
                    collectionDate: new Date().toISOString().split('T')[0],
                    amount: 0,
                    remarks: ''
                  });
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section
                </label>
                <select
                  value={formData.section}
                  onChange={(e) => {
                    const section = e.target.value as 'LP' | 'UP' | 'HS' | 'HSS';
                    const sectionConfig = getSectionConfig();
                    setFormData(prev => ({
                      ...prev,
                      section: section,
                      sectionHead: section ? sectionConfig[section].head : ''
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Section</option>
                  <option value="LP">LP - Lower Primary (Classes 1-4)</option>
                  <option value="UP">UP - Upper Primary (Classes 5-7)</option>
                  <option value="HS">HS - High School (Classes 8-10)</option>
                  <option value="HSS">HSS - Higher Secondary (Classes 11-12)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Head Name
                </label>
                <input
                  type="text"
                  value={formData.sectionHead}
                  onChange={(e) => setFormData(prev => ({ ...prev, sectionHead: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter section head name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collection Date
                </label>
                <input
                  type="date"
                  value={formData.collectionDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, collectionDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collection Amount
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
                  Remarks (Optional)
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Any additional notes..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCollection(null);
                    setFormData({
                      section: '' as 'LP' | 'UP' | 'HS' | 'HSS' | '',
                      sectionHead: '',
                      collectionDate: new Date().toISOString().split('T')[0],
                      amount: 0,
                      remarks: ''
                    });
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingCollection ? 'Update' : 'Add'} Collection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Date-wise Collection Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Date-wise Collection Summary</h2>
        
        {/* Get unique dates from collections */}
        {(() => {
          const uniqueDates = [...new Set(sectionCollections.map(c => c.collectionDate))].sort().reverse();
          
          if (uniqueDates.length === 0) {
            return (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No collection entries found</p>
              </div>
            );
          }
          
          return (
            <div className="space-y-4">
              {uniqueDates.slice(0, 7).map(date => {
                const dateCollections = sectionCollections.filter(c => c.collectionDate === date);
                const dateTotal = dateCollections.reduce((sum, c) => sum + c.amount, 0);
                
                return (
                  <div key={date} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-900">
                        {new Date(date).toLocaleDateString('en-GB', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h4>
                      <span className="text-lg font-semibold text-green-600">
                        ₹{dateTotal.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {['LP', 'UP', 'HS', 'HSS'].map(section => {
                        const sectionAmount = dateCollections
                          .filter(c => c.section === section)
                          .reduce((sum, c) => sum + c.amount, 0);
                        
                        return (
                          <div key={section} className="bg-gray-50 rounded p-3 text-center">
                            <div className="text-sm font-medium text-gray-700">{section}</div>
                            <div className="text-lg font-semibold text-gray-900">
                              ₹{sectionAmount.toLocaleString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              
              {uniqueDates.length > 7 && (
                <div className="text-center text-sm text-gray-500">
                  Showing last 7 days. Use date filter above to see specific dates.
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default SarvodayaCollection;