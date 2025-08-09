import React, { useState } from 'react';
import { Plus, Calendar, Users, TrendingUp, CreditCard, Search, Edit, Trash2, Save, BookOpen, Download, Filter } from 'lucide-react';
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

interface ClassCollectionEntry {
  id: string;
  class: string;
  division: string;
  teacher: string;
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
  
  const [classCollections, setClassCollections] = useState<ClassCollectionEntry[]>(() => {
    const saved = localStorage.getItem('classCollections');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeTab, setActiveTab] = useState<'section' | 'class'>('section');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<SectionCollectionEntry | ClassCollectionEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');

  const [sectionFormData, setSectionFormData] = useState({
    section: '' as 'LP' | 'UP' | 'HS' | 'HSS' | '',
    sectionHead: '',
    collectionDate: new Date().toISOString().split('T')[0],
    amount: 0,
    remarks: ''
  });

  const [classFormData, setClassFormData] = useState({
    class: '',
    division: '',
    teacher: '',
    collectionDate: new Date().toISOString().split('T')[0],
    amount: 0,
    remarks: ''
  });

  // Helper function to get class range for user
  const getClassRangeForUser = (userRole: string, username: string) => {
    if (userRole !== 'sarvodaya') return null;
    
    switch (username) {
      case 'lp':
        return { min: 1, max: 4, sections: ['LP'] };
      case 'up':
        return { min: 5, max: 7, sections: ['UP'] };
      case 'hs':
        return { min: 8, max: 10, sections: ['HS'] };
      case 'hss':
        return { min: 11, max: 12, sections: ['HSS'] };
      case 'sarvodaya':
        return null; // Full access
      default:
        return null;
    }
  };

  // Filter data based on user access
  const getFilteredDataForUser = () => {
    const classRange = getClassRangeForUser(user?.role || '', user?.username || '');
    
    if (!classRange) {
      // Full access for sarvodaya user
      return {
        students: students,
        payments: payments,
        sectionCollections: sectionCollections,
        classCollections: classCollections
      };
    }

    // Filter data for restricted users
    const filteredStudents = students.filter(s => {
      const classNum = parseInt(s.class);
      return classNum >= classRange.min && classNum <= classRange.max;
    });

    const filteredPayments = payments.filter(p => {
      const classNum = parseInt(p.class);
      return classNum >= classRange.min && classNum <= classRange.max;
    });

    const filteredSectionCollections = sectionCollections.filter(c => 
      classRange.sections.includes(c.section)
    );

    const filteredClassCollections = classCollections.filter(c => {
      const classNum = parseInt(c.class);
      return classNum >= classRange.min && classNum <= classRange.max;
    });

    return {
      students: filteredStudents,
      payments: filteredPayments,
      sectionCollections: filteredSectionCollections,
      classCollections: filteredClassCollections
    };
  };

  const filteredData = getFilteredDataForUser();
  const classRange = getClassRangeForUser(user?.role || '', user?.username || '');

  // Save collections to localStorage
  const saveSectionCollections = (newCollections: SectionCollectionEntry[]) => {
    setSectionCollections(newCollections);
    localStorage.setItem('sectionCollections', JSON.stringify(newCollections));
  };

  const saveClassCollections = (newCollections: ClassCollectionEntry[]) => {
    setClassCollections(newCollections);
    localStorage.setItem('classCollections', JSON.stringify(newCollections));
  };

  // Generate ID
  const generateId = () => {
    return 'col_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  // Get section configuration
  const getSectionConfig = () => {
    const config = {
      LP: { name: 'Lower Primary', classes: [1, 2, 3, 4], head: 'LP Section Head' },
      UP: { name: 'Upper Primary', classes: [5, 6, 7], head: 'UP Section Head' },
      HS: { name: 'High School', classes: [8, 9, 10], head: 'HS Section Head' },
      HSS: { name: 'Higher Secondary', classes: [11, 12], head: 'HSS Section Head' }
    };

    // Filter sections based on user access
    if (classRange) {
      const filteredConfig: any = {};
      classRange.sections.forEach(section => {
        filteredConfig[section] = config[section as keyof typeof config];
      });
      return filteredConfig;
    }

    return config;
  };

  // Get available classes for user
  const getAvailableClasses = () => {
    if (!classRange) {
      return Array.from({ length: 12 }, (_, i) => i + 1);
    }
    return Array.from({ length: classRange.max - classRange.min + 1 }, (_, i) => classRange.min + i);
  };

  // Calculate actual collections by section
  const getActualSectionCollections = () => {
    const sectionConfig = getSectionConfig();
    const sectionCollections: Record<string, number> = {};
    
    Object.entries(sectionConfig).forEach(([sectionKey, config]) => {
      sectionCollections[sectionKey] = 0;
      
      filteredData.payments.forEach(payment => {
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
    const availableSections = Object.keys(getSectionConfig());
    
    availableSections.forEach(section => {
      reportedCollections[section] = filteredData.sectionCollections
        .filter(c => c.section === section)
        .reduce((sum, c) => sum + c.amount, 0);
    });
    
    return reportedCollections;
  };

  // Calculate actual collections by class
  const getActualClassCollections = () => {
    const classCollections: Record<string, number> = {};
    
    filteredData.payments.forEach(payment => {
      const classKey = `${payment.class}-${payment.division}`;
      classCollections[classKey] = (classCollections[classKey] || 0) + payment.totalAmount;
    });
    
    return classCollections;
  };

  // Calculate reported collections by class
  const getReportedClassCollections = () => {
    const reportedCollections: Record<string, number> = {};
    
    filteredData.classCollections.forEach(collection => {
      const classKey = `${collection.class}-${collection.division}`;
      reportedCollections[classKey] = (reportedCollections[classKey] || 0) + collection.amount;
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

  // Get class balance data
  const getClassBalanceData = () => {
    const actualCollections = getActualClassCollections();
    const reportedCollections = getReportedClassCollections();
    const availableClasses = getAvailableClasses();
    const balanceData: any[] = [];
    
    availableClasses.forEach(classNum => {
      ['A', 'B', 'C', 'D', 'E'].forEach(division => {
        const classKey = `${classNum}-${division}`;
        const actual = actualCollections[classKey] || 0;
        const reported = reportedCollections[classKey] || 0;
        
        // Only show classes that have some activity
        if (actual > 0 || reported > 0) {
          balanceData.push({
            class: classNum.toString(),
            division: division,
            actual: actual,
            reported: reported,
            balance: actual - reported
          });
        }
      });
    });
    
    return balanceData.sort((a, b) => {
      const classA = parseInt(a.class);
      const classB = parseInt(b.class);
      if (classA !== classB) return classA - classB;
      return a.division.localeCompare(b.division);
    });
  };

  // Handle section form submission
  const handleSectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sectionFormData.section || !sectionFormData.sectionHead || sectionFormData.amount <= 0) {
      alert('Please fill all required fields');
      return;
    }

    const newCollection: SectionCollectionEntry = {
      id: editingCollection && 'section' in editingCollection ? editingCollection.id : generateId(),
      section: sectionFormData.section,
      sectionHead: sectionFormData.sectionHead,
      collectionDate: sectionFormData.collectionDate,
      amount: sectionFormData.amount,
      remarks: sectionFormData.remarks,
      addedBy: user?.username || 'admin',
      createdAt: editingCollection ? editingCollection.createdAt : new Date().toISOString()
    };

    if (editingCollection && 'section' in editingCollection) {
      const updatedCollections = sectionCollections.map(c => 
        c.id === editingCollection.id ? newCollection : c
      );
      saveSectionCollections(updatedCollections);
    } else {
      saveSectionCollections([newCollection, ...sectionCollections]);
    }

    resetForms();
  };

  // Handle class form submission
  const handleClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!classFormData.class || !classFormData.division || !classFormData.teacher || classFormData.amount <= 0) {
      alert('Please fill all required fields');
      return;
    }

    const newCollection: ClassCollectionEntry = {
      id: editingCollection && 'class' in editingCollection ? editingCollection.id : generateId(),
      class: classFormData.class,
      division: classFormData.division,
      teacher: classFormData.teacher,
      collectionDate: classFormData.collectionDate,
      amount: classFormData.amount,
      remarks: classFormData.remarks,
      addedBy: user?.username || 'admin',
      createdAt: editingCollection ? editingCollection.createdAt : new Date().toISOString()
    };

    if (editingCollection && 'class' in editingCollection) {
      const updatedCollections = classCollections.map(c => 
        c.id === editingCollection.id ? newCollection : c
      );
      saveClassCollections(updatedCollections);
    } else {
      saveClassCollections([newCollection, ...classCollections]);
    }

    resetForms();
  };

  // Reset forms and close modal
  const resetForms = () => {
    setSectionFormData({
      section: '' as 'LP' | 'UP' | 'HS' | 'HSS' | '',
      sectionHead: '',
      collectionDate: new Date().toISOString().split('T')[0],
      amount: 0,
      remarks: ''
    });
    setClassFormData({
      class: '',
      division: '',
      teacher: '',
      collectionDate: new Date().toISOString().split('T')[0],
      amount: 0,
      remarks: ''
    });
    setShowAddModal(false);
    setEditingCollection(null);
  };

  // Handle delete
  const handleDelete = (id: string, type: 'section' | 'class') => {
    if (confirm('Are you sure you want to delete this collection entry?')) {
      if (type === 'section') {
        const updatedCollections = sectionCollections.filter(c => c.id !== id);
        saveSectionCollections(updatedCollections);
      } else {
        const updatedCollections = classCollections.filter(c => c.id !== id);
        saveClassCollections(updatedCollections);
      }
    }
  };

  // Download CSV functions
  const downloadSectionCollectionsCSV = () => {
    const headers = ['Section', 'Section Head', 'Collection Date', 'Amount', 'Remarks', 'Added By'];
    const csvData = filteredData.sectionCollections.map(collection => [
      collection.section,
      collection.sectionHead,
      new Date(collection.collectionDate).toLocaleDateString('en-GB'),
      collection.amount.toString(),
      collection.remarks || '',
      collection.addedBy
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `section_collections_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadClassCollectionsCSV = () => {
    const headers = ['Class', 'Division', 'Teacher', 'Collection Date', 'Amount', 'Remarks', 'Added By'];
    const csvData = filteredData.classCollections.map(collection => [
      collection.class,
      collection.division,
      collection.teacher,
      new Date(collection.collectionDate).toLocaleDateString('en-GB'),
      collection.amount.toString(),
      collection.remarks || '',
      collection.addedBy
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `class_collections_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSectionBalanceCSV = () => {
    const balanceData = getSectionBalanceData();
    const headers = ['Section', 'Section Name', 'Classes', 'Actual Collection', 'Reported Collection', 'Balance', 'Status'];
    const csvData = balanceData.map(item => [
      item.section,
      item.name,
      item.classes,
      item.actual.toString(),
      item.reported.toString(),
      Math.abs(item.balance).toString(),
      item.balance > 0 ? 'Pending' : item.balance < 0 ? 'Excess' : 'Balanced'
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `section_balance_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadClassBalanceCSV = () => {
    const balanceData = getClassBalanceData();
    const headers = ['Class', 'Division', 'Actual Collection', 'Reported Collection', 'Balance', 'Status'];
    const csvData = balanceData.map(item => [
      item.class,
      item.division,
      item.actual.toString(),
      item.reported.toString(),
      Math.abs(item.balance).toString(),
      item.balance > 0 ? 'Pending' : item.balance < 0 ? 'Excess' : 'Balanced'
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `class_balance_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter collections based on search and filters
  const getFilteredCollections = () => {
    if (activeTab === 'section') {
      return filteredData.sectionCollections.filter(collection => {
        const matchesSearch = collection.sectionHead.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             collection.section.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = !dateFilter || collection.collectionDate === dateFilter;
        const matchesSection = !sectionFilter || collection.section === sectionFilter;
        
        return matchesSearch && matchesDate && matchesSection;
      });
    } else {
      return filteredData.classCollections.filter(collection => {
        const matchesSearch = collection.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             `${collection.class}-${collection.division}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = !dateFilter || collection.collectionDate === dateFilter;
        const matchesClass = !classFilter || collection.class === classFilter;
        
        return matchesSearch && matchesDate && matchesClass;
      });
    }
  };

  // Calculate totals
  const filteredCollections = getFilteredCollections();
  const totalReported = filteredCollections.reduce((sum: number, c: any) => sum + c.amount, 0);
  const todayCollections = (activeTab === 'section' ? filteredData.sectionCollections : filteredData.classCollections)
    .filter((c: any) => c.collectionDate === new Date().toISOString().split('T')[0]);
  const todayTotal = todayCollections.reduce((sum: number, c: any) => sum + c.amount, 0);

  const getPageTitle = () => {
    if (user?.role === 'admin') return 'Collection Entry Management';
    if (user?.role === 'clerk') return 'Collection Entry Management';
    
    switch (user?.username) {
      case 'lp': return 'LP Section Collection Entry (Classes 1-4)';
      case 'up': return 'UP Section Collection Entry (Classes 5-7)';
      case 'hs': return 'HS Section Collection Entry (Classes 8-10)';
      case 'hss': return 'HSS Section Collection Entry (Classes 11-12)';
      default: return 'Section-wise Collection Management';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
          <p className="text-gray-600">
            {classRange 
              ? `Manage collections for classes ${classRange.min}-${classRange.max}`
              : 'Track section and class-wise collections with balance reporting'
            }
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Add Collection</span>
        </button>
      </div>

      {/* Tab Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-6 mb-4">
          <button
            onClick={() => setActiveTab('section')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'section'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Section-wise Entry</span>
          </button>
          <button
            onClick={() => setActiveTab('class')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'class'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Class-wise Entry</span>
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          {activeTab === 'section' 
            ? 'Track collections by sections (LP, UP, HS, HSS)'
            : 'Track collections by individual classes and divisions'
          }
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Entries</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeTab === 'section' ? filteredData.sectionCollections.length : filteredData.classCollections.length}
              </p>
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

      {/* Balance Report */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {activeTab === 'section' ? 'Section-wise' : 'Class-wise'} Collection Balance
          </h2>
          <button
            onClick={activeTab === 'section' ? downloadSectionBalanceCSV : downloadClassBalanceCSV}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            <span>Download Balance CSV</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {activeTab === 'section' ? 'Section' : 'Class'}
                </th>
                {activeTab === 'section' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Classes
                  </th>
                )}
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
              {activeTab === 'section' ? (
                getSectionBalanceData().map((item, index) => (
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
                ))
              ) : (
                getClassBalanceData().map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Class {item.class}-{item.division}</div>
                      </div>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">Collection Filters</h2>
          <button
            onClick={activeTab === 'section' ? downloadSectionCollectionsCSV : downloadClassCollectionsCSV}
            className="ml-auto flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            <span>Download CSV</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === 'section' ? "Search by section or head..." : "Search by teacher or class..."}
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
          {activeTab === 'section' ? (
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Sections</option>
              {Object.keys(getSectionConfig()).map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          ) : (
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Classes</option>
              {getAvailableClasses().map(cls => (
                <option key={cls} value={cls.toString()}>Class {cls}</option>
              ))}
            </select>
          )}
          <div className="text-sm text-gray-600 flex items-center">
            Showing: {filteredCollections.length} entries
          </div>
        </div>
      </div>

      {/* Collections Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {activeTab === 'section' ? 'Section' : 'Class'} Collection Entries
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {activeTab === 'section' ? 'Section & Head' : 'Class & Teacher'}
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
              {filteredCollections.map((collection: any) => {
                if (activeTab === 'section') {
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
                              setSectionFormData({
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
                            onClick={() => handleDelete(collection.id, 'section')}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Collection"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                } else {
                  return (
                    <tr key={collection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Class {collection.class}-{collection.division}
                          </div>
                          <div className="text-sm text-gray-500">
                            {collection.teacher}
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
                              setClassFormData({
                                class: collection.class,
                                division: collection.division,
                                teacher: collection.teacher,
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
                            onClick={() => handleDelete(collection.id, 'class')}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Collection"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
        
        {filteredCollections.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No collections found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || dateFilter ? 'No collections match your search criteria.' : 'Get started by adding a collection entry.'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Collection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCollection ? 'Edit Collection' : 'Add Collection'}
              </h2>
              <button onClick={resetForms} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>

            {/* Tab Selection in Modal */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setActiveTab('section')}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                  activeTab === 'section'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Section-wise
              </button>
              <button
                onClick={() => setActiveTab('class')}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                  activeTab === 'class'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Class-wise
              </button>
            </div>

            {/* Section Form */}
            {activeTab === 'section' && (
              <form onSubmit={handleSectionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section
                  </label>
                  <select
                    value={sectionFormData.section}
                    onChange={(e) => {
                      const section = e.target.value as 'LP' | 'UP' | 'HS' | 'HSS';
                      const sectionConfig = getSectionConfig();
                      setSectionFormData(prev => ({
                        ...prev,
                        section: section,
                        sectionHead: section ? sectionConfig[section]?.head || '' : ''
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Section</option>
                    {Object.entries(getSectionConfig()).map(([key, config]) => (
                      <option key={key} value={key}>
                        {key} - {config.name} (Classes {config.classes.join(', ')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Head Name
                  </label>
                  <input
                    type="text"
                    value={sectionFormData.sectionHead}
                    onChange={(e) => setSectionFormData(prev => ({ ...prev, sectionHead: e.target.value }))}
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
                    value={sectionFormData.collectionDate}
                    onChange={(e) => setSectionFormData(prev => ({ ...prev, collectionDate: e.target.value }))}
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
                      value={sectionFormData.amount}
                      onChange={(e) => setSectionFormData(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
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
                    value={sectionFormData.remarks}
                    onChange={(e) => setSectionFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Any additional notes..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForms}
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
            )}

            {/* Class Form */}
            {activeTab === 'class' && (
              <form onSubmit={handleClassSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class
                    </label>
                    <select
                      value={classFormData.class}
                      onChange={(e) => {
                        setClassFormData(prev => ({ 
                          ...prev, 
                          class: e.target.value,
                          teacher: e.target.value && classFormData.division 
                            ? `Class ${e.target.value}${classFormData.division} Teacher`
                            : ''
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Class</option>
                      {getAvailableClasses().map(cls => (
                        <option key={cls} value={cls.toString()}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Division
                    </label>
                    <select
                      value={classFormData.division}
                      onChange={(e) => {
                        setClassFormData(prev => ({ 
                          ...prev, 
                          division: e.target.value,
                          teacher: classFormData.class && e.target.value 
                            ? `Class ${classFormData.class}${e.target.value} Teacher`
                            : ''
                        }));
                      }}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Teacher
                  </label>
                  <input
                    type="text"
                    value={classFormData.teacher}
                    onChange={(e) => setClassFormData(prev => ({ ...prev, teacher: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter teacher name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collection Date
                  </label>
                  <input
                    type="date"
                    value={classFormData.collectionDate}
                    onChange={(e) => setClassFormData(prev => ({ ...prev, collectionDate: e.target.value }))}
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
                      value={classFormData.amount}
                      onChange={(e) => setClassFormData(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
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
                    value={classFormData.remarks}
                    onChange={(e) => setClassFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Any additional notes..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForms}
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SarvodayaCollection;