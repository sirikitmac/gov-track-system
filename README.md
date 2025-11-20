# BuildTrack-LGU System

A comprehensive governance platform for managing the complete lifecycle of Local Government Unit (LGU) projects—from planning and budgeting to procurement, implementation, and public transparency.

<img width="1856" height="939" alt="image" src="https://github.com/user-attachments/assets/c6958e02-ad8e-43c6-9cf2-fee53bea0985" />
<img width="1860" height="942" alt="image" src="https://github.com/user-attachments/assets/b2eb772c-ff5c-4ab5-8120-0f69d45efd48" />
<img width="1863" height="940" alt="image" src="https://github.com/user-attachments/assets/e3b2e121-9626-4311-acc1-e2790aba8e80" />

## 🎯 Overview

BuildTrack-LGU digitizes and streamlines the entire project management workflow for local government units in the Philippines. The system ensures transparency, accountability, and efficiency throughout the project lifecycle.

### Key Features

- **Project Planning & Proposal Management** - Submit, review, and prioritize project proposals
- **Budget Allocation & Tracking** - Manage approved budgets, disbursements, and fund sources
- **Procurement Automation** - Handle public bidding process from invitation to contract award
- **Real-Time Project Monitoring** - Track progress with milestone management and approval workflows
- **Public Transparency Portal** - Citizens can view all projects with interactive map, budget info, and progress updates
- **Role-Based Access Control** - 9 distinct user roles with tailored permissions
- **Advanced Data Tables** - Search, sort, and paginate all listing pages
- **Modern UI/UX** - Custom theme with gradient cards and responsive design

---

> **Admin Access:**
> Email: `annieneshreend@gmail.com`
> Pass: `annie04`

---

## 🚀 Quick Start Guide

### Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- A Supabase account (free tier works)
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd track-lgu-system-main
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Set Up Supabase Database

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish setting up (~2 minutes)
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the contents of `scripts/00-complete-setup.sql`
6. Paste into the SQL Editor
7. Click **Run** (or press Ctrl/Cmd + Enter)
8. Wait for execution to complete (~10 seconds)

✅ Your database is now fully set up!

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Run the setup script
supabase db push --include-seed scripts/00-complete-setup.sql
```

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**To find your Supabase credentials:**
1. Go to your Supabase project dashboard
2. Click **Settings** (gear icon) in the left sidebar
3. Click **API** in the settings menu
4. Copy **Project URL** → use as `NEXT_PUBLIC_SUPABASE_URL`
5. Copy **anon public** key → use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 5. Run the Development Server

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. (Optional) Seed Mock Data

To populate your database with test data (1000+ records):

1. Go to Supabase Dashboard → SQL Editor
2. Open `scripts/seed-mock-data.sql`
3. Copy and paste the contents
4. Click **Run**

This will create:
- Sample users (all roles)
- Sample projects (all statuses)
- Sample contractors
- Sample bids
- Sample milestones
- Sample project updates

---

## 👥 User Roles & Access

The system supports 9 distinct user roles:

### 1. **System Administrator**
- Full system access
- User management
- View all projects and data
- System configuration

### 2. **Planner**
- Submit project proposals
- Upload feasibility studies
- Track proposal status
- View own projects

### 3. **Development Council (LDC)**
- Review submitted proposals
- Prioritize projects for AIP
- Generate Annual Investment Program
- Approve/reject proposals

### 4. **Legislator**
- View all projects
- Access budget information
- Review project progress
- Oversight functions

### 5. **Budget Officer**
- Allocate budgets to prioritized projects
- Track disbursements
- Manage fund source codes
- Budget utilization reports

### 6. **BAC Secretariat**
- Create bid invitations
- Manage public bidding process
- Evaluate contractor bids
- Award contracts

### 7. **Technical Inspector**
- Monitor project implementation
- Create and manage milestones
- Approve contractor updates
- Track project progress

### 8. **Contractor**
- View assigned projects
- Submit progress updates
- Upload photos and reports
- Track milestones

### 9. **Public User**
- View active projects on map
- See project details (budget, progress, contractor)
- Access transparency portal
- No login required for viewing

---

## 🗂️ Project Structure

```
track-lgu-system-main/
├── app/                          # Next.js 14 App Router
│   ├── page.tsx                 # Landing page
│   ├── globals.css              # Global styles & theme
│   ├── auth/                    # Authentication pages
│   │   ├── login/
│   │   ├── sign-up/
│   │   └── logout/
│   ├── dashboard/               # Role-based dashboards
│   │   ├── admin/
│   │   ├── planner/
│   │   ├── ldc/
│   │   ├── budget/
│   │   ├── bac/
│   │   ├── inspector/
│   │   └── notifications/
│   └── projects/                # Public projects portal
│       └── [id]/               # Project details page
├── components/                  # React components
│   ├── ui/                     # shadcn/ui components
│   │   ├── data-table.tsx      # Reusable DataTable
│   │   ├── charts.tsx          # Chart components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── admin/                  # Admin-specific components
│   ├── planner/                # Planner components
│   ├── ldc/                    # LDC components
│   ├── budget/                 # Budget components
│   ├── bac/                    # BAC components
│   ├── inspector/              # Inspector components
│   ├── sidebar.tsx             # Main navigation sidebar
│   ├── top-navbar.tsx          # Top navigation bar
│   └── dashboard-layout.tsx    # Dashboard wrapper
├── lib/                        # Utility libraries
│   ├── supabase/              # Supabase clients
│   │   ├── client.ts          # Client-side
│   │   ├── server.ts          # Server-side
│   │   └── middleware.ts      # Middleware
│   └── utils.ts               # Helper functions
├── scripts/                    # Database scripts
│   ├── 00-complete-setup.sql  # ⭐ MAIN SETUP SCRIPT (USE THIS!)
│   ├── seed-mock-data.sql     # Test data seeding
│   └── 01-10...sql           # (Legacy - now consolidated)
├── public/                     # Static assets
├── .env.local                 # Environment variables (create this)
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── next.config.mjs            # Next.js config
└── README.md                  # This file
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Tables**: @tanstack/react-table
- **Icons**: lucide-react
- **Theme**: next-themes

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-Time**: Supabase Realtime (optional)

### Database Features
- **Row Level Security** - All tables protected
- **Automatic Triggers** - User profile creation
- **JWT Claims** - Role-based access
- **Audit Logging** - Project history tracking

---

## 📝 Common Tasks

### Creating a New User Account

1. Go to `/auth/sign-up`
2. Fill in the form (email, password, name, role)
3. Click **Sign Up**
4. **Important**: After first signup, users must **log out and log back in** for role permissions to work correctly

### Adding Mock Data

```sql
-- Run in Supabase SQL Editor
-- This creates 1000+ test records
\i scripts/seed-mock-data.sql
```
### Issue: "Can't run development server"

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or with pnpm
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Then run dev server
npm run dev
```

---

## 📚 Additional Documentation

### Database Schema Diagram
See `scripts/00-complete-setup.sql` for complete schema with comments.

### API Documentation
- Supabase automatically generates REST API
- Access at: `https://your-project.supabase.co/rest/v1/`
- Use with `Authorization: Bearer YOUR_ANON_KEY`

---

## 🤝 Contributing

For questions or contributions:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database and Auth by [Supabase](https://supabase.com/)
- Icons from [Lucide](https://lucide.dev/)
