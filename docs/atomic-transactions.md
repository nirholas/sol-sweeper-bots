# Atomic transactions and bundles, the legitimate version

Sweepers and the searchers who fight over arbitrage use the same primitive:
grouping actions so they succeed or fail together, and paying for favorable
ordering. The primitive is neutral. This note explains what it is and what it
is legitimately for, so the mechanics in the story are accurate and so builders
understand the tool rather than only fearing it.

## What "atomic" means on Solana

A single Solana transaction can carry many instructions, and they execute all
or nothing. If the last instruction fails, the whole transaction reverts and
nothing before it took effect. That is atomicity: several steps collapse into
one indivisible unit.

This is genuinely useful and completely ordinary:

- **Swap plus slippage guard.** Do the swap and, in the same transaction, a
  check that reverts if you got less than a minimum. You never end up half-swapped
  at a bad price.
- **Create, initialize, fund in one shot.** Open an account, set its authority,
  and deposit into it atomically, so a partial state can never be observed.
- **Route across pools.** A multi-hop trade lands as one unit or not at all, so
  you are never stranded holding the intermediate token.

None of that requires anyone else's key. It is how careful on-chain code is
written.

## Bundles and priority: paying for ordering

Beyond a single transaction, block-builder services let a searcher submit a
*bundle*, an ordered group of transactions that must land together and in
order, and bid a tip for inclusion. Combined with priority fees, this is how a
searcher makes an opportunity land in a specific slot ahead of competitors.

The honest uses are a large, tolerated part of the ecosystem:

- **Arbitrage.** Two venues price the same asset differently. A searcher buys
  low and sells high in one atomic bundle; if either leg fails, the whole thing
  reverts and they are not left exposed. This tightens prices across the market.
- **Liquidations.** A lending position falls below its collateral threshold. A
  bundle repays the debt and claims the collateral atomically, keeping the
  protocol solvent. Protocols *want* this to happen quickly.
- **Backrunning an oracle update.** Reacting to newly public information in the
  next slot, without front-running anyone.

The skill, capital, and infrastructure here are real and prized. This is what
"MEV searcher" means as a profession.

## Where the same primitive turns predatory

The mechanics do not change; the target does. A sweeper points bundling and
priority bidding at a person's mistake instead of a market inefficiency: it
watches an address whose key leaked and, the instant funds arrive, lands an
atomic drain ahead of everyone, paying whatever ordering costs. The atomicity
guarantees the theft is clean; the priority bid guarantees it is first.

The dividing line is not the tool. It is whose authority you are acting under.
Bundling your own swaps, liquidating a position the protocol invites you to
liquidate, arbitraging a public price gap: all yours to do. Signing from a
wallet you do not own is not, no matter how elegant the bundle. Atomicity makes
a legitimate operation safe and an illegitimate one unstoppable, which is
exactly why understanding it matters to defenders.

## Practical takeaway for builders

If you are building with bundles and atomic transactions, you are working with
standard, powerful Solana tooling. Use it for your own flows: it will make them
safer and more predictable. The moment the design depends on a key that is not
yours, it stops being engineering and starts being the thing this repository is
about defending against.
