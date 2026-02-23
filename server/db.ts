import { and, desc, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, User, alerts, executorLogs, hwidBans,
  remoteLoaders, scripts, userSettings, users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

// ─── Users ─────────────────────────────────────────────────────────────────
export async function createUser(email: string, passwordHash: string, name?: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(users).values({
    email: email.toLowerCase(),
    passwordHash,
    name,
    loginMethod: "email",
    lastSignedIn: new Date(),
    role: "user",
  });
  const user: any = result[0];
  return await getUserById(user.insertId ?? user.lastInsertRowid);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return result[0];
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getAllUsers(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
}

export async function updateUserHwid(userId: number, hwid: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ hwid, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function updateUserLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date(), updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function banUser(userId: number, reason: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ isBanned: true, banReason: reason, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function unbanUser(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ isBanned: false, banReason: null, updatedAt: new Date() }).where(eq(users.id, userId));
}

// ─── HWID Bans ─────────────────────────────────────────────────────────────
export async function createHwidBan(hwid: string, reason: string, bannedBy: number, userId?: number) {
  const db = await getDb();
  if (!db) return;
  await db.insert(hwidBans).values({ hwid, reason, bannedBy, userId, isActive: true });
}

export async function removeHwidBan(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(hwidBans).set({ isActive: false, updatedAt: new Date() }).where(eq(hwidBans.id, id));
}

export async function isHwidBanned(hwid: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(hwidBans).where(and(eq(hwidBans.hwid, hwid), eq(hwidBans.isActive, true))).limit(1);
  return result.length > 0;
}

export async function getHwidBans(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hwidBans).where(eq(hwidBans.isActive, true)).orderBy(desc(hwidBans.createdAt)).limit(limit).offset(offset);
}

// ─── Scripts ───────────────────────────────────────────────────────────────
export async function createScript(data: {
  userId: number; name: string; description?: string;
  originalKey?: string; originalUrl?: string; fileType: "lua" | "txt"; obfuscationOptions?: object;
}) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(scripts).values({ ...data, executionCount: 0, isActive: true });
  return result;
}

export async function updateScriptObfuscated(scriptId: number, obfuscatedKey: string, obfuscatedUrl: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(scripts).set({ obfuscatedKey, obfuscatedUrl, updatedAt: new Date() }).where(eq(scripts.id, scriptId));
}

export async function getUserScripts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scripts).where(and(eq(scripts.userId, userId), eq(scripts.isActive, true))).orderBy(desc(scripts.createdAt));
}

export async function getScriptById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(scripts).where(eq(scripts.id, id)).limit(1);
  return result[0];
}

export async function deleteScript(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(scripts).set({ isActive: false, updatedAt: new Date() }).where(eq(scripts.id, id));
}

export async function incrementScriptExecution(scriptId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(scripts).set({ executionCount: sql`${scripts.executionCount} + 1`, updatedAt: new Date() }).where(eq(scripts.id, scriptId));
}

export async function getTopScripts(userId: number, limit = 5) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scripts).where(and(eq(scripts.userId, userId), eq(scripts.isActive, true))).orderBy(desc(scripts.executionCount)).limit(limit);
}

// ─── Executor Logs ─────────────────────────────────────────────────────────
export async function createExecutorLog(data: {
  userId?: number; scriptId?: number; hwid?: string; scriptName?: string;
  executorName?: string; gameId?: string; gameName?: string; ipAddress?: string;
  status: "success" | "error" | "blocked" | "bypass_attempt"; errorMessage?: string; metadata?: object;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(executorLogs).values(data);
}

export async function getExecutorLogs(userId: number, limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(executorLogs).where(eq(executorLogs.userId, userId)).orderBy(desc(executorLogs.createdAt)).limit(limit).offset(offset);
}

export async function getAllExecutorLogs(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(executorLogs).orderBy(desc(executorLogs.createdAt)).limit(limit).offset(offset);
}

export async function getExecutorLogStats(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, success: 0, errors: 0, blocked: 0, bypass: 0 };
  const logs = await db.select().from(executorLogs).where(eq(executorLogs.userId, userId));
  return {
    total: logs.length,
    success: logs.filter((l) => l.status === "success").length,
    errors: logs.filter((l) => l.status === "error").length,
    blocked: logs.filter((l) => l.status === "blocked").length,
    bypass: logs.filter((l) => l.status === "bypass_attempt").length,
  };
}

