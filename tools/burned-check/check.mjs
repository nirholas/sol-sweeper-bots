#!/usr/bin/env node
// burned-check: read-only diagnostic that tells you whether a Solana address
// shows the signature of a swept ("burned") wallet, the pattern the story
// describes: value arrives and leaves again almost immediately, over and over,
// leaving a near-zero balance despite repeated funding.
//
// It only READS public ledger state (getBalance, getSignaturesForAddress,
// getTransaction) over public JSON-RPC. It never needs, asks for, or touches a
// private key, and it moves nothing.
//
// Usage:
//   node check.mjs <address> [--rpc <url>] [--limit N] [--json]
//
// Requires Node 18+ (global fetch).

const args = process.argv.slice(2);
const address = args.find((a) => !a.startsWith("--"));
const asJson = args.includes("--json");
const rpc = argValue("--rpc") || "https://api.mainnet-beta.solana.com";
const limit = Number(argValue("--limit") || "25");

function argValue(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

if (!address) {
  console.error("usage: node check.mjs <address> [--rpc <url>] [--limit N] [--json]");
  process.exit(2);
}

const B58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
if (!B58.test(address)) {
  console.error(`error: "${address}" is not a base58 Solana address.`);
  process.exit(2);
}

async function rpcCall(method, params) {
  const res = await fetch(rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`RPC ${method} HTTP ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(`RPC ${method}: ${body.error.message}`);
  return body.result;
}

const LAMPORTS_PER_SOL = 1_000_000_000;

async function main() {
  const balanceResult = await rpcCall("getBalance", [address]);
  const balanceLamports = balanceResult.value ?? 0;
  const balanceSol = balanceLamports / LAMPORTS_PER_SOL;

  const sigs = await rpcCall("getSignaturesForAddress", [address, { limit }]);

  // Inspect recent transactions and measure this address's balance delta in
  // each: a positive delta is money in, a negative delta is money out. A swept
  // wallet shows tightly interleaved in/out pairs seconds apart.
  let inflows = 0;
  let outflows = 0;
  let quickOut = 0; // outflow within 60s of the previous inflow
  let lastInflowTime = null;
  const samples = [];

  const toInspect = sigs.slice(0, Math.min(sigs.length, 15));
  for (const s of toInspect) {
    let tx;
    try {
      tx = await rpcCall("getTransaction", [s.signature, { maxSupportedTransactionVersion: 0, encoding: "json" }]);
    } catch {
      continue;
    }
    if (!tx || !tx.meta) continue;
    const keys = (tx.transaction.message.accountKeys || []).map((k) => (typeof k === "string" ? k : k.pubkey));
    const idx = keys.indexOf(address);
    if (idx < 0) continue;
    const delta = (tx.meta.postBalances[idx] - tx.meta.preBalances[idx]) / LAMPORTS_PER_SOL;
    const t = s.blockTime ? s.blockTime * 1000 : null;
    if (delta > 0) {
      inflows++;
      lastInflowTime = t;
    } else if (delta < 0) {
      outflows++;
      if (lastInflowTime && t && t - lastInflowTime <= 60_000) quickOut++;
    }
    samples.push({ signature: s.signature, deltaSol: Number(delta.toFixed(6)), blockTime: s.blockTime, err: s.err ? "failed" : "ok" });
  }

  // Verdict heuristic. Many signatures + near-zero balance + interleaved
  // in/out is the swept fingerprint. We report confidence, not certainty.
  const nearZero = balanceLamports < 0.001 * LAMPORTS_PER_SOL;
  const churny = inflows > 0 && outflows > 0;
  let verdict, note;
  if (nearZero && churny && (quickOut > 0 || sigs.length >= limit)) {
    verdict = "LIKELY SWEPT";
    note = "Near-zero balance with repeated in-then-out flow. Anything sent here will almost certainly be drained on arrival.";
  } else if (nearZero && sigs.length > 0) {
    verdict = "EMPTY, ACTIVE HISTORY";
    note = "Currently near zero with prior activity. Treat as unsafe if the key was ever public.";
  } else if (balanceLamports > 0) {
    verdict = "HOLDS A BALANCE";
    note = "Currently funded. If this address's key is known to be public, the balance is at acute risk.";
  } else {
    verdict = "NO ACTIVITY";
    note = "No balance and no recent signatures found.";
  }

  const report = {
    address,
    rpc,
    balanceSol: Number(balanceSol.toFixed(9)),
    recentSignatures: sigs.length,
    inspected: samples.length,
    inflows,
    outflows,
    quickOutflowsWithin60s: quickOut,
    verdict,
    note,
    samples,
  };

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`\naddress   ${address}`);
  console.log(`rpc       ${rpc}`);
  console.log(`balance   ${report.balanceSol} SOL`);
  console.log(`activity  ${sigs.length} recent signature(s); inspected ${samples.length}`);
  console.log(`flow      ${inflows} in / ${outflows} out, ${quickOut} out within 60s of an in`);
  console.log(`\nverdict   ${verdict}`);
  console.log(`          ${note}\n`);
  if (samples.length) {
    console.log("recent balance deltas (this address):");
    for (const s of samples.slice(0, 10)) {
      const when = s.blockTime ? new Date(s.blockTime * 1000).toISOString() : "unknown time";
      const sign = s.deltaSol > 0 ? "+" : "";
      console.log(`  ${when}  ${sign}${s.deltaSol} SOL  ${s.err}  ${s.signature.slice(0, 12)}...`);
    }
    console.log();
  }
}

main().catch((err) => {
  console.error(`burned-check failed: ${err.message}`);
  process.exit(1);
});
