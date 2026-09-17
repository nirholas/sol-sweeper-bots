# keyscan

A read-only scanner that finds Solana private keys committed into a source
tree, before they ship. It never contacts the network and never prints a full
secret. Every hit is redacted to its first and last four characters.

This is the tool that would have caught the leaked keyfile that started this
repository. Run it in CI, in a pre-commit hook, or by hand over a dependency
you are about to trust.

## Use

```
node scan.mjs [path ...]     # scan paths (default: current directory)
node scan.mjs --staged       # scan only files git has staged (for hooks)
node scan.mjs --json         # machine-readable output
```

Exit code is `1` when any high-confidence secret is found, `0` otherwise, so it
gates a commit or a build step directly.

## What it flags

| Signal | Confidence | What it is |
|---|---|---|
| `*.json` containing a 64-length byte array | high | full ed25519 keypair (`solana-keygen` / Phantom export) |
| `*.json` containing a 32-length byte array | medium | possible seed |
| base58 token decoding to 64 bytes | high | ed25519 secret key |
| base58 token decoding to 32 bytes | low | a 32-byte value: could be a public key (fine) or a seed (verify) |

Public keys are 32-byte base58 strings, so they surface at **low** confidence
by design. keyscan tells you where to look; a low hit means "confirm this is a
public value, not a seed." Only high-confidence hits fail the exit code.

## How it works

- No dependencies. base58 decoding is implemented inline.
- Skips `.git`, `node_modules`, `target`, `dist`, `build`, `vendor`, and files
  over 2 MB.
- Reads text/source/JSON extensions only.

## Scanning a dependency before you trust it

```
npm pack some-sdk            # or: cargo the crate source, or download from the registry
tar -xf some-sdk-*.tgz
node scan.mjs package
```

If it finds a key in a published package, use
[the disclosure template](../../docs/disclosure-report.md). Report it; do not
use it.
