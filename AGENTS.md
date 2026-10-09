# AGENTS.md

Operating notes for AI coding agents (Claude Code, Codex, Cursor, Copilot and others) working in this repository. Everything here is derived from the files actually in the tree, so trust it over guesses, and update it when the facts change.

## What this repository is

See `README.md` for the project description.

- Source: https://github.com/nirholas/sol-sweeper-bots
- Primary language: JavaScript
- License: MIT License (see the LICENSE file)

## Repository layout

- `docs/`
- `hooks/`
- `tools/`
- `README.md`
- `LICENSE`
- `package.json`

## Setup

```bash
npm install
```

## Commands

No build, test or lint scripts are declared in the tree. Verify changes by running the project as `README.md` describes.

## Conventions

- `.env` files are gitignored; never commit credentials, and read configuration from environment variables.
- Read the surrounding code before adding to it, and match its naming, file organisation and error-handling style.
- Keep `README.md` accurate: if a change alters behaviour, commands or configuration, update the docs in the same commit.
- Do not leave TODO comments, stub functions, placeholder data or commented-out code behind. Finish what you start or leave it out.
- Small, focused commits with a subject line that describes the change, not the act of committing.

## Where to raise things

- Bugs and feature requests: https://github.com/nirholas/sol-sweeper-bots/issues
- Questions and ideas: https://github.com/nirholas/sol-sweeper-bots/discussions
- Security issues: report privately at https://github.com/nirholas/sol-sweeper-bots/security/advisories/new, never in a public issue.
