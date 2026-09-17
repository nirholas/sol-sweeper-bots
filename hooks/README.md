# hooks

A git `pre-commit` hook that refuses any commit which would introduce a Solana
private key. It runs [keyscan](../tools/keyscan) against the staged files only,
so it judges exactly what is about to be committed and nothing else in the tree.

## Install

From your repository root:

```bash
ln -sf ../../hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

Prefer a copy over a symlink? `cp hooks/pre-commit .git/hooks/pre-commit` works
too; the hook resolves the scanner path either way.

## Behavior

- A staged high-confidence key (a 64-byte array or a base58 64-byte secret)
  blocks the commit with a redacted report of what and where.
- A clean staging area passes silently.

## Bypass

Only when you are certain a match is a false positive:

```bash
SKIP_KEYSCAN=1 git commit ...
```

If you find yourself bypassing it for real keys, the fix is to stop committing
keys, not to disable the hook. A committed key is compromised forever.
