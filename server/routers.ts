import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import {
  banUser, createAlert, createExecutorLog, createHwidBan, createRemoteLoader,
  createScript, deleteRemoteLoader, deleteScript, getAllExecutorLogs, getAllUsers,
  getDashboardStats, getExecutorLogs, getExecutorLogStats, getHwidBans,
  getRemoteLoaderByKey, getScriptById, getTopScripts, getUnreadAlertCount,
  getUserAlerts, getUserRemoteLoaders, getUserScripts, getUserSettings,
  isHwidBanned, markAlertRead, markAllAlertsRead, removeHwidBan, unbanUser,
  updateRemoteLoader, updateScriptObfuscated, updateUserSettings,
  incrementRemoteLoaderExecution, incrementScriptExecution,
} from "./db";
import { obfuscateLua, validateLuaScript } from "./obfuscator";
import { storagePut } from "./storage";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

function randomSuffix() { return nanoid(8); }

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    register: publicProcedure
      .input(z.object({
        email: z.string().email().max(320),
        password: z.string().min(6).max(256),
        name: z.string().max(255).optional(),
      }))
      .mutation(async ({ input }) => {
        const user = await sdk.registerUser(input.email, input.password, input.name);
        if (!user) throw new TRPCError({ code: "BAD_REQUEST", message: "Email already registered" });
        return { success: true, userId: user.id };
      }),
    
    login: publicProcedure
      .input(z.object({
        email: z.string().email().max(320),
        password: z.string().min(1).max(256),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await sdk.loginUser(input.email, input.password);
        if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        
        const sessionToken = await sdk.createSessionToken(user.id, user.email, user.role);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true, user };
      }),
    
    loginGuest: publicProcedure
      .mutation(async ({ ctx }) => {
        const user = await sdk.createGuestUser();
        if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create guest user" });
        
        const sessionToken = await sdk.createSessionToken(user.id, user.email, user.role);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true, user };
      }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  scripts: router({
    list: protectedProcedure.query(async ({ ctx }) => getUserScripts(ctx.user.id)),

    upload: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        content: z.string().min(1),
        fileType: z.enum(["lua", "txt"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const validation = validateLuaScript(input.content);
        if (!validation.valid) throw new TRPCError({ code: "BAD_REQUEST", message: validation.error });
        const fileKey = `scripts/${ctx.user.id}/${randomSuffix()}-original.${input.fileType}`;
        const { url } = await storagePut(fileKey, Buffer.from(input.content, "utf-8"), "text/plain");
        await createScript({ userId: ctx.user.id, name: input.name, description: input.description, originalKey: fileKey, originalUrl: url, fileType: input.fileType });
        return { success: true, url };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const script = await getScriptById(input.id);
        if (!script || script.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
        await deleteScript(input.id);
        return { success: true };
      }),

    obfuscate: protectedProcedure
      .input(z.object({
        scriptId: z.number().optional(),
        content: z.string().optional(),
        name: z.string().optional(),
        fileType: z.enum(["lua", "txt"]).optional(),
        options: z.object({
          stringLayers: z.number().min(1).max(3).optional(),
          constantArray: z.boolean().optional(),
          antiTamper: z.boolean().optional(),
          envChecks: z.boolean().optional(),
          variableRename: z.boolean().optional(),
          controlFlow: z.boolean().optional(),
          deadCode: z.boolean().optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let content = input.content;
        let scriptId = input.scriptId;
        if (scriptId) {
          const script = await getScriptById(scriptId);
          if (!script || script.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND" });
          if (script.originalUrl) { const res = await fetch(script.originalUrl); content = await res.text(); }
        }
        if (!content) throw new TRPCError({ code: "BAD_REQUEST", message: "No script content provided" });
        const validation = validateLuaScript(content);
        if (!validation.valid) throw new TRPCError({ code: "BAD_REQUEST", message: validation.error });
        const settings = await getUserSettings(ctx.user.id);
        const opts = {
          stringLayers: input.options?.stringLayers ?? settings?.obfStringLayers ?? 3,
          constantArray: input.options?.constantArray ?? settings?.obfConstantArray ?? true,
          antiTamper: input.options?.antiTamper ?? settings?.obfAntiTamper ?? true,
          envChecks: input.options?.envChecks ?? settings?.obfEnvChecks ?? true,
          variableRename: input.options?.variableRename ?? settings?.obfVariableRename ?? true,
          controlFlow: input.options?.controlFlow ?? settings?.obfControlFlow ?? true,
          deadCode: input.options?.deadCode ?? settings?.obfDeadCode ?? false,
        };
        const obfuscated = obfuscateLua(content, opts);
        const obfKey = `scripts/${ctx.user.id}/${randomSuffix()}-obfuscated.lua`;
        const { url: obfUrl } = await storagePut(obfKey, Buffer.from(obfuscated, "utf-8"), "text/plain");
        if (scriptId) { await updateScriptObfuscated(scriptId, obfKey, obfUrl); }
        else { await createScript({ userId: ctx.user.id, name: input.name ?? `Obfuscated-${Date.now()}`, fileType: input.fileType ?? "lua", obfuscationOptions: opts }); }
        return { success: true, obfuscated, obfuscatedUrl: obfUrl };
      }),
  }),

  hwidBans: router({
    list: protectedProcedure.query(async () => getHwidBans()),

    ban: protectedProcedure
      .input(z.object({ hwid: z.string().min(1).max(256), reason: z.string().min(1), userId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        await createHwidBan(input.hwid, input.reason, ctx.user.id, input.userId);
        if (input.userId) await banUser(input.userId, input.reason);
        await createAlert({ userId: ctx.user.id, type: "new_ban", title: "New HWID Ban", message: `HWID ${input.hwid.slice(0, 16)}... banned. Reason: ${input.reason}`, metadata: { hwid: input.hwid } });
        await notifyOwner({ title: "New HWID Ban", content: `HWID: ${input.hwid}\nReason: ${input.reason}` });
        return { success: true };
      }),

    unban: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await removeHwidBan(input.id); return { success: true }; }),

    check: publicProcedure
      .input(z.object({ hwid: z.string() }))
      .query(async ({ input }) => { const banned = await isHwidBanned(input.hwid); return { banned }; }),
  }),

  executorLogs: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role === "admin") return getAllExecutorLogs(input.limit ?? 100, input.offset ?? 0);
        return getExecutorLogs(ctx.user.id, input.limit ?? 100, input.offset ?? 0);
      }),

    stats: protectedProcedure.query(async ({ ctx }) => getExecutorLogStats(ctx.user.id)),

    log: publicProcedure
      .input(z.object({
        accessKey: z.string(),
        hwid: z.string().optional(),
        executorName: z.string().optional(),
        gameId: z.string().optional(),
        gameName: z.string().optional(),
        status: z.enum(["success", "error", "blocked", "bypass_attempt"]).default("success"),
        errorMessage: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const loader = await getRemoteLoaderByKey(input.accessKey);
        if (!loader) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid access key" });
        if (input.hwid) {
          const banned = await isHwidBanned(input.hwid);
          if (banned) {
            await createExecutorLog({ userId: loader.userId, scriptId: loader.scriptId ?? undefined, hwid: input.hwid, executorName: input.executorName, gameId: input.gameId, gameName: input.gameName, ipAddress: (ctx.req.headers?.["x-forwarded-for"] as string) ?? undefined, status: "blocked", errorMessage: "HWID banned" });
            return { allowed: false, reason: "banned" };
          }
        }
        await createExecutorLog({ userId: loader.userId, scriptId: loader.scriptId ?? undefined, hwid: input.hwid, executorName: input.executorName, gameId: input.gameId, gameName: input.gameName, ipAddress: (ctx.req.headers?.["x-forwarded-for"] as string) ?? undefined, status: input.status, errorMessage: input.errorMessage, metadata: input.metadata as object | undefined });
        if (loader.scriptId) await incrementScriptExecution(loader.scriptId);
        await incrementRemoteLoaderExecution(loader.id);
        if (input.status === "bypass_attempt") {
          await createAlert({ userId: loader.userId, type: "bypass_attempt", title: "Bypass Attempt Detected", message: `Bypass attempt on loader "${loader.name}". HWID: ${input.hwid ?? "unknown"}`, metadata: { hwid: input.hwid, executorName: input.executorName } });
          await notifyOwner({ title: "⚠️ Bypass Attempt", content: `Loader: ${loader.name}\nHWID: ${input.hwid ?? "unknown"}\nExecutor: ${input.executorName ?? "unknown"}` });
        }
        return { allowed: true };
      }),
  }),

  remoteLoaders: router({
    list: protectedProcedure.query(async ({ ctx }) => getUserRemoteLoaders(ctx.user.id)),

    create: protectedProcedure
      .input(z.object({ name: z.string().min(1).max(255), scriptId: z.number().optional(), requireHwid: z.boolean().optional(), content: z.string().optional(), fileType: z.enum(["lua", "txt"]).optional() }))
      .mutation(async ({ ctx, input }) => {
        const accessKey = nanoid(32);
        let scriptKey: string | undefined;
        let scriptUrl: string | undefined;
        if (input.content) {
          const key = `loaders/${ctx.user.id}/${randomSuffix()}.${input.fileType ?? "lua"}`;
          const { url } = await storagePut(key, Buffer.from(input.content, "utf-8"), "text/plain");
          scriptKey = key; scriptUrl = url;
        }
        await createRemoteLoader({ userId: ctx.user.id, name: input.name, accessKey, scriptId: input.scriptId, scriptKey, scriptUrl, requireHwid: input.requireHwid ?? false });
        return { success: true, accessKey };
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), scriptId: z.number().optional(), requireHwid: z.boolean().optional(), isActive: z.boolean().optional(), content: z.string().optional(), fileType: z.enum(["lua", "txt"]).optional() }))
      .mutation(async ({ ctx, input }) => {
        const loaders = await getUserRemoteLoaders(ctx.user.id);
        if (!loaders.find((l) => l.id === input.id)) throw new TRPCError({ code: "NOT_FOUND" });
        const updateData: Parameters<typeof updateRemoteLoader>[1] = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.scriptId !== undefined) updateData.scriptId = input.scriptId;
        if (input.requireHwid !== undefined) updateData.requireHwid = input.requireHwid;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;
        if (input.content) {
          const key = `loaders/${ctx.user.id}/${randomSuffix()}.${input.fileType ?? "lua"}`;
          const { url } = await storagePut(key, Buffer.from(input.content, "utf-8"), "text/plain");
          updateData.scriptKey = key; updateData.scriptUrl = url;
        }
        await updateRemoteLoader(input.id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const loaders = await getUserRemoteLoaders(ctx.user.id);
        if (!loaders.find((l) => l.id === input.id)) throw new TRPCError({ code: "NOT_FOUND" });
        await deleteRemoteLoader(input.id);
        return { success: true };
      }),

    fetch: publicProcedure
      .input(z.object({ key: z.string(), hwid: z.string().optional() }))
      .query(async ({ input }) => {
        const loader = await getRemoteLoaderByKey(input.key);
        if (!loader || !loader.isActive) throw new TRPCError({ code: "NOT_FOUND", message: "Loader not found or inactive" });
        if (loader.requireHwid && !input.hwid) throw new TRPCError({ code: "UNAUTHORIZED", message: "HWID required" });
        if (input.hwid) { const banned = await isHwidBanned(input.hwid); if (banned) throw new TRPCError({ code: "FORBIDDEN", message: "HWID banned" }); }
        if (!loader.scriptUrl) throw new TRPCError({ code: "NOT_FOUND", message: "No script attached" });
        const res = await fetch(loader.scriptUrl);
        const content = await res.text();
        return { content, name: loader.name };
      }),
  }),

  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => getUserSettings(ctx.user.id)),
    update: protectedProcedure
      .input(z.object({
        obfStringLayers: z.number().min(1).max(3).optional(),
        obfConstantArray: z.boolean().optional(),
        obfAntiTamper: z.boolean().optional(),
        obfEnvChecks: z.boolean().optional(),
        obfVariableRename: z.boolean().optional(),
        obfControlFlow: z.boolean().optional(),
        obfDeadCode: z.boolean().optional(),
        notifyBypassAttempt: z.boolean().optional(),
        notifyNewBan: z.boolean().optional(),
        notifySuspiciousActivity: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => { await updateUserSettings(ctx.user.id, input); return { success: true }; }),
  }),

  alerts: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => getUserAlerts(ctx.user.id, input.limit ?? 20)),
    unreadCount: protectedProcedure.query(async ({ ctx }) => getUnreadAlertCount(ctx.user.id)),
    markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await markAlertRead(input.id); return { success: true }; }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => { await markAllAlertsRead(ctx.user.id); return { success: true }; }),
  }),

  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => getDashboardStats(ctx.user.id)),
    topScripts: protectedProcedure.query(async ({ ctx }) => getTopScripts(ctx.user.id, 5)),
  }),

  admin: router({
    users: adminProcedure.query(async () => getAllUsers(100, 0)),
    banUser: adminProcedure.input(z.object({ userId: z.number(), reason: z.string() })).mutation(async ({ input }) => { await banUser(input.userId, input.reason); return { success: true }; }),
    unbanUser: adminProcedure.input(z.object({ userId: z.number() })).mutation(async ({ input }) => { await unbanUser(input.userId); return { success: true }; }),
    allLogs: adminProcedure.input(z.object({ limit: z.number().optional() })).query(async ({ input }) => getAllExecutorLogs(input.limit ?? 200)),
  }),
});

export type AppRouter = typeof appRouter;
