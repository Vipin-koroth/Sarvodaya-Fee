import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Student as SupabaseStudent, Payment as SupabasePayment, FeeConfig } from '../lib/supabase';

// Transform Supabase types to match existing interface
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
  developmentFees: Record<string, number>;
  busStops: Record<string, number>;
}

interface DataContextType {
  students: Student[];
  payments: Payment[];
  feeConfig: FeeConfiguration;
  addStudent: (student: Omit<Student, 'id'>) => Promise<void>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  importStudents: (students: Omit<Student, 'id'>[]) => Promise<{ successCount: number; skipCount: number; errors: string[] }>;
  addPayment: (payment: Omit<Payment, 'id' | 'paymentDate'>) => Promise<void>;
  updatePayment: (id: string, payment: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  updateFeeConfig: (config: Partial<FeeConfiguration>) => Promise<void>;
  sendSMS: (mobile: string, message: string) => void;
  sendWhatsApp: (mobile: string, message: string) => void;
  loading: boolean;
  error: string | null;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const isConfigured = !!(url && key && url !== 'your_supabase_project_url' && key !== 'your_supabase_anon_key');
    console.log('Supabase configuration check:', { 
      hasUrl: !!url, 
      hasKey: !!key, 
      isConfigured,
      url: url?.substring(0, 20) + '...' 
    });
    return isConfigured;
  } catch {
    console.log('Supabase configuration check failed, using localStorage');
    return false;
  }
};

