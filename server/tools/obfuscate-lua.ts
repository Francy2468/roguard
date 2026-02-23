#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { obfuscateLua, validateLuaScript } from '../obfuscator';

function usage() {
  console.log('Usage: obfuscate-lua <input.lua> [output.lua]');
  console.log('If output omitted, writes <input>.obf.lua');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    usage();
    process.exit(1);
  }

  const inputPath = path.resolve(process.cwd(), args[0]);
  const outputPath = args[1]
    ? path.resolve(process.cwd(), args[1])
    : inputPath.replace(/\.lua$/i, '') + '.obf.lua';

  try {
    const code = await fs.readFile(inputPath, 'utf8');
    const valid = validateLuaScript(code);
    if (!valid.valid) {
      console.error('Validation failed:', valid.error);
      process.exit(2);
    }

    // Strongest default: 5 encryption layers, high control flow intensity, junk bytes
    const obf = obfuscateLua(code, {
      encryptionLayers: 5,
      junkCodeBytes: 4000,
      controlFlowIntensity: 9,
      stringCompression: true,
      antiDecompile: true,
      polymorphism: true,
    });

    await fs.writeFile(outputPath, obf, 'utf8');
    console.log('Obfuscated:', inputPath, '->', outputPath);
  } catch (err: any) {
    console.error('Error:', err.message || err);
    process.exit(3);
  }
}

main();
