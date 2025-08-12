import React, { useState } from 'react';
import { Plus, TrendingUp, AlertCircle, CheckCircle, Calendar, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

const SectionHeadCollection: React.FC = () => {
  const { user } = useAuth();
  const { addSectionCollection, getSectionCollectionSummary, sectionCollections, payments } = useData();
  const [collectedAmount, setCollectedAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Get section info
  const getSectionInfo = () => {
    if (!user || user.role !== 'sarvodaya') return null;
    
    switch (user.username) {
      case 'lp':
        return { name: 'LP (Classes 1-4)', code: 'lp', classes: [1, 2, 3, 4] };
      case 'up':
        return { name: 'UP (Classes 5-7)', code: 'up', classes: [5, 6, 7] };
      case 'hs':
        return { name: 'HS (Classes 8-10)', code: 'hs', classes: [8, 9, 10] };
      case 'hss':
        return { name: 'HSS (Classes 11-12)', code: 'hss', classes: [11, 12] };
      default:
        return null;
    }
  };

  const sectionInfo = getSectionInfo();
  if (!sectionInfo) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Access restricted to section heads only</p>
      </div>
    );
  }

  const summary = getSectionCollectionSummary(sectionInfo.code);
  
  // Get recent collections for this section
  const recentCollections = sectionCollections
    .filter(sc => sc.sectionHead === sectionInfo.code)
    .sort((a, b) => new Date(b.collectionDate).getTime() - new Date(a.collectionDate).getTime())
    .slice(0, 10);

  // Get class-wise collection breakdown
  const getClassWiseBreakdown = () => {
    return sectionInfo.classes.map(classNum => {
      const classPayments = payments.filter(p => parseInt(p.class) === classNum);
      const totalAmount = classPayments.reduce((sum, p) => sum + p.totalAmount, 0);
      const paymentCount = classPayments.length;
      
      return {
        class: classNum,
        totalAmount,
        paymentCount
      };
    });
  };

  const classBreakdown = getClassWiseBreakdown();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(collectedAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await addSectionCollection({
        sectionHead: sectionInfo.code,
        collectedAmount: amount,
        addedBy: user?.username || '',
        remarks: remarks.trim()
      });
      
      setCollectedAmount('');
      setRemarks('');
      setSuccess('Collection amount recorded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      alert('Failed to record collection: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{sectionInfo.name} Collection</h1>
        <p className="text-gray-600">Record amounts collected from class teachers</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Expected Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{summary.totalExpected.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Collected Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{summary.totalCollected.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className={`${summary.balance > 0 ? 'bg-red-50' : 'bg-gray-50'} rounded-lg p-4`}>
          <div className="flex items-center">
            <AlertCircle className={`h-8 w-8 ${summary.balance > 0 ? 'text-red-600' : 'text-gray-600'}`} />
            <div className="ml-4">
              <p className={`text-sm font-medium ${summary.balance > 0 ? 'text-red-600' : 'text-gray-600'}`}>Balance Due</p>
              <p className="text-2xl font-bold text-gray-900">₹{summary.balance.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className={`${summary.excess > 0 ? 'bg-purple-50' : 'bg-gray-50'} rounded-lg p-4`}>
          <div className="flex items-center">
            <Plus className={`h-8 w-8 ${summary.excess > 0 ? 'text-purple-600' : 'text-gray-600'}`} />
            <div className="ml-4">
              <p className={`text-sm font-medium ${summary.excess > 0 ? 'text-purple-600' : 'text-gray-600'}`}>Excess Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{summary.excess.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Class-wise Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Class-wise Collection Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {classBreakdown.map(item => (
            <div key={item.class} className="bg-gray-50 rounded-lg p-4">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">Class {item.class}</div>
                <div className="text-sm text-gray-600">{item.paymentCount} payments</div>
                <div className="text-xl font-semibold text-green-600 mt-2">₹{item.totalAmount.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Collection Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Plus className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Record Collection</h2>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collected Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={collectedAmount}
                  onChange={(e) => setCollectedAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter amount collected"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks (Optional)
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add any remarks"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Recording...' : 'Record Collection'}
          </button>
        </form>
      </div>

      {/* Recent Collections */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Collections</h3>
        {recentCollections.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
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
                {recentCollections.map((collection) => (
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
              Start by recording your first collection from class teachers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SectionHeadCollection;