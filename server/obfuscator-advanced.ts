/**
 * DEPRECATED - This file is no longer used
 * 
 * All advanced obfuscation features have been integrated into:
 * server/obfuscator.ts (v2.0)
 * 
 * Features included in server/obfuscator.ts:
 * - 80+ custom opcodes with full VM emulation
 * - 2000+ bytes of intelligent junk code
 * - Multi-layer encryption (up to 5 layers)
 * - Advanced control flow obfuscation
 * - String table compression
 * - Function wrapping and polymorphism
 * - Anti-decompilation techniques
 * 
 * Do not import from this file. Use server/obfuscator.ts instead.
 */

export {};


const JUNK_PATTERNS = [
  () => `local ${randomId(10)} = ${Math.random() * 999999}`,
  () => `if ${Math.random() > 0.5} then -- ${randomId(8)} end`,
  () => `local ${randomId(10)} = "${randomId(20)}" .. "${randomId(20)}"`,
  () => `for i = 1, ${Math.floor(Math.random() * 100)} do end`,
  () => `local function ${randomId(8)}() return ${Math.random()} end`,
  () => `table.insert({}, ${randomId(10)})`,
  () => `if not (${Math.random() > 0.5}) then return end`,
  () => `local ${randomId(10)} = {${Math.floor(Math.random() * 999)}, ${Math.floor(Math.random() * 999)}}`,
  () => `string.format("%d", ${Math.floor(Math.random() * 99999999)})`,
  () => `math.floor(${Math.random()} * 1000000)`,
];

