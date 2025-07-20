import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Student {
  id: string;
  admissionNo: string;
  name: string;
  mobile: string;
  class: string;
  division: string;
  busStop: string;
  busNumber: string;
  tripNumber: string;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  developmentFee: number;
  busFee: number;
  specialFee: number;
  specialFeeType: string;
  totalAmount: number;
  paymentDate: string;
  addedBy: string;
  class: string;
  division: string;
}

export interface FeeConfiguration {
  developmentFees: Record<string, number>; // class -> amount (for classes 1-10) or class-division -> amount (for classes 11-12)
  busStops: Record<string, number>; // stop -> amount
}

interface DataContextType {
  students: Student[];
  payments: Payment[];
  feeConfig: FeeConfiguration;
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  importStudents: (students: Omit<Student, 'id'>[]) => void;
  addPayment: (payment: Omit<Payment, 'id' | 'paymentDate'>) => void;
  updatePayment: (id: string, payment: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
  updateFeeConfig: (config: Partial<FeeConfiguration>) => void;
  sendSMS: (mobile: string, message: string) => void;
  sendWhatsApp: (mobile: string, message: string) => void;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [feeConfig, setFeeConfig] = useState<FeeConfiguration>({
    developmentFees: {},
    busStops: {}
  });

  useEffect(() => {
    // Load data from localStorage
    const savedStudents = localStorage.getItem('students');
    const savedPayments = localStorage.getItem('payments');
    const savedFeeConfig = localStorage.getItem('feeConfig');

    if (savedStudents) setStudents(JSON.parse(savedStudents));
    if (savedPayments) setPayments(JSON.parse(savedPayments));
    if (savedFeeConfig) {
      setFeeConfig(JSON.parse(savedFeeConfig));
    } else {
      // Initialize default fee configuration
      const defaultConfig: FeeConfiguration = {
        developmentFees: {
          '1': 500, '2': 600, '3': 700, '4': 800, '5': 900, '6': 1000,
          '7': 1100, '8': 1200, '9': 1300, '10': 1400,
          '11-A': 1500, '11-B': 1600, '11-C': 1700, '11-D': 1800, '11-E': 1900,
          '12-A': 1600, '12-B': 1700, '12-C': 1800, '12-D': 1900, '12-E': 2000
        },
        busStops: {
          'Main Gate': 800, 'Market Square': 900, 'Railway Station': 1000,
          'City Center': 850, 'Park Avenue': 750, 'School Road': 700
        }
      };
      setFeeConfig(defaultConfig);
      localStorage.setItem('feeConfig', JSON.stringify(defaultConfig));
    }
  }, []);

  const addStudent = (student: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...student,
      id: Date.now().toString()
    };
    const updatedStudents = [...students, newStudent];
    setStudents(updatedStudents);
    localStorage.setItem('students', JSON.stringify(updatedStudents));
  };

  const updateStudent = (id: string, studentData: Partial<Student>) => {
    const updatedStudents = students.map(student =>
      student.id === id ? { ...student, ...studentData } : student
    );
    setStudents(updatedStudents);
    localStorage.setItem('students', JSON.stringify(updatedStudents));
  };

  const deleteStudent = (id: string) => {
    const updatedStudents = students.filter(student => student.id !== id);
    setStudents(updatedStudents);
    localStorage.setItem('students', JSON.stringify(updatedStudents));
  };

  const importStudents = (newStudents: Omit<Student, 'id'>[]) => {
    const studentsWithIds = newStudents.map(student => ({
      ...student,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }));
    const updatedStudents = [...students, ...studentsWithIds];
    setStudents(updatedStudents);
    localStorage.setItem('students', JSON.stringify(updatedStudents));
  };

  const addPayment = (payment: Omit<Payment, 'id' | 'paymentDate'>) => {
    const newPayment: Payment = {
      ...payment,
      id: Date.now().toString(),
      paymentDate: new Date().toISOString()
    };
    const updatedPayments = [...payments, newPayment];
    setPayments(updatedPayments);
    localStorage.setItem('payments', JSON.stringify(updatedPayments));

    // Send SMS notification
    const student = students.find(s => s.id === payment.studentId);
    if (student) {
      // Get the correct fee key for classes 11 and 12 (class-division) or regular classes (class only)
      const feeKey = (student.class === '11' || student.class === '12') 
        ? `${student.class}-${student.division}` 
        : student.class;
      
      const message = `Dear Parent, Payment of ₹${payment.totalAmount} received for ${student.name} (${student.admissionNo}). Date: ${new Date().toLocaleDateString()}. Thank you! - Sarvodaya School`;
      sendSMS(student.mobile, message);
      sendWhatsApp(student.mobile, message);
    }
  };

