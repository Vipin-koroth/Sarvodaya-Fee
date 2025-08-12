import React, { useState } from 'react';
import { Plus, Users, TrendingUp, AlertTriangle, CheckCircle, Clock, Eye, X } from 'lucide-react';
import { useData, TeacherCollection, SectionCollection } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

const SarvodayaCollection: React.FC = () => {
  const { user } = useAuth();
  const { 
    teacherCollections, 
    sectionCollections, 
    addTeacherCollection, 
    updateTeacherCollection,
    addSectionCollection,
    updateSectionCollection,
    getSectionCollectionSummary,
    payments 
  } = useData();
  
  const [activeTab, setActiveTab] = useState<'teacher-entry' | 'section-handover' | 'clerk-entry' | 'summary'>('teacher-entry');
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showClerkModal, setShowClerkModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<TeacherCollection | null>(null);
  const [selectedSection, setSelectedSection] = useState<SectionCollection | null>(null);

  // Get user's section based on role
  const getUserSection = () => {
    if (user?.role === 'admin' || user?.role === 'clerk') return null; // Full access
    if (user?.username === 'lp') return 'lp';
    if (user?.username === 'up') return 'up';
    if (user?.username === 'hs') return 'hs';
    if (user?.username === 'hss') return 'hss';
    return null;
  };

  const userSection = getUserSection();

  // Teacher Collection Entry Modal
  const TeacherCollectionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [formData, setFormData] = useState({
      teacherUsername: '',
      teacherName: '',
      class: '',
      division: '',
      collectedAmount: 0,
      remarks: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      await addTeacherCollection({
        ...formData,
        section: getClassSection(formData.class),
        collectionDate: new Date().toISOString(),
        paidToSection: false,
        paidToClerk: false
      });
      
      onClose();
    };

    const getClassSection = (classNum: string): 'lp' | 'up' | 'hs' | 'hss' => {
      const num = parseInt(classNum);
      if (num >= 1 && num <= 4) return 'lp';
      if (num >= 5 && num <= 7) return 'up';
      if (num >= 8 && num <= 10) return 'hs';
      if (num >= 11 && num <= 12) return 'hss';
      return 'lp';
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Teacher Collection Entry</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teacher Username
                </label>
                <input
                  type="text"
                  value={formData.teacherUsername}
                  onChange={(e) => setFormData(prev => ({ ...prev, teacherUsername: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., class1a"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teacher Name
                </label>
                <input
                  type="text"
                  value={formData.teacherName}
                  onChange={(e) => setFormData(prev => ({ ...prev, teacherName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class
                </label>
                <select
                  value={formData.class}
                  onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Class</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Division
                </label>
                <select
                  value={formData.division}
                  onChange={(e) => setFormData(prev => ({ ...prev, division: e.target.value }))}
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
                Collected Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={formData.collectedAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, collectedAmount: parseInt(e.target.value) || 0 }))}
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
                rows={2}
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Section:</strong> {formData.class ? getClassSection(formData.class).toUpperCase() : 'Select class first'}
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Collection
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Section Handover Modal
  const SectionHandoverModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
    const [remarks, setRemarks] = useState('');

    // Get unpaid teachers for current section
    const unpaidTeachers = teacherCollections.filter(tc => 
      (!userSection || tc.section === userSection) && 
      !tc.paidToSection && 
      tc.collectedAmount > 0
    );

    const totalAmount = unpaidTeachers
      .filter(tc => selectedTeachers.includes(tc.id))
      .reduce((sum, tc) => sum + tc.collectedAmount, 0);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Mark selected teachers as paid to section
      for (const teacherId of selectedTeachers) {
        await updateTeacherCollection(teacherId, {
          paidToSection: true,
          paidToSectionDate: new Date().toISOString(),
          paidToSectionBy: user?.username || ''
        });
      }

      // Create section collection record
      await addSectionCollection({
        section: userSection as 'lp' | 'up' | 'hs' | 'hss',
        sectionHead: user?.username || '',
        totalAmount,
        collectionDate: new Date().toISOString(),
        paidToClerk: false,
        teacherCollections: selectedTeachers,
        remarks
      });

      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Section Collection Handover</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">
                {userSection?.toUpperCase()} Section - Unpaid Teachers
              </h3>
              <p className="text-sm text-blue-800">
                Select teachers whose collections you want to handover to clerk
              </p>
            </div>

            <div className="space-y-3">
              {unpaidTeachers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No unpaid collections found</p>
              ) : (
                unpaidTeachers.map(teacher => (
                  <div key={teacher.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={selectedTeachers.includes(teacher.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTeachers(prev => [...prev, teacher.id]);
                        } else {
                          setSelectedTeachers(prev => prev.filter(id => id !== teacher.id));
                        }
                      }}
                      className="h-4 w-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {teacher.teacherName} ({teacher.teacherUsername})
                      </div>
                      <div className="text-sm text-gray-600">
                        Class {teacher.class}-{teacher.division} • ₹{teacher.collectedAmount}
                      </div>
                      <div className="text-xs text-gray-500">
                        Collected: {new Date(teacher.collectionDate).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedTeachers.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-green-900">Total Amount:</span>
                  <span className="text-xl font-bold text-green-600">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks (Optional)
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Any additional notes..."
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedTeachers.length === 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Handover to Clerk
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Clerk Entry Modal
  const ClerkEntryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [selectedSections, setSelectedSections] = useState<string[]>([]);
    const [remarks, setRemarks] = useState('');

    // Get unpaid section collections
    const unpaidSections = sectionCollections.filter(sc => !sc.paidToClerk);

    const totalAmount = unpaidSections
      .filter(sc => selectedSections.includes(sc.id))
      .reduce((sum, sc) => sum + sc.totalAmount, 0);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Mark selected sections as paid to clerk
      for (const sectionId of selectedSections) {
        await updateSectionCollection(sectionId, {
          paidToClerk: true,
          paidToClerkDate: new Date().toISOString()
        });
      }

      alert(`₹${totalAmount.toLocaleString()} received from ${selectedSections.length} sections`);
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Clerk Collection Entry</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-2">
                Section Collections Pending
              </h3>
              <p className="text-sm text-purple-800">
                Select section collections to mark as received
              </p>
            </div>

            <div className="space-y-3">
              {unpaidSections.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No pending section collections</p>
              ) : (
                unpaidSections.map(section => (
                  <div key={section.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={selectedSections.includes(section.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSections(prev => [...prev, section.id]);
                        } else {
                          setSelectedSections(prev => prev.filter(id => id !== section.id));
                        }
                      }}
                      className="h-4 w-4 text-purple-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {section.section.toUpperCase()} Section - {section.sectionHead}
                      </div>
                      <div className="text-sm text-gray-600">
                        ₹{section.totalAmount.toLocaleString()} • {section.teacherCollections.length} teachers
                      </div>
                      <div className="text-xs text-gray-500">
                        Date: {new Date(section.collectionDate).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedSections.length > 0 && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-purple-900">Total Amount:</span>
                  <span className="text-xl font-bold text-purple-600">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks (Optional)
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                placeholder="Any additional notes..."
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedSections.length === 0}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Mark as Received
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Summary Statistics
  const getSummaryStats = () => {
    const totalTeacherCollections = teacherCollections.reduce((sum, tc) => sum + tc.collectedAmount, 0);
    const totalPaidToSections = teacherCollections
      .filter(tc => tc.paidToSection)
      .reduce((sum, tc) => sum + tc.collectedAmount, 0);
    const totalSectionCollections = sectionCollections.reduce((sum, sc) => sum + sc.totalAmount, 0);
    const totalPaidToClerk = sectionCollections
      .filter(sc => sc.paidToClerk)
      .reduce((sum, sc) => sum + sc.totalAmount, 0);

    return {
      totalTeacherCollections,
      totalPaidToSections,
      totalSectionCollections,
      totalPaidToClerk,
      pendingFromTeachers: totalTeacherCollections - totalPaidToSections,
      pendingFromSections: totalSectionCollections - totalPaidToClerk
    };
  };

  const stats = getSummaryStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Collection Management</h1>
        <p className="text-gray-600">Track collections from teachers to sections to clerk</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'teacher-entry', label: 'Teacher Collections', icon: Users },
              { id: 'section-handover', label: 'Section Handover', icon: TrendingUp },
              { id: 'clerk-entry', label: 'Clerk Entry', icon: CheckCircle },
              { id: 'summary', label: 'Summary', icon: Eye }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Teacher Collections Tab */}
      {activeTab === 'teacher-entry' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Teacher Collections</h2>
            <button
              onClick={() => setShowTeacherModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Collection</span>
            </button>
          </div>

          {/* Teacher Collections List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teacherCollections
                    .filter(tc => !userSection || tc.section === userSection)
                    .map(collection => (
                    <tr key={collection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{collection.teacherName}</div>
                          <div className="text-sm text-gray-500">{collection.teacherUsername}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {collection.class}-{collection.division}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {collection.section.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        ₹{collection.collectedAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {collection.paidToSection ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid to Section
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(collection.collectionDate).toLocaleDateString('en-GB')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {teacherCollections.filter(tc => !userSection || tc.section === userSection).length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No collections found</h3>
                <p className="mt-1 text-sm text-gray-500">Start by adding teacher collections.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section Handover Tab */}
      {activeTab === 'section-handover' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Section Collection Handover</h2>
            {userSection && (
              <button
                onClick={() => setShowSectionModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Handover Collections</span>
              </button>
            )}
          </div>

          {/* Unpaid Teachers Alert */}
          {userSection && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    Teachers Not Paid to {userSection.toUpperCase()} Section
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    {teacherCollections
                      .filter(tc => tc.section === userSection && !tc.paidToSection && tc.collectedAmount > 0)
                      .map(tc => (
                        <div key={tc.id} className="flex justify-between items-center py-1">
                          <span>{tc.teacherName} ({tc.class}-{tc.division})</span>
                          <span className="font-semibold">₹{tc.collectedAmount}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section Collections List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Section Head
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teachers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sectionCollections
                    .filter(sc => !userSection || sc.section === userSection)
                    .map(section => (
                    <tr key={section.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {section.section.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {section.sectionHead}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {section.teacherCollections.length} teachers
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        ₹{section.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {section.paidToClerk ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid to Clerk
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(section.collectionDate).toLocaleDateString('en-GB')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Clerk Entry Tab */}
      {activeTab === 'clerk-entry' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Clerk Collection Entry</h2>
            {(user?.role === 'admin' || user?.role === 'clerk') && (
              <button
                onClick={() => setShowClerkModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Mark as Received</span>
              </button>
            )}
          </div>

          {/* Pending Collections Alert */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-purple-800">
                  Section Collections Pending with Clerk
                </h3>
                <div className="mt-2 text-sm text-purple-700">
                  {sectionCollections
                    .filter(sc => !sc.paidToClerk)
                    .map(sc => (
                      <div key={sc.id} className="flex justify-between items-center py-1">
                        <span>{sc.section.toUpperCase()} Section - {sc.sectionHead}</span>
                        <span className="font-semibold">₹{sc.totalAmount}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* All Collections Status */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">All Section Collections</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Collection Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clerk Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Received Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sectionCollections.map(section => (
                    <tr key={section.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {section.section.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        ₹{section.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(section.collectionDate).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {section.paidToClerk ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Received
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {section.paidToClerkDate ? new Date(section.paidToClerkDate).toLocaleDateString('en-GB') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Collection Summary</h2>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">Teacher Collections</p>
                  <p className="text-2xl font-bold text-gray-900">₹{stats.totalTeacherCollections.toLocaleString()}</p>
                  <p className="text-xs text-blue-600">Pending: ₹{stats.pendingFromTeachers.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-600">Section Collections</p>
                  <p className="text-2xl font-bold text-gray-900">₹{stats.totalSectionCollections.toLocaleString()}</p>
                  <p className="text-xs text-green-600">Pending: ₹{stats.pendingFromSections.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-600">Clerk Received</p>
                  <p className="text-2xl font-bold text-gray-900">₹{stats.totalPaidToClerk.toLocaleString()}</p>
                  <p className="text-xs text-purple-600">From sections</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section-wise Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Section-wise Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {['lp', 'up', 'hs', 'hss'].map(section => {
                const sectionTeachers = teacherCollections.filter(tc => tc.section === section);
                const sectionTotal = sectionTeachers.reduce((sum, tc) => sum + tc.collectedAmount, 0);
                const sectionPaid = sectionTeachers.filter(tc => tc.paidToSection).reduce((sum, tc) => sum + tc.collectedAmount, 0);
                const unpaidCount = sectionTeachers.filter(tc => !tc.paidToSection && tc.collectedAmount > 0).length;

                return (
                  <div key={section} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{section.toUpperCase()} Section</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-medium">₹{sectionTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Paid:</span>
                        <span className="font-medium text-green-600">₹{sectionPaid.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pending:</span>
                        <span className="font-medium text-red-600">₹{(sectionTotal - sectionPaid).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Unpaid Teachers:</span>
                        <span className="font-medium text-orange-600">{unpaidCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showTeacherModal && <TeacherCollectionModal onClose={() => setShowTeacherModal(false)} />}
      {showSectionModal && <SectionHandoverModal onClose={() => setShowSectionModal(false)} />}
      {showClerkModal && <ClerkEntryModal onClose={() => setShowClerkModal(false)} />}
    </div>
  );
};

export default SarvodayaCollection;