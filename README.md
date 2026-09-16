# The Wallets That Can Never Hold Money

A field guide to Solana sweeper bots: what they are, why a "test" private key committed to a
public package is empty within seconds of being funded, and how the same infrastructure that
powers legitimate MEV gets pointed at ordinary victims.

Written for a general technical audience. This repository is explanatory. It contains no
wallet-draining code and no build instructions for one. It describes the phenomenon so that
readers, journalists, and builders can reason about it and defend against it.

- [The story](story.md) - the long-form piece.
- [Defensive notes](defense.md) - what actually protects a key, and how to check if one is burned.

## The one-sentence version

On a public blockchain, a private key is not a secret you can leak and then rotate. The moment
it becomes public, automated bots claim every lamport that ever touches its address, in the same
block, forever. The key still "works." It just can never hold value again.
