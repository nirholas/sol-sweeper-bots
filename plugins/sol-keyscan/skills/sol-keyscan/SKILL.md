---
name: sol-keyscan
description: Scan a source tree or dependency for committed Solana private keys with keyscan, block such commits with a pre-commit hook, and check from public ledger data whether an address is already swept with burned-check. Use before trusting a package or shipping code, or when a key may have leaked.
---

# sol-keyscan

The sol-sweeper-bots repo ships two read-only, dependency-free Node tools (Node 18+). Neither touches the network for writes, and neither needs a key. They are not published to npm, so run them from a clone:

```bash
git clone https://github.com/nirholas/sol-sweeper-bots
```

Below, `$TOOLS` is the path to that clone.

## keyscan: find committed keys

```bash
node $TOOLS/tools/keyscan/scan.mjs [path ...]   # default path is "."
node $TOOLS/tools/keyscan/scan.mjs --staged     # only files git has staged
node $TOOLS/tools/keyscan/scan.mjs --json       # machine-readable output
```

It never contacts the network and redacts every hit to the first and last four characters. Exit code 1 means a high-confidence finding, 0 means none, so it can gate a commit or CI step.

| Signal | Confidence |
| --- | --- |
| `*.json` holding a 64-length byte array (solana-keygen or Phantom export) | high |
| base58 token that decodes to 64 bytes (ed25519 secret key) | high |
| `*.json` holding a 32-length byte array | medium |
| base58 token that decodes to 32 bytes | low (may be a public key; confirm) |

It skips `.git`, `node_modules`, `target`, `dist`, `build`, `vendor` and files over 2 MB. Only high-confidence hits fail the exit code, so read low and medium hits by hand.

Scan a dependency before trusting it:

```bash
npm pack some-sdk && tar -xf some-sdk-*.tgz
node $TOOLS/tools/keyscan/scan.mjs package
```

## Pre-commit guard

In the repository to protect:

```bash
ln -sf $TOOLS/hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

It runs keyscan on staged files and blocks a commit that adds a key. `SKIP_KEYSCAN=1 git commit ...` bypasses it; use that only for a confirmed false positive.

## burned-check: is this address already swept

```bash
node $TOOLS/tools/burned-check/check.mjs <address> [--rpc <url>] [--limit N] [--json]
```

It reads `getBalance`, `getSignaturesForAddress` and `getTransaction` over public JSON-RPC (default `https://api.mainnet-beta.solana.com`, `--limit` default 25) and prints a verdict: `LIKELY SWEPT`, `EMPTY, ACTIVE HISTORY`, `HOLDS A BALANCE` or `NO ACTIVITY`. An invalid address exits with code 2.

## What to do with a finding

A key that is public is permanently unsafe: bots take any value that reaches its address. Never use, import or fund a wallet whose key you found. If the key is in a published package, report it with `docs/disclosure-report.md` from the repo. If it is your own, stop using the address and move to a fresh keypair.

## Worked example

```bash
node $TOOLS/tools/keyscan/scan.mjs --json . > findings.json; echo "exit $?"
node $TOOLS/tools/burned-check/check.mjs <address-from-a-finding> --json
```