// Generate UUID for localStorage
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Default fee configuration
const getDefaultFeeConfig = (): FeeConfiguration => ({
  developmentFees: {
    '1': 5000, '2': 5500, '3': 6000, '4': 6500, '5': 7000,
    '6': 7500, '7': 8000, '8': 8500, '9': 9000, '10': 9500,
    '11-A': 12000, '11-B': 12000, '11-C': 12000, '11-D': 12000, '11-E': 12000,
    '12-A': 13000, '12-B': 13000, '12-C': 13000, '12-D': 13000, '12-E': 13000
  },
  busStops: {
    'Main Gate': 800,
    'Market Square': 900,
    'Railway Station': 1000,
    'City Center': 850,
    'Hospital Junction': 750,
    'College Road': 950,
    'Bus Stand': 700,
    'Temple Road': 800
  }
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [feeConfig, setFeeConfig] = useState<FeeConfiguration>(getDefaultFeeConfig());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useSupabase, setUseSupabase] = useState(false);

  // Load initial data
  useEffect(() => {
    const configured = isSupabaseConfigured();
    setUseSupabase(configured);
    
    if (configured) {
      loadSupabaseData();
    } else {
      loadLocalStorageData();
    }
  }, []);

  const loadSupabaseData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        loadStudentsFromSupabase(),
        loadPaymentsFromSupabase(),
        loadFeeConfigFromSupabase()
      ]);
      setupRealtimeSubscriptions();
    } catch (err) {
      console.error('Supabase connection failed, falling back to localStorage:', err);
      setError('Supabase connection failed, using local storage');
      setUseSupabase(false);
      loadLocalStorageData();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalStorageData = () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load students
      const savedStudents = localStorage.getItem('students');
      if (savedStudents) {
        setStudents(JSON.parse(savedStudents));
      }

      // Load payments
      const savedPayments = localStorage.getItem('payments');
      if (savedPayments) {
        setPayments(JSON.parse(savedPayments));
      }

      // Load fee config
      const savedFeeConfig = localStorage.getItem('feeConfig');
      if (savedFeeConfig) {
        setFeeConfig(JSON.parse(savedFeeConfig));
      }
      
      console.log('Data loaded from localStorage successfully');
    } catch (err) {
      console.error('Error loading from localStorage:', err);
      setError('Failed to load data from local storage');
    } finally {
      setLoading(false);
    }
  };

  // Supabase data loading functions
  const loadStudentsFromSupabase = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setStudents(data?.map(transformSupabaseStudent) || []);
  };

  const loadPaymentsFromSupabase = async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setPayments(data?.map(transformSupabasePayment) || []);
  };

  const loadFeeConfigFromSupabase = async () => {
    const { data, error } = await supabase
      .from('fee_config')
      .select('*');

    if (error) throw error;

    const developmentFees: Record<string, number> = {};
    const busStops: Record<string, number> = {};

    data?.forEach((config: FeeConfig) => {
      if (config.config_type === 'development_fee') {
        developmentFees[config.config_key] = config.config_value;
      } else if (config.config_type === 'bus_stop') {
        busStops[config.config_key] = config.config_value;
      }
    });

    // Use defaults if no config found
    const defaultConfig = getDefaultFeeConfig();
    setFeeConfig({
      developmentFees: Object.keys(developmentFees).length > 0 ? developmentFees : defaultConfig.developmentFees,
      busStops: Object.keys(busStops).length > 0 ? busStops : defaultConfig.busStops
    });
  };

  const setupRealtimeSubscriptions = () => {
    if (!useSupabase) return;

    // Students subscription
    const studentsSubscription = supabase
      .channel('students_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'students' },
        (payload) => {
          console.log('Students realtime update:', payload);
          if (payload.eventType === 'INSERT') {
            const newStudent = transformSupabaseStudent(payload.new as SupabaseStudent);
            setStudents(prev => {
              // Check if student already exists to avoid duplicates
              const exists = prev.find(s => s.id === newStudent.id);
              if (exists) {
                console.log('Student already exists in state, skipping duplicate');
                return prev;
              }
              console.log('Adding new student from realtime:', newStudent);
              return [newStudent, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedStudent = transformSupabaseStudent(payload.new as SupabaseStudent);
            setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
          } else if (payload.eventType === 'DELETE') {
            setStudents(prev => prev.filter(s => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Payments subscription
    const paymentsSubscription = supabase
      .channel('payments_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        (payload) => {
          console.log('Payments realtime update:', payload);
          if (payload.eventType === 'INSERT') {
            const newPayment = transformSupabasePayment(payload.new as SupabasePayment);
            setPayments(prev => {
              // Check if payment already exists to avoid duplicates
              const exists = prev.find(p => p.id === newPayment.id);
              if (exists) {
                console.log('Payment already exists in state, skipping duplicate');
                return prev;
              }
              console.log('Adding new payment from realtime:', newPayment);
              return [newPayment, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedPayment = transformSupabasePayment(payload.new as SupabasePayment);
            setPayments(prev => prev.map(p => p.id === updatedPayment.id ? updatedPayment : p));
          } else if (payload.eventType === 'DELETE') {
            setPayments(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Fee config subscription
    const feeConfigSubscription = supabase
      .channel('fee_config_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'fee_config' },
        () => {
          console.log('Fee config realtime update');
          loadFeeConfigFromSupabase();
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      console.log('Cleaning up realtime subscriptions');
      studentsSubscription.unsubscribe();
      paymentsSubscription.unsubscribe();
      feeConfigSubscription.unsubscribe();
    };
  };

  // Transform functions
  const transformSupabaseStudent = (student: SupabaseStudent): Student => ({
    id: student.id,
    admissionNo: student.admission_no,
    name: student.name,
    mobile: student.mobile,
    class: student.class,
    division: student.division,
    busStop: student.bus_stop,
    busNumber: student.bus_number,
    tripNumber: student.trip_number,
  });

  const transformStudentToSupabase = (student: Omit<Student, 'id'>): Omit<SupabaseStudent, 'id' | 'created_at'> => ({
    admission_no: student.admissionNo,
    name: student.name,
    mobile: student.mobile,
    class: student.class,
    division: student.division,
    bus_stop: student.busStop,
    bus_number: student.busNumber,
    trip_number: student.tripNumber,
  });

  const transformSupabasePayment = (payment: SupabasePayment): Payment => ({
    id: payment.id,
    studentId: payment.student_id || '',
    studentName: payment.student_name,
    admissionNo: payment.admission_no,
    developmentFee: payment.development_fee,
    busFee: payment.bus_fee,
    specialFee: payment.special_fee,
    specialFeeType: payment.special_fee_type,
    totalAmount: payment.total_amount,
    paymentDate: payment.payment_date,
    addedBy: payment.added_by,
    class: payment.class,
    division: payment.division,
  });

  const transformPaymentToSupabase = (payment: Omit<Payment, 'id' | 'paymentDate'>): Omit<SupabasePayment, 'id' | 'created_at'> => ({
    student_id: payment.studentId,
    student_name: payment.studentName,
    admission_no: payment.admissionNo,
    development_fee: payment.developmentFee,
    bus_fee: payment.busFee,
    special_fee: payment.specialFee,
    special_fee_type: payment.specialFeeType,
    total_amount: payment.totalAmount,
    payment_date: new Date().toISOString(),
    added_by: payment.addedBy,
    class: payment.class,
    division: payment.division,
  });

  const getStudentBalance = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return { devBalance: 0, busBalance: 0 };

    const classKey = (['11', '12'].includes(student.class)) 
      ? `${student.class}-${student.division}` 
      : student.class;

    const totalDevFee = feeConfig.developmentFees[classKey] || 0;
    const totalBusFee = feeConfig.busStops[student.busStop] || 0;

    const studentPayments = payments.filter(p => p.studentId === studentId);
    const paidDevFee = studentPayments.reduce((sum, p) => sum + p.developmentFee, 0);
    const paidBusFee = studentPayments.reduce((sum, p) => sum + p.busFee, 0);

    return {
      devBalance: totalDevFee - paidDevFee,
      busBalance: totalBusFee - paidBusFee
    };
  };

  // CRUD operations
  const addStudent = async (student: Omit<Student, 'id'>) => {
    if (useSupabase) {
      // Check if admission number already exists
      const { data: existingStudents, error: checkError } = await supabase
        .from('students')
        .select('id')
        .eq('admission_no', student.admissionNo)
        .limit(1);

      if (checkError) {
        throw checkError;
      }

      if (existingStudents && existingStudents.length > 0) {
        throw new Error(`Student with admission number ${student.admissionNo} already exists.`);
      }

      const { data, error } = await supabase
        .from('students')
        .insert([transformStudentToSupabase(student)])
        .select()
        .single();
      
      if (error) throw error;
      
      // Immediately add to local state for instant UI update
      if (data) {
        const newStudent = transformSupabaseStudent(data);
        setStudents(prev => [newStudent, ...prev]);
        console.log('Student added to Supabase and local state:', newStudent);
      }
    } else {
      // Check for duplicate admission number in localStorage
      const existingStudent = students.find(s => s.admissionNo === student.admissionNo);
      if (existingStudent) {
        throw new Error(`Student with admission number ${student.admissionNo} already exists.`);
      }

      const newStudent: Student = { ...student, id: generateId() };
      const updatedStudents = [newStudent, ...students];
      setStudents(updatedStudents);
      localStorage.setItem('students', JSON.stringify(updatedStudents));
      console.log('Student added to localStorage:', newStudent);
    }
  };

  const updateStudent = async (id: string, studentData: Partial<Student>) => {
    if (useSupabase) {
      const updateData: Partial<Omit<SupabaseStudent, 'id' | 'created_at'>> = {};
      
      if (studentData.admissionNo) updateData.admission_no = studentData.admissionNo;
      if (studentData.name) updateData.name = studentData.name;
      if (studentData.mobile) updateData.mobile = studentData.mobile;
      if (studentData.class) updateData.class = studentData.class;
      if (studentData.division) updateData.division = studentData.division;
      if (studentData.busStop) updateData.bus_stop = studentData.busStop;
      if (studentData.busNumber) updateData.bus_number = studentData.busNumber;
      if (studentData.tripNumber) updateData.trip_number = studentData.tripNumber;

      const { data, error } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Immediately update local state
      if (data) {
        const updatedStudent = transformSupabaseStudent(data);
        setStudents(prev => prev.map(s => s.id === id ? updatedStudent : s));
        console.log('Student updated in Supabase and local state:', updatedStudent);
      }
    } else {
      const updatedStudents = students.map(s => s.id === id ? { ...s, ...studentData } : s);
      setStudents(updatedStudents);
      localStorage.setItem('students', JSON.stringify(updatedStudents));
      console.log('Student updated in localStorage');
    }
  };

  const deleteStudent = async (id: string) => {
    if (useSupabase) {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);
      if (error) throw error;
      
      // Immediately remove from local state
      setStudents(prev => prev.filter(s => s.id !== id));
      console.log('Student deleted from Supabase and local state:', id);
    } else {
      const updatedStudents = students.filter(s => s.id !== id);
      setStudents(updatedStudents);
      localStorage.setItem('students', JSON.stringify(updatedStudents));
      console.log('Student deleted from localStorage:', id);
    }
  };

  const importStudents = async (newStudents: Omit<Student, 'id'>[]) => {
    if (useSupabase) {
      // Get existing admission numbers
      const { data: existingStudents, error: fetchError } = await supabase
        .from('students')
        .select('admission_no');
      
      if (fetchError) throw fetchError;
      
      const existingAdmissionNos = new Set(existingStudents?.map(s => s.admission_no) || []);
      
      let successCount = 0;
      let skipCount = 0;
      const errors: string[] = [];
      
      for (const student of newStudents) {
        // Validate all required fields are present and not empty
        const admissionNo = student.admissionNo?.trim();
        const name = student.name?.trim();
        const mobile = student.mobile?.trim();
        const classValue = student.class?.trim();
        const division = student.division?.trim();
        const busStop = student.busStop?.trim();
        const busNumber = student.busNumber?.trim();
        const tripNumber = student.tripNumber?.trim();
        
        // Strict validation - check each field has actual content
        const hasEmptyFields = !admissionNo || admissionNo.length === 0 ||
                              !name || name.length === 0 ||
                              !mobile || mobile.length === 0 ||
                              !classValue || classValue.length === 0 ||
                              !division || division.length === 0 ||
                              !busStop || busStop.length === 0 ||
                              !busNumber || busNumber.length === 0 ||
                              !tripNumber || tripNumber.length === 0;
        
        if (hasEmptyFields) {
          skipCount++;
          const emptyFields = [];
          if (!admissionNo || admissionNo.length === 0) emptyFields.push('admissionNo');
          if (!name || name.length === 0) emptyFields.push('name');
          if (!mobile || mobile.length === 0) emptyFields.push('mobile');
          if (!classValue || classValue.length === 0) emptyFields.push('class');
          if (!division || division.length === 0) emptyFields.push('division');
          if (!busStop || busStop.length === 0) emptyFields.push('busStop');
          if (!busNumber || busNumber.length === 0) emptyFields.push('busNumber');
          if (!tripNumber || tripNumber.length === 0) emptyFields.push('tripNumber');
          
          errors.push(`Skipped: Row with empty fields [${emptyFields.join(', ')}] - ${name || 'Unknown'} (${admissionNo || 'No admission no'})`);
          continue;
        }
        
        if (existingAdmissionNos.has(student.admissionNo)) {
          skipCount++;
          errors.push(`Skipped: Student with admission number ${student.admissionNo} already exists`);
          continue;
        }
        
        try {
          const { error } = await supabase
            .from('students')
            .insert([transformStudentToSupabase(student)]);
          
          if (error) {
            errors.push(`Failed to add ${student.name} (${student.admissionNo}): ${error.message}`);
          } else {
            successCount++;
            existingAdmissionNos.add(student.admissionNo); // Add to set to prevent duplicates in same batch
          }
        } catch (err) {
          errors.push(`Failed to add ${student.name} (${student.admissionNo}): ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
      
      return { successCount, skipCount, errors };
    } else {
      const existingAdmissionNos = new Set(students.map(s => s.admissionNo));
      
      let successCount = 0;
      let skipCount = 0;
      const errors: string[] = [];
      const validStudents: Student[] = [];
      
      for (const student of newStudents) {
        // Validate all required fields are present and not empty
        const admissionNo = student.admissionNo?.trim();
        const name = student.name?.trim();
        const mobile = student.mobile?.trim();
        const classValue = student.class?.trim();
        const division = student.division?.trim();
        const busStop = student.busStop?.trim();
        const busNumber = student.busNumber?.trim();
        const tripNumber = student.tripNumber?.trim();
        
        // Strict validation - check each field has actual content
        const hasEmptyFields = !admissionNo || admissionNo.length === 0 ||
                              !name || name.length === 0 ||
                              !mobile || mobile.length === 0 ||
                              !classValue || classValue.length === 0 ||
                              !division || division.length === 0 ||
                              !busStop || busStop.length === 0 ||
                              !busNumber || busNumber.length === 0 ||
                              !tripNumber || tripNumber.length === 0;
        
        if (hasEmptyFields) {
          skipCount++;
          const emptyFields = [];
          if (!admissionNo || admissionNo.length === 0) emptyFields.push('admissionNo');
          if (!name || name.length === 0) emptyFields.push('name');
          if (!mobile || mobile.length === 0) emptyFields.push('mobile');
          if (!classValue || classValue.length === 0) emptyFields.push('class');
          if (!division || division.length === 0) emptyFields.push('division');
          if (!busStop || busStop.length === 0) emptyFields.push('busStop');
          if (!busNumber || busNumber.length === 0) emptyFields.push('busNumber');
          if (!tripNumber || tripNumber.length === 0) emptyFields.push('tripNumber');
          
          errors.push(`Skipped: Row with empty fields [${emptyFields.join(', ')}] - ${name || 'Unknown'} (${admissionNo || 'No admission no'})`);
          continue;
        }
        
        if (existingAdmissionNos.has(student.admissionNo)) {
          skipCount++;
          errors.push(`Skipped: Student with admission number ${student.admissionNo} already exists`);
          continue;
        }
        
        validStudents.push({ ...student, id: generateId() });
        existingAdmissionNos.add(student.admissionNo);
        successCount++;
      }
      
      const updatedStudents = [...validStudents, ...students];
      setStudents(updatedStudents);
      localStorage.setItem('students', JSON.stringify(updatedStudents));
      
      return { successCount, skipCount, errors };
    }
  };

  const addPayment = async (payment: Omit<Payment, 'id' | 'paymentDate'>) => {
    try {
      setError(null);
      
    if (useSupabase) {
      const { data, error } = await supabase
        .from('payments')
        .insert([transformPaymentToSupabase(payment)])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase payment insert error:', error);
        throw error;
      }
      
      // Immediately add to local state for instant UI update
      if (data) {
        const newPayment = transformSupabasePayment(data);
        setPayments(prev => [newPayment, ...prev]);
        console.log('Payment added to Supabase and local state:', newPayment);
      }
    } else {
      const newPayment: Payment = { 
        ...payment, 
        id: generateId(), 
        paymentDate: new Date().toISOString() 
      };
      const updatedPayments = [newPayment, ...payments];
      setPayments(updatedPayments);
      localStorage.setItem('payments', JSON.stringify(updatedPayments));
      console.log('Payment added to localStorage:', newPayment);
    }

      // Send SMS notification (don't let this fail the payment)
      try {
        const student = students.find(s => s.id === payment.studentId);
        if (student) {
          const message = `Dear Parent, Payment of ₹${payment.totalAmount} received for ${student.name} (${student.admissionNo}). Date: ${new Date().toLocaleDateString('en-GB')}. Thank you! - Sarvodaya School`;
          sendSMS(student.mobile, message);
          sendWhatsApp(student.mobile, message);
        }
      } catch (smsError) {
        console.warn('SMS/WhatsApp notification failed:', smsError);
        // Don't throw - payment was successful even if notification failed
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      setError(error instanceof Error ? error.message : 'Failed to add payment');
      throw error;
    }
  };

  const updatePayment = async (id: string, paymentData: Partial<Payment>) => {
    if (useSupabase) {
      const updateData: Partial<Omit<SupabasePayment, 'id' | 'created_at'>> = {};
      
      if (paymentData.studentId) updateData.student_id = paymentData.studentId;
      if (paymentData.studentName) updateData.student_name = paymentData.studentName;
      if (paymentData.admissionNo) updateData.admission_no = paymentData.admissionNo;
      if (paymentData.developmentFee !== undefined) updateData.development_fee = paymentData.developmentFee;
      if (paymentData.busFee !== undefined) updateData.bus_fee = paymentData.busFee;
      if (paymentData.specialFee !== undefined) updateData.special_fee = paymentData.specialFee;
      if (paymentData.specialFeeType) updateData.special_fee_type = paymentData.specialFeeType;
      if (paymentData.totalAmount !== undefined) updateData.total_amount = paymentData.totalAmount;
      if (paymentData.addedBy) updateData.added_by = paymentData.addedBy;
      if (paymentData.class) updateData.class = paymentData.class;
      if (paymentData.division) updateData.division = paymentData.division;

      const { data, error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Immediately update local state
      if (data) {
        const updatedPayment = transformSupabasePayment(data);
        setPayments(prev => prev.map(p => p.id === id ? updatedPayment : p));
        console.log('Payment updated in Supabase and local state:', updatedPayment);
      }
    } else {
      const updatedPayments = payments.map(p => p.id === id ? { ...p, ...paymentData } : p);
      setPayments(updatedPayments);
      localStorage.setItem('payments', JSON.stringify(updatedPayments));
      console.log('Payment updated in localStorage');
    }
  };

  const deletePayment = async (id: string) => {
    if (useSupabase) {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      
      // Immediately remove from local state
      setPayments(prev => prev.filter(p => p.id !== id));
      console.log('Payment deleted from Supabase and local state:', id);
    } else {
      const updatedPayments = payments.filter(p => p.id !== id);
      setPayments(updatedPayments);
      localStorage.setItem('payments', JSON.stringify(updatedPayments));
      console.log('Payment deleted from localStorage:', id);
    }
  };

  const updateFeeConfig = async (config: Partial<FeeConfiguration>) => {
    if (useSupabase) {
      const updates: Omit<FeeConfig, 'id' | 'created_at' | 'updated_at'>[] = [];

      if (config.developmentFees) {
        Object.entries(config.developmentFees).forEach(([key, value]) => {
          updates.push({
            config_type: 'development_fee',
            config_key: key,
            config_value: value
          });
        });
      }

      if (config.busStops) {
        Object.entries(config.busStops).forEach(([key, value]) => {
          updates.push({
            config_type: 'bus_stop',
            config_key: key,
            config_value: value
          });
        });
      }

      for (const update of updates) {
        const { error } = await supabase
          .from('fee_config')
          .upsert(update, { 
            onConflict: 'config_type,config_key',
            ignoreDuplicates: false 
          });
        if (error) throw error;
      }
      
      // Immediately update local state
      const updatedConfig = { ...feeConfig, ...config };
      setFeeConfig(updatedConfig);
      console.log('Fee config updated in Supabase and local state');
    } else {
      const updatedConfig = { ...feeConfig, ...config };
      setFeeConfig(updatedConfig);
      localStorage.setItem('feeConfig', JSON.stringify(updatedConfig));
      console.log('Fee config updated in localStorage');
    }
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
      console.log('SMS notification failed, but payment was successful');
    }
  };

  // SMS provider implementations
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
        To: `+91${mobile}`,
        Body: message
      })
    });

    if (!response.ok) {
      throw new Error(`Twilio API error: ${response.status}`);
    }
  };

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

  const sendViaTextBee = async (mobile: string, message: string, credentials: any) => {
    const TEXTBEE_API_KEY = credentials?.apiKey;
    const TEXTBEE_DEVICE_ID = credentials?.deviceId;

    if (!TEXTBEE_API_KEY || !TEXTBEE_DEVICE_ID) {
      throw new Error('TextBee API key and Device ID not configured');
    }

    const response = await fetch('https://api.textbee.dev/v1/gateway/send', {
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
    }
  };

  // WhatsApp provider implementations
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

  const sendWhatsAppViaCallMeBot = async (mobile: string, message: string, credentials: any) => {
    const { apiKey } = credentials;
    
    if (!apiKey) {
      throw new Error('CallMeBot API key not configured');
    }

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
    sendWhatsApp,
    loading,
    error
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};