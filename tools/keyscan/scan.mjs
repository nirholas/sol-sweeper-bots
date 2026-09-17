#!/usr/bin/env node
// keyscan: read-only scanner that finds Solana private keys committed into a
// source tree. It never contacts the network and never prints a full secret;
// every hit is redacted to first/last 4 characters. Exit code 1 on any
// high-confidence finding so it can gate a commit or a CI job.
//
// Usage:
//   node scan.mjs [path ...]        scan the given paths (default: ".")
//   node scan.mjs --json            emit findings as JSON
//   node scan.mjs --staged          scan only files git has staged
//
// What it flags:
//   - *.json files whose contents are a 64- or 32-length byte array
//     (the `solana-keygen` / Phantom export format).
//   - base58 tokens in any text file that decode to exactly 64 bytes
//     (an ed25519 secret key) or 32 bytes (a possible seed).

import { readFileSync, statSync, readdirSync } from "node:fs";
import { join, extname, relative } from "node:path";
import { execSync } from "node:child_process";

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const B58_MAP = new Map([...B58].map((c, i) => [c, i]));

// Decode a base58 string to bytes, or return null if it contains a
// non-alphabet character. Pure, allocation-light, no dependency.
function base58Decode(str) {
  if (str.length === 0) return null;
  const bytes = [0];
  for (const ch of str) {
    const val = B58_MAP.get(ch);
    if (val === undefined) return null;
    let carry = val;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  // Account for leading '1' characters, each a leading zero byte.
  for (let k = 0; k < str.length && str[k] === "1"; k++) bytes.push(0);
  return bytes.reverse();
}

function redact(s) {
  if (s.length <= 12) return "*".repeat(s.length);
  return `${s.slice(0, 4)}...${s.slice(-4)} (${s.length} chars)`;
}

// A JSON byte array of length 64 is a full ed25519 keypair; length 32 is a
// seed. Anything else (public keys are base58 strings, not arrays) is ignored.
function classifyJsonArray(arr) {
  if (!Array.isArray(arr)) return null;
  const allBytes = arr.every((n) => Number.isInteger(n) && n >= 0 && n <= 255);
  if (!allBytes) return null;
  if (arr.length === 64) return { confidence: "high", kind: "ed25519 secret key (64-byte array)" };
  if (arr.length === 32) return { confidence: "medium", kind: "possible seed (32-byte array)" };
  return null;
}

function scanJsonValue(value) {
  const hits = [];
  const walk = (v) => {
    const c = classifyJsonArray(v);
    if (c) hits.push(c);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(value);
  return hits;
}

// base58 runs long enough to be a 32- or 64-byte secret. Public keys also land
// in the 32-byte bucket, so we report those at low confidence and let the
// operator judge; a 64-byte decode is unambiguously a secret key.
const B58_RUN = /[1-9A-HJ-NP-Za-km-z]{40,120}/g;

function scanText(text) {
  const hits = [];
  const seen = new Set();
  for (const match of text.matchAll(B58_RUN)) {
    const token = match[0];
    if (seen.has(token)) continue;
    seen.add(token);
    const decoded = base58Decode(token);
    if (!decoded) continue;
    if (decoded.length === 64) {
      hits.push({ confidence: "high", kind: "ed25519 secret key (base58, 64 bytes)", sample: redact(token) });
    } else if (decoded.length === 32) {
      hits.push({ confidence: "low", kind: "32-byte base58 value (key or seed; verify)", sample: redact(token) });
    }
  }
  return hits;
}

const IGNORE_DIRS = new Set([".git", "node_modules", "target", "dist", "build", ".next", "vendor"]);
const TEXT_EXT = new Set([".json", ".js", ".mjs", ".cjs", ".ts", ".rs", ".py", ".txt", ".md", ".env", ".yaml", ".yml", ".toml", ".sh", ""]);
const MAX_BYTES = 2 * 1024 * 1024;

function* walkDir(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (!IGNORE_DIRS.has(e.name)) yield* walkDir(full);
    } else if (e.isFile()) {
      yield full;
    }
  }
}

function scanFile(path) {
  let st;
  try {
    st = statSync(path);
  } catch {
    return [];
  }
  if (st.size > MAX_BYTES) return [];
  if (!TEXT_EXT.has(extname(path))) return [];
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return [];
  }
  const findings = [];
  if (extname(path) === ".json") {
    try {
      const parsed = JSON.parse(text);
      for (const h of scanJsonValue(parsed)) findings.push({ ...h, sample: "[byte array]" });
    } catch {
      // Not valid JSON; fall through to the text scan below.
    }
  }
  for (const h of scanText(text)) findings.push(h);
  return findings;
}

function collectPaths(args) {
  if (args.includes("--staged")) {
    let out = "";
    try {
      out = execSync("git diff --cached --name-only --diff-filter=ACM", { encoding: "utf8" });
    } catch {
      return [];
    }
    return out.split("\n").map((s) => s.trim()).filter(Boolean);
  }
  const roots = args.filter((a) => !a.startsWith("--"));
  if (roots.length === 0) roots.push(".");
  const files = [];
  for (const root of roots) {
    let st;
    try {
      st = statSync(root);
    } catch {
      continue;
    }
    if (st.isDirectory()) files.push(...walkDir(root));
    else files.push(root);
  }
  return files;
}

function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes("--json");
  const files = collectPaths(args);
  const results = [];
  for (const file of files) {
    const findings = scanFile(file);
    for (const f of findings) results.push({ file: relative(process.cwd(), file) || file, ...f });
  }

  const high = results.filter((r) => r.confidence === "high");

  if (asJson) {
    process.stdout.write(JSON.stringify({ findings: results, highConfidence: high.length }, null, 2) + "\n");
  } else if (results.length === 0) {
    process.stdout.write("keyscan: no Solana private keys found.\n");
  } else {
    process.stdout.write(`keyscan: ${results.length} finding(s), ${high.length} high-confidence.\n\n`);
    for (const r of results) {
      const tag = r.confidence.toUpperCase().padEnd(6);
      process.stdout.write(`  [${tag}] ${r.file}\n           ${r.kind}${r.sample ? `  ${r.sample}` : ""}\n`);
    }
    process.stdout.write("\nA committed private key is permanently compromised. Rotate to a fresh key; do not reuse the address.\n");
  }

  process.exit(high.length > 0 ? 1 : 0);
}

main();