  const updatePayment = (id: string, paymentData: Partial<Payment>) => {
    const updatedPayments = payments.map(payment =>
      payment.id === id ? { ...payment, ...paymentData } : payment
    );
    setPayments(updatedPayments);
    localStorage.setItem('payments', JSON.stringify(updatedPayments));
  };

  const deletePayment = (id: string) => {
    const updatedPayments = payments.filter(payment => payment.id !== id);
    setPayments(updatedPayments);
    localStorage.setItem('payments', JSON.stringify(updatedPayments));
  };

  const updateFeeConfig = (config: Partial<FeeConfiguration>) => {
    const updatedConfig = { ...feeConfig, ...config };
    setFeeConfig(updatedConfig);
    localStorage.setItem('feeConfig', JSON.stringify(updatedConfig));
  };

  const sendSMS = (mobile: string, message: string) => {
    const savedProvider = localStorage.getItem('smsProvider') || 'twilio';
    const savedCredentials = localStorage.getItem('smsCredentials');
    
    if (!savedCredentials) {
      console.log('SMS credentials not configured, skipping SMS notification...');
      return;
    }

    const credentials = JSON.parse(savedCredentials);
    
    try {
      switch (savedProvider) {
        case 'twilio':
          sendViaTwilio(mobile, message, credentials.twilio);
          break;
        case 'textlocal':
          sendViaTextLocal(mobile, message, credentials.textlocal);
          break;
        case 'msg91':
          sendViaMSG91(mobile, message, credentials.msg91);
          break;
        case 'textbee':
          sendViaTextBee(mobile, message, credentials.textbee);
          break;
        default:
          console.log(`Unknown SMS provider: ${savedProvider}`);
          return;
      }
      
      console.log(`✅ SMS sent successfully to ${mobile}`);
    } catch (error) {
      console.error(`❌ SMS failed to ${mobile}:`, error);
      // Silent failure - don't interrupt payment flow
      console.log('SMS notification failed, but payment was successful');
    }
  };

