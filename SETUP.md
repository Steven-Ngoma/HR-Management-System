# 🚀 HR Management System - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
# Install root dependencies
npm install

# Install all project dependencies (backend + frontend)
npm run install-deps
```

### 2. Environment Setup

#### Backend Environment
Create `backend/.env` file:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/hr_management
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_complex
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

#### Frontend Environment
Create `frontend/.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Database Setup

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. The application will create the database automatically

#### Option B: MongoDB Atlas (Cloud)
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get the connection string
4. Update `MONGODB_URI` in backend/.env

### 4. Start the Application
```bash
# Start both frontend and backend concurrently
npm run dev

# Or start them separately:
# Backend (Terminal 1)
cd backend && npm run dev

# Frontend (Terminal 2)
cd frontend && npm run dev
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **API Health Check**: http://localhost:5000/api/health

## 🔐 Default Login Credentials

### Admin Account
- **Email**: admin@hrms.com
- **Password**: admin123

### HR Account
- **Email**: hr@hrms.com
- **Password**: hr123

### Employee Account
- **Email**: employee@hrms.com
- **Password**: emp123

## 📁 Project Structure

```
hr-management-system/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── utils/          # Utility functions
│   │   └── app.ts          # Express app setup
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # React + TypeScript UI
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── vite.config.ts
├── package.json            # Root package.json
└── README.md
```

## 🛠️ Development Commands

### Root Level
```bash
npm run dev          # Start both frontend and backend
npm run build        # Build both projects
npm run install-deps # Install all dependencies
npm run lint         # Lint both projects
npm run test         # Run all tests
```

### Backend Commands
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build TypeScript
npm start            # Start production server
npm run lint         # Lint code
npm test             # Run tests
```

### Frontend Commands
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
npm test             # Run tests
```

## 🔧 Configuration

### Backend Configuration
- **Port**: 5000 (configurable via PORT env var)
- **Database**: MongoDB (local or Atlas)
- **Authentication**: JWT tokens
- **CORS**: Configured for frontend origin

### Frontend Configuration
- **Port**: 3000 (Vite default)
- **API Proxy**: Configured in vite.config.ts
- **Styling**: Tailwind CSS
- **State Management**: React Query + Context

## 📊 Features Implemented

### ✅ Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, HR, Employee)
- Secure password hashing
- Session management

### ✅ Employee Management
- Complete employee profiles
- CRUD operations
- Department and role management
- Employee statistics

### ✅ Attendance Tracking
- Clock in/out functionality
- Attendance history
- Working hours calculation
- Overtime tracking

### ✅ Payroll Management
- Salary calculations
- Tax and deduction management
- Payslip generation
- Payroll history

### ✅ Dashboard & Analytics
- Real-time statistics
- Attendance trends
- Department analytics
- Performance metrics

### ✅ User Interface
- Responsive design
- Modern UI with Tailwind CSS
- Interactive components
- Mobile-friendly

## 🚀 Deployment

### Backend Deployment
1. Build the project: `npm run build`
2. Set production environment variables
3. Deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend Deployment
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Configure environment variables for production API URL

### Environment Variables for Production
```env
# Backend
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
CORS_ORIGIN=your_frontend_domain

# Frontend
VITE_API_URL=your_backend_api_url
```

## 🔍 Troubleshooting

### Common Issues

#### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in .env
- Verify network connectivity for Atlas

#### Port Already in Use
- Change PORT in backend/.env
- Update VITE_API_URL in frontend/.env
- Kill existing processes on ports 3000/5000

#### CORS Errors
- Verify CORS_ORIGIN in backend/.env
- Check API URL in frontend/.env
- Ensure both servers are running

#### Build Errors
- Clear node_modules and reinstall
- Check TypeScript errors
- Verify all dependencies are installed

### Getting Help
1. Check the console for error messages
2. Verify environment variables are set correctly
3. Ensure all dependencies are installed
4. Check if both servers are running

## 📝 Next Steps

### Potential Enhancements
- [ ] Email notifications
- [ ] File upload for documents
- [ ] Advanced reporting
- [ ] Leave management system
- [ ] Performance reviews
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Mobile app

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**Happy Coding! 🎉**