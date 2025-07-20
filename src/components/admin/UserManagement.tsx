import React, { useState } from 'react';
import { Users, Key, Shield, UserCheck, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const UserManagement: React.FC = () => {
  const { getAllUsers, resetUserPassword } = useAuth();
  const [selectedUser, setSelectedUser] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const users = getAllUsers();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedUser || !newPassword) {
      setError('Please select a user and enter a new password');
      return;
    }

    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters long');
      return;
    }

    setLoading(true);
    const result = await resetUserPassword(selectedUser, newPassword);
    
    if (result) {
      setSuccess(`Password reset successfully for ${selectedUser}`);
      setNewPassword('');
      setSelectedUser('');
    } else {
      setError('Failed to reset password');
    }
    
    setLoading(false);
  };

  const getUserDisplayName = (user: any) => {
    if (user.role === 'admin') {
      return 'Administrator';
    }
    return `Class ${user.class}-${user.division} Teacher`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Reset passwords for system users</p>
      </div>

      {/* Password Reset Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Key className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Reset User Password</h2>
            <p className="text-sm text-gray-600">Select a user and set a new password</p>
          </div>
        </div>

        {success && (
          <div className="flex items-center space-x-2 p-4 mb-6 text-green-700 bg-green-50 border border-green-200 rounded-lg">
            <Shield className="h-5 w-5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select User
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Choose a user...</option>
              {users.map((user) => (
                <option key={user.username} value={user.username}>
                  {user.username} - {getUserDisplayName(user)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Resetting...</span>
              </>
            ) : (
              <>
                <Key className="h-4 w-4" />
                <span>Reset Password</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">System Users</h2>
            <p className="text-sm text-gray-600">All registered users in the system</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <div key={user.username} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  user.role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'
                }`}>
                  {user.role === 'admin' ? (
                    <Shield className={`h-5 w-5 ${
                      user.role === 'admin' ? 'text-purple-600' : 'text-blue-600'
                    }`} />
                  ) : (
                    <UserCheck className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{user.username}</div>
                  <div className="text-sm text-gray-600">{getUserDisplayName(user)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">User Account Information</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div>• <strong>Admin Account:</strong> Full system access and user management</div>
            <div>• <strong>Teacher Accounts:</strong> Class-specific access (format: class[X][Y])</div>
            <div>• <strong>Default Password:</strong> "admin" for all new accounts</div>
            <div>• <strong>Password Reset:</strong> Only admin can reset other users' passwords</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;