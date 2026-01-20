# AutoService - Automotive Service Management System

A comprehensive web-based automotive service management system built with React, TypeScript, Supabase, and Tailwind CSS.

## Features

### Role-Based Access Control
- **Admin**: Full system control, service request management, mechanic assignment, user oversight
- **Mechanic**: Service execution, status updates, job queue management, billing
- **Customer**: Service requests, order tracking, vehicle management

### Core Functionality

#### Customer Portal
- Create and track service requests
- Manage multiple vehicles
- View service history and status updates
- Real-time request status tracking

#### Admin Dashboard
- Approve/reject service requests
- Assign mechanics to jobs
- Manage service pricing and estimates
- View system analytics
- Manage users (customers and mechanics)
- Vehicle database management

#### Mechanic Portal
- View assigned service queue
- Update job status in real-time
- Add work notes and documentation
- Set final billing costs
- Track completed jobs

### Service Types Available
- Engine Overhaul
- Automatic Transmission Overhaul
- Manual Transmission Overhaul
- Suspension System
- Wiring/Electrical
- ECU Service
- ABS System
- Central Lock
- Racing ECU Installation
- Paint & Body Repair
- Vehicle Inspection

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with AdminLTE-inspired design
- **Backend**: Supabase (PostgreSQL database with Row Level Security)
- **Authentication**: Supabase Auth
- **Routing**: React Router v6
- **State Management**: React Context API

## Getting Started

### Prerequisites
- Node.js 16+
- Supabase account and project

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. The Supabase database is already configured with environment variables.

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Database Structure

The system uses the following database tables:
- `profiles` - User profiles with role information
- `vehicles` - Customer vehicle information
- `service_requests` - Service request details and status
- `status_history` - Audit trail of status changes
- `service_photos` - Documentation photos (optional)

All tables are protected with Row Level Security (RLS) policies ensuring data isolation and security.

## User Roles

### Creating Demo Users

To test the system, you can create users with different roles:

1. **Customer Account** (automatically created during registration)
   - Register at `/register`
   - Default role: customer

2. **Admin Account** (requires database access)
   - Create a user via registration
   - Update the role in the profiles table:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = 'user-id-here';
   ```

3. **Mechanic Account** (requires database access)
   - Create a user via registration
   - Update the role in the profiles table:
   ```sql
   UPDATE profiles SET role = 'mechanic' WHERE id = 'user-id-here';
   ```

## Features Highlight

### Theme System
- Light and dark mode support
- Persistent theme preference
- Smooth transitions

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interface

### Security
- Row Level Security on all tables
- Authentication required for all operations
- Role-based access control
- Secure data isolation

### Real-time Updates
- Status changes tracked with history
- Instant dashboard updates
- Live service queue management

## Project Structure

```
src/
├── components/
│   ├── layout/          # Layout components (Sidebar, Header, etc.)
│   ├── ui/              # Reusable UI components
│   └── ProtectedRoute.tsx
├── contexts/            # React Context providers
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── lib/                 # Utilities and configurations
│   ├── supabase.ts
│   └── database.types.ts
├── pages/
│   ├── admin/          # Admin module pages
│   ├── customer/       # Customer module pages
│   ├── mechanic/       # Mechanic module pages
│   ├── Login.tsx
│   └── Register.tsx
└── App.tsx             # Main application with routing
```

## Contributing

This is a production-ready automotive service management system. Feel free to extend it with additional features such as:
- SMS/Email notifications
- Advanced reporting and analytics
- Invoice generation and printing
- Parts inventory management
- Customer appointment scheduling
- Payment processing integration

## License

MIT License - feel free to use this project for your automotive service business!
