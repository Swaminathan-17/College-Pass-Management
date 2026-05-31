# College Pass Management System (CPMS)

A comprehensive web application for digitizing and managing student outpass requests in educational institutions.

## Features

- **Student Dashboard**: Request passes, view history, download PDF passes
- **Faculty Dashboard**: Approve/reject student pass requests
- **Warden Dashboard**: Final approval for faculty-approved passes
- **Security Dashboard**: Verify passes using roll number and pass code, mark exit/return times
- **Admin Dashboard**: View analytics and system statistics
- **Email Notifications**: Automated emails for faculty, students, and parents
- **PDF Generation**: System-generated digital passes with unique codes
- **Role-based Authentication**: Secure login system for all user types

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcrypt for password hashing
- PDFKit for PDF generation
- Nodemailer for email notifications
- UUID for pass code generation

### Frontend
- React (Vite)
- Tailwind CSS
- React Router
- Axios for API calls

## Installation

### Prerequisites
- Node.js (v18+)
- MongoDB
- Gmail account with app password for email notifications

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file with the following variables:
```
MONGO_URI=mongodb://localhost:27017/college-pass-management
JWT_SECRET=your-secret-key-here
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
PORT=5000
```

4. Start the backend server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm run dev
```

## Usage

1. **Registration**: Users can register with their respective roles (student, faculty, warden, security, admin)
2. **Student Pass Request**: Students fill out a form with pass details
3. **Faculty Approval**: Faculty receive notifications and can approve/reject requests
4. **Warden Approval**: Warden provides final approval for faculty-approved requests
5. **Pass Generation**: System generates unique pass codes and PDF passes
6. **Email Notifications**: Automated emails sent to all stakeholders
7. **Security Verification**: Security personnel verify passes using roll number and pass code
8. **Exit/Return Tracking**: Security marks entry and exit times

## Database Models

### User
- name, email, password, role

### Student
- userId, rollNo, department, year, phone, parentPhone, parentEmail, violationCount, isBlocked

### PassRequest
- studentId, passType, reason, destination, outDate, outTime, expectedReturnTime, status, passCode, facultyRemark, wardenRemark, exitTime, returnTimeActual, pdfUrl, emailSent

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login

### Pass Management
- POST /api/pass/request (Student)
- GET /api/pass/history (Student)
- PUT /api/pass/faculty-approve/:id (Faculty)
- PUT /api/pass/faculty-reject/:id (Faculty)
- PUT /api/pass/warden-approve/:id (Warden)
- PUT /api/pass/warden-reject/:id (Warden)
- POST /api/pass/verify (Security)
- PUT /api/pass/exit/:id (Security)
- PUT /api/pass/return/:id (Security)
- GET /api/pass/pending (Faculty/Warden)

### Admin
- GET /api/admin/analytics

## Workflow

1. Student submits pass request → Status: REQUESTED
2. Faculty approves/rejects → Status: FACULTY_APPROVED or REJECTED
3. Warden approves/rejects → Status: WARDEN_APPROVED or REJECTED
4. System generates pass code and PDF → Status: WARDEN_APPROVED
5. Student shows pass to security → Status: OUTSIDE
6. Student returns → Status: RETURNED

## File Structure

```
College-GPM/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── uploads/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   └── services/
│   └── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

# College-Pass-Management
Final Year College Project
