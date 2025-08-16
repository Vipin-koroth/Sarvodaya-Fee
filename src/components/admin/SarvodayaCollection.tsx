import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Download, Calendar, Users, TrendingUp, FileText } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

interface SectionCollection {
  id: string;
  section: string;
  headName: string;
  amount: number;
  date: string;
  addedBy: string;
}

interface ClassCollection {
  id: string;
  class: string;
  division: string;
  teacherName: string;
  busFee: number;
  developmentFee: number;
  othersFee: number;
  totalAmount: number;
  date: string;
  addedBy: string;
}

const SarvodayaCollection: React.FC = () => {
  const { payments } = useData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'section' | 'class'>('section');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  
  // Section Collections State
  const [sectionCollections, setSectionCollections] = useState<SectionCollection[]>(() => {
    const saved = localStorage.getItem('globalSectionCollections');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Class Collections State
  const [classCollections, setClassCollections] = useState<ClassCollection[]>(() => {
    const saved = localStorage.getItem('globalClassCollections');
    return saved ? JSON.parse(saved) : [];
  });

  // Form states
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showClassForm, setShowClassForm] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  // Section form data
  const [sectionFormData, setSectionFormData] = useState({
    section: '',
    headName: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  });

  // Class form data
  const [classFormData, setClassFormData] = useState({
    class: '',
    division: '',
    teacherName: '',
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

  // Filter data based on user's class range
  const getFilteredPayments = () => {
    const classRange = getClassRangeForUser();
    if (!classRange) return payments; // Full access for sarvodaya
    
    return payments.filter(payment => {
      const classNum = parseInt(payment.class);
      return classNum >= classRange.min && classNum <= classRange.max;
    });
  };

  // Generate ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Section form handlers
  const handleSectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newCollection: SectionCollection = {
      id: editingSectionId || generateId(),
      section: sectionFormData.section,
      headName: sectionFormData.headName,
      amount: sectionFormData.amount,
      date: sectionFormData.date,
      addedBy: user?.username || ''
    };

    let updatedCollections;
    if (editingSectionId) {
      updatedCollections = sectionCollections.map(c => 
        c.id === editingSectionId ? newCollection : c
      );
    } else {
      updatedCollections = [...sectionCollections, newCollection];
    }

    setSectionCollections(updatedCollections);
    localStorage.setItem('globalSectionCollections', JSON.stringify(updatedCollections));
    
    // Reset form
    setSectionFormData({
      section: '',
      headName: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0]
    });
    setShowSectionForm(false);
    setEditingSectionId(null);
  };

  // Class form handlers
  const handleClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalAmount = classFormData.busFee + classFormData.developmentFee + classFormData.othersFee;
    
    const newCollection: ClassCollection = {
      id: editingClassId || generateId(),
      class: classFormData.class,
      division: classFormData.division,
      teacherName: classFormData.teacherName,
      busFee: classFormData.busFee,
      developmentFee: classFormData.developmentFee,
      othersFee: classFormData.othersFee,
      totalAmount: totalAmount,
      date: classFormData.date,
      addedBy: user?.username || ''
    };

    let updatedCollections;
    if (editingClassId) {
      updatedCollections = classCollections.map(c => 
        c.id === editingClassId ? newCollection : c
      );
    } else {
      updatedCollections = [...classCollections, newCollection];
    }

    setClassCollections(updatedCollections);
    localStorage.setItem('globalClassCollections', JSON.stringify(updatedCollections));
    
    // Reset form
    setClassFormData({
      class: '',
      division: '',
      teacherName: '',
      busFee: 0,
      developmentFee: 0,
      othersFee: 0,
      date: new Date().toISOString().split('T')[0]
    });
    setShowClassForm(false);
    setEditingClassId(null);
  };

  // Auto-populate teacher name based on class selection
  const handleClassChange = (classValue: string) => {
    setClassFormData(prev => ({
      ...prev,
      class: classValue,
      teacherName: classValue && prev.division ? `class${classValue}${prev.division.toLowerCase()}` : ''
    }));
  };

  const handleDivisionChange = (division: string) => {
    setClassFormData(prev => ({
      ...prev,
      division,
      teacherName: prev.class && division ? `class${prev.class}${division.toLowerCase()}` : ''
    }));
  };

  // Delete handlers
  const deleteSectionCollection = (id: string) => {
    if (confirm('Are you sure you want to delete this section collection?')) {
      const updated = sectionCollections.filter(c => c.id !== id);
      setSectionCollections(updated);
      localStorage.setItem('globalSectionCollections', JSON.stringify(updated));
    }
  };

  const deleteClassCollection = (id: string) => {
    if (confirm('Are you sure you want to delete this class collection?')) {
      const updated = classCollections.filter(c => c.id !== id);
      setClassCollections(updated);
      localStorage.setItem('globalClassCollections', JSON.stringify(updated));
    }
  };

  // Edit handlers
  const editSectionCollection = (collection: SectionCollection) => {
    setSectionFormData({
      section: collection.section,
      headName: collection.headName,
      amount: collection.amount,
      date: collection.date
    });
    setEditingSectionId(collection.id);
    setShowSectionForm(true);
  };

  const editClassCollection = (collection: ClassCollection) => {
    setClassFormData({
      class: collection.class,
      division: collection.division,
      teacherName: collection.teacherName,
      busFee: collection.busFee,
      developmentFee: collection.developmentFee,
      othersFee: collection.othersFee,
      date: collection.date
    });
    setEditingClassId(collection.id);
    setShowClassForm(true);
  };

  // Filter collections based on search and date
  const getFilteredSectionCollections = () => {
    return sectionCollections.filter(collection => {
      const matchesSearch = collection.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           collection.headName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = !filterDate || collection.date === filterDate;
      return matchesSearch && matchesDate;
    });
  };

  const getFilteredClassCollections = () => {
    const classRange = getClassRangeForUser();
    let filtered = classCollections;

    // Filter by class range if user has restrictions
    if (classRange) {
      filtered = filtered.filter(collection => {
        const classNum = parseInt(collection.class);
        return classNum >= classRange.min && classNum <= classRange.max;
      });
    }

    // Apply search and date filters
    return filtered.filter(collection => {
      const matchesSearch = collection.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           `${collection.class}${collection.division}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = !filterDate || collection.date === filterDate;
      return matchesSearch && matchesDate;
    });
  };

  // Calculate actual collections from payments
  const calculateActualCollections = () => {
    const filteredPayments = getFilteredPayments();
    
    // Section-wise actual collections
    const sectionActuals = {
      'LP': filteredPayments.filter(p => [1,2,3,4].includes(parseInt(p.class))).reduce((sum, p) => sum + (p.totalAmount || 0), 0),
      'UP': filteredPayments.filter(p => [5,6,7].includes(parseInt(p.class))).reduce((sum, p) => sum + (p.totalAmount || 0), 0),
      'HS': filteredPayments.filter(p => [8,9,10].includes(parseInt(p.class))).reduce((sum, p) => sum + (p.totalAmount || 0), 0),
      'HSS': filteredPayments.filter(p => [11,12].includes(parseInt(p.class))).reduce((sum, p) => sum + (p.totalAmount || 0), 0)
    };

    // Class-wise actual collections
    const classActuals: Record<string, number> = {};
    for (let classNum = 1; classNum <= 12; classNum++) {
      for (let division of ['A', 'B', 'C', 'D', 'E']) {
        const key = `${classNum}${division}`;
        classActuals[key] = filteredPayments
          .filter(p => p.class === classNum.toString() && p.division === division)
          .reduce((sum, p) => sum + (p.totalAmount || 0), 0);
      }
    }

    return { sectionActuals, classActuals };
  };

  // Calculate reported collections
  const calculateReportedCollections = () => {
    const sectionReported = {
      'LP': sectionCollections.filter(c => c.section === 'LP').reduce((sum, c) => sum + (c.amount || 0), 0),
      'UP': sectionCollections.filter(c => c.section === 'UP').reduce((sum, c) => sum + (c.amount || 0), 0),
      'HS': sectionCollections.filter(c => c.section === 'HS').reduce((sum, c) => sum + (c.amount || 0), 0),
      'HSS': sectionCollections.filter(c => c.section === 'HSS').reduce((sum, c) => sum + (c.amount || 0), 0)
    };

    const classReported: Record<string, number> = {};
    classCollections.forEach(c => {
      const key = `${c.class}${c.division}`;
      classReported[key] = (classReported[key] || 0) + (c.totalAmount || 0);
    });

    return { sectionReported, classReported };
  };

  // CSV Download functions
  const downloadSectionCollectionsCSV = () => {
    const headers = ['Section', 'Head Name', 'Amount', 'Date', 'Added By'];
    const csvData = getFilteredSectionCollections().map(c => [
      c.section,
      c.headName,
      c.amount || 0,
      c.date,
      c.addedBy
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
    const headers = ['Class', 'Division', 'Teacher Name', 'Bus Fee', 'Development Fee', 'Others Fee', 'Total Amount', 'Date', 'Added By'];
    const csvData = getFilteredClassCollections().map(c => [
      c.class,
      c.division,
      c.teacherName,
      c.busFee || 0,
      c.developmentFee || 0,
      c.othersFee || 0,
      c.totalAmount || 0,
      c.date,
      c.addedBy
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
    const { sectionActuals } = calculateActualCollections();
    const { sectionReported } = calculateReportedCollections();
    
    const headers = ['Section', 'Actual Collection', 'Reported Collection', 'Difference', 'Status'];
    const csvData = Object.keys(sectionActuals).map(section => {
      const actual = sectionActuals[section as keyof typeof sectionActuals] || 0;
      const reported = sectionReported[section as keyof typeof sectionReported] || 0;
      const difference = actual - reported;
      const status = difference === 0 ? 'Balanced' : difference > 0 ? 'Pending' : 'Excess';
      
      return [section, actual, reported, Math.abs(difference), status];
    });
    
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
    const { classActuals } = calculateActualCollections();
    const { classReported } = calculateReportedCollections();
    
    const headers = ['Class', 'Division', 'Actual Collection', 'Reported Collection', 'Difference', 'Status'];
    const csvData = Object.keys(classActuals).map(classKey => {
      const actual = classActuals[classKey] || 0;
      const reported = classReported[classKey] || 0;
      const difference = actual - reported;
      const status = difference === 0 ? 'Balanced' : difference > 0 ? 'Pending' : 'Excess';
      
      const classNum = classKey.slice(0, -1);
      const division = classKey.slice(-1);
      
      return [classNum, division, actual, reported, Math.abs(difference), status];
    });
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `class_balance_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const { sectionActuals, classActuals } = calculateActualCollections();
  const { sectionReported, classReported } = calculateReportedCollections();

  const getPageTitle = () => {
    const classRange = getClassRangeForUser();
    if (classRange) {
      return `${classRange.name} Collection Entry`;
    }
    return 'Collection Entry';
  };

  // Check if user should only see class-wise entry
  const isClassOnlyUser = () => {
    return user?.role === 'sarvodaya' && ['lp', 'up', 'hs', 'hss'].includes(user?.username || '');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
        <p className="text-gray-600">
          {(() => {
            const classRange = getClassRangeForUser();
            return classRange 
              ? `Manage collection entries for ${classRange.name} section`
              : 'Manage section-wise and class-wise collection entries';
          })()}
        </p>
      </div>

      {/* Tab Navigation */}
      {!isClassOnlyUser() && (
        <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('section')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'section'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Section-wise Entry
            </button>
            <button
              onClick={() => setActiveTab('class')}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === 'class'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Class-wise Entry
            </button>
          </nav>
        </div>
      </div>
      )}

      {/* Section-wise Tab */}
      {!isClassOnlyUser() && activeTab === 'section' && (
        <div className="space-y-6">
          {/* Section Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Object.entries(sectionActuals).map(([section, actual]) => {
              const reported = sectionReported[section as keyof typeof sectionReported] || 0;
              const difference = actual - reported;
              const status = difference === 0 ? 'balanced' : difference > 0 ? 'pending' : 'excess';
              
              return (
                <div key={section} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{section}</h3>
                    <div className={`w-3 h-3 rounded-full ${
                      status === 'balanced' ? 'bg-green-500' : 
                      status === 'pending' ? 'bg-red-500' : 'bg-orange-500'
                    }`}></div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Actual:</span>
                      <span className="font-medium">₹{(actual || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reported:</span>
                      <span className="font-medium">₹{(reported || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="text-gray-600">Difference:</span>
                      <span className={`font-medium ${
                        status === 'balanced' ? 'text-green-600' : 
                        status === 'pending' ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        ₹{Math.abs(difference || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section Controls */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Section Collections</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={downloadSectionCollectionsCSV}
                  className="flex items-center space-x-2 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Collections CSV</span>
                </button>
                <button
                  onClick={downloadSectionBalanceCSV}
                  className="flex items-center space-x-2 px-3 py-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Balance CSV</span>
                </button>
                <button
                  onClick={() => setShowSectionForm(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Section Entry</span>
                </button>
              </div>
            </div>

            {/* Section Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by section or head name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-sm text-gray-600 flex items-center">
                Total: {getFilteredSectionCollections().length} entries
              </div>
            </div>

            {/* Section Collections Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Head Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
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
                  {getFilteredSectionCollections().map((collection) => (
                    <tr key={collection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {collection.section}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {collection.headName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-green-600">
                          ₹{(collection.amount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(collection.date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {collection.addedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => editSectionCollection(collection)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteSectionCollection(collection.id)}
                            className="text-red-600 hover:text-red-900"
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

            {getFilteredSectionCollections().length === 0 && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No section collections found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding a section collection entry.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Class-wise Tab */}
      {(isClassOnlyUser() || activeTab === 'class') && (
        <div className="space-y-6">
          {/* Class Summary Cards for restricted users */}
          {isClassOnlyUser() && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(() => {
                const classRange = getClassRangeForUser();
                if (!classRange) return null;
                
                const classCards = [];
                for (let classNum = classRange.min; classNum <= classRange.max; classNum++) {
                  for (let division of ['A', 'B', 'C', 'D', 'E']) {
                    const classKey = `${classNum}${division}`;
                    const actualAmount = classActuals[classKey] || 0;
                    const reportedAmount = classReported[classKey] || 0;
                    const pendingAmount = actualAmount - reportedAmount;
                    
                    // Get class-specific payments and collections
                    const classPayments = getFilteredPayments().filter(p => 
                      p.class === classNum.toString() && p.division === division
                    );
                    const classCollectionsForClass = classCollections.filter(c => 
                      c.class === classNum.toString() && c.division === division
                    );
                    
                     // Calculate totals by fee type
                     const receivedBusFee = classPayments.reduce((sum, p) => sum + (p.busFee || 0), 0);
                     const receivedDevFee = classPayments.reduce((sum, p) => sum + (p.developmentFee || 0), 0);
                     const receivedOthersFee = classPayments.reduce((sum, p) => sum + (p.specialFee || 0), 0);
                     const totalReceived = receivedBusFee + receivedDevFee + receivedOthersFee;
                     
                     const reportedBusFee = classCollectionsForClass.reduce((sum, c) => sum + (c.busFee || 0), 0);
                     const reportedDevFee = classCollectionsForClass.reduce((sum, c) => sum + (c.developmentFee || 0), 0);
                     const reportedOthersFee = classCollectionsForClass.reduce((sum, c) => sum + (c.othersFee || 0), 0);
                     const totalReported = reportedBusFee + reportedDevFee + reportedOthersFee;
                     
                     const pendingBusFee = receivedBusFee - reportedBusFee;
                     const pendingDevFee = receivedDevFee - reportedDevFee;
                     const pendingOthersFee = receivedOthersFee - reportedOthersFee;
                    
                    // Only show classes that have actual collections or reported collections
                    if (actualAmount > 0 || reportedAmount > 0) {
                      classCards.push(
                        <div key={classKey} className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">Class {classNum}-{division}</h3>
                            <div className={`w-3 h-3 rounded-full ${
                              pendingAmount === 0 ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                          </div>
                         <div className="space-y-3 text-sm">
                           {/* Bus Fee */}
                           <div className="bg-blue-50 p-2 rounded">
                             <div className="font-medium text-blue-800 mb-1">Bus Fee</div>
                             <div className="flex justify-between text-xs">
                               <span>Received: ₹{receivedBusFee.toLocaleString()}</span>
                               <span>Reported: ₹{reportedBusFee.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between text-xs font-medium">
                               <span>Pending:</span>
                               <span className={pendingBusFee === 0 ? 'text-green-600' : 'text-red-600'}>
                                 ₹{Math.abs(pendingBusFee).toLocaleString()}
                               </span>
                             </div>
                           </div>
                           
                           {/* Development Fee */}
                           <div className="bg-purple-50 p-2 rounded">
                             <div className="font-medium text-purple-800 mb-1">Development Fee</div>
                             <div className="flex justify-between text-xs">
                               <span>Received: ₹{receivedDevFee.toLocaleString()}</span>
                               <span>Reported: ₹{reportedDevFee.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between text-xs font-medium">
                               <span>Pending:</span>
                               <span className={pendingDevFee === 0 ? 'text-green-600' : 'text-red-600'}>
                                 ₹{Math.abs(pendingDevFee).toLocaleString()}
                               </span>
                             </div>
                           </div>
                           
                           {/* Others Fee */}
                           <div className="bg-orange-50 p-2 rounded">
                             <div className="font-medium text-orange-800 mb-1">Others Fee</div>
                             <div className="flex justify-between text-xs">
                               <span>Received: ₹{receivedOthersFee.toLocaleString()}</span>
                               <span>Reported: ₹{reportedOthersFee.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between text-xs font-medium">
                               <span>Pending:</span>
                               <span className={pendingOthersFee === 0 ? 'text-green-600' : 'text-red-600'}>
                                 ₹{Math.abs(pendingOthersFee).toLocaleString()}
                               </span>
                             </div>
                           </div>
                           
                           {/* Total Summary */}
                           <div className="border-t pt-2">
                             <div className="flex justify-between font-medium">
                               <span>Total Pending:</span>
                               <span className={pendingAmount === 0 ? 'text-green-600' : 'text-red-600'}>
                                 ₹{Math.abs(pendingAmount).toLocaleString()}
                               </span>
                             </div>
                           </div>
                         </div>
                        </div>
                      );
                    }
                  }
                }
                return classCards;
              })()}
            </div>
          )}

          {/* Class Controls */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Class Collections</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={downloadClassCollectionsCSV}
                  className="flex items-center space-x-2 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Collections CSV</span>
                </button>
                <button
                  onClick={downloadClassBalanceCSV}
                  className="flex items-center space-x-2 px-3 py-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Balance CSV</span>
                </button>
                <button
                  onClick={() => setShowClassForm(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Class Entry</span>
                </button>
              </div>
            </div>

            {/* Class Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by teacher or class..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-sm text-gray-600 flex items-center">
                Total: {getFilteredClassCollections().length} entries
              </div>
            </div>

            {/* Class Collections Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher Name
                    </th>
                    {isClassOnlyUser() && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Received
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pending Amount
                        </th>
                      </>
                    )}
                    {isClassOnlyUser() && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bus Fee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Development Fee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Others Fee
                        </th>
                      </>
                    )}
                    {!isClassOnlyUser() && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bus Fee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Development Fee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Others Fee
                        </th>
                      </>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
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
                  {getFilteredClassCollections().map((collection) => (
                    <tr key={collection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          {collection.class}-{collection.division}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {collection.teacherName}
                      </td>
                      {isClassOnlyUser() && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-blue-600">
                              ₹{(classActuals[`${collection.class}${collection.division}`] || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${
                              Math.max(0, (classActuals[`${collection.class}${collection.division}`] || 0) - (classReported[`${collection.class}${collection.division}`] || 0)) === 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              ₹{Math.max(0, (classActuals[`${collection.class}${collection.division}`] || 0) - (classReported[`${collection.class}${collection.division}`] || 0)).toLocaleString()}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-blue-600">
                          ₹{(collection.busFee || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-purple-600">
                          ₹{(collection.developmentFee || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-orange-600">
                          ₹{(collection.othersFee || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-green-600">
                          ₹{(collection.totalAmount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(collection.date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {collection.addedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => editClassCollection(collection)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteClassCollection(collection.id)}
                            className="text-red-600 hover:text-red-900"
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

            {getFilteredClassCollections().length === 0 && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No class collections found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding a class collection entry.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section Form Modal */}
      {!isClassOnlyUser() && showSectionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingSectionId ? 'Edit Section Collection' : 'Add Section Collection'}
            </h3>
            <form onSubmit={handleSectionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section
                </label>
                <select
                  value={sectionFormData.section}
                  onChange={(e) => setSectionFormData(prev => ({ ...prev, section: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Section</option>
                  {(() => {
                    // If user is a section head, only show their section
                    if (user?.role === 'sarvodaya' && ['lp', 'up', 'hs', 'hss'].includes(user?.username || '')) {
                      const sectionMap = {
                        'lp': 'LP',
                        'up': 'UP', 
                        'hs': 'HS',
                        'hss': 'HSS'
                      };
                      const userSection = sectionMap[user.username as keyof typeof sectionMap];
                      return <option value={userSection}>{userSection} (Your Section)</option>;
                    }
                    // For admin, clerk, sarvodaya - show all sections
                    return (
                      <>
                        <option value="LP">LP (Classes 1-4)</option>
                        <option value="UP">UP (Classes 5-7)</option>
                        <option value="HS">HS (Classes 8-10)</option>
                        <option value="HSS">HSS (Classes 11-12)</option>
                      </>
                    );
                  })()}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Head Name
                </label>
                <input
                  type="text"
                  value={sectionFormData.headName}
                  onChange={(e) => setSectionFormData(prev => ({ ...prev, headName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={sectionFormData.amount}
                  onChange={(e) => setSectionFormData(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={sectionFormData.date}
                  onChange={(e) => setSectionFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSectionForm(false);
                    setEditingSectionId(null);
                    setSectionFormData({
                      section: '',
                      headName: '',
                      amount: 0,
                      date: new Date().toISOString().split('T')[0]
                    });
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingSectionId ? 'Update' : 'Add'} Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Form Modal */}
      {showClassForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingClassId ? 'Edit Class Collection' : 'Add Class Collection'}
            </h3>
            <form onSubmit={handleClassSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class
                  </label>
                  <select
                    value={classFormData.class}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Class</option>
                    {(() => {
                      const classRange = getClassRangeForUser();
                      if (classRange) {
                        const classes = [];
                        for (let i = classRange.min; i <= classRange.max; i++) {
                          classes.push(i);
                        }
                        return classes.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ));
                      } else {
                        return Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ));
                      }
                    })()}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Division
                  </label>
                  <select
                    value={classFormData.division}
                    onChange={(e) => handleDivisionChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  Teacher Name
                </label>
                <input
                  type="text"
                  value={classFormData.teacherName}
                  onChange={(e) => setClassFormData(prev => ({ ...prev, teacherName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bus Fee (₹)
                </label>
                <input
                  type="number"
                  value={classFormData.busFee}
                  onChange={(e) => setClassFormData(prev => ({ ...prev, busFee: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Development Fee (₹)
                </label>
                <input
                  type="number"
                  value={classFormData.developmentFee}
                  onChange={(e) => setClassFormData(prev => ({ ...prev, developmentFee: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Others Fee (₹)
                </label>
                <input
                  type="number"
                  value={classFormData.othersFee}
                  onChange={(e) => setClassFormData(prev => ({ ...prev, othersFee: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={classFormData.date}
                  onChange={(e) => setClassFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              {/* Total Amount Display */}
              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-900">Total Amount:</span>
                  <span className="text-lg font-bold text-green-600">
                    ₹{(classFormData.busFee + classFormData.developmentFee + classFormData.othersFee).toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowClassForm(false);
                    setEditingClassId(null);
                    setClassFormData({
                      class: '',
                      division: '',
                      teacherName: '',
                      busFee: 0,
                      developmentFee: 0,
                      othersFee: 0,
                      date: new Date().toISOString().split('T')[0]
                    });
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={(classFormData.busFee + classFormData.developmentFee + classFormData.othersFee) <= 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingClassId ? 'Update' : 'Add'} Collection
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