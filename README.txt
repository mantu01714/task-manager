================================================================================
                    TEAM TASK MANAGER — FULL-STACK WEB APPLICATION
                         Assignment Submission | Full-Stack Development
================================================================================

CANDIDATE INFORMATION
----------------------
  Project Name  : Team Task Manager
  Tech Stack    : React.js, Node.js, Express, PostgreSQL, Prisma ORM
  Architecture  : REST API + SPA (Single Page Application)
  
  LIVE LINKS (Railway)
  --------------------
  Frontend URL  : https://illustrious-determination-production-b2f4.up.railway.app
  Backend API   : https://task-manager-production-5312.up.railway.app/api


================================================================================
                               PROJECT OVERVIEW
================================================================================

Team Task Manager is a production-ready, full-stack SaaS web application that
enables teams to collaborate on projects, assign tasks, and track progress in
real-time through an interactive Kanban board.

The application implements Role-Based Access Control (RBAC) where project
Admins manage teams and tasks, while Members track and update their assignments.


================================================================================
                              FEATURES IMPLEMENTED
================================================================================

  [1] AUTHENTICATION SYSTEM
      - User Signup with full name, email, and password
      - Secure Login with JWT (JSON Web Token) authentication
      - Passwords hashed using bcryptjs (industry standard)
      - Protected routes on both frontend (React) and backend (Express)
      - Auto-redirect to login when session expires

  [2] ROLE-BASED ACCESS CONTROL (RBAC)
      - Two roles: ADMIN and MEMBER (enforced at the database level)
      - ADMIN capabilities:
          * Create projects
          * Invite team members by email
          * Remove members from a project
          * Create and delete tasks
          * Assign tasks to any member
      - MEMBER capabilities:
          * View all projects they belong to
          * View assigned tasks on the Kanban board
          * Update task status via drag-and-drop
          * Cannot invite/remove members or delete tasks

  [3] PROJECT MANAGEMENT
      - Create projects with name and description
      - Invite registered users to projects by email
      - Remove members from a project
      - View all project members with their roles
      - Each project has an isolated Kanban board

  [4] TASK MANAGEMENT
      - Create tasks with: Title, Description, Due Date, and Assignee
      - Assign tasks to specific project members
      - Three task statuses: TODO, IN_PROGRESS, DONE
      - Drag-and-drop Kanban board (powered by @dnd-kit/core)
      - Optimistic UI updates for smooth user experience
      - Status badges on each card (In Progress / Done / Overdue)

  [5] OVERDUE DETECTION
      - Tasks past their due date in the "To Do" column are automatically
        highlighted with a red border and "Overdue" badge
      - Overdue count displayed on the main Dashboard
      - Moving a task to "In Progress" removes the Overdue warning

  [6] ANALYTICS DASHBOARD
      - Total Tasks count
      - Completed Tasks count
      - Pending Tasks count
      - Overdue Tasks count
      - Recent Activity Feed (live audit trail of all team actions)

  [7] AUDIT LOG
      - Every action is logged: task created, moved, deleted, etc.
      - Logs are stored in the ActivityLog database table
      - Recent activity is displayed on the Dashboard


================================================================================
                                 TECH STACK
================================================================================

  FRONTEND
  --------
  - React.js (with Hooks)          — UI framework
  - Vite                           — Build tool
  - Tailwind CSS                   — Utility-first styling
  - React Router DOM               — Client-side routing
  - Axios                          — HTTP client with JWT interceptor
  - @dnd-kit/core                  — Drag-and-drop Kanban board
  - lucide-react                   — Icon library

  BACKEND
  -------
  - Node.js + Express.js           — REST API server
  - Prisma ORM                     — Type-safe database client
  - PostgreSQL                     — Relational database
  - JSON Web Token (JWT)           — Stateless authentication
  - bcryptjs                       — Password hashing
  - Zod                            — Input validation schemas
  - CORS + dotenv                  — Security & configuration


================================================================================
                             DATABASE SCHEMA
================================================================================

  User
  ----
  id, name, email (unique), password (hashed), createdAt

  Project
  -------
  id, name, description, createdAt

  ProjectMember  (Junction Table — RBAC)
  -------------
  id, projectId (FK), userId (FK), role (ADMIN | MEMBER)

  Task
  ----
  id, title, description, status (TODO | IN_PROGRESS | DONE),
  dueDate, projectId (FK), assigneeId (FK → User), createdAt, updatedAt

  ActivityLog
  -----------
  id, userId (FK), action (string), timestamp


================================================================================
                            REST API ENDPOINTS
================================================================================

  AUTH ROUTES  (/api/auth)
  -------------------------
  POST   /api/auth/register        — Register a new user
  POST   /api/auth/login           — Login and receive JWT token
  GET    /api/auth/me              — Get current user (protected)

  PROJECT ROUTES  (/api/projects)  [All Protected]
  -------------------------------------------------
  POST   /api/projects             — Create a new project (Admin)
  GET    /api/projects             — Get all projects for current user
  GET    /api/projects/:id         — Get a single project with tasks & members
  POST   /api/projects/:id/members       — Add a member by email (Admin only)
  DELETE /api/projects/:id/members/:uid  — Remove a member (Admin only)

  TASK ROUTES  (/api/tasks)  [All Protected]
  ------------------------------------------
  POST   /api/tasks                — Create a task (project member)
  PUT    /api/tasks/:id            — Update task status/details
  DELETE /api/tasks/:id            — Delete a task (Admin only)
  GET    /api/tasks/stats          — Get dashboard statistics


================================================================================
                           VALIDATION & SECURITY
