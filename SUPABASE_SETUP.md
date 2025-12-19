# Supabase Setup Instructions

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub or create an account
4. Click "New Project"
5. Choose your organization
6. Enter project details:
   - **Name:** Sarvodaya School Fee Management
   - **Database Password:** Create a strong password
   - **Region:** Choose closest to your location
7. Click "Create new project"

## Step 2: Get Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **Anon/Public Key** (starts with `eyJ`)

## Step 3: Configure Environment Variables

1. Open the `.env` file in your project
2. Replace the placeholder values:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Step 4: Database Setup

The database tables will be created automatically when you first run the application with valid Supabase credentials.

### Tables that will be created:
- **users** - User authentication and roles
- **students** - Student information
- **payments** - Payment records
- **fee_config** - Fee configuration settings

## Step 5: Verify Connection

1. Save the `.env` file with your credentials
2. Restart the development server
3. Check the browser console for "✅ Supabase client created successfully"
4. Try logging in - user data will now be stored in Supabase

## Default Login Credentials

- **Admin:** username: `admin`, password: `admin`
- **Clerk:** username: `clerk`, password: `admin`
- **Teachers:** username: `class[X][Y]` (e.g., `class1a`), password: `admin`

## Troubleshooting

### Connection Issues:
- Verify URL and API key are correct
- Check if project is paused (free tier pauses after inactivity)
- Ensure no extra spaces in environment variables

### Database Issues:
- Check Supabase dashboard → Database → Tables
- Verify RLS policies are enabled
- Check logs in Supabase dashboard

### Authentication Issues:
- Clear browser localStorage
- Check user table in Supabase dashboard
- Verify default users were created

## Security Notes

- Never commit `.env` file to version control
- Use Row Level Security (RLS) policies
- Regularly rotate API keys
- Monitor usage in Supabase dashboard

## Support

If you encounter issues:
1. Check Supabase dashboard logs
2. Verify environment variables
3. Check browser console for errors
4. Ensure project is not paused