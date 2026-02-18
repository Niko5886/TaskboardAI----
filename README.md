# Taskboard

A modern, Trello-style task management application built with vanilla JavaScript and Supabase. Create projects, organize tasks in customizable columns, and manage your workflow with an intuitive drag-and-drop interface.

![Taskboard](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

- 🔐 **User Authentication** - Secure registration and login with Supabase Auth
- 📋 **Project Management** - Create, edit, and manage multiple projects
- 🎯 **Task Boards** - Visual kanban-style boards for each project
- 🎨 **Task Cards** - Create, edit, delete, and organize tasks
- 🖱️ **Drag & Drop** - Intuitive task movement between columns and reordering
- 👥 **Role-Based Access** - Admin and user roles with appropriate permissions
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🎨 **Modern UI** - Clean interface built with Bootstrap 5

## 🛠️ Tech Stack

### Frontend
- **JavaScript** (ES6+ modules)
- **HTML5** & **CSS3**
- **Bootstrap 5.3** - UI framework
- **Bootstrap Icons** - Icon library
- **Navigo 8** - Client-side routing
- **Vite 6** - Build tool and dev server

### Backend
- **Supabase** - Backend as a Service
- **PostgreSQL** - Database
- **Supabase Auth** - Authentication
- **Supabase REST API** - API layer
- **Row Level Security (RLS)** - Data security

### Deployment
- **Netlify** - Hosting platform

## 📁 Project Structure

```
Taskboard/
├── index.html              # Main HTML entry point
├── package.json            # Dependencies and scripts
├── vite.config.js         # Vite configuration
├── db/                    # Database scripts
│   ├── migrations/        # SQL migration files
│   ├── seed.js           # Data seeding script
│   └── register-users.js # User registration utilities
├── src/
│   ├── main.js           # Application entry point
│   ├── components/       # Reusable UI components
│   │   ├── header/       # Header component
│   │   └── footer/       # Footer component
│   ├── pages/            # Application pages
│   │   ├── index/        # Landing page
│   │   ├── login/        # Login page
│   │   ├── register/     # Registration page
│   │   ├── dashboard/    # User dashboard
│   │   ├── projects/     # Projects list
│   │   ├── projectadd/   # Add new project
│   │   ├── projectedit/  # Edit project
│   │   ├── project/      # Project taskboard view
│   │   └── notfound/     # 404 page
│   ├── router/           # Routing configuration
│   │   ├── router.js     # Router setup
│   │   └── routes.js     # Route definitions
│   ├── styles/           # Global styles
│   │   └── app.css       # Main stylesheet
│   └── utils/            # Utility modules
│       ├── auth.js       # Authentication helpers
│       └── toast.js      # Toast notification helpers
└── prompts/              # Development prompts
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Supabase Account** - [Sign up for free](https://supabase.com)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Niko5886/TaskboardAI----.git
   cd Taskboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Supabase**

   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Get these values from your [Supabase Dashboard](https://app.supabase.com) under Project Settings → API.

4. **Set up the database**

   Run the migrations in your Supabase SQL Editor in order:
   - `20260213_001_initial_taskboard_schema_with_rls.sql`
   - `20260213_002_cleanup_to_four_tables_only.sql`
   - `20260213_003_simplify_task_stage_foreign_keys.sql`
   - `20260213_004_seed_sample_data.sql`
   - `20260213_005_fix_rls_policies_authenticated.sql`
   - `20260213_006_fix_infinite_recursion_rls.sql`
   - `20260218_007_add_mobile_app_project.sql` (optional - adds Mobile App Development project)

### Running the Application

#### Development Mode
```bash
npm run dev
```
Opens the app at `http://localhost:5173`

#### Production Build
```bash
npm run build
```
Generates optimized files in the `dist/` folder

#### Preview Production Build
```bash
npm run preview
```

## 🗄️ Database Schema

The application uses four main tables:

- **users** - User accounts (managed by Supabase Auth)
- **userroles** - User role assignments (admin/user)
- **projects** - Project information
- **tasks** - Task items within projects

All tables are protected with Row Level Security (RLS) policies to ensure data privacy and security.

### Sample Projects

The database includes sample projects with realistic tasks:

#### 📋 Default Projects (from seed data)
- **nik's Project** - Sample project with standard web development tasks
- **maria's Project** - Sample project with standard web development tasks
- **peter's Project** - Sample project with standard web development tasks

#### 📱 Mobile App Development Project (optional)
A specialized project template for mobile app development:
- **Stages:** Backlog, In Development, Testing, Completed
- **Tasks:** 15 pre-configured tasks for React Native development
- **Features:** Authentication, Navigation, UI, API Integration, Push Notifications, Testing
- See [db/MOBILE_APP_PROJECT.md](db/MOBILE_APP_PROJECT.md) for details

To add the Mobile App Development project:
```bash
# Option 1: Run SQL migration in Supabase SQL Editor
# Execute: db/migrations/20260218_007_add_mobile_app_project.sql

# Option 2: Use Node.js seed script
node db/seed-mobile-app.js
```

## 🔐 Authentication & Authorization

- Users must register and authenticate to access the application
- Role-based access control with `admin` and `user` roles
- RLS policies enforce data access restrictions at the database level
- Session management handled by Supabase Auth

## 📱 Pages & Routes

- `/` - Landing page
- `/login` - User login
- `/register` - User registration
- `/dashboard` - User dashboard
- `/projects` - List all projects
- `/projects/add` - Create new project
- `/projects/:id/edit` - Edit project
- `/projects/:id/tasks` - Project taskboard view
- `/admin` - Admin panel (admin only)

## 🎨 UI Guidelines

- Semantic HTML5 structure
- Responsive design using Bootstrap's grid system
- Consistent color scheme and typography
- Bootstrap components for UI elements
- Accessible and user-friendly interface

## 🔄 Database Migrations

When making database schema changes:

1. Create a new migration file in `db/migrations/` with the format: `YYYYMMDD_NNN_description.sql`
2. Apply the migration in Supabase SQL Editor
3. **Never edit existing migrations** after they've been applied
4. Create a new migration for any further changes

## 🚢 Deployment

The application is configured for deployment on Netlify:

1. Build the project: `npm run build`
2. Deploy the `dist/` folder to Netlify
3. Set environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## 🏗️ Architecture

This is a classical client-server application:

- **Frontend**: Vanilla JavaScript SPA with client-side routing
- **Backend**: Supabase (serverless)
- **Database**: PostgreSQL via Supabase
- **API**: Supabase REST API with automatic generation
- **Authentication**: Supabase Auth with JWT tokens

### Design Principles

- **Modular architecture** - Separate files for components, pages, and features
- **ES6 modules** - Clean import/export structure
- **Component-based** - Reusable UI components
- **Service-oriented** - Utility modules for common functionality

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 🔗 Links

- [Supabase Documentation](https://supabase.com/docs)
- [Bootstrap Documentation](https://getbootstrap.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [Navigo Router](https://github.com/krasimir/navigo)

## 📧 Contact

For questions or support, please open an issue in the GitHub repository.

---

Made with ❤️ using Supabase and JavaScript
