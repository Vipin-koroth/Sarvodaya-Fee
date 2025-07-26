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
  private static SERVICE_ID = 'service_backup';
  private static TEMPLATE_ID = 'template_backup';
  private static PUBLIC_KEY = '_RWoqN93jOymywN_a';
  private static PRIVATE_KEY = 'MaEp5XnCJqyJw8szR0Zcz';

  static async sendBackupEmail(data: BackupEmailData): Promise<boolean> {
    try {
      // Check if EmailJS is available
      if (typeof window !== 'undefined' && (window as any).emailjs) {
        const emailjs = (window as any).emailjs;
        
        const templateParams = {
          to_email: data.to_email,
          subject: data.subject,
          message: data.message,
          students_csv: data.students_csv,
          payments_csv: data.payments_csv,
          from_name: 'Sarvodaya School Management System',
          reply_to: 'noreply@sarvodayaschool.edu'
        };

        const response = await emailjs.send(
          this.SERVICE_ID,
          this.TEMPLATE_ID,
          templateParams,
          {
            publicKey: this.PUBLIC_KEY,
            privateKey: this.PRIVATE_KEY
          }
        );

        console.log('Email sent successfully:', response);
        return true;
      } else {
        console.warn('EmailJS not loaded. Loading EmailJS...');
        await this.setupEmailJS();
        // Retry sending after loading
        return this.sendBackupEmail(data);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  static async setupEmailJS(): Promise<void> {
    try {
      // Load EmailJS script if not already loaded
      if (typeof window !== 'undefined' && !(window as any).emailjs) {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
          script.onload = () => {
            (window as any).emailjs.init({
              publicKey: this.PUBLIC_KEY,
              privateKey: this.PRIVATE_KEY
            });
            console.log('EmailJS initialized successfully');
            resolve();
          };
          script.onerror = () => {
            reject(new Error('Failed to load EmailJS script'));
          };
          document.head.appendChild(script);
        });
      } else {
        // Re-initialize with new keys
        (window as any).emailjs.init({
          publicKey: this.PUBLIC_KEY,
          privateKey: this.PRIVATE_KEY
        });
      }
    } catch (error) {
      console.error('Failed to setup EmailJS:', error);
      throw error;
    }
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