# Responsible disclosure: exposed private key in a published package

This is the template to use when you find a live private key committed into a
published package. It is written so you can send it as-is after filling the
brackets. It contains no key material: you reference the location, you never
paste the secret.

## Why this is the right move

An exposed key controlling a real wallet is a genuine security issue for
whoever owns that wallet and for everyone who installs the package. Reporting
it, rather than using it, is what a security researcher does. It is also the
only path here that builds reputation instead of liability. Many projects run
disclosure programs and some pay bounties; even where they do not, a clean
report is a credential.

## Before you send

- **Do not move funds, sign, or mint from the wallet.** Confirming the key is
  live by importing it read-only into a watch context, or by observing the
  address on an explorer, is enough. Operating the wallet is not disclosure, it
  is the thing disclosure exists to prevent.
- **Redact.** Reference the file path and package version. Never paste the
  secret into an email, issue, or chat. If the recipient needs to confirm, they
  can open the same public file.
- **Pick a private channel.** A `SECURITY.md`, a security email, or a program
  on a platform like GitHub. Do not open a public issue that points at a live
  key.

## Template

> Subject: Security disclosure: private key committed in [package]@[version]
>
> Hello [maintainer / security contact],
>
> I found what appears to be a live ed25519 private key committed to the
> published source of [package name] version [x.y.z]. It is located at:
>
>   [path/inside/the/package, e.g. keys/quote_mint.json]
>   (visible in the registry-published source and in the git history)
>
> The key decodes to a valid Solana keypair. Public ledger state for the
> corresponding address shows [it currently holds a balance / prior activity],
> which suggests it is or was a real wallet rather than an inert test artifact.
> I have not signed any transaction with it and have not moved any funds; I am
> only reporting what is publicly observable.
>
> Recommended actions:
>   1. Treat the key and its address as permanently compromised. Do not send
>      further funds to it, and migrate any authority it holds to a freshly
>      generated key.
>   2. Remove the key from the source and from examples/tests. Replace hardcoded
>      signers with runtime-generated keypairs or an environment variable the
>      user supplies.
>   3. Publish a new version without the key, and consider yanking affected
>      versions from the registry.
>   4. Add a secret scan to CI so this cannot recur.
>
> Happy to share the exact observations privately. Please let me know a secure
> channel if you would like more detail.
>
> [your name / handle]
> [date]

## After you send

- Give the maintainer reasonable time to respond and remediate before writing
  publicly about it. Coordinated disclosure means the fix lands first.
- When you do write it up, describe the class of problem and the fix. You do
  not need to reveal the key to tell the story; the interesting part is the
  supply-chain lesson, not the secret.
