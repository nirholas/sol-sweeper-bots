# The Wallets That Can Never Hold Money

Why a private key that ever becomes public is permanently unsafe on Solana, how
sweeper bots claim any funded compromised address in-block, and the read-only
tools that catch the problem upstream.

This repository is explanatory and defensive. It contains no wallet-draining
code and no instructions for operating a wallet you do not control. The one rule
throughout: the only question that decides whether an address is yours to use is
whether you hold its authority. A key you found in a package does not pass that
test, no matter what it is labeled.

## Read

- **[story.md](story.md)** - the long-form piece: leaked test keys, how sweepers
  watch and win the fee race, the MEV parallel, the economics of stealing
  pennies, and the wallet that can never hold money.
- **[defense.md](defense.md)** - what actually protects a key, what to do if one
  is exposed, and how to confirm an address is already burned from the public
  record.
- **[docs/atomic-transactions.md](docs/atomic-transactions.md)** - the bundling
  and priority-fee primitive explained in its legitimate form (arbitrage,
  liquidations, slippage guards), and the line where the same tool turns
  predatory.
- **[docs/disclosure-report.md](docs/disclosure-report.md)** - a ready-to-send
  responsible-disclosure template for reporting an exposed key in a published
  package.

## Tools (read-only, no keys, no network writes)

- **[tools/keyscan](tools/keyscan)** - scans a source tree for committed Solana
  private keys and redacts every hit. Exit code 1 on a high-confidence find, so
  it gates a commit or CI job. This is the tool that catches a leak before it
  ships.
- **[tools/burned-check](tools/burned-check)** - reads public ledger state to
  tell you whether an address shows the swept-wallet fingerprint. Proves an
  address is a dead drop without ever touching its key.
- **[hooks/pre-commit](hooks/pre-commit)** - a git hook that runs keyscan
  against staged files and blocks a commit that would introduce a key.

## Quick start

```bash
# scan the current tree for committed keys
node tools/keyscan/scan.mjs .

# scan a dependency before you trust it
npm pack some-sdk && tar -xf some-sdk-*.tgz && node tools/keyscan/scan.mjs package

# check whether an address is already swept (read-only, mainnet)
node tools/burned-check/check.mjs <address>

# install the pre-commit guard in your own repo
ln -sf ../../hooks/pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
```

Node 18+ (the tools use built-in `fetch` and have no dependencies).

## The one-sentence version

On a public blockchain, a private key is not a secret you can leak and then
rotate. The moment it becomes public, automated bots claim every lamport that
ever touches its address, in the same block, forever. The key still works. It
just can never hold value again. The right response is to scan for these keys
before they ship, disclose the ones you find, and never treat a wallet you do
not control as yours.
