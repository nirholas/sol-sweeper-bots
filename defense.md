# Defensive notes

The companion to [the story](story.md). If the story explains why a leaked key is unrecoverable,
this explains the only things that actually work: not leaking, and knowing when you already have.

Nothing here is a drain tool or an attack recipe. It is the defender's side, written plainly.

## The one rule that matters

A private key that has ever been public is permanently unsafe. Not "risky." Unsafe with no
recovery path. The defense is entirely upstream, at the moment the key is created and stored,
because that is the only moment you control. Once a key is out, every downstream reaction is too
slow.

## How keys leak, so you can not do it

The common paths, roughly in order of how often they happen:

- **Committing a keyfile or seed to a repository.** Even a private repo is one visibility toggle,
  one fork, or one compromised collaborator away from public. Git history keeps it even after you
  delete the file.
- **Hardcoding a keypair in tests or examples.** The subject of the story. If a test needs a
  signer, generate one at runtime or load it from an environment variable that is never committed.
- **Pasting into chat, issues, or paste sites** while debugging. As demonstrated the hard way, a
  paste is a publish.
- **Logging secrets.** A key printed into application logs ends up in log aggregation, crash
  reports, and screenshots.
- **`.env` files that escape `.gitignore`.** Confirm the ignore rule actually matches before the
  first commit, not after.

## If a key may have been exposed

Treat exposure as certain, not possible, and act in this order:

1. **Move funds from a fresh key, not the exposed one.** Generate a new keypair on a trusted
   machine and transfer everything to it. Do not try to "empty the exposed wallet to safety" as a
   race; you will lose that race. If the exposed address currently holds value, the realistic
   assumption is that it is already gone or will be the instant you touch it.
2. **Abandon the exposed address forever.** Never fund it again, not even to test. It is a bucket
   with no bottom.
3. **Rotate everything the key protected.** If it signed for a program, a multisig member, or an
   authority, update those authorities to the new key.
4. **Do not bother scrubbing git history for safety's sake.** Do it for hygiene if you like, but
   the scanners already have it. Removing the commit changes nothing about the key's safety.

## Checking whether an address is already burned (read-only)

This is legitimate, defensive, and harms no one: you are only reading public ledger state to
confirm what you already suspect. It touches no keys and moves no funds.

- **Look at the address in any block explorer.** A history of many small deposits, each followed
  almost immediately by a transfer out to a different address, is the signature of a swept wallet.
  The near-zero balance despite repeated funding tells the whole story.
- **Query the balance and recent signatures with a public RPC endpoint.** A `getBalance` call and
  a `getSignaturesForAddress` call over public JSON-RPC are read-only. The pattern of quick
  in-then-out transfers, timestamped seconds apart, confirms an address is under active sweep
  coverage.

If you see that pattern, the conclusion is simple: the key is compromised, the address is dead,
and nothing you send there will stay. Which is the entire point of the story, proven from the
public record without needing the key at all.

## For maintainers of SDKs and examples

You can remove one source of these leaks entirely:

- Generate keypairs at test time; never commit a fixed one.
- In examples, read the signer from an environment variable and document that the user must supply
  their own, rather than shipping a working one.
- Add a secret scanner to your own pre-commit and CI so a hardcoded key fails the build before it
  is ever pushed.

A committed test key looks harmless because it is empty. It is not harmless. It teaches every
reader of your code that this is normal, and some of them will copy the pattern into a repository
that does hold funds.
