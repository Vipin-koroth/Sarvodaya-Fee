import React, { useState } from 'react';
import { TrendingUp, AlertCircle, CheckCircle, Users, Calendar, Eye, X } from 'lucide-react';
import { useData, SectionCollection } from '../../contexts/DataContext';

const SectionCollectionView: React.FC = () => {
  const { sectionCollections, getSectionCollectionSummary, payments } = useData();
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const sections = [
    { code: 'lp', name: 'LP (Classes 1-4)', classes: [1, 2, 3, 4] },
    { code: 'up', name: 'UP (Classes 5-7)', classes: [5, 6, 7] },
    { code: 'hs', name: 'HS (Classes 8-10)', classes: [8, 9, 10] },
    { code: 'hss', name: 'HSS (Classes 11-12)', classes: [11, 12] }
  ];

  const getSectionSummaries = () => {
    return sections.map(section => ({
      ...section,
      summary: getSectionCollectionSummary(section.code),
      collections: sectionCollections.filter(sc => sc.sectionHead === section.code)
    }));
  };

  const sectionSummaries = getSectionSummaries();
  const totalExpected = sectionSummaries.reduce((sum, s) => sum + s.summary.totalExpected, 0);
  const totalCollected = sectionSummaries.reduce((sum, s) => sum + s.summary.totalCollected, 0);
  const totalBalance = sectionSummaries.reduce((sum, s) => sum + s.summary.balance, 0);
  const totalExcess = sectionSummaries.reduce((sum, s) => sum + s.summary.excess, 0);

  const SectionDetailsModal: React.FC<{ sectionCode: string; onClose: () => void }> = ({ sectionCode, onClose }) => {
    const section = sections.find(s => s.code === sectionCode);
    if (!section) return null;

    const sectionCollectionRecords = sectionCollections
      .filter(sc => sc.sectionHead === sectionCode)
      .sort((a, b) => new Date(b.collectionDate).getTime() - new Date(a.collectionDate).getTime());

    const classWisePayments = section.classes.map(classNum => {
      const classPayments = payments.filter(p => parseInt(p.class) === classNum);
      return {
        class: classNum,
        payments: classPayments.length,
        amount: classPayments.reduce((sum, p) => sum + p.totalAmount, 0)
      };
    });

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">{section.name} Collection Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Class-wise Breakdown */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Class-wise Payment Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {classWisePayments.map(item => (
                <div key={item.class} className="bg-blue-50 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-900">Class {item.class}</div>
                    <div className="text-sm text-blue-700">{item.payments} payments</div>
                    <div className="text-xl font-semibold text-blue-600 mt-2">₹{item.amount.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Collection Records */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Collection Records ({sectionCollectionRecords.length})</h3>
            {sectionCollectionRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount Collected
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remarks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Added By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sectionCollectionRecords.map((collection) => (
                      <tr key={collection.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(collection.collectionDate).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-semibold text-green-600">
                            ₹{collection.collectedAmount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {collection.remarks || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {collection.addedBy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No collections recorded</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This section head hasn't recorded any collections yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Section Head Collections</h1>
        <p className="text-gray-600">View amounts collected by section heads from class teachers</p>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Expected</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalExpected.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Total Collected</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalCollected.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className={`${totalBalance > 0 ? 'bg-red-50' : 'bg-gray-50'} rounded-lg p-4`}>
          <div className="flex items-center">
            <AlertCircle className={`h-8 w-8 ${totalBalance > 0 ? 'text-red-600' : 'text-gray-600'}`} />
            <div className="ml-4">
              <p className={`text-sm font-medium ${totalBalance > 0 ? 'text-red-600' : 'text-gray-600'}`}>Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className={`${totalExcess > 0 ? 'bg-purple-50' : 'bg-gray-50'} rounded-lg p-4`}>
          <div className="flex items-center">
            <Users className={`h-8 w-8 ${totalExcess > 0 ? 'text-purple-600' : 'text-gray-600'}`} />
            <div className="ml-4">
              <p className={`text-sm font-medium ${totalExcess > 0 ? 'text-purple-600' : 'text-gray-600'}`}>Total Excess</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalExcess.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section-wise Summary */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Section-wise Collection Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Section
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collected Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance Due
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Excess Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collections
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sectionSummaries.map((section) => (
                <tr key={section.code} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{section.name}</div>
                      <div className="text-sm text-gray-500">Classes {section.classes.join(', ')}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-blue-600">
                      ₹{section.summary.totalExpected.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-green-600">
                      ₹{section.summary.totalCollected.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${section.summary.balance > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      ₹{section.summary.balance.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${section.summary.excess > 0 ? 'text-purple-600' : 'text-gray-500'}`}>
                      ₹{section.summary.excess.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {section.collections.length} records
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedSection(section.code)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section Details Modal */}
      {selectedSection && (
        <SectionDetailsModal
          sectionCode={selectedSection}
          onClose={() => setSelectedSection(null)}
        />
      )}
    </div>
  );
};

export default SectionCollectionView;