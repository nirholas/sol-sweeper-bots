# The Wallets That Can Never Hold Money

<!-- three.ws:badges -->
[![GitHub stars](https://img.shields.io/github/stars/nirholas/sol-sweeper-bots?style=flat&logo=github)](https://github.com/nirholas/sol-sweeper-bots/stargazers) [![License](https://img.shields.io/github/license/nirholas/sol-sweeper-bots?style=flat)](https://github.com/nirholas/sol-sweeper-bots/blob/HEAD/LICENSE) [![Last commit](https://img.shields.io/github/last-commit/nirholas/sol-sweeper-bots?style=flat)](https://github.com/nirholas/sol-sweeper-bots/commits) [![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat)](https://github.com/nirholas/sol-sweeper-bots/pulls) [![AI agent friendly](https://img.shields.io/badge/AI%20agents-AGENTS.md%20%2B%20llms.txt-6d5dfc?style=flat)](https://github.com/nirholas/sol-sweeper-bots/blob/HEAD/AGENTS.md)
<!-- /three.ws:badges -->


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

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=nirholas/sol-sweeper-bots&type=Date)](https://www.star-history.com/#nirholas/sol-sweeper-bots&Date)

<!-- three.ws:growth -->
## Support the project

If sol-sweeper-bots saves you time, **[star it on GitHub](https://github.com/nirholas/sol-sweeper-bots)**. Stars are how other developers and AI agents find the repositories worth trusting, and they cost you one click.

Know someone who would use it? [Post on X](https://twitter.com/intent/tweet?text=sol-sweeper-bots%3A%20Defensive%20explainer%20and%20read-only%20tools%20on%20why%20leaked%20Solana%20private%20keys%20are%20permanently%20unsafe&url=https%3A%2F%2Fgithub.com%2Fnirholas%2Fsol-sweeper-bots) · [Share on Bluesky](https://bsky.app/intent/compose?text=sol-sweeper-bots%3A%20Defensive%20explainer%20and%20read-only%20tools%20on%20why%20leaked%20Solana%20private%20keys%20are%20permanently%20unsafe%20https%3A%2F%2Fgithub.com%2Fnirholas%2Fsol-sweeper-bots) · [Share on LinkedIn](https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fgithub.com%2Fnirholas%2Fsol-sweeper-bots) · [Submit to Hacker News](https://news.ycombinator.com/submitlink?u=https%3A%2F%2Fgithub.com%2Fnirholas%2Fsol-sweeper-bots&t=sol-sweeper-bots%3A%20Defensive%20explainer%20and%20read-only%20tools%20on%20why%20leaked%20Solana%20private%20keys%20are%20permanently%20unsafe) · [Share on Reddit](https://www.reddit.com/submit?url=https%3A%2F%2Fgithub.com%2Fnirholas%2Fsol-sweeper-bots&title=sol-sweeper-bots%3A%20Defensive%20explainer%20and%20read-only%20tools%20on%20why%20leaked%20Solana%20private%20keys%20are%20permanently%20unsafe)

## Built for AI agents too

Coding agents and LLM tooling can read this repo directly: [AGENTS.md](./AGENTS.md), [llms.txt](./llms.txt), [llms-full.txt](./llms-full.txt). Point an agent at `https://github.com/nirholas/sol-sweeper-bots` and it has the context it needs.

## More from the same author

- [All repositories by nirholas](https://github.com/nirholas/nirholas#readme): the full catalog, grouped by topic
- [three.ws](https://three.ws): the platform for 3D AI agents with Solana wallets, a skill marketplace and x402 payments
- Questions or ideas: [open an issue](https://github.com/nirholas/sol-sweeper-bots/issues) or [start a discussion](https://github.com/nirholas/sol-sweeper-bots/discussions)

## Contributors

[![Contributors](https://contrib.rocks/image?repo=nirholas/sol-sweeper-bots)](https://github.com/nirholas/sol-sweeper-bots/graphs/contributors)

<!-- /three.ws:growth -->
