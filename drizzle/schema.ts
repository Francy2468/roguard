import {
  bigint,
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  name: text("name"),
  avatar: text("avatar"),
  loginMethod: varchar("loginMethod", { length: 64 }).default("email"),
  hwid: varchar("hwid", { length: 256 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isBanned: boolean("isBanned").default(false).notNull(),
  banReason: text("banReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Scripts ──────────────────────────────────────────────────────────────────
export const scripts = mysqlTable("scripts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  originalKey: text("originalKey"),     // S3 key for original file
  originalUrl: text("originalUrl"),     // S3 URL for original file
  obfuscatedKey: text("obfuscatedKey"), // S3 key for obfuscated file
  obfuscatedUrl: text("obfuscatedUrl"), // S3 URL for obfuscated file
  fileType: mysqlEnum("fileType", ["lua", "txt"]).default("lua").notNull(),
  executionCount: int("executionCount").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  obfuscationOptions: json("obfuscationOptions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Script = typeof scripts.$inferSelect;
export type InsertScript = typeof scripts.$inferInsert;

// ─── HWID Bans ────────────────────────────────────────────────────────────────
export const hwidBans = mysqlTable("hwid_bans", {
  id: int("id").autoincrement().primaryKey(),
  hwid: varchar("hwid", { length: 256 }).notNull().unique(),
  userId: int("userId"),
  reason: text("reason"),
  bannedBy: int("bannedBy"), // admin user id
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HwidBan = typeof hwidBans.$inferSelect;
export type InsertHwidBan = typeof hwidBans.$inferInsert;

// ─── Executor Logs ────────────────────────────────────────────────────────────
export const executorLogs = mysqlTable("executor_logs", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  userId: int("userId"),
  scriptId: int("scriptId"),
  hwid: varchar("hwid", { length: 256 }),
  scriptName: varchar("scriptName", { length: 255 }),
  executorName: varchar("executorName", { length: 128 }),
  gameId: varchar("gameId", { length: 64 }),
  gameName: varchar("gameName", { length: 255 }),
  ipAddress: varchar("ipAddress", { length: 64 }),
  status: mysqlEnum("status", ["success", "error", "blocked", "bypass_attempt"]).default("success").notNull(),
  errorMessage: text("errorMessage"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExecutorLog = typeof executorLogs.$inferSelect;
export type InsertExecutorLog = typeof executorLogs.$inferInsert;

// ─── Remote Loaders ───────────────────────────────────────────────────────────
export const remoteLoaders = mysqlTable("remote_loaders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  accessKey: varchar("accessKey", { length: 64 }).notNull().unique(),
  scriptId: int("scriptId"),
  scriptKey: text("scriptKey"),   // S3 key
  scriptUrl: text("scriptUrl"),   // S3 URL
  isActive: boolean("isActive").default(true).notNull(),
  requireHwid: boolean("requireHwid").default(false).notNull(),
  executionCount: int("executionCount").default(0).notNull(),
  lastExecutedAt: timestamp("lastExecutedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RemoteLoader = typeof remoteLoaders.$inferSelect;
export type InsertRemoteLoader = typeof remoteLoaders.$inferInsert;

// ─── User Settings ────────────────────────────────────────────────────────────
export const userSettings = mysqlTable("user_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  // Obfuscation defaults
  obfStringLayers: int("obfStringLayers").default(3).notNull(),
  obfConstantArray: boolean("obfConstantArray").default(true).notNull(),
  obfAntiTamper: boolean("obfAntiTamper").default(true).notNull(),
  obfEnvChecks: boolean("obfEnvChecks").default(true).notNull(),
  obfVariableRename: boolean("obfVariableRename").default(true).notNull(),
  obfControlFlow: boolean("obfControlFlow").default(true).notNull(),
  obfDeadCode: boolean("obfDeadCode").default(false).notNull(),
  // Notifications
  notifyBypassAttempt: boolean("notifyBypassAttempt").default(true).notNull(),
  notifyNewBan: boolean("notifyNewBan").default(true).notNull(),
  notifySuspiciousActivity: boolean("notifySuspiciousActivity").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

// ─── Alerts ───────────────────────────────────────────────────────────────────
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["bypass_attempt", "new_ban", "suspicious_activity", "info"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;