================================================================================

  - All API inputs validated using Zod schemas (type + format checking)
  - Passwords stored as bcrypt hashes (never plain text)
  - JWT tokens expire after 7 days
  - Every protected route verifies the JWT on every request
  - Role checks enforced at the controller level (not just frontend)
  - CORS configured to allow only frontend origin
  - Environment variables used for all secrets (never hardcoded)


================================================================================
                           HOW TO RUN LOCALLY
================================================================================

  PREREQUISITES
  -------------
  - Node.js v18+
  - PostgreSQL (running locally or a cloud instance like Neon.tech)

  STEP 1 — CLONE / EXTRACT THE PROJECT
  --------------------------------------
  Extract the zip file to any folder.

  STEP 2 — CONFIGURE ENVIRONMENT VARIABLES
  -----------------------------------------
  Open:  backend/.env

  Update with your PostgreSQL credentials:

      PORT=5000
      DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/taskmanager?schema=public"
      JWT_SECRET="your-secret-key-here"

  STEP 3 — INSTALL BACKEND DEPENDENCIES
  ---------------------------------------
  Open a terminal in the project root:

      cd backend
      npm install

  STEP 4 — SET UP THE DATABASE
  -----------------------------
  Push the Prisma schema to create all tables:

      npx prisma generate
      npx prisma db push

  STEP 5 — START THE BACKEND SERVER
  -----------------------------------
      npm run dev

  You should see:  "Server running on port 5000"

  STEP 6 — INSTALL FRONTEND DEPENDENCIES
  ----------------------------------------
  Open a NEW terminal:

      cd frontend
      npm install

  STEP 7 — START THE FRONTEND
  ----------------------------
      npm run dev

  Open your browser at:  http://localhost:5173


================================================================================
                            HOW TO TEST THE APP
================================================================================

  TESTING ROLE-BASED ACCESS CONTROL:
  ------------------------------------
  1. Open http://localhost:5173 and register as User A (this is the Admin).
  2. Click "New Project" and create a project.
  3. Open the project board — click "Invite Member".
  4. In a different browser/incognito window, register as User B.
  5. Go back to User A's window, invite User B using their email.
  6. Log in as User B — the project now appears on their Dashboard!
  7. As User B, verify you CANNOT see the "Invite Member" button.
  8. As User B, drag a task — status updates live in the database.

  TESTING OVERDUE DETECTION:
  ---------------------------
  1. Create a task with today's date as the due date.
  2. The task immediately shows an "Overdue" badge (red).
  3. Drag the task to "In Progress" — the Overdue badge disappears.
  4. Drag it to "Done" — the Done badge appears in green.


================================================================================
                              PROJECT STRUCTURE
================================================================================

  task-manager/
  ├── backend/
  │   ├── prisma/
  │   │   └── schema.prisma          ← Database models
  │   ├── src/
  │   │   ├── controllers/
  │   │   │   ├── auth.controller.js
  │   │   │   ├── project.controller.js
  │   │   │   └── task.controller.js
  │   │   ├── middlewares/
  │   │   │   └── auth.middleware.js  ← JWT verification
  │   │   ├── routes/
  │   │   │   ├── auth.routes.js
  │   │   │   ├── project.routes.js
  │   │   │   └── task.routes.js
  │   │   ├── utils/
  │   │   │   └── prisma.js           ← Prisma client instance
  │   │   └── index.js                ← Express app entry point
  │   ├── .env                        ← Environment variables
  │   └── package.json
  │
  └── frontend/
      ├── src/
      │   ├── api/
      │   │   └── axios.js            ← Axios with JWT interceptor
      │   ├── components/
      │   │   └── Layout.jsx          ← Sidebar + Topbar layout
      │   ├── context/
      │   │   └── AuthContext.jsx     ← Global auth state
      │   ├── pages/
      │   │   ├── Login.jsx
      │   │   ├── Register.jsx
      │   │   ├── Dashboard.jsx       ← Stats + Activity Feed
      │   │   └── ProjectBoard.jsx    ← Kanban board
      │   ├── App.jsx                 ← Routes + PrivateRoute guard
      │   └── index.css
      └── package.json


================================================================================
                          DEPLOYMENT INFORMATION
================================================================================

  BACKEND (Railway.app)
  ---------------------
  - Root Directory  : backend/
  - Build Command   : npm install && npx prisma generate
  - Start Command   : npm start
  - Environment Vars: DATABASE_URL, JWT_SECRET, PORT

  FRONTEND (Railway.app)
  ----------------------
  - Root Directory  : frontend/
  - Build Method    : Dockerfile (provided)
  - Environment Vars: VITE_API_URL=https://task-manager-production-5312.up.railway.app/api
  - Live URL        : https://illustrious-determination-production-b2f4.up.railway.app


================================================================================
                               ASSIGNMENT CHECKLIST
================================================================================

  [x] Authentication — Signup / Login with JWT
  [x] Role-Based Access Control — Admin & Member roles
  [x] Project Management — Create, view, manage team
  [x] Task Management — Create, assign, update status
  [x] Kanban Board — Drag-and-drop with 3 columns
  [x] Dashboard Analytics — Stats + overdue count
  [x] Overdue Detection — Auto-flagging past-due tasks
  [x] Audit Log — Activity feed tracking all actions
  [x] REST APIs — Full CRUD with proper HTTP methods
  [x] SQL Database — PostgreSQL with relational schema
  [x] Input Validation — Zod schemas on all endpoints
  [x] Password Security — bcrypt hashing
  [x] Proper Relationships — Foreign keys across all tables
  [x] Protected Routes — Frontend + backend both secured


================================================================================
                                END OF README
================================================================================
