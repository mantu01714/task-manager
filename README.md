# Team Task Manager SaaS Application

A production-ready, modern Team Task Manager web application designed to help teams collaborate, organize tasks, and track productivity with a beautiful Kanban interface.

## 🚀 Features

- **Authentication System:** Secure JWT-based signup and login with hashed passwords.
- **Role-Based Access Control:** Differentiates between Admin and Member roles for project access.
- **Kanban Board:** Intuitive drag-and-drop interface built with `@dnd-kit/core` to move tasks across statuses (To Do, In Progress, Done).
- **Dashboard Insights:** Real-time metrics tracking total, completed, pending, and overdue tasks.
- **Overdue Task Detection:** Visual highlights for tasks that have passed their due date.
- **Activity Timeline:** Automatically records user actions (task creation, updates, status changes) to provide an audit log.
- **Dark Mode Support:** Seamless toggling between light and dark themes using Tailwind CSS.

## 🛠 Tech Stack

**Frontend:**
- React.js (Vite)
- Tailwind CSS v3
- Axios
- React Router DOM
- @dnd-kit/core (Drag and Drop)
- Lucide React (Icons)

**Backend:**
- Node.js & Express.js
- Prisma ORM
- PostgreSQL
- JWT & Bcrypt (Auth)
- Zod (Input Validation)

## 📦 Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database (Local or Cloud like Neon/Supabase)

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the `.env` file with your PostgreSQL URL:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://user:password@localhost:5432/taskmanager?schema=public"
   JWT_SECRET="your_super_secret_jwt_key"
   ```
4. Run Prisma Migrations to set up the schema:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the environment variables (create a `.env` file):
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

## 🌐 Deployment Guide

### Deploying the Backend & Database (Railway)
1. Create an account on [Railway](https://railway.app/).
2. Create a new project and select **Provision PostgreSQL**.
3. Deploy the backend by connecting your GitHub repository.
4. Set the environment variables (`DATABASE_URL`, `JWT_SECRET`, `PORT`) in Railway's variable dashboard. Railway automatically provides the `DATABASE_URL` from the provisioned Postgres database.
5. In your Railway service settings, set the build command to `npm install && npx prisma generate` and start command to `node src/index.js` or `npx prisma migrate deploy && node src/index.js`.

### Deploying the Frontend (Vercel)
1. Create an account on [Vercel](https://vercel.com/).
2. Import your GitHub repository and select the `frontend` folder as the Root Directory.
3. Set the Build Command to `npm run build` and Output Directory to `dist`.
4. Add the `VITE_API_URL` environment variable pointing to your deployed Railway backend URL.
5. Deploy!

## 📸 Screenshots
*(Add screenshots of your UI here, particularly the Dashboard, Kanban board, and Dark Mode)*
