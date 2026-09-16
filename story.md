# The Wallets That Can Never Hold Money

## Inside Solana's sweeper bots, and the leaked keys they feed on

Somewhere in the test suite of an open-source Solana SDK, there is a private key. It was never
meant to be a secret. A developer needed a signer so the tests would run the same way on every
machine, so they generated a keypair, pasted it into a fixture, and moved on. It has been sitting
in plain sight ever since, published to a package registry, mirrored across GitHub, copied into
a hundred forks.

If you funded that address with a fraction of a SOL right now, the money would be gone before you
could refresh the explorer. Not stolen by a person watching the screen. Claimed by a program that
has been waiting on that exact address, along with tens of thousands of others, for months.

This is the world of sweeper bots. They are the reason a leaked private key is not like a leaked
password. You cannot change it, revoke it, or race to empty the wallet first. On a public
blockchain, the leak is permanent and the bots are faster than you will ever be.

---

## Why test keys leak in the first place

The leak is almost never malicious. It is a byproduct of how software gets built.

Deterministic tests need deterministic inputs. A library that builds Solana transactions needs a
signer to build them with. The cleanest way to make a test reproducible is to hardcode a keypair
so every run produces the same signatures and the same program-derived addresses. Example code
has the same pull: a snippet that "just works" when you paste it needs a funded-looking account,
so the author drops one in.

The keypair is scenery. To the developer it represents nothing. It has no funds, it is on devnet
in their mental model, and it exists only to make a green checkmark appear. So it ships. It goes
into the crate, into the npm package, into the Stack Overflow answer with 400 upvotes, into the
Discord message pinned in the SDK's support channel.

And the instant it touches any public surface, it stops being scenery and becomes an address that
a very large number of automated systems now watch continuously.

---

## What a sweeper actually is

A sweeper bot is conceptually simple, which is part of what makes it relentless. It maintains a
list of addresses whose private keys are known to be compromised, and it reacts the moment any
of them receives value.

The compromised-key list is assembled by scanners that crawl the same places developers leak keys:
public git repositories and their full commit history, package registries, paste sites, gists,
chat exports, and the firehose of newly pushed code that services like GitHub expose in near real
time. A committed private key has a recognizable shape, so finding one in a diff is trivial and
happens within seconds of the push. Security teams run these scanners defensively to warn their
own developers. Thieves run identical scanners to feed their sweepers. The tooling is the same;
only the intent differs.

Watching the addresses is cheap on Solana because the network will tell you. Rather than polling
balances, a bot subscribes to account updates and gets pushed a notification the moment a watched
address changes. When value lands, the bot reacts immediately, and the whole point is that its
reaction is automated end to end: no human is in the loop, because a human would lose the race.

That race is the interesting part, and it is where Solana's design turns a mere theft into
something closer to a physics problem.

---

## The race, and why you always lose it

When you send funds to a compromised address, you are not the only one who noticed. The sweeper
noticed at the same time, and it has spent months tuning for exactly this moment.

Solana orders transactions within a block partly by how much a sender is willing to pay in
priority fees. A sweeper will pay almost anything, because the alternative is letting the money
sit where a competitor's sweeper (or, absurdly, the original owner) might grab it first. It is
common for a sweeper to spend more on fees than the amount it is stealing. Draining a few cents of
SOL at a loss is rational if it protects the bot's coverage of that address and denies the funds
to everyone else.

Some operators go further and route their sweep through block-building services that let a
searcher bundle transactions and bid for priority placement, the same infrastructure legitimate
arbitrage bots use. The effect is that the drain can be effectively guaranteed to land in the very
next block, ahead of anything you could submit by hand.

So the timeline looks like this. Funds arrive. The bot is notified in the same slot. It constructs
and submits a transfer that empties the address, paying whatever it takes to win ordering. The
next time a human looks, the balance is zero and there is a transfer out to an address they have
never seen, timestamped a fraction of a second after their deposit. To the victim it looks like
the money teleported. It did not. It was auctioned.