function randomId(len = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";
  let result = chars[Math.floor(Math.random() * chars.length)];
  for (let i = 1; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function generateOpcode(): string {
  return OPCODES[Math.floor(Math.random() * OPCODES.length)];
}

function generateJunkCode(bytes: number): string {
  const lines: string[] = [];
  let currentBytes = 0;

  while (currentBytes < bytes) {
    const pattern = JUNK_PATTERNS[Math.floor(Math.random() * JUNK_PATTERNS.length)];
    const junk = pattern();
    lines.push(junk);
    currentBytes += junk.length;
  }

  return lines.join("\n");
}

function advancedStringEncryption(str: string, layer: number): string {
  const layers = [
    (s: string) => {
      const bytes = Array.from(s).map(c => c.charCodeAt(0) ^ (Math.random() * 255 | 0));
      return `(function()local t={${bytes.join(",")}};local r="";for i=1,#t do r=r..string.char(t[i])end;return r end)()`;
    },
    (s: string) => {
      const rot = Math.floor(Math.random() * 256);
      const bytes = Array.from(s).map(c => (c.charCodeAt(0) + rot) % 256);
      return `(function()local t={${bytes.join(",")}};local r="";for i=1,#t do r=r..string.char((t[i]-${rot})%256)end;return r end)()`;
    },
    (s: string) => {
      const bytes = Array.from(s).map(c => c.charCodeAt(0));
      const key = Math.random() * 999999 | 0;
      return `(function()local t={${bytes.join(",")}};local k=${key};local r="";for i=1,#t do r=r..string.char(t[i]~k)end;return r end)()`;
    },
    (s: string) => {
      const bin = Array.from(s).map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join('');
      const chunks = bin.match(/.{1,8}/g) || [];
      const nums = chunks.map(b => parseInt(b, 2));
      return `(function()local t={${nums.join(",")}};local r="";for i=1,#t do r=r..string.char(t[i])end;return r end)()`;
    },
    (s: string) => {
      const offset = Math.floor(Math.random() * 256);
      const bytes = Array.from(s).map(c => (c.charCodeAt(0) - offset + 256) % 256);
      return `(function()local t={${bytes.join(",")}};local o=${offset};local r="";for i=1,#t do r=r..string.char((t[i]+o)%256)end;return r end)()`;
    },
  ];

  return layers[Math.min(layer - 1, layers.length - 1)](str);
}

function createOpcodeWrapper(code: string): string {
  const funcName = randomId(12);
  const execVar = randomId(10);
  const execCode = `
local ${execVar} = function()
  ${code}
end
return ${execVar}()
`;
  return `(function()
local ${funcName} = "${Buffer.from(execCode).toString('base64')}"
local ${randomId(8)} = function(s)
  return loadstring(string.gsub(s, "([^A-Za-z0-9+/=])", "")) or function() end
end
return ${randomId(8)}(${funcName})()
end)()`;
}

function polymorphicString(str: string): string {
  const methods = [
    () => `string.char(${Array.from(str).map(c => c.charCodeAt(0)).join(",")})`,
    () => {
      const parts = str.split('').map(c => `string.char(${c.charCodeAt(0)})`);
      return parts.join(' .. ');
    },
    () => {
      const bytes = Array.from(str).map(c => c.charCodeAt(0));
      return `(function()local t={${bytes.join(",")}};local r="";for i,v in ipairs(t)do r=r..string.char(v)end;return r end)()`;
    },
  ];

  return methods[Math.floor(Math.random() * methods.length)]();
}

function createControlFlowObfuscation(code: string, intensity: number): string {
  const numBlocks = Math.min(Math.floor(intensity * 1.5), 20);
  const blocks: string[] = [];
  const flags: string[] = [];

  for (let i = 0; i < numBlocks; i++) {
    flags.push(randomId(10));
  }

  const codeLines = code.split('\n');
  const blockSize = Math.max(1, Math.floor(codeLines.length / numBlocks));

  let result = `local ${randomId(10)} = function()\n`;

  for (let i = 0; i < numBlocks; i++) {
    const flag = flags[i];
    const nextFlag = flags[(i + 1) % numBlocks];
    result += `local ${flag} = false\n`;
  }

  result += `while true do\n`;

  for (let i = 0; i < numBlocks; i++) {
    const flag = flags[i];
    const nextFlag = flags[(i + 1) % numBlocks];
    const start = i * blockSize;
    const end = Math.min((i + 1) * blockSize, codeLines.length);
    const blockCode = codeLines.slice(start, end).join('\n');

    result += `if not ${flag} then\n`;
    result += blockCode + '\n';
    result += `${flag} = true\n`;
    result += `${nextFlag} = false\n`;
    result += `end\n`;

    if (i === numBlocks - 1) {
      result += `break\n`;
    }
  }

  result += `end\nend\nreturn ${randomId(10)}()`;

  return result;
}

export function obfuscateLuaAdvanced(
  code: string,
  options: AdvancedObfuscationOptions = {}
): string {
  const layers = options.encryptionLayers ?? 3;
  const junkBytes = options.junkCodeBytes ?? 2000;
  const cfIntensity = Math.min(options.controlFlowIntensity ?? 7, 10);
  const compress = options.stringCompression ?? true;
  const antiDecomp = options.antiDecompile ?? true;
  const polymorphism_ = options.polymorphism ?? true;

  const parts: string[] = [];

  // Header with version
  parts.push(`--[[`);
  parts.push(`Roguard Advanced Obfuscation v2.0`);
  parts.push(`${OPCODES.length} Custom Opcodes | ${junkBytes} Bytes Junk Code`);
  parts.push(`Obfuscation Level: ${layers === 5 ? "MAXIMUM" : layers === 4 ? "ULTRA" : layers === 3 ? "HIGH" : "STANDARD"}`);
  parts.push(`Anti-Decompilation: ${antiDecomp ? "ENABLED" : "DISABLED"}`);
  parts.push(`]] --`);
  parts.push("");

  // Anti-decompilation measures
  if (antiDecomp) {
    parts.push(`if game and game:FindFirstChild("_deobf") then error("deobfuscator detected") end`);
    parts.push(`setmetatable(_G, {__metatable = "locked"})`);
    parts.push(`debug.setlocal = function() end`);
  }

  // Environment obfuscation
  parts.push(`local ${randomId(15)} = getfenv(0)`);
  parts.push(`local ${randomId(15)} = setfenv`);

  // Junk code injection
  if (junkBytes > 0) {
    parts.push(`-- [[ JUNK CODE: ${junkBytes} bytes ]] --`);
    parts.push(generateJunkCode(junkBytes));
  }

  // Process code based on options
  let processedCode = code;

  // Apply multi-layer encryption
  for (let i = 1; i <= layers; i++) {
    processedCode = advancedStringEncryption(processedCode, i);
  }

  // Apply control flow obfuscation
  if (cfIntensity > 0) {
    processedCode = createControlFlowObfuscation(processedCode, cfIntensity);
  }

  // Apply polymorphic wrapping
  if (polymorphism_) {
    processedCode = createOpcodeWrapper(processedCode);
  }

  parts.push(processedCode);

  return parts.join("\n");
}

// Export the simplified interface compatible with old code
export function obfuscateLua(code: string, _options?: any): string {
  const layers = _options?.stringLayers ?? 3;
  return obfuscateLuaAdvanced(code, {
    encryptionLayers: layers,
    junkCodeBytes: 2000,
    controlFlowIntensity: 7,
    stringCompression: _options?.constantArray ?? true,
    antiDecompile: _options?.antiTamper ?? true,
    polymorphism: _options?.variableRename ?? true,
  });
}

export function validateLuaScript(code: string): { valid: boolean; error?: string } {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: "Script is empty" };
  }
  if (code.length > 5 * 1024 * 1024) {
    return { valid: false, error: "Script exceeds 5MB limit" };
  }
  const openFunctions = (code.match(/\bfunction\b/g) || []).length;
  const endCount = (code.match(/\bend\b/g) || []).length;
  if (openFunctions > endCount + 5) {
    return { valid: false, error: "Possible syntax error: unmatched function/end blocks" };
  }
  return { valid: true };
}
