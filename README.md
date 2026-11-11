<div align="center">

# ↩ TWEET//TO//YOURSELF

### Making it easier to tweet to yourself.

**THE REPLY GUY SDK — v0.1.0**

**Now you can be the poster, the reply guy, the fact-checker, and the argument's only witness.**

[Play the offline web app](https://qsolkcb.github.io/TWEET-TO-YOURSELF/) · [Read the field guide](docs/FIELD_GUIDE.md)

**This is not a product. This is INDEPENDENCE. 👽**

</div>

---

## 👽 NEW — REPLY REACTOR 3000 (VANILLAJS v1.7.0)

**We've turned arguing with yourself into a mathematically exact game.**

The new on-page **REPLY REACTOR 3000** uses three **unchanged, source-pinned**
[Apache-2.0 VANILLAJS v1.7.0](https://github.com/QSOLKCB/VANILLAJS/releases/tag/v1.7.0)
modules: **GF(3)**, **symbolic-events** and **audio2d**.

- Every new top-level post moves your two-coordinate *ego state* by +1 in GF(3).
- Every self-reply applies a reversible GF(3) shear and increments the second coordinate.
- Reach **[2,1]** for the entirely meaningless **“Win an Argument Against Yourself”** achievement.
- Watch an always-offline 3×3 ternary-state grid update from your local posts.
- Export a versioned, **post-text-free symbolic event log** or an exact,
  **48 kHz mono PCM16LE reference WAV** (up to eight seconds).
- Play the reference score through explicitly opted-in browser audio without
  altering the source posts, numerical state or event identities.
- Score only the most recent 32 posts: older messages stay in the timeline
  but are outside the current 32-tick scoring window.

This is a **classical finite-state puzzle with a declared musical mapping**.
It is not quantum computation, a physical surveillance detector, or generative AI.
Audio-device resampling is presentation only; the generated WAV is the reference.

[Read the mathematics and reproducibility contract](docs/REPLY_REACTOR.md) ·
[Inspect pinned source SHAs](vendor/vanillajs/SOURCE.md)

---

## Why argue with strangers when you can argue with yourself?

TWEET-TO-YOURSELF is an open-source, absurdist, standalone HTML application.
It **does not post to X/Twitter**. It does not sign into social media, invoke an
LLM, access surveillance systems, load external JavaScript or call a remote API.

The fictional warning generator occasionally claims that imaginary government
agents are monitoring your farts, that a tinfoil hat needs a firmware update,
or that satellites are requesting annual leave after the latest self-reply.
**These are explicit jokes, not allegations, security alerts or factual claims.**

### Fully unnecessary special features

- **Self-reply timeline:** Write a post and reply directly to yourself as many
  times as you like (up to the bounded local archive limit).
- **One-click auto-argument:** Deterministically generates another silly
  objection from *you*. No model, no cloud, no API key.
- **S.E.L.F. AI\*:** Self-Echo Loop Facilitator — cycles through scripted,
  clearly fictional conspiracy alerts and increasingly useless countermeasures.
  \*Not actually artificial intelligence.
- **Grass Protocol 005:** Touch virtual grass five times. Go outdoors for
  the premium version. Does not block surveillance signals.
- **Tinfoil-hat instructions:** A checklist for a craft joke, explicitly
  not an effective privacy or communications device.
- **Why Earth isn't flat:** Four actual, broadly established observations
  about Earth's curvature, intentionally distinguishing science from satire.
- **Your own receipts:** Download an inspectable JSON file documenting your
  local self-replies. No network requests are performed.
- **Local recovery:** State is stored in this browser's localStorage when
  available, with corrupt data rejected and errors reported.
- **Multi-tab safety:** Storage events refresh visible posts, and a pre-write
  stale-snapshot check rejects conflicting operations before overwriting posts.
  Drafts remain in the composer for explicit retry. Because localStorage has
  no atomic compare-and-swap, truly simultaneous writes across tabs are not
  transactionally protected.
- **Unicode:** Composer and core both count Unicode code points, not UTF-16
  units. The input accepts 280 emoji, trimming excess pasted code points.
- **Offline-first:** Native HTML/CSS/ES modules; no NPM install, frameworks,
  build server, fonts, images, cookies, analytics or runtime dependencies.

## Run locally

The application is static. Open `index.html` directly in a modern browser if
your browser permits local ES-module imports, **or serve it from loopback**:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:8765/`. No external network is required.

### Test

Node's built-in test runner, no packages required:

```sh
node --test tests/*.test.mjs
node --check src/core.mjs
node --check src/app.mjs
node --check src/reply-reactor.mjs
node --check src/reply-reactor-ui.mjs
```

To verify the deployment payload using only Python's standard library:

```sh
uv run --no-project python scripts/verify_site.py
```

GitHub Actions runs the same tests on pull requests and `main` pushes.
The GitHub Pages job is restricted to **successful main-branch pushes**; a
pull request cannot deploy and there is no unrestricted manual dispatch.
Enable GitHub Pages with **GitHub Actions** as the source to publish the site.

## Architecture and privacy

- `src/archive-store.mjs`: offline storage sync and stale-write rejection.
- `src/core.mjs`: pure deterministic warning/reply generator, bounded archive
  validation, receipt serialization and factual field-guide content.
- `src/app.mjs`: local browser UI and explicit DOM event handlers.
- `src/reply-reactor.mjs`: pure, bounded, 32-tick GF(3) game projection,
  symbolic score and auditable JSON/WAV reference.
- `src/reply-reactor-ui.mjs`: 9-state SVG graph, achievement and opt-in audio.
- `vendor/vanillajs/{gf3,symbolic-events,audio2d}/index.js`: byte-pinned
  upstream modules (see `vendor/vanillajs/SOURCE.md`).
- `index.html` / `style.css`: accessible, responsive self-reply cockpit.
- `tests/`: Node behavioral and static-site contract tests.
- `scripts/verify_site.py`: standard-library source packaging checks.
- `docs/FIELD_GUIDE.md`: parody guide and genuine geography explanations.

The script uses `textContent` when displaying posts, never `innerHTML`.
A restrictive Content Security Policy forbids network connections and
third-party scripts. LocalStorage persists *only on this device/browser*;
clear the echo or site data to remove it. A 150-post limit and 280-character
message limit prevent unbounded local archives. Export produces inert JSON;
there is no automatic upload, import of executable mods or contact with X.

The app is **not** a real privacy, intelligence, location, or security tool.
The humor targets implausible conspiracy narratives, not ordinary questions
or legitimate personal safety concerns.

## License

Apache-2.0. No external fonts or copyrighted social-media UI assets.
The app is a standalone parody and is not affiliated with X/Twitter or any
named intelligence organization.

---

**ZERO REAL TWEETS SENT. INFINITE OPPORTUNITIES TO DISAGREE WITH YOURSELF.**
