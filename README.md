# Roguard

Advanced Lua script obfuscator for Roblox with email/password authentication, user management, and detailed execution analytics.

## Features

### 🔐 Authentication
- **Email/Password Authentication** - Secure bcrypt-hashed passwords
- **Guest Login** - Quick access without registration
- **JWT Sessions** - Secure token-based authentication with 1-year expiration
- **Protected Routes** - Dashboard and advanced features require login

### 🎭 Obfuscation Engine (v2.0 - Advanced)
- **80+ Custom Opcodes** - Full virtual machine emulation with custom instruction set
- **5-Layer Encryption** - Polymorphic encryption with 5 unique algorithms
- **2000+ Bytes Junk Code** - Intelligent dead code injection for added obfuscation
- **Control Flow Obfuscation** - Configurable intensity (1-10) for maximum security
- **Anti-Decompilation Measures** - Detects and blocks decompiler attempts
- **Polymorphic String Wrapping** - Multiple methods for string encoding
- **Custom VM** - Proprietary bytecode that only Roguard understands

### 📊 Analytics & Management
- **Execution Logs** - Track script usage with timestamp, game info, executor details
- **HWID Banning** - Hardware ID blocking and management
- **User Statistics** - Script execution count, top scripts, recent activity
- **Remote Loaders** - Manage and deploy scripts via HTTP endpoints
- **Alerts & Notifications** - Bypass attempts, ban notifications, suspicious activity

### 🚀 Deployment
- **Render.com Ready** - Production-ready deployment configuration
- **Docker Support** - Container-based deployments
- **MySQL Database** - Persistent data storage
- **S3 Integration** - Cloud script storage

## Tech Stack

- **Frontend:** React 19.2, Vite 7.1, TailwindCSS 4.1, Wouter routing
- **Backend:** Node.js, Express, tRPC 11.6
- **Database:** MySQL with Drizzle ORM 0.44
- **Security:** Bcrypt (password hashing), jose (JWT), crypto
- **Tooling:** TypeScript, Vitest, pnpm

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+ (`npm install -g pnpm`)
- MySQL 8.0+

### Installation

```bash
# Clone repository
git clone <repository-url>
cd roguard

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Apply database migrations
pnpm db:push

# Start development server
pnpm dev
```

The app will be available at `http://localhost:5173`

## Environment Variables

### Required
```env
# JWT secret for session tokens (minimum 32 characters)
JWT_SECRET=your-secret-key-here

# MySQL database connection
DATABASE_URL=mysql://user:password@host:port/database
```

### Optional
```env
# Forge API for advanced features
BUILT_IN_FORGE_API_URL=https://forge.api.example.com
BUILT_IN_FORGE_API_KEY=your-api-key

# Node environment
NODE_ENV=production
```

## Project Structure

```
roguard/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── GuestLogin.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── ...
│   │   ├── components/       # Reusable components
│   │   ├── hooks/            # Custom hooks (useAuth, etc)
│   │   └── styles/           # TailwindCSS styling
│   └── vite.config.ts
│
├── server/                    # Express backend
│   ├── _core/
│   │   ├── sdk.ts           # Authentication & session logic
│   │   ├── context.ts       # tRPC context setup
│   │   ├── cookies.ts       # Cookie utilities
│   │   └── ...
│   ├── routers.ts           # tRPC endpoint definitions
│   ├── db.ts                # Database operations
│   ├── obfuscator.ts        # Lua obfuscation engine
│   └── storage.ts           # S3 file handling
│
├── drizzle/                   # Database schema & migrations
│   ├── schema.ts            # Table definitions
│   └── relations.ts         # Foreign keys
│
├── shared/                    # Shared code
│   ├── types.ts             # Type exports
│   └── const.ts             # Constants (session, cookie names)
│
├── render.yaml              # Render.com deployment config
├── Dockerfile               # Container setup
└── package.json            # Dependencies
```

## API Documentation

All endpoints are tRPC-based with full type safety.

### Authentication Endpoints
```typescript
// Register new user
auth.register: (email: string, password: string, name?: string) => { success: true, userId: number }

// Login with credentials
auth.login: (email: string, password: string) => { success: true, user: User }

// Create guest account
auth.loginGuest: () => { success: true, user: User }

// Logout and clear session
auth.logout: () => { success: true }

// Get current user
auth.me: () => User | null
```

### Script Management
```typescript
scripts.list: () => Script[]
scripts.upload: (name, description?, content, fileType) => { success: true, url }
scripts.delete: (id) => { success: true }
scripts.obfuscate: (scriptId|content, options) => { success: true, obfuscated, url }
```

