import React, { useState, useEffect } from 'react';
import { Plus, Users, TrendingUp, Calendar, FileText, Edit, Trash2, Save, X, Receipt, DollarSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

interface TeacherCollectionEntry {
  id: string;
  teacherUsername: string;
  class: string;
  division: string;
  feeType: 'bus_fee' | 'development_fund' | 'others';
  amount: number;
  date: string;
  addedBy: string;
  description?: string;
  created_at: string;
}

interface SectionCollectionEntry {
  id: string;
  sectionHead: string;
  fromTeacher: string;
  feeType: 'bus_fee' | 'development_fund' | 'others';
  amount: number;
  date: string;
  addedBy: string;
  description?: string;
  created_at: string;
}

interface ClerkCollectionEntry {
  id: string;
  fromSectionHead: string;
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
  const [activeView, setActiveView] = useState<'overview' | 'teacher-entry' | 'section-entry' | 'clerk-entry'>('overview');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  
  // Collection entries state
  const [teacherCollections, setTeacherCollections] = useState<TeacherCollectionEntry[]>([]);
  const [sectionCollections, setSectionCollections] = useState<SectionCollectionEntry[]>([]);
  const [clerkCollections, setClerkCollections] = useState<ClerkCollectionEntry[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    target: '', // teacher/section head to collect from
    feeType: 'development_fund' as 'bus_fee' | 'development_fund' | 'others',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Helper function to check user type
  const isSectionUser = () => {
    return user?.role === 'sarvodaya' && ['lp', 'up', 'hs', 'hss'].includes(user?.username || '');
  };

  const isClerkUser = () => {
    return user?.role === 'admin' || user?.role === 'clerk' || user?.username === 'sarvodaya';
  };

  // Load collection entries from localStorage
  useEffect(() => {
    const savedTeacherCollections = localStorage.getItem('teacherCollectionEntries');
    const savedSectionCollections = localStorage.getItem('sectionCollectionEntries');
    const savedClerkCollections = localStorage.getItem('clerkCollectionEntries');
    
    if (savedTeacherCollections) {
      setTeacherCollections(JSON.parse(savedTeacherCollections));
    }
    if (savedSectionCollections) {
      setSectionCollections(JSON.parse(savedSectionCollections));
    }
    if (savedClerkCollections) {
      setClerkCollections(JSON.parse(savedClerkCollections));
    }
  }, []);

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

  // Get available section heads for clerk users
  const getAvailableSectionHeads = () => {
    return [
      { value: 'lp', label: 'LP (Classes 1-4)' },
      { value: 'up', label: 'UP (Classes 5-7)' },
      { value: 'hs', label: 'HS (Classes 8-10)' },
      { value: 'hss', label: 'HSS (Classes 11-12)' }
    ];
  };

  // Calculate teacher collections from student payments
  const getTeacherCollectionsFromPayments = () => {
    const teacherTotals: Record<string, { busFee: number; developmentFund: number; others: number; total: number }> = {};
    
    payments.forEach(payment => {
      const teacherKey = `class${payment.class}${payment.division.toLowerCase()}`;
      
      if (!teacherTotals[teacherKey]) {
        teacherTotals[teacherKey] = { busFee: 0, developmentFund: 0, others: 0, total: 0 };
      }
      
      teacherTotals[teacherKey].busFee += payment.busFee;
      teacherTotals[teacherKey].developmentFund += payment.developmentFee;
      teacherTotals[teacherKey].others += payment.specialFee;
      teacherTotals[teacherKey].total += payment.totalAmount;
    });
    
    return teacherTotals;
  };

  // Calculate section collections from teacher entries

  // Calculate clerk collections from section entries
  const getClerkCollectionsFromEntries = () => {
    const clerkTotals = { busFee: 0, developmentFund: 0, others: 0, total: 0, entries: clerkCollections.length };

    clerkCollections.forEach(entry => {
      clerkTotals[entry.feeType === 'bus_fee' ? 'busFee' : 
                  entry.feeType === 'development_fund' ? 'developmentFund' : 'others'] += entry.amount;
      clerkTotals.total += entry.amount;
    });

    return clerkTotals;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.target || formData.amount <= 0) {
      alert('Please fill all required fields');
      return;
    }

    const baseEntry = {
      id: editingEntry?.id || Date.now().toString(),
      feeType: formData.feeType,
      amount: formData.amount,
      date: formData.date,
      addedBy: user?.username || '',
      description: formData.description,
      created_at: editingEntry?.created_at || new Date().toISOString()
    };

    if (isSectionUser()) {
      // Section user adding teacher collection
      const newEntry: SectionCollectionEntry = {
        ...baseEntry,
        sectionHead: user?.username || '',
        fromTeacher: formData.target
      };

      let updatedEntries;
      if (editingEntry) {
        updatedEntries = sectionCollections.map(entry => 
          entry.id === editingEntry.id ? newEntry : entry
        );
      } else {
        updatedEntries = [...sectionCollections, newEntry];
      }

      localStorage.setItem('sectionCollectionEntries', JSON.stringify(updatedEntries));
      setSectionCollections(updatedEntries);
    } else if (isClerkUser()) {
      // Clerk user adding section collection
      const newEntry: ClerkCollectionEntry = {
        ...baseEntry,
        fromSectionHead: formData.target
      };

      let updatedEntries;
      if (editingEntry) {
        updatedEntries = clerkCollections.map(entry => 
          entry.id === editingEntry.id ? newEntry : entry
        );
      } else {
        updatedEntries = [...clerkCollections, newEntry];
      }

      localStorage.setItem('clerkCollectionEntries', JSON.stringify(updatedEntries));
      setClerkCollections(updatedEntries);
    }

    resetForm();
    setShowAddModal(false);
    setEditingEntry(null);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      target: '',
      feeType: 'development_fund',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
  };

  // Handle edit
  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setFormData({
      target: isSectionUser() ? entry.fromTeacher : entry.fromSectionHead,
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
      if (isSectionUser()) {
        const updatedEntries = sectionCollections.filter(entry => entry.id !== entryId);
        localStorage.setItem('sectionCollectionEntries', JSON.stringify(updatedEntries));
        setSectionCollections(updatedEntries);
      } else if (isClerkUser()) {
        const updatedEntries = clerkCollections.filter(entry => entry.id !== entryId);
        localStorage.setItem('clerkCollectionEntries', JSON.stringify(updatedEntries));
        setClerkCollections(updatedEntries);
      }
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

  // Calculate totals from student payments by teacher
  const getTeacherTotalsFromPayments = () => {
    const teacherTotals: Record<string, { busFee: number; developmentFund: number; others: number; total: number }> = {};
    
    payments.forEach(payment => {
      const teacherKey = `class${payment.class}${payment.division.toLowerCase()}`;
      
      if (!teacherTotals[teacherKey]) {
        teacherTotals[teacherKey] = { busFee: 0, developmentFund: 0, others: 0, total: 0 };
      }
      
      teacherTotals[teacherKey].busFee += payment.busFee;
      teacherTotals[teacherKey].developmentFund += payment.developmentFee;
      teacherTotals[teacherKey].others += payment.specialFee;
      teacherTotals[teacherKey].total += payment.totalAmount;
    });
    
    return teacherTotals;
  };

  // Calculate section totals from student payments
  const getSectionTotalsFromPayments = () => {
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

  // Calculate section collections from entries
  const getSectionCollectionsFromEntries = () => {
    const sectionTotals = {
      lp: { busFee: 0, developmentFund: 0, others: 0, total: 0, entries: 0 },
      up: { busFee: 0, developmentFund: 0, others: 0, total: 0, entries: 0 },
      hs: { busFee: 0, developmentFund: 0, others: 0, total: 0, entries: 0 },
      hss: { busFee: 0, developmentFund: 0, others: 0, total: 0, entries: 0 }
    };

    sectionCollections.forEach(entry => {
      const section = entry.sectionHead as 'lp' | 'up' | 'hs' | 'hss';
      if (sectionTotals[section]) {
        sectionTotals[section][entry.feeType === 'bus_fee' ? 'busFee' : 
                              entry.feeType === 'development_fund' ? 'developmentFund' : 'others'] += entry.amount;
        sectionTotals[section].total += entry.amount;
        sectionTotals[section].entries += 1;
      }
    });

    return sectionTotals;
  };

  // Overview Component
  const OverviewComponent: React.FC = () => {
    const teacherTotals = getTeacherTotalsFromPayments();
    const sectionTotalsFromPayments = getSectionTotalsFromPayments();
    const sectionCollectionsFromEntries = getSectionCollectionsFromEntries();
    const clerkCollectionsFromEntries = getClerkCollectionsFromEntries();

    return (
      <div className="space-y-6">

        {/* Section-wise Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Section-wise Collection Overview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(['lp', 'up', 'hs', 'hss'] as const).map((section) => {
              const fromPayments = sectionTotalsFromPayments[section];
              const fromEntries = sectionCollectionsFromEntries[section];
              
              return (
                <div key={section} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">{getSectionDisplay(section)}</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="bg-blue-100 rounded p-2">
                      <div className="font-medium text-blue-900 mb-1">From Students</div>
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-medium">₹{fromPayments?.total.toLocaleString() || '0'}</span>
                      </div>
                    </div>
                    
                    <div className="bg-green-100 rounded p-2">
                      <div className="font-medium text-green-900 mb-1">From Teachers</div>
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-medium">₹{fromEntries?.total.toLocaleString() || '0'}</span>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-100 rounded p-2">
                      <div className="font-medium text-yellow-900 mb-1">Balance Due</div>
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className={`font-bold ${
                          (fromPayments?.total || 0) - (fromEntries?.total || 0) === 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          ₹{Math.abs((fromPayments?.total || 0) - (fromEntries?.total || 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Teacher Entry Component (for section users)
  const TeacherEntryComponent: React.FC = () => {
    const availableTeachers = getAvailableClassTeachers();
    const teacherTotalsFromPayments = getTeacherTotalsFromPayments();
    
    // Filter section collections for current user
    const userSectionCollections = sectionCollections.filter(entry => entry.sectionHead === user?.username);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Teacher Collection Entries - {getSectionDisplay(user?.username || '')}
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Teacher Collection</span>
          </button>
        </div>

        {/* Teacher Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableTeachers.map(teacher => {
            const fromPayments = teacherTotalsFromPayments[teacher.value] || { busFee: 0, developmentFund: 0, others: 0, total: 0 };
            const teacherEntries = userSectionCollections.filter(entry => entry.fromTeacher === teacher.value);
            const totalEntered = teacherEntries.reduce((sum, entry) => sum + entry.amount, 0);
            
            return (
              <div key={teacher.value} className="bg-white border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">{teacher.label}</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">From Students:</span>
                    <span className="font-medium">₹{fromPayments.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entered to Section:</span>
                    <span className="font-medium text-green-600">₹{totalEntered.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Balance Due:</span>
                    <span className={`font-bold ${
                      fromPayments.total - totalEntered === 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₹{Math.abs(fromPayments.total - totalEntered).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Entries: {teacherEntries.length}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Collection Entries Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Collection Entries from Teachers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userSectionCollections
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(entry.date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                          {entry.fromTeacher ? entry.fromTeacher.replace('class', 'Class ').replace(/(\d+)([a-z])/, '$1-$2').toUpperCase() : 'Unknown Teacher'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          entry.feeType === 'bus_fee' ? 'bg-orange-100 text-orange-800' :
                          entry.feeType === 'development_fund' ? 'bg-blue-100 text-blue-800' :
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
          
          {userSectionCollections.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No collection entries</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by adding collections received from class teachers.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Clerk Entry Component (for admin/clerk/sarvodaya users)
  const ClerkEntryComponent: React.FC = () => {
    const sectionTotalsFromPayments = getSectionTotalsFromPayments();
    const sectionCollectionsFromEntries = getSectionCollectionsFromEntries();

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Section Head Collection Entries</h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Section Collection</span>
          </button>
        </div>

        {/* Section Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['lp', 'up', 'hs', 'hss'] as const).map((section) => {
            const fromEntries = sectionCollectionsFromEntries[section];
            const sectionClerkEntries = clerkCollections.filter(entry => entry.fromSectionHead === section);
            const totalToClerk = sectionClerkEntries.reduce((sum, entry) => sum + entry.amount, 0);
            
            return (
              <div key={section} className="bg-white border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">{getSectionDisplay(section)}</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">From Teachers:</span>
                    <span className="font-medium">₹{fromEntries.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">To Clerk:</span>
                    <span className="font-medium text-green-600">₹{totalToClerk.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Balance Due:</span>
                    <span className={`font-bold ${
                      fromEntries.total - totalToClerk === 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ₹{Math.abs(fromEntries.total - totalToClerk).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Entries: {sectionClerkEntries.length}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Collection Entries Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Collection Entries from Section Heads</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From Section Head</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clerkCollections
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(entry.date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          entry.fromSectionHead === 'lp' ? 'bg-blue-100 text-blue-800' :
                          entry.fromSectionHead === 'up' ? 'bg-green-100 text-green-800' :
                          entry.fromSectionHead === 'hs' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {getSectionDisplay(entry.fromSectionHead)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          entry.feeType === 'bus_fee' ? 'bg-orange-100 text-orange-800' :
                          entry.feeType === 'development_fund' ? 'bg-blue-100 text-blue-800' :
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
          
          {clerkCollections.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No collection entries</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by adding collections received from section heads.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Check access permissions
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
            {isSectionUser() 
              ? `${getSectionDisplay(user?.username || '')} Collection Management`
              : 'Collection Management System'
            }
          </h1>
          <p className="text-gray-600">
            3-Tier Collection System: Students → Teachers → Section Heads → Admin/Clerk
          </p>
        </div>
      </div>

      {/* Collection System Overview */}

      {/* View Toggle */}
      <div className="bg-white rounded-lg shadow p-6">
        {!isSectionUser() && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setActiveView('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              System Overview
            </button>
            
            {isClerkUser() && (
              <button
                onClick={() => setActiveView('clerk-entry')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === 'clerk-entry'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Section Collections
              </button>
            )}
          </div>
        )}
        
        {isSectionUser() && (
          <TeacherEntryComponent />
        )}
        
        {!isSectionUser() && (
          <>
            {/* Render active view */}
            {activeView === 'overview' && <OverviewComponent />}
            {activeView === 'clerk-entry' && isClerkUser() && <ClerkEntryComponent />}
          </>
        )}
      </div>

      {/* Add/Edit Collection Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingEntry ? 'Edit Collection Entry' : 
                 isSectionUser() ? 'Add Teacher Collection' : 'Add Section Collection'}
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
                    value={formData.target}
                    onChange={(e) => setFormData(prev => ({ ...prev, target: e.target.value }))}
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
                    value={formData.target}
                    onChange={(e) => setFormData(prev => ({ ...prev, target: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Section Head</option>
                    {getAvailableSectionHeads().map(section => (
                      <option key={section.value} value={section.value}>
                        {section.label}
                      </option>
                    ))}
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