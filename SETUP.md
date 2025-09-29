# Dbstuff.ai - Setup Instructions

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or hosted like Neon, Supabase, Railway)
- Google Cloud Project (for OAuth - optional for MVP)
- Gemini API key from Google AI Studio

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local with your values
```

Required environment variables:

```env
# Database (your main app database)
DATABASE_URL="postgresql://user:pass@localhost:5432/dbstuff"

# NextAuth
NEXTAUTH_SECRET="generate-random-string-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional for MVP - email/password works)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Gemini AI (REQUIRED)
GEMINI_API_KEY="your-gemini-api-key"

# Encryption Key (REQUIRED for database credentials)
ENCRYPTION_KEY="your-32-character-key"
```

### 3. Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64').slice(0, 32))"
```

### 4. Generate NextAuth Secret

```bash
openssl rand -base64 32
```

### 5. Get Gemini API Key

1. Go to <https://aistudio.google.com/apikey>
2. Create a new API key
3. Copy it to your `.env.local`

### 6. Setup Database

```bash
# Generate migrations
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Open Drizzle Studio to view database
npm run db:studio
```

### 7. Run Development Server

```bash
npm run dev
```

Visit <http://localhost:3000>

## Testing the App

### 1. Sign Up

- Go to <http://localhost:3000>
- Click "Start Free"
- Create an account with email/password

### 2. Add Database Connection

- After signing in, you'll be redirected to add a connection
- Use "Connection URL" mode for hosted databases (Neon, Supabase)
- Or use "Manual Entry" for local databases

Example Neon connection string:

```
postgresql://user:password@ep-xxx.aws.neon.tech/dbname?sslmode=require
```

### 3. Start Querying

- Once connected, go to the Chat interface
- Ask questions like:
  - "Show me all tables"
  - "What are the column names in the users table?"
  - "Count total records in each table"

## Features Working

✅ Landing page
✅ Email/password authentication
✅ Google OAuth (if configured)
✅ Database connection management (PostgreSQL)
✅ Connection URL support (Neon, Supabase, etc.)
✅ AI-powered SQL generation
✅ Query execution and visualization
✅ Usage tracking (10 queries/day for free users)
✅ Query history

## Next Steps (Not Built Yet)

- Stripe billing integration
- Dashboard creation
- Export functionality
- Advanced usage analytics
- Team features (organizations)

## Troubleshooting

### "useSession must be wrapped in SessionProvider"

- Make sure you have `app/layout.tsx` and `app/providers.tsx` properly set up
- This should already be configured

### Cannot connect to database

- Check your DATABASE_URL is correct
- Make sure PostgreSQL is running
- Try testing with `psql` command line first

### AI queries failing

- Verify GEMINI_API_KEY is set correctly
- Check you have API quota available
- Look at server logs for specific errors

### Encryption errors

- Make sure ENCRYPTION_KEY is exactly 32 characters
- Regenerate if needed using the command above

## Support

For issues, check:

1. Browser console for frontend errors
2. Terminal/server logs for backend errors
3. Database logs if connection issues

## Production Deployment

For Vercel deployment:

1. Push code to GitHub
2. Import project in Vercel
3. Add all environment variables
4. Deploy!

Make sure to:

- Use production database
- Set NODE_ENV=production
- Update NEXTAUTH_URL to your domain
