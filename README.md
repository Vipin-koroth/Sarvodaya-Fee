# Sarvodaya Higher Secondary School - Fee Management System

## Features
A comprehensive web-based fee management system for schools with student management, payment tracking, and automated backup features.
### Core Functionality
- **Student Management**: Add, edit, delete, and import students via CSV
- **Payment Processing**: Record development fees, bus fees, and special fees
- **Receipt Generation**: Print A6 receipts with balance information
- **Fee Configuration**: Manage development fees by class and bus stop charges
- **Reports & Analytics**: Generate class-wise, bus stop-wise, and monthly reports
### User Management
- **Admin Dashboard**: Full system access and management
- **Teacher Accounts**: Class-specific access (format: class[X][Y])
- **Password Management**: Change passwords and reset user accounts
- **Default Credentials**: admin/admin for all accounts
### Data Management
- **Automatic Backups**: Weekly email backups to specified address
- **Data Export**: Download students and payments as CSV files
- **Data Clearing**: Reset system to default state
- **Import/Export**: Bulk student import via CSV files
### Communication
- **SMS Notifications**: Payment confirmations via multiple providers
- **WhatsApp Integration**: Send receipts via WhatsApp Web
- **Email Backups**: Automated weekly data backups
## Setup Instructions
### 1. Database Configuration
The system supports both Supabase (recommended) and localStorage:
#### Supabase Setup (Recommended)
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Click "Connect to Supabase" button in the application
3. Enter your Supabase URL and API key
4. Database tables will be created automatically
#### Environment Variables
Create a `.env` file with:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
### 2. Email Backup Setup
For automated weekly backups:
1. Sign up for [EmailJS](https://www.emailjs.com/)
2. Create an email service and template
3. Update the EmailJS configuration in `src/lib/emailService.ts`:
   ```javascript
   private static SERVICE_ID = 'your_emailjs_service_id';
   private static TEMPLATE_ID = 'your_emailjs_template_id';
   private static PUBLIC_KEY = 'your_emailjs_public_key';
   ```
4. Update the public key in `index.html`
### 3. SMS Configuration (Optional)
Configure SMS providers in the admin panel:
- **Twilio**: Global SMS service
- **TextLocal**: India-specific SMS
- **MSG91**: India-specific SMS
- **TextBee**: India-specific SMS service
### 4. WhatsApp Configuration (Optional)
Configure WhatsApp providers:
- **Twilio WhatsApp**: Global service
- **WhatsApp Business API**: Official API
- **UltraMsg**: Gateway service
- **CallMeBot**: Simple API
## Default User Accounts
### Administrator
- **Username**: admin
- **Password**: admin
- **Access**: Full system management
### Teachers
- **Format**: class[X][Y] (e.g., class1a, class12e)
- **Password**: admin (changeable)
- **Access**: Class-specific students and payments
## Data Management
### Weekly Backups
- Automatically sends CSV backups every Sunday
- Configurable email address (default: kvipin00@gmail.com)
- Includes complete student and payment data
- Manual backup option available
### Data Reset
- Clear all students, payments, or complete system data
- Reset to default state with original user accounts
- Maintains backup settings after reset
## Technical Details
### Technology Stack
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL) or localStorage
- **Build Tool**: Vite
- **Deployment**: Netlify
### File Structure
```
src/
├── components/
│   ├── admin/          # Admin-specific components
│   ├── teacher/        # Teacher-specific components
│   └── common/         # Shared components
├── contexts/           # React contexts for state management
├── lib/               # Utility libraries
└── types/             # TypeScript type definitions
```
### Database Schema
- **students**: Student information and bus details
- **payments**: Payment records with fee breakdown
- **fee_config**: Development fees and bus stop charges
## Usage Guide
### Adding Students
1. Navigate to Student Management
2. Click "Add Student" or import via CSV
3. Fill in required information including bus details
### Recording Payments
1. Go to Payment Management
2. Click "Add Payment"
3. Select student and enter fee amounts
4. System automatically calculates remaining balances
### Generating Reports
1. Access Reports & Analytics
2. Choose report type (class-wise, bus stop-wise, monthly)
3. Apply filters and download CSV
### Printing Receipts
1. Use "Print Receipt" feature for bulk A6 receipts
2. Filter by date or class
3. Receipts include balance information
## Support
For technical support or feature requests, please contact the development team.
## License
This software is developed for Sarvodaya Higher Secondary School, Eachome.