### Analytics
```typescript
dashboard.stats: () => { totalScripts, totalExecutions, totalUsers, topScripts, recentLogs }
executorLogs.list: (filters?) => ExecutorLog[]
hwid.list: (filters?) => HwidBan[]
```

Full API documentation available at `http://localhost:5173/api`

## Authentication Flow

### Registration
1. User submits email/password on `/auth/register`
2. Password validated (min 6 characters)
3. Password hashed with bcrypt
4. User created in database
5. Redirect to `/auth/login` for login

### Login
1. User submits email/password on `/auth/login`
2. User lookup by email in database
3. Password verified with bcrypt
4. JWT session token created
5. Token stored in httpOnly cookie
6. Redirect to `/dashboard`

### Guest Login
1. Guest link clicked on `/auth/guest`
2. Auto-generated guest email created (`guest_{timestamp}_{random}@guest.local`)
3. Guest user created with no password
4. JWT session token created
5. Logged in and redirect to `/dashboard`

### Session Verification
1. On each request, session cookie checked
2. JWT token verified with secret key
3. User loaded from database by ID
4. User status and bans verified
5. Protected routes accessible if authenticated

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(320) UNIQUE NOT NULL,
  passwordHash VARCHAR(255),           -- NULL for guests
  name TEXT,
  avatar TEXT,
  loginMethod VARCHAR(64) DEFAULT 'email',
  hwid VARCHAR(256),
  role ENUM('user', 'admin') DEFAULT 'user',
  isBanned BOOLEAN DEFAULT false,
  banReason TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  lastSignedIn TIMESTAMP DEFAULT NOW()
);
```

For complete schema, see [drizzle/schema.ts](drizzle/schema.ts)

## Development

### Commands

```bash
# Development server with hot reload
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm check

# Run tests
pnpm test

# Database operations
pnpm db:push        # Run pending migrations
pnpm db:generate    # Generate migration from schema changes
pnpm db:studio      # Open Drizzle Studio (visual DB browser)

# Production server
pnpm start
```

### Project Cleanup Done ✅

- [x] Removed all Manus AI references (components, packages, vite plugins)
- [x] Removed Google OAuth system entirely
- [x] Replaced with bcrypt + JWT email/password authentication
- [x] Updated database schema (openId → email + passwordHash)
- [x] Created Login, Register, GuestLogin pages
- [x] Configured for Render.com deployment
- [x] Added comprehensive documentation

See [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md) for detailed changes.

## Deployment

### Render.com

1. Connect repository to Render
2. Configure environment variables:
   - `JWT_SECRET` - Auto-generated or provide secure value
   - `DATABASE_URL` - MySQL connection string
   - `NODE_ENV` - Set to `production`
3. Build command: `pnpm install && pnpm db:push && pnpm build`
4. Start command: `pnpm start`
5. Deploy and verify

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for complete verification steps.

### Docker

```bash
# Build image
docker build -t roguard:latest .

# Run container
docker run -e JWT_SECRET=secret -e DATABASE_URL=mysql://... roguard:latest
```

## Security Considerations

- **Password Security:** Bcrypt with 10 salt rounds (industry standard)
- **Session Security:** JWT tokens signed with HS256, 1-year expiration
- **Cookie Security:** HttpOnly, Secure, SameSite flags enabled
- **SQL Injection:** Protected via Drizzle ORM parameterized queries
- **XSS Protection:** React's built-in sanitization
- **CSRF Protection:** SameSite cookie policy

## Performance

- **Stateless Sessions:** JWT means no database lookup per request
- **Optimized Obfuscation:** Multi-threaded processing (configurable)
- **Database Indexing:** Indexes on email, user ID, script ID
- **S3 Caching:** CloudFront distribution for script files
- **Client Caching:** Browser caching for static assets

## Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test --watch

# Coverage report
pnpm test --coverage
```

Current test status: **14 tests passing**

## Troubleshooting

### Database Connection Error
```bash
# Verify DATABASE_URL format:
mysql://user:password@host:port/database

# Test connection:
mysql -u user -p -h host -P port -D database
```

### JWT_SECRET not set
```bash
# Generate secure secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Set in environment
export JWT_SECRET=your-generated-secret
```

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Type check
pnpm check
```

## Contributing

1. Create a feature branch
2. Make changes
3. Test thoroughly (`pnpm test`, `pnpm check`)
4. Create a pull request

## License

Proprietary - Roguard

## Support

For issues or questions:
1. Check [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) troubleshooting section
2. Review [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md) for recent changes
3. Check server logs: `pnpm dev` shows all errors

---

**Version:** 2.0.0 (Authentication Refactor)  
**Last Updated:** 2024  
**Status:** Production Ready
