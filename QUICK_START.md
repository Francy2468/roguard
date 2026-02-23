# Quick Start - Run These Commands

## 📌 Before You Deploy

Copy and run these commands in order:

### 1️⃣ Install Dependencies
```bash
pnpm install
```

### 2️⃣ Apply Database Migration (CRITICAL)
```bash
pnpm db:push
```
⚠️ **MUST RUN** - Updates users table schema from OAuth to email-based

### 3️⃣ Type Check
```bash
pnpm check
```
Should show zero TypeScript errors

### 4️⃣ Build Project
```bash
pnpm build
```
Should complete without errors

### 5️⃣ Test Authentication (Optional - Local Development)
```bash
pnpm dev
```
Then visit `http://localhost:5173` and:
- Register with test email
- Login with credentials
- Test guest login
- Verify session persists

## 🚀 Deploy to Render

1. Ensure all commands above completed successfully
2. Push to your repository:
   ```bash
   git add -A
   git commit -m "Authentication migration: OAuth → Email/Password + JWT"
   git push origin main
   ```
3. Render will automatically:
   - Run `pnpm install`
   - Run `pnpm db:push` (applies schema)
   - Build project with `pnpm build`
   - Start server

## ✅ Verification Checklist

After deployment:

- [ ] Homepage loads (`/`)
- [ ] Can register at `/auth/register`
- [ ] Can login at `/auth/login`
- [ ] Can use guest login at `/auth/guest`
- [ ] Dashboard loads after login (`/dashboard`)
- [ ] Scripts can be uploaded and obfuscated
- [ ] Logout works and redirects to home
- [ ] Refreshing doesn't log you out (session persists)

## ⚠️ If Something Goes Wrong

### "database.ts:XX - Type error"
```bash
pnpm db:push  # Make sure you ran this
pnpm check    # Check TypeScript
```

### "JWT_SECRET not set"
In Render Dashboard → Environment:
- Add `JWT_SECRET` with secure value OR
- Keep `generateValue: true` in render.yaml

### "Column 'email' doesn't exist"
```bash
pnpm db:push  # Database migration not applied
```

Check Render logs for the actual error.

## 📚 Read These If You Need Details

- `MIGRATION_COMPLETE.md` - Final summary of all changes
- `MIGRATION_SUMMARY.md` - Technical breakdown of every file modified
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step deployment guide
- `README.md` - Project overview and documentation

## 🎯 What Changed?

**Old System:**
- Google OAuth login
- Manus AI integration
- openId-based user records

**New System:**
- Email/password registration & login
- Guest login without registration
- Bcrypt password hashing
- JWT session tokens
- NO MORE Manus AI or Google OAuth

## 🔑 Key Files

**Authentication:** `server/_core/sdk.ts` (156 lines)
**Database:** `server/db.ts` (user operations)
**Routing:** `server/routers.ts` (auth endpoints)
**Frontend:** `client/src/pages/Login.tsx`, `Register.tsx`, `GuestLogin.tsx`

---

**Ready to deploy?** Run step 1-5 above, then push to Render! 🚀