This is why the "leaked test key" is such a perfect small tragedy. People who stumble on it and
think "let me just send a tiny bit to see if it works" are running a live experiment whose result
is always the same. The wallet works perfectly. It simply cannot keep anything. It is a bucket
with no bottom, and the floor is a swarm of programs that have agreed, without ever communicating,
that whatever falls in is theirs.

---

## A dark mirror of MEV

None of this technology is inherently criminal, and that is the uncomfortable center of the story.

The legitimate version is called MEV, maximal extractable value. Searchers run bots that watch the
chain for profitable opportunities such as arbitrage between decentralized exchanges or
liquidations of undercollateralized loans, and they compete in fee auctions to capture them first.
It is a real, large, mostly tolerated part of how these markets function. The skills are prized;
the infrastructure is professional-grade.

A sweeper is that same machine pointed at a person instead of a market inefficiency. The account
subscriptions, the priority-fee bidding, the bundle submission, the obsessive latency
optimization: all of it is standard searcher engineering. The only thing that changes is the
target. Instead of profiting from a price gap that the market created, the sweeper profits from a
mistake that a human made. Same reflexes, different prey.

That parallel is worth sitting with, because it explains why sweepers are so good. They are not a
fringe scam built by amateurs. They are a routine application of infrastructure that an entire
professional ecosystem has spent years sharpening for other reasons. Fighting them by trying to be
faster is hopeless. They were fast before you showed up.

---

## The economics of stealing pennies

It seems irrational to run expensive, sophisticated infrastructure to sweep addresses that are
almost always empty and, when funded, often hold only dust. The economics make sense once you see
what the bot is actually betting on.

Coverage is cheap and the tail is fat. Watching one more address costs almost nothing, so a
sweeper watches every compromised key it can find. The vast majority will never be funded again.
But every so often someone makes a real mistake: a developer generates a mainnet keypair using an
example that happens to reuse a published seed, an automated system pays into the wrong address, a
newcomer follows a tutorial literally and funds the tutorial's own demo account. When that
happens, the wallet might briefly hold a meaningful sum, and the bot that has maintained coverage
for months collects the entire tail event in a single block.

Running at a loss on the small stuff is the cost of being positioned for the large stuff. It is
insurance written backwards: the sweeper pays tiny premiums constantly, in fees, for the rare
payout. And because the payout goes to whoever is fastest, there is no room for a casual
participant. The bots that survive are the ones that never blink.

---

## What this means for the people building on-chain

For a story, the sweeper is a vivid character. For anyone actually shipping software, it is a
standing rule with no exceptions: a private key that has ever been public is dead, permanently,
and no amount of cleverness resurrects it.

That has concrete consequences. Rotating a leaked key is not enough; the funds must move from a
key that was never exposed, generated on a machine you trust, and the old address must simply be
abandoned. Deleting the commit does not help, because the scanners already have it and the git
history preserves it anyway. Scrubbing the repository does not un-ring the bell. The only safe
assumption is that anything ever committed is known to everyone forever.

The good news is that the defense is boring and completely effective, which is the subject of the
companion [defensive notes](defense.md). Keys that never touch a public surface never enter a
sweeper's list. The entire threat evaporates upstream, at the moment of not leaking, which is the
one moment you fully control.

---

## The empty wallet as a monument

There is something almost poetic in a wallet that everyone can open and no one can fill. It is a
public address with a published key, visible to the entire world, and it will hold a zero balance
until the network itself shuts down. Every deposit is an offering to a swarm. Every sweep is
instant and impersonal. The wallet keeps working, faithfully, forever, and keeps nothing.

It is the clearest illustration you will find of what a blockchain actually is. Not a vault, but a
public ledger where the only thing standing between value and the entire internet is a secret, and
where the moment the secret is out, the crowd is already faster than you. The sweeper bots did not
break that rule. They are just the part of the system that enforces it without mercy, at machine
speed, on anyone careless enough to test it.
