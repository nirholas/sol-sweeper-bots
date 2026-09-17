# burned-check

A read-only diagnostic that tells you whether a Solana address shows the
fingerprint of a swept ("burned") wallet: value arrives and leaves again almost
immediately, over and over, leaving a near-zero balance despite repeated
funding.

It only **reads** public ledger state (`getBalance`,
`getSignaturesForAddress`, `getTransaction`) over public JSON-RPC. It never
needs, asks for, or touches a private key, and it moves nothing. You can point
it at any address, including one whose key you found, to confirm from the public
record that sending funds there is pointless without ever holding the key.

## Use

```
node check.mjs <address> [--rpc <url>] [--limit N] [--json]
```

- `--rpc` defaults to `https://api.mainnet-beta.solana.com`. Use your own
  endpoint for higher rate limits.
- `--limit` is how many recent signatures to pull (default 25); it inspects the
  most recent up to 15 in detail.
- `--json` emits the full report for scripting.

Requires Node 18+ (global `fetch`).

## What it reports

- Current balance in SOL.
- Count of recent signatures and how many were inspected.
- Inflow / outflow counts, and how many outflows landed within 60 seconds of an
  inflow (the sweep tell).
- A verdict: `LIKELY SWEPT`, `EMPTY, ACTIVE HISTORY`, `HOLDS A BALANCE`, or
  `NO ACTIVITY`, with a plain-language note.
- A list of recent balance deltas for the address, so you can see the in/out
  pattern yourself.

## Reading the result

A `LIKELY SWEPT` verdict, near-zero balance with tightly interleaved
in-then-out flow, is the public proof of the story: the address works, but
cannot keep anything, because bots claim every deposit on arrival. That is the
conclusion reached entirely from the ledger, without the key.

`HOLDS A BALANCE` on an address whose key is known to be public means funds are
at acute risk right now. That is a disclosure trigger, not an opportunity: see
[the disclosure template](../../docs/disclosure-report.md).
