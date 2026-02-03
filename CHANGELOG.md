# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-01-28

### 🎉 Initial Release

First stable release of Watheeq MVP - Law Firm Management System.

### Added

#### Authentication & Users
- JWT-based authentication system
- User registration with automatic firm creation
- Role-based access control (OWNER, ADMIN, LAWYER, SECRETARY)
- Profile management with avatar upload
- Password change functionality
- User management (CRUD) for admins

#### Cases Module
- Full CRUD operations for legal cases
- Case number auto-generation (CASE-YYYY-XXX)
- Multiple case types (Civil, Criminal, Commercial, Labor, Family, Administrative)
- Status tracking (Active, Pending, Closed, Archived)
- Client and assignee association
- Advanced filtering and search

#### Clients Module
- Client management for individuals and companies
- Contact information storage
- ID/Commercial registration tracking
- Client-case relationship

#### Hearings Module
- Hearing scheduling and management
- Calendar view with month navigation
- Status tracking (Scheduled, Completed, Postponed, Cancelled)
- Case association
- Date range filtering

#### Documents Module
- File upload with drag-and-drop support
- Document preview (images, PDFs)
- Download functionality
- Categorization by type
- Case and client association

#### Invoices Module
- Invoice creation with line items
- Automatic total calculation
- Invoice number generation (INV-YYYY-XXX)
- Payment status tracking (Pending, Paid, Overdue, Cancelled)
- Print functionality
- Invoice statistics

#### Settings Module
- Profile settings with avatar
- Firm settings with logo
- User management panel
- Notification preferences

#### Dashboard
- Statistics overview
- Recent cases widget
- Upcoming hearings widget
- Financial summary

#### UI/UX
- Full RTL (Arabic) support
- Dark/Light theme toggle
- Responsive design (mobile-first)
- Loading skeletons
- Empty state components
- Toast notifications
- Confirmation dialogs
- Smooth CSS animations
- Accessibility features (focus states, reduced-motion)

#### DevOps
- Docker support (development and production)
- Docker Compose configurations
- Nginx reverse proxy setup
- GitHub Actions CI/CD pipeline
- Shell scripts for common tasks
- Comprehensive environment examples

#### Documentation
- README with quick start guide
- Contributing guidelines
- API documentation
- Frontend development guide
- Deployment guide (Arabic)
- MIT License

---

## [0.9.0] - 2026-01-27

### Added
- Settings module (Profile, Users, Firm, Notifications)
- Confirmation dialog component
- Empty state component
- Skeleton loading components

### Changed
- Implemented lazy loading for all routes
- Optimized bundle size (537KB → 308KB)
- Enhanced animations and transitions

---

## [0.8.0] - 2026-01-26

### Added
- Invoices module with full CRUD
- Invoice printing functionality
- Invoice statistics

---

## [0.7.0] - 2026-01-25

### Added
- Documents module with upload/download
- File preview modal
- Drag and drop upload

---

## [0.6.0] - 2026-01-24

### Added
- Hearings module
- Calendar component
- Date range filtering

---

## [0.5.0] - 2026-01-23

### Added
- Clients module with full CRUD
- Client type filtering
- Client-case relationship

---

## [0.4.0] - 2026-01-22

### Added
- Cases module with full CRUD
- Status and type filtering
- Search functionality

---

## [0.3.0] - 2026-01-21

### Added
- Dashboard with statistics
- Side navigation
- Header component
- Theme toggle

---

## [0.2.0] - 2026-01-20

### Added
- Authentication system
- Login page
- Registration page
- JWT token handling

---

## [0.1.0] - 2026-01-19

### Added
- Initial project setup
- NestJS backend with Prisma
- React frontend with Vite
- Database schema design
- Basic UI components (Shadcn/ui)

---

## Future Roadmap

### [1.1.0] - Planned
- [ ] Email notifications
- [ ] Dashboard charts
- [ ] Export to Excel/PDF
- [ ] Advanced search

### [1.2.0] - Planned
- [ ] Real-time notifications
- [ ] Calendar drag-and-drop
- [ ] Audit logging
- [ ] Mobile app (React Native)

---

[1.0.0]: https://github.com/your-username/watheeq-mvp/releases/tag/v1.0.0
[0.9.0]: https://github.com/your-username/watheeq-mvp/releases/tag/v0.9.0
