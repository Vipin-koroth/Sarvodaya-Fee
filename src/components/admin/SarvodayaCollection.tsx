import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Download, Calendar, Users, TrendingUp, FileText } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

// Define global section collections structure
const globalSectionCollections = [
  { id: 'LP', name: 'LP (Classes 1-4)', classes: [1, 2, 3, 4] },
  { id: 'UP', name: 'UP (Classes 5-7)', classes: [5, 6, 7] },
  { id: 'HS', name: 'HS (Classes 8-10)', classes: [8, 9, 10] },
  { id: 'HSS', name: 'HSS (Classes 11-12)', classes: [11, 12] }
];

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
  amount: number;
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
    amount: 0,
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
    
    // Save to global section collections storage
    const existingEntries = JSON.parse(localStorage.getItem('globalSectionCollections') || '{}');
    existingEntries[selectedSection] = (existingEntries[selectedSection] || 0) + sectionAmount;
    localStorage.setItem('globalSectionCollections', JSON.stringify(existingEntries));

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
    
    const newCollection: ClassCollection = {
      id: editingClassId || generateId(),
      class: classFormData.class,
      division: classFormData.division,
      teacherName: classFormData.teacherName,
      amount: classFormData.amount,
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
      amount: 0,
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
      amount: collection.amount,
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
      classReported[key] = (classReported[key] || 0) + (c.amount || 0);
    });

    return { sectionReported, classReported };
  };

  // Calculate section-wise totals for detailed tracking
  const getSectionTotals = () => {
    const sections = ['LP', 'UP', 'HS', 'HSS'];
    return sections.map(section => {
      const sectionCollections = globalSectionCollections.filter(c => c.section === section);
      const receivedFromSectionHead = sectionCollections.reduce((sum, c) => sum + (c.amount || 0), 0);
      
      // Get class range for section
      let classRange: number[] = [];
      
      // Get received amount from section head entries
      const sectionEntries = JSON.parse(localStorage.getItem('globalSectionCollections') || '{}');
      const receivedFromHead = sectionEntries[section.name] || 0;
      switch (section) {
        case 'LP': classRange = [1, 2, 3, 4]; break;
        case 'UP': classRange = [5, 6, 7]; break;
        case 'HS': classRange = [8, 9, 10]; break;
        case 'HSS': classRange = [11, 12]; break;
      }
      
      // Calculate actual collected from payments
      const actualCollected = payments
        .filter(p => classRange.includes(parseInt(p.class)))
        .reduce((sum, p) => sum + (p.totalAmount || 0), 0);
      
      const remainingBalance = actualCollected - receivedFromSectionHead;
      
      return {
        section,
        actualCollected,
        receivedFromHead,
        remainingBalance: actualCollected - receivedFromHead,
        classRange: classRange.join(', ')
      };
    });
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
    const headers = ['Class', 'Division', 'Teacher Name', 'Amount', 'Date', 'Added By'];
    const csvData = getFilteredClassCollections().map(c => [
      c.class,
      c.division,
      c.teacherName,
      c.amount || 0,
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

  return (
    <div className="space-y-6">
      {/* Component content will be added here */}
      <div>SarvodayaCollection Component</div>
    </div>
  );
}

export default SarvodayaCollection;