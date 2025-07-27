// Email service for sending weekly backups
// This uses EmailJS for client-side email sending

export interface BackupEmailData {
  to_email: string;
  subject: string;
  message: string;
  students_csv: string;
  payments_csv: string;
}

export class EmailService {
  private static SERVICE_ID = 'service_backup_system';
  private static TEMPLATE_ID = 'template_backup_email';
  private static PUBLIC_KEY = '_RWoqN93jOymywN_a';
  private static PRIVATE_KEY = 'MaEp5XnCJqyJw8szR0Zcz';

  static async sendBackupEmail(data: BackupEmailData): Promise<boolean> {
    try {
      // Ensure EmailJS is loaded
      await this.setupEmailJS();
      
      const emailjs = (window as any).emailjs;
      if (!emailjs) {
        throw new Error('EmailJS failed to load');
      }
      
      const templateParams = {
        to_email: data.to_email,
        subject: data.subject,
        message: data.message,
        receipt_wise_csv: data.receipt_wise_csv,
        class_monthly_csv: data.class_monthly_csv,
        from_name: 'Sarvodaya School Management System',
        reply_to: 'noreply@sarvodayaschool.edu'
      };

      console.log('Sending email with params:', templateParams);
      console.log('Using service ID:', this.SERVICE_ID);
      console.log('Using template ID:', this.TEMPLATE_ID);

      const response = await emailjs.send(
        this.SERVICE_ID,
        this.TEMPLATE_ID,
        templateParams,
        this.PUBLIC_KEY
      );

      console.log('Email sent successfully:', response);
      return response.status === 200;
    } catch (error) {
      console.error('Failed to send email:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : JSON.stringify(error),
        status: (error as any)?.status,
        text: (error as any)?.text,
        serviceId: this.SERVICE_ID,
        templateId: this.TEMPLATE_ID,
        publicKey: this.PUBLIC_KEY
      });
      
      // Provide more helpful error message
      if ((error as any)?.status === 400 && (error as any)?.text?.includes('service ID not found')) {
        throw new Error(`EmailJS Service ID '${this.SERVICE_ID}' not found. Please create a service in your EmailJS dashboard at https://dashboard.emailjs.com/admin`);
      }
      
      throw new Error(`Email sending failed: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }
  }

  static async setupEmailJS(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Window is not available'));
        return;
      }

      // Check if EmailJS is already loaded
      if ((window as any).emailjs) {
        console.log('EmailJS already loaded, initializing...');
        (window as any).emailjs.init(this.PUBLIC_KEY);
        resolve();
        return;
      }

      // Load EmailJS script
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
      script.onload = () => {
        try {
          (window as any).emailjs.init(this.PUBLIC_KEY);
          console.log('EmailJS loaded and initialized successfully');
          resolve();
        } catch (error) {
          console.error('Failed to initialize EmailJS:', error);
          reject(error);
        }
      };
      script.onerror = () => {
        reject(new Error('Failed to load EmailJS script'));
      };
      document.head.appendChild(script);
    });
  }
}

// Backup scheduler utility
export class BackupScheduler {
  private static BACKUP_INTERVAL_KEY = 'backupIntervalId';
  private static LAST_BACKUP_KEY = 'lastBackupDate';
  
  static scheduleWeeklyBackup(callback: () => void): void {
    // Clear existing interval
    this.clearScheduledBackup();
    
    // Calculate milliseconds until next Sunday midnight
    const now = new Date();
    const nextSunday = new Date();
    nextSunday.setDate(now.getDate() + (7 - now.getDay()));
    nextSunday.setHours(0, 0, 0, 0);
    
    const msUntilNextSunday = nextSunday.getTime() - now.getTime();
    
    // Set initial timeout for next Sunday
    setTimeout(() => {
      callback(); // Send first backup
      
      // Then set weekly interval
      const intervalId = setInterval(callback, 7 * 24 * 60 * 60 * 1000); // 7 days
      localStorage.setItem(this.BACKUP_INTERVAL_KEY, intervalId.toString());
    }, msUntilNextSunday);
  }
  
  static clearScheduledBackup(): void {
    const intervalId = localStorage.getItem(this.BACKUP_INTERVAL_KEY);
    if (intervalId) {
      clearInterval(parseInt(intervalId));
      localStorage.removeItem(this.BACKUP_INTERVAL_KEY);
    }
  }
  
  static getLastBackupDate(): Date | null {
    const lastBackup = localStorage.getItem(this.LAST_BACKUP_KEY);
    return lastBackup ? new Date(lastBackup) : null;
  }
  
  static setLastBackupDate(date: Date): void {
    localStorage.setItem(this.LAST_BACKUP_KEY, date.toISOString());
  }
  
  static shouldSendBackup(): boolean {
    const lastBackup = this.getLastBackupDate();
    if (!lastBackup) return true;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return lastBackup < oneWeekAgo;
  }
}