  // Twilio SMS Integration
  const sendViaTwilio = async (mobile: string, message: string, credentials: any) => {
    const TWILIO_ACCOUNT_SID = credentials?.accountSid;
    const TWILIO_AUTH_TOKEN = credentials?.authToken;
    const TWILIO_PHONE_NUMBER = credentials?.phoneNumber;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      throw new Error('Twilio credentials not configured');
    }

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: TWILIO_PHONE_NUMBER,
        To: `+91${mobile}`, // Assuming Indian numbers
        Body: message
      })
    });

    if (!response.ok) {
      throw new Error(`Twilio API error: ${response.status}`);
    }
  };

  // TextLocal SMS Integration (India)
  const sendViaTextLocal = async (mobile: string, message: string, credentials: any) => {
    const TEXTLOCAL_API_KEY = credentials?.apiKey;
    const TEXTLOCAL_SENDER = credentials?.sender || 'SCHOOL';

    if (!TEXTLOCAL_API_KEY) {
      throw new Error('TextLocal API key not configured');
    }

    const response = await fetch('https://api.textlocal.in/send/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        apikey: TEXTLOCAL_API_KEY,
        numbers: mobile,
        message: message,
        sender: TEXTLOCAL_SENDER
      })
    });

    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(`TextLocal error: ${result.errors?.[0]?.message || 'Unknown error'}`);
    }
  };

  // MSG91 SMS Integration (India)
  const sendViaMSG91 = async (mobile: string, message: string, credentials: any) => {
    const MSG91_API_KEY = credentials?.apiKey;
    const MSG91_SENDER_ID = credentials?.senderId || 'SCHOOL';
    const MSG91_ROUTE = credentials?.route || '4';

    if (!MSG91_API_KEY) {
      throw new Error('MSG91 API key not configured');
    }

    const response = await fetch(`https://api.msg91.com/api/sendhttp.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        authkey: MSG91_API_KEY,
        mobiles: mobile,
        message: message,
        sender: MSG91_SENDER_ID,
        route: MSG91_ROUTE
      })
    });

    const result = await response.text();
    if (!result.includes('success')) {
      throw new Error(`MSG91 error: ${result}`);
    }
  };

  // TextBee SMS Integration (India)
  const sendViaTextBee = async (mobile: string, message: string, credentials: any) => {
    const TEXTBEE_API_KEY = credentials?.apiKey;
    const TEXTBEE_DEVICE_ID = credentials?.deviceId;

    if (!TEXTBEE_API_KEY || !TEXTBEE_DEVICE_ID) {
      throw new Error('TextBee API key and Device ID not configured');
    }

    const response = await fetch('https://api.textbee.dev/api/v1/gateway/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TEXTBEE_API_KEY,
      },
      body: JSON.stringify({
        device: TEXTBEE_DEVICE_ID,
        phone: `+91${mobile}`,
        message: message,
      })
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(`TextBee error: ${result.message || result.error || response.statusText || 'Unknown error'}`);
    }
  };

  const sendWhatsApp = async (mobile: string, message: string) => {
    try {
      const savedCredentials = localStorage.getItem('whatsappCredentials');
      const savedProvider = localStorage.getItem('whatsappProvider');
      
      if (!savedCredentials || !savedProvider) {
        console.log('WhatsApp not configured, skipping...');
        return;
      }

      const credentials = JSON.parse(savedCredentials);
      
      switch (savedProvider) {
        case 'twilio':
          await sendWhatsAppViaTwilio(mobile, message, credentials.twilio);
          break;
        case 'whatsapp-business':
          await sendWhatsAppViaBusinessAPI(mobile, message, credentials.business);
          break;
        case 'ultramsg':
          await sendWhatsAppViaUltraMsg(mobile, message, credentials.ultramsg);
          break;
        case 'callmebot':
          await sendWhatsAppViaCallMeBot(mobile, message, credentials.callmebot);
          break;
        default:
          throw new Error('Unknown WhatsApp provider');
      }
      
      console.log(`✅ WhatsApp sent successfully to ${mobile}`);
    } catch (error) {
      console.error(`❌ WhatsApp failed to ${mobile}:`, error);
      // Don't show alert for WhatsApp failures to avoid interrupting workflow
    }
  };

  // Twilio WhatsApp Integration
  const sendWhatsAppViaTwilio = async (mobile: string, message: string, credentials: any) => {
    const { accountSid, authToken, phoneNumber } = credentials;
    
    if (!accountSid || !authToken || !phoneNumber) {
      throw new Error('Twilio WhatsApp credentials not configured');
    }

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: `whatsapp:${phoneNumber}`,
        To: `whatsapp:+91${mobile}`,
        Body: message
      })
    });

    if (!response.ok) {
      throw new Error(`Twilio WhatsApp API error: ${response.status}`);
    }
  };

  // WhatsApp Business API Integration
  const sendWhatsAppViaBusinessAPI = async (mobile: string, message: string, credentials: any) => {
    const { accessToken, phoneNumberId } = credentials;
    
    if (!accessToken || !phoneNumberId) {
      throw new Error('WhatsApp Business API credentials not configured');
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: `91${mobile}`,
        type: 'text',
        text: {
          body: message
        }
      })
    });

    if (!response.ok) {
      throw new Error(`WhatsApp Business API error: ${response.status}`);
    }
  };

  // UltraMsg WhatsApp Integration
  const sendWhatsAppViaUltraMsg = async (mobile: string, message: string, credentials: any) => {
    const { token, instanceId } = credentials;
    
    if (!token || !instanceId) {
      throw new Error('UltraMsg credentials not configured');
    }

    const response = await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: token,
        to: `91${mobile}`,
        body: message
      })
    });

    const result = await response.json();
    if (!response.ok || result.sent !== true) {
      throw new Error(`UltraMsg error: ${result.error || 'Unknown error'}`);
    }
  };

  // CallMeBot WhatsApp Integration
  const sendWhatsAppViaCallMeBot = async (mobile: string, message: string, credentials: any) => {
    const { apiKey } = credentials;
    
    if (!apiKey) {
      throw new Error('CallMeBot API key not configured');
    }

    const response = await fetch(`https://api.callmebot.com/whatsapp.php`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Note: CallMeBot requires phone number to be registered first
    // This is a simplified implementation
    const url = `https://api.callmebot.com/whatsapp.php?phone=91${mobile}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
    
    const result = await fetch(url);
    if (!result.ok) {
      throw new Error(`CallMeBot error: ${result.status}`);
    }
  };

  const value = {
    students,
    payments,
    feeConfig,
    addStudent,
    updateStudent,
    deleteStudent,
    importStudents,
    addPayment,
    updatePayment,
    deletePayment,
    updateFeeConfig,
    sendSMS,
    sendWhatsApp
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};