export async function getRecentLogs(userId: number, hours = 24) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return db.select().from(executorLogs).where(and(eq(executorLogs.userId, userId), gte(executorLogs.createdAt, since))).orderBy(desc(executorLogs.createdAt));
}

// ─── Remote Loaders ────────────────────────────────────────────────────────
export async function createRemoteLoader(data: {
  userId: number; name: string; accessKey: string;
  scriptId?: number; scriptKey?: string; scriptUrl?: string; requireHwid?: boolean;
}) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(remoteLoaders).values({ ...data, isActive: true, executionCount: 0 });
}

export async function getUserRemoteLoaders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(remoteLoaders).where(and(eq(remoteLoaders.userId, userId), eq(remoteLoaders.isActive, true))).orderBy(desc(remoteLoaders.createdAt));
}

export async function getRemoteLoaderByKey(accessKey: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(remoteLoaders).where(and(eq(remoteLoaders.accessKey, accessKey), eq(remoteLoaders.isActive, true))).limit(1);
  return result[0];
}

export async function updateRemoteLoader(id: number, data: Partial<{ name: string; scriptId: number; scriptKey: string; scriptUrl: string; requireHwid: boolean; isActive: boolean }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(remoteLoaders).set({ ...data, updatedAt: new Date() }).where(eq(remoteLoaders.id, id));
}

export async function deleteRemoteLoader(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(remoteLoaders).set({ isActive: false, updatedAt: new Date() }).where(eq(remoteLoaders.id, id));
}

export async function incrementRemoteLoaderExecution(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(remoteLoaders).set({ executionCount: sql`${remoteLoaders.executionCount} + 1`, lastExecutedAt: new Date(), updatedAt: new Date() }).where(eq(remoteLoaders.id, id));
}

// ─── User Settings ─────────────────────────────────────────────────────────
export async function getUserSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  if (result[0]) return result[0];
  await db.insert(userSettings).values({ userId });
  const fresh = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return fresh[0] ?? null;
}

export async function updateUserSettings(userId: number, data: Partial<Omit<typeof userSettings.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) return;
  await db.insert(userSettings).values({ userId, ...data }).onDuplicateKeyUpdate({ set: { ...data, updatedAt: new Date() } });
}

// ─── Alerts ────────────────────────────────────────────────────────────────
export async function createAlert(data: { userId: number; type: "bypass_attempt" | "new_ban" | "suspicious_activity" | "info"; title: string; message: string; metadata?: object }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(alerts).values({ ...data, isRead: false });
}

export async function getUserAlerts(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(alerts).where(eq(alerts.userId, userId)).orderBy(desc(alerts.createdAt)).limit(limit);
}

export async function markAlertRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(alerts).set({ isRead: true }).where(eq(alerts.id, id));
}

export async function markAllAlertsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(alerts).set({ isRead: true }).where(eq(alerts.userId, userId));
}

export async function getUnreadAlertCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select().from(alerts).where(and(eq(alerts.userId, userId), eq(alerts.isRead, false)));
  return result.length;
}

// ─── Dashboard Stats ───────────────────────────────────────────────────────
export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [userScripts, loaders, logStats, recentLogs, topScripts] = await Promise.all([
    getUserScripts(userId),
    getUserRemoteLoaders(userId),
    getExecutorLogStats(userId),
    getRecentLogs(userId, 24),
    getTopScripts(userId, 5),
  ]);
  return {
    totalScripts: userScripts.length,
    totalLoaders: loaders.length,
    logStats,
    recentActivity: recentLogs.slice(0, 10),
    topScripts,
  };
}
