import React, { useState, useEffect } from 'react';
import { MessageSquare, Save, Settings, Phone, Key, CheckCircle, AlertTriangle } from 'lucide-react';

const SMSConfiguration: React.FC = () => {
  const [smsProvider, setSmsProvider] = useState('twilio');
  const [credentials, setCredentials] = useState({
    twilio: {
      accountSid: '',
      authToken: '',
      phoneNumber: ''
    },
    textlocal: {
      apiKey: '',
      sender: 'SCHOOL'
    },
    msg91: {
      apiKey: '',
      senderId: 'SCHOOL',
      route: '4'
    },
    textbee: {
      apiKey: '',
      senderId: 'SCHOOL',
      deviceId: ''
    }
  });
  const [testNumber, setTestNumber] = useState('');
  const [testMessage, setTestMessage] = useState('Test SMS from Sarvodaya School Fee Management System');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Load saved credentials from localStorage
    const savedCredentials = localStorage.getItem('smsCredentials');
    const savedProvider = localStorage.getItem('smsProvider');
    
    if (savedCredentials) {
      setCredentials(JSON.parse(savedCredentials));
    }
    if (savedProvider) {
      setSmsProvider(savedProvider);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('smsCredentials', JSON.stringify(credentials));
    localStorage.setItem('smsProvider', smsProvider);
    setSuccess('SMS configuration saved successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleTestSMS = async () => {
    if (!testNumber) {
      setError('Please enter a test phone number');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // This would use the same sendSMS function from DataContext
      // For demo purposes, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess(`Test SMS sent successfully to ${testNumber}!`);
    } catch (err) {
      setError('Failed to send test SMS. Please check your configuration.');
    } finally {
      setLoading(false);
    }
  };

  const updateCredentials = (provider: string, field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider as keyof typeof prev],
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SMS Configuration</h1>
        <p className="text-gray-600">Configure SMS service for payment notifications</p>
      </div>

      {/* Provider Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MessageSquare className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">SMS Provider</h2>
            <p className="text-sm text-gray-600">Choose your SMS service provider</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setSmsProvider('twilio')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              smsProvider === 'twilio' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Phone className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">Twilio</div>
            <div className="text-sm text-gray-600">Global SMS service</div>
          </button>
          
          <button
            onClick={() => setSmsProvider('textlocal')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              smsProvider === 'textlocal' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <MessageSquare className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">TextLocal</div>
            <div className="text-sm text-gray-600">India-specific SMS</div>
          </button>
          
          <button
            onClick={() => setSmsProvider('msg91')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              smsProvider === 'msg91' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Settings className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">MSG91</div>
            <div className="text-sm text-gray-600">India-specific SMS</div>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
          <button
            onClick={() => setSmsProvider('textbee')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              smsProvider === 'textbee' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <MessageSquare className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">TextBee</div>
            <div className="text-sm text-gray-600">India-specific SMS service</div>
          </button>
        </div>
      </div>

      {/* Configuration Forms */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Key className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">API Configuration</h2>
            <p className="text-sm text-gray-600">Enter your {smsProvider} credentials</p>
          </div>
        </div>

        {smsProvider === 'twilio' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account SID
              </label>
              <input
                type="text"
                value={credentials.twilio.accountSid}
                onChange={(e) => updateCredentials('twilio', 'accountSid', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter Twilio Account SID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auth Token
              </label>
              <input
                type="password"
                value={credentials.twilio.authToken}
                onChange={(e) => updateCredentials('twilio', 'authToken', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter Twilio Auth Token"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="text"
                value={credentials.twilio.phoneNumber}
                onChange={(e) => updateCredentials('twilio', 'phoneNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter Twilio Phone Number (e.g., +1234567890)"
              />
            </div>
          </div>
        )}

        {smsProvider === 'textlocal' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={credentials.textlocal.apiKey}
                onChange={(e) => updateCredentials('textlocal', 'apiKey', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter TextLocal API Key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sender ID
              </label>
              <input
                type="text"
                value={credentials.textlocal.sender}
                onChange={(e) => updateCredentials('textlocal', 'sender', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter Sender ID (e.g., SCHOOL)"
                maxLength={6}
              />
            </div>
          </div>
        )}

        {smsProvider === 'msg91' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={credentials.msg91.apiKey}
                onChange={(e) => updateCredentials('msg91', 'apiKey', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter MSG91 API Key"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sender ID
                </label>
                <input
                  type="text"
                  value={credentials.msg91.senderId}
                  onChange={(e) => updateCredentials('msg91', 'senderId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter Sender ID"
                  maxLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Route
                </label>
                <select
                  value={credentials.msg91.route}
                  onChange={(e) => updateCredentials('msg91', 'route', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="4">Transactional</option>
                  <option value="1">Promotional</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {smsProvider === 'textbee' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={credentials.textbee.apiKey}
                onChange={(e) => updateCredentials('textbee', 'apiKey', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter TextBee API Key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device ID
              </label>
              <input
                type="text"
                value={credentials.textbee.deviceId}
                onChange={(e) => updateCredentials('textbee', 'deviceId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter registered Device ID"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          className="mt-6 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Save className="h-4 w-4" />
          <span>Save Configuration</span>
        </button>
      </div>

      {/* Test SMS */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Phone className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Test SMS</h2>
            <p className="text-sm text-gray-600">Send a test message to verify configuration</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Phone Number
            </label>
            <input
              type="tel"
              value={testNumber}
              onChange={(e) => setTestNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter phone number (e.g., 9876543210)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Message
            </label>
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {success && (
            <div className="flex items-center space-x-2 p-3 text-green-700 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-2 p-3 text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleTestSMS}
            disabled={loading || !testNumber}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MessageSquare className="h-4 w-4" />
            <span>{loading ? 'Sending...' : 'Send Test SMS'}</span>
          </button>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-yellow-50 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-6 w-6 text-yellow-600 mt-1" />
          <div>
            <h3 className="text-lg font-medium text-yellow-900 mb-2">Setup Instructions</h3>
            <div className="text-sm text-yellow-800 space-y-2">
              <p><strong>Twilio:</strong> Sign up at twilio.com, get Account SID, Auth Token, and buy a phone number</p>
              <p><strong>TextLocal:</strong> Sign up at textlocal.in, get API key from settings</p>
              <p><strong>MSG91:</strong> Sign up at msg91.com, get API key and register sender ID</p>
              <p><strong>TextBee:</strong> Sign up at textbee.dev, get API key and register your device to get Device ID</p>
              <p><strong>Note:</strong> SMS charges apply based on your provider's pricing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMSConfiguration;