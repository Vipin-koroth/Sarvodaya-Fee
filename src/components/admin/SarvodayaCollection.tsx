import React, { useState } from 'react';
import { Plus, Calendar, Users, TrendingUp, CreditCard, Search, Edit, Trash2, Save } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

interface CollectionEntry {
  id: string;
  teacherName: string;
  class: string;
  division: string;
  collectionDate: string;
  amount: number;
  remarks: string;
  addedBy: string;
  createdAt: string;
}

const SarvodayaCollection: React.FC = () => {
  const { students, payments } = useData();
  const { user } = useAuth();
  const [collections, setCollections] = useState<CollectionEntry[]>(() => {
    const saved = localStorage.getItem('sarvodayaCollections');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');

  const [formData, setFormData] = useState({
    teacherName: '',
    class: '',
    division: '',
    collectionDate: new Date().toISOString().split('T')[0],
    amount: 0,
    remarks: ''
  });

  // Save collections to localStorage
  const saveCollections = (newCollections: CollectionEntry[]) => {
    setCollections(newCollections);
    localStorage.setItem('sarvodayaCollections', JSON.stringify(newCollections));
  };

  // Generate ID
  const generateId = () => {
    return 'col_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  // Get class teachers list
  const getClassTeachers = () => {
    // Get class range based on user
    const getClassRange = () => {
      switch (user?.username) {
        case 'lp':
          return { min: 1, max: 4 };
        case 'up':
          return { min: 5, max: 7 };
        case 'hs':
          return { min: 8, max: 10 };
        case 'hss':
          return { min: 11, max: 12 };
        case 'sarvodaya':
        default:
          return { min: 1, max: 12 }; // Full access for sarvodaya
      }
    };
    
    const classRange = getClassRange();
    const teachers = [];
    for (let classNum = classRange.min; classNum <= classRange.max; classNum++) {
      for (let division of ['A', 'B', 'C', 'D', 'E']) {
        teachers.push({
          name: `Class ${classNum}-${division} Teacher`,
          class: classNum.toString(),
          division: division
        });
      }
    }
    return teachers;
  };

  // Calculate actual collections from payments
  const getActualCollections = () => {
    // Get class range based on user
    const getClassRange = () => {
      switch (user?.username) {
        case 'lp':
          return { min: 1, max: 4 };
        case 'up':
          return { min: 5, max: 7 };
        case 'hs':
          return { min: 8, max: 10 };
        case 'hss':
          return { min: 11, max: 12 };
        case 'sarvodaya':
        default:
          return { min: 1, max: 12 }; // Full access for sarvodaya
      }
    };
    
    const classRange = getClassRange();
    const classCollections: Record<string, number> = {};
    
    payments.forEach(payment => {
      const classNum = parseInt(payment.class);
      // Filter by class range
      if (classNum < classRange.min || classNum > classRange.max) {
        return;
      }
      
      const classKey = `${payment.class}-${payment.division}`;
      if (!classCollections[classKey]) {
        classCollections[classKey] = 0;
      }
      classCollections[classKey] += payment.totalAmount;
    });
    
    return classCollections;
  };

  // Calculate reported collections
  const getReportedCollections = () => {
    // Get class range based on user
    const getClassRange = () => {
      switch (user?.username) {
        case 'lp':
          return { min: 1, max: 4 };
        case 'up':
          return { min: 5, max: 7 };
        case 'hs':
          return { min: 8, max: 10 };
        case 'hss':
          return { min: 11, max: 12 };
        case 'sarvodaya':
        default:
          return { min: 1, max: 12 }; // Full access for sarvodaya
      }
    };
    
    const classRange = getClassRange();
    const classCollections: Record<string, number> = {};
    
    collections.forEach(collection => {
      const classNum = parseInt(collection.class);
      // Filter by class range
      if (classNum < classRange.min || classNum > classRange.max) {
        return;
      }
      
      const classKey = `${collection.class}-${collection.division}`;
      if (!classCollections[classKey]) {
        classCollections[classKey] = 0;
      }
      classCollections[classKey] += collection.amount;
    });
    
    return classCollections;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.teacherName || !formData.class || !formData.division || formData.amount <= 0) {
      alert('Please fill all required fields');
      return;
    }

    const newCollection: CollectionEntry = {
      id: editingCollection ? editingCollection.id : generateId(),
      teacherName: formData.teacherName,
      class: formData.class,
      division: formData.division,
      collectionDate: formData.collectionDate,
      amount: formData.amount,
      remarks: formData.remarks,
      addedBy: 'sarvodaya',
      createdAt: editingCollection ? editingCollection.createdAt : new Date().toISOString()
    };

    if (editingCollection) {
      const updatedCollections = collections.map(c => 
        c.id === editingCollection.id ? newCollection : c
      );
      saveCollections(updatedCollections);
      setEditingCollection(null);
    } else {
      saveCollections([newCollection, ...collections]);
      setShowAddModal(false);
    }

    // Reset form
    setFormData({
      teacherName: '',
      class: '',
      division: '',
      collectionDate: new Date().toISOString().split('T')[0],
      amount: 0,
      remarks: ''
    });
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this collection entry?')) {
      const updatedCollections = collections.filter(c => c.id !== id);
      saveCollections(updatedCollections);
    }
  };

  // Get class range based on user
  const getClassRange = () => {
    switch (user?.username) {
      case 'lp':
        return { min: 1, max: 4 };
      case 'up':
        return { min: 5, max: 7 };
      case 'hs':
        return { min: 8, max: 10 };
      case 'hss':
        return { min: 11, max: 12 };
      case 'sarvodaya':
      default:
        return { min: 1, max: 12 }; // Full access for sarvodaya
    }
  };

  const classRange = getClassRange();

  // Filter collections
  const filteredCollections = collections.filter(collection => {
    const classNum = parseInt(collection.class);
    // Filter by user's class range
    if (classNum < classRange.min || classNum > classRange.max) {
      return false;
    }
    
    const matchesSearch = collection.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${collection.class}-${collection.division}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || collection.collectionDate === dateFilter;
    const matchesClass = !classFilter || collection.class === classFilter;
    
    return matchesSearch && matchesDate && matchesClass;
  });

  // Calculate totals
  const totalReported = filteredCollections.reduce((sum, c) => sum + c.amount, 0);
  const todayCollections = collections.filter(c => {
    const classNum = parseInt(c.class);
    return classNum >= classRange.min && classNum <= classRange.max &&
    c.collectionDate === new Date().toISOString().split('T')[0];
  });
  const todayTotal = todayCollections.reduce((sum, c) => sum + c.amount, 0);

  // Get balance report data
  const actualCollections = getActualCollections();
  const reportedCollections = getReportedCollections();
  
  const balanceData = [];

  for (let classNum = classRange.min; classNum <= classRange.max; classNum++) {
    for (let division of ['A', 'B', 'C', 'D', 'E']) {
      const classKey = `${classNum}-${division}`;
      const actual = actualCollections[classKey] || 0;
      const reported = reportedCollections[classKey] || 0;
      const balance = actual - reported;
      
      if (actual > 0 || reported > 0) {
        balanceData.push({
          class: classNum.toString(),
          division,
          actual,
          reported,
          balance
        });
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collection Management</h1>
          <p className="text-gray-600">Track class teacher collections and balances</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Add Collection</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Collections</p>
              <p className="text-2xl font-bold text-gray-900">{collections.length}</p>
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
            <Users className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-orange-600">Today's Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{todayTotal.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Report */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Collection Balance Report</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actual Collection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reported Collection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {balanceData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      Class {item.class}-{item.division}
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
                      ₹{item.balance.toLocaleString()}
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
        
        {balanceData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No collection data available</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by teacher or class..."
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
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Classes</option>
            {Array.from({ length: classRange.max - classRange.min + 1 }, (_, i) => classRange.min + i).map(cls => (
              <option key={cls} value={cls.toString()}>Class {cls}</option>
            ))}
          </select>
          <div className="text-sm text-gray-600 flex items-center">
            Showing: {filteredCollections.length} entries
          </div>
        </div>
      </div>

      {/* Collections Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teacher & Class
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
              {filteredCollections.map((collection) => (
                <tr key={collection.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{collection.teacherName}</div>
                      <div className="text-sm text-gray-500">Class {collection.class}-{collection.division}</div>
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
                            teacherName: collection.teacherName,
                            class: collection.class,
                            division: collection.division,
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
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCollections.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No collections found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || dateFilter || classFilter ? 'No collections match your search criteria.' : 'Get started by adding a collection entry.'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Collection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCollection ? 'Edit Collection' : 'Add Collection Entry'}
              </h2>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCollection(null);
                  setFormData({
                    teacherName: '',
                    class: '',
                    division: '',
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
                  Teacher Name
                </label>
                <select
                  value={formData.teacherName}
                  onChange={(e) => {
                    const selected = e.target.value;
                    const teacher = getClassTeachers().find(t => t.name === selected);
                    setFormData(prev => ({
                      ...prev,
                      teacherName: selected,
                      class: teacher?.class || '',
                      division: teacher?.division || ''
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Teacher</option>
                  {getClassTeachers().map((teacher, index) => (
                    <option key={index} value={teacher.name}>{teacher.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class
                  </label>
                  <input
                    type="text"
                    value={formData.class}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Division
                  </label>
                  <input
                    type="text"
                    value={formData.division}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
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
                      teacherName: '',
                      class: '',
                      division: '',
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
    </div>
  );
};

export default SarvodayaCollection;