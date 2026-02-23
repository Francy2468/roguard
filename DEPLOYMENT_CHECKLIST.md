# Roguard Deployment Checklist

## Pre-Migration

- [ ] Verify all changes were applied correctly
- [ ] Confirm no references to deprecated OAuth/Manus remain
- [ ] Review database schema changes in `drizzle/schema.ts`
- [ ] Verify environment variables are properly configured

## Database Migration (CRITICAL)

```bash
# Generate and apply migrations
pnpm db:push
```

Expected changes:
- Users table: Replace `openId` column with `email` and `passwordHash`
- All user data will be preserved with the new schema
- Indexes on `email` will be created

## Build & Compilation

```bash
# Install dependencies
pnpm install

# Type-check entire project
pnpm check

# Build frontend and backend
pnpm build
```

Expected result:
- Zero TypeScript errors
- Production bundles generated
- No warnings about missing dependencies

## Local Testing

### 1. Start Development Server
```bash
pnpm dev
```

### 2. Test Registration Flow
- Visit `http://localhost:5173/auth/register`
- Register with email: `test@example.com`
- Set password: (min 6 chars)
- Verify success page and redirect to login

### 3. Test Login Flow
- Visit `http://localhost:5173/auth/login`
- Login with registered credentials
- Verify redirect to `/dashboard`
- Check session cookie is set (`session` cookie)

### 4. Test Guest Login
- Visit `http://localhost:5173/auth/guest`
- Should auto-trigger guest account creation
- Verify redirect to `/dashboard`
- Verify session cookie is set

### 5. Test Session Persistence
- Login as user
- Refresh page (F5)
- Verify you remain logged in
- Check browser DevTools > Application > Cookies for `session` cookie

### 6. Test Protected Routes
- Logout: Click logout button
- Try to access `/dashboard`
- Should redirect to `/auth/login`

### 7. Test Logout
- Login again
- Click logout
- Verify redirect to home page
- Visit `/dashboard` - should redirect to login
- Verify `session` cookie is removed

## Render Deployment

### Pre-Deployment Checklist
- [ ] Ensure `pnpm db:push` completed successfully locally
- [ ] Run `pnpm build` and verify zero errors
- [ ] All tests pass: `pnpm test`
- [ ] Environment variables documented

### Render Configuration

In Render Dashboard:

1. **Environment Variables**
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: MySQL connection string (with credentials)
   - `JWT_SECRET`: (auto-generated or provide secure value)
   - `BUILT_IN_FORGE_API_URL`: Forge API endpoint
   - `BUILT_IN_FORGE_API_KEY`: API key

2. **Build Command**
   ```
   pnpm install && pnpm db:push && pnpm build
   ```

3. **Start Command**
   ```
   pnpm start
   ```

4. **Port**
   - Set to `5173` (or update render.yaml)

### Post-Deployment Verification

1. **Health Check**
   - Visit: `https://your-app.onrender.com`
   - Verify home page loads

2. **Authentication Test**
   - Register with test email
   - Login with credentials
   - Test guest login
   - Verify session persistence

3. **API Health**
   - Visit: `https://your-app.onrender.com/api`
   - Should return tRPC endpoint information

4. **Database Connection**
   - Use Render logs to verify database connection successful
   - Search logs for "Database connected" or similar

## Troubleshooting

### Database Migration Error
```bash
# Issue: "Column 'openId' doesn't exist"
# Solution: Verify drizzle/schema.ts has correct schema
# Check if migration ran locally first

# Reset local database (development only)
pnpm db:drop  # May not be available, delete DB manually
pnpm db:push
```

### JWT_SECRET Error
```bash
# Issue: "JWT_SECRET environment variable not set"
# Solution: Verify JWT_SECRET in Render environment variables
# Must be at least 32 characters for security

# Generate secure secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Session Cookie Issues
```bash
# Issue: Cookies not persisting across requests
# Check:
1. HttpOnly flag is set (prevents XSS access)
2. Secure flag is true (HTTPS in production)
3. SameSite is "lax" or "strict"
4. Path is "/" or unset
5. Domain is correct (production domain)
```

### 404 on Auth Routes
```bash
# Issue: /auth/login returns 404
# Solution:
1. Verify routes added to App.tsx
2. Check Vite routing configuration
3. Ensure React Router is properly setup
4. Verify imports in App.tsx are correct
```

### "User already exists" on Register
- Email already registered in database
- Try registering with a different email
- Or check if user exists with: SELECT * FROM users WHERE email = 'test@example.com'

## Database Recovery (If Needed)

### Backup Before Migration
```bash
# Local
mysqldump -u user -p database_name > backup.sql

# Restore
mysql -u user -p database_name < backup.sql
```

### Manual Schema Update (If Drizzle Fails)

```sql
-- Backup old openId data (if you need it)
ALTER TABLE users ADD COLUMN openId_backup VARCHAR(128);
UPDATE users SET openId_backup = openId;

-- Remove old columns
ALTER TABLE users DROP COLUMN openId;

-- Add new columns
ALTER TABLE users ADD COLUMN email VARCHAR(320) UNIQUE NOT NULL;
ALTER TABLE users ADD COLUMN passwordHash VARCHAR(255);

-- Set default values (for existing users if any)
UPDATE users SET email = CONCAT('user_', id, '@migrated.local'), loginMethod = 'migrated' WHERE email IS NULL;
ALTER TABLE users MODIFY email VARCHAR(320) UNIQUE NOT NULL;
```

## Security Checklist

- [ ] JWT_SECRET is 32+ characters
- [ ] Database password is strong
- [ ] HTTPS enforced in production
- [ ] HttpOnly cookies enabled
- [ ] CORS configured properly
- [ ] No debug logs expose sensitive data
- [ ] Rate limiting considered for auth endpoints
- [ ] Password validation (min 6 chars) enforced

## Performance Considerations

- JWT tokens are stateless (no database lookup per request)
- Single database query per authenticated request (user lookup by ID)
- Session expiration: 1 year (adjust in `shared/const.ts` if needed)
- Guest accounts use auto-generated emails (ensure index on users.email)

## Monitoring

### Logs to Check
- Database connection errors
- JWT verification failures
- Authentication failures (too many failed attempts)
- User registration errors
- Session token generation issues

### Key Metrics
- Registration success rate
- Login failure rate
- Session duration (average)
- Guest account creation rate
- Page performance (auth pages should load < 2s)

## Rollback Plan

If authentication system fails in production:

1. **Immediate:**
   - Revert to previous commit with OAuth system
   - Update environment variables back to OAuth config

2. **Investigation:**
   - Check Render logs for specific errors
   - Verify database migration applied correctly
   - Confirm JWT_SECRET is set

3. **Data Safety:**
   - User database is preserved (email-based, portable)
   - OAuth data not required for new system
   - Sessions stored only in cookies (JWT)

## Migration Complete ✅

Once all tests pass and deployment is verified:

```bash
# Final commit
git add -A
git commit -m "Authentication migration: OAuth → Email/Password + JWT

- Removed all Manus AI references
- Replaced Google OAuth with bcrypt + JWT
- Updated database schema (openId → email + passwordHash)
- Created auth pages (Login, Register, Guest)
- Configured for Render deployment
- Updated environment variables"

# Push to production
git push origin main
```

---

**Last Updated:** 2024  
**Status:** Ready for deployment after database migration
