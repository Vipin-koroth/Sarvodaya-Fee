import React, { useState, useEffect } from 'react';
import { MessageCircle, Save, Settings, Phone, Key, CheckCircle, AlertTriangle } from 'lucide-react';

const WhatsAppConfiguration: React.FC = () => {
  const [whatsappProvider, setWhatsappProvider] = useState('twilio');
  const [credentials, setCredentials] = useState({
    twilio: {
      accountSid: '',
      authToken: '',
      phoneNumber: ''
    },
    business: {
      accessToken: '',
      phoneNumberId: ''
    },
    ultramsg: {
      token: '',
      instanceId: ''
    },
    callmebot: {
      apiKey: ''
    }
  });
  const [testNumber, setTestNumber] = useState('');
  const [testMessage, setTestMessage] = useState('Test WhatsApp from Sarvodaya School Fee Management System');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Load saved credentials from localStorage
    const savedCredentials = localStorage.getItem('whatsappCredentials');
    const savedProvider = localStorage.getItem('whatsappProvider');
    
    if (savedCredentials) {
      setCredentials(JSON.parse(savedCredentials));
    }
    if (savedProvider) {
      setWhatsappProvider(savedProvider);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('whatsappCredentials', JSON.stringify(credentials));
    localStorage.setItem('whatsappProvider', whatsappProvider);
    setSuccess('WhatsApp configuration saved successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleTestWhatsApp = async () => {
    if (!testNumber) {
      setError('Please enter a test phone number');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Simulate WhatsApp API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess(`Test WhatsApp sent successfully to ${testNumber}!`);
    } catch (err) {
      setError('Failed to send test WhatsApp. Please check your configuration.');
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
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp Configuration</h1>
        <p className="text-gray-600">Configure WhatsApp service for payment notifications</p>
      </div>

      {/* Provider Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <MessageCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">WhatsApp Provider</h2>
            <p className="text-sm text-gray-600">Choose your WhatsApp service provider</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setWhatsappProvider('twilio')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              whatsappProvider === 'twilio' 
                ? 'border-green-500 bg-green-50 text-green-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Phone className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">Twilio WhatsApp</div>
            <div className="text-sm text-gray-600">Global WhatsApp service</div>
          </button>
          
          <button
            onClick={() => setWhatsappProvider('whatsapp-business')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              whatsappProvider === 'whatsapp-business' 
                ? 'border-green-500 bg-green-50 text-green-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <MessageCircle className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">WhatsApp Business API</div>
            <div className="text-sm text-gray-600">Official WhatsApp API</div>
          </button>
          
          <button
            onClick={() => setWhatsappProvider('ultramsg')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              whatsappProvider === 'ultramsg' 
                ? 'border-green-500 bg-green-50 text-green-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Settings className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">UltraMsg</div>
            <div className="text-sm text-gray-600">WhatsApp gateway service</div>
          </button>
          
          <button
            onClick={() => setWhatsappProvider('callmebot')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              whatsappProvider === 'callmebot' 
                ? 'border-green-500 bg-green-50 text-green-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Phone className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">CallMeBot</div>
            <div className="text-sm text-gray-600">Simple WhatsApp API</div>
          </button>
        </div>
      </div>

      {/* Configuration Forms */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Key className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">API Configuration</h2>
            <p className="text-sm text-gray-600">Enter your {whatsappProvider} credentials</p>
          </div>
        </div>

        {whatsappProvider === 'twilio' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account SID
              </label>
              <input
                type="text"
                value={credentials.twilio.accountSid}
                onChange={(e) => updateCredentials('twilio', 'accountSid', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter Twilio Auth Token"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Phone Number
              </label>
              <input
                type="text"
                value={credentials.twilio.phoneNumber}
                onChange={(e) => updateCredentials('twilio', 'phoneNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter Twilio WhatsApp Number (e.g., +14155238886)"
              />
            </div>
          </div>
        )}

        {whatsappProvider === 'whatsapp-business' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Token
              </label>
              <input
                type="password"
                value={credentials.business.accessToken}
                onChange={(e) => updateCredentials('business', 'accessToken', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter WhatsApp Business API Access Token"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number ID
              </label>
              <input
                type="text"
                value={credentials.business.phoneNumberId}
                onChange={(e) => updateCredentials('business', 'phoneNumberId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter Phone Number ID"
              />
            </div>
          </div>
        )}

        {whatsappProvider === 'ultramsg' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token
              </label>
              <input
                type="password"
                value={credentials.ultramsg.token}
                onChange={(e) => updateCredentials('ultramsg', 'token', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter UltraMsg Token"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instance ID
              </label>
              <input
                type="text"
                value={credentials.ultramsg.instanceId}
                onChange={(e) => updateCredentials('ultramsg', 'instanceId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter Instance ID"
              />
            </div>
          </div>
        )}

        {whatsappProvider === 'callmebot' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={credentials.callmebot.apiKey}
                onChange={(e) => updateCredentials('callmebot', 'apiKey', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter CallMeBot API Key"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          className="mt-6 flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Save className="h-4 w-4" />
          <span>Save Configuration</span>
        </button>
      </div>

      {/* Test WhatsApp */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <MessageCircle className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Test WhatsApp</h2>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
            onClick={handleTestWhatsApp}
            disabled={loading || !testNumber}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{loading ? 'Sending...' : 'Send Test WhatsApp'}</span>
          </button>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-green-50 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-6 w-6 text-green-600 mt-1" />
          <div>
            <h3 className="text-lg font-medium text-green-900 mb-2">Setup Instructions</h3>
            <div className="text-sm text-green-800 space-y-2">
              <p><strong>Twilio WhatsApp:</strong> Enable WhatsApp sandbox in Twilio console, get credentials</p>
              <p><strong>WhatsApp Business API:</strong> Apply for WhatsApp Business API, get access token and phone number ID</p>
              <p><strong>UltraMsg:</strong> Sign up at ultramsg.com, create instance, get token and instance ID</p>
              <p><strong>CallMeBot:</strong> Register your WhatsApp number with CallMeBot, get API key</p>
              <p><strong>Note:</strong> WhatsApp messaging charges may apply based on your provider's pricing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppConfiguration;