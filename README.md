# SecureCheck

SecureCheck is a static, local-first password security analyzer and learning toolkit built with HTML, CSS, and vanilla JavaScript. It has no backend, third-party scripts, analytics, or external password-analysis services.

## Run it

Open index.html in a current Chromium, Firefox, or Safari browser. If the browser restricts clipboard access when opening a file directly, run a local static server from this folder:

    python -m http.server 8000

Then visit http://localhost:8000. The server only serves these static files; analysis still runs entirely in the browser.

## Files

- index.html — accessible page structure and application sections.
- styles.css — responsive layouts, fifteen coordinated themes, and visual states.
- app.js — local analysis, estimates, generators, comparison, simulator, history, reports, and settings.

## Analysis and scoring

- The local detector reports several visible patterns together: common-password similarity, dictionary words and substitutions, keyboard walks, sequences, repeated blocks and runs, date and month cues, familiar prefixes and suffixes, and word-number structures.
- Character analysis includes class counts and distribution indicators, code points, graphemes, UTF-8 bytes, whitespace, Unicode code points, and emoji graphemes. The anatomy map shows only type runs and counts, not password characters.
- A 100-point score combines length, character-class diversity, distribution indicators, predictability, repetition, and common-password similarity. Related pattern flags share the same predictability factor to reduce double-counting.
- Manually entered passwords have low analysis confidence because the app cannot know how they were created, whether they are reused, or whether they have appeared in a breach. No external password list is downloaded and no password is sent anywhere.
- A 100/100 result is the ceiling of this model, not a guarantee.

## Guessing-time model

- The dashboard puts the fastest enabled scenario first and shows expected time (N/2 attempts) and worst case (N attempts) for its modeled candidate space.
- The model computes in logarithmic space, so large search estimates do not overflow. It formats seconds through months, years, centuries, and scientific notation.
- Thirteen presets range from 1,000 to 1 quadrillion guesses per second. A numeric input, unit selector, logarithmic slider, quick preset buttons, reset control, and editable scenario rates let users explore assumptions.
- Rate-limited online, faster online, fast-hash offline, slow password-hash, and user-configured scenarios remain independent. bcrypt, scrypt, Argon2id, PBKDF2, and fast general-purpose hash are method-context labels; SecureCheck does not claim benchmark rates.
- The observed character-class ceiling assumes independent, uniform choices from an inferred pool. For manual input, the pattern-aware guessability value is only a low-confidence proxy; neither time is a real-world cracking prediction.

## Generator, lab, and themes

- Password generation uses crypto.getRandomValues() with rejection sampling. Optional 100/100 verification applies the same analyzer to each candidate, discards nonqualifying results, and enforces a per-password attempt limit.
- Generator profiles, character-set controls, ambiguous-character exclusion, custom characters, batches, per-result actions, and generated setting confidence are available.
- The Password Analysis Lab compares fictional strings while adjusting length, character classes, visible patterns, origin assumptions, and guessing pace. Its hypothetical CSPRNG option changes only the model assumption; it is not a real generated password.
- Fifteen themes are included: Midnight Green, Midnight Blue, Cyber Purple, Crimson Security, Arctic Light, OLED Black, Graphite, Emerald, Cyberpunk, Minimalist, Deep Ocean, Solarized Light, Monochrome, Neon Blue, and Forest. Accent presets, a custom accent, three density settings, and reduced-motion controls are available.
- Other tools include password comparison, passphrase generation, a pattern challenge, a searchable security glossary, a temporary habit checklist, and password-free reports.

## Privacy notes

- Entered passwords are held in page memory only and are cleared when leaving the analyzer or comparison page.
- The app persists display and privacy preferences only. Optional recent analysis contains score statistics in memory for the current tab; it never contains password text.
- Reports include findings and assumptions but never include password text.
- Password and passphrase generation use secure browser randomness. There is no insecure random-number fallback.
- The lab and pattern challenge use fictional examples only.
