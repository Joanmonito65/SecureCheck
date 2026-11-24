# SecureCheck

SecureCheck is a static, local-first password security analyzer and learning toolkit built with HTML, CSS, and vanilla JavaScript. It has no backend, third-party scripts, analytics, or external password-analysis services.

## Run it

Open index.html in a current Chromium, Firefox, or Safari browser. If the browser restricts clipboard access when opening a file directly, run a local static server from this folder:

    python -m http.server 8000

Then visit http://localhost:8000. The server only serves these static files; analysis still runs entirely in the browser.

## Files

- index.html — accessible page structure and all application sections.
- styles.css — responsive dark/light themes, layouts, and visual states.
- app.js — local analysis, estimates, generators, comparison, simulator, history, reports, and settings.

## Upgrade features

- Ten coordinated palettes: Midnight Green, Midnight Blue, Cyber Purple, Crimson Security, Arctic Light, OLED Black, Graphite, Emerald, Cyberpunk, and Minimalist. Theme tokens now coordinate surfaces, signals, charts, simulator panels, and focus states. Choose a built-in accent or custom color.
- Optional 100/100 generator verification. Each accepted password is analyzed by the shared scoring function; only candidates scoring exactly 100 are displayed. Verification has a per-result attempt limit and explains when selected settings cannot reach the score ceiling.
- Generator result cards show the actual score, strength category, length, entropy estimate, composition, copy, analyze, and regenerate controls. Batch generation is available for passwords and passphrases.
- Generator profiles provide balanced, maximum-variety, and easy-to-type starting points. A live pool meter shows the unique character count and a theoretical entropy ceiling; it is an assumption-based preview, not a security verdict.
- The generator explains when selected settings cannot reach 100/100 and provides the settings that need to change.
- The Password Quality Lab compares fixed fictional samples at adjustable lengths, character pools, patterns, and guessing speeds.
- The Pattern Spotter challenge uses fixed made-up examples and the shared analyzer to teach how predictable patterns affect its score.
- Interface density can be set to compact, comfortable, or spacious. Quick navigation is available from the header or Ctrl+K.
- Revealed analyzer and comparison values auto-hide after 30 seconds when enabled, and hide immediately when the tab loses focus.
- The guessing-time comparison includes online and offline assumptions plus a logarithmic speed visualization.

## Privacy notes

- Entered passwords are held in page memory only and are cleared when leaving the analyzer or comparison page.
- The app persists display and privacy preferences only. Optional recent analysis contains score statistics in memory for the current tab; it never contains password text.
- Reports include findings and assumptions but never include password text.
- Password and passphrase generation use crypto.getRandomValues() with rejection sampling. There is no insecure random-number fallback.
- The guessing lab displays fictional strings only and never reads or tests an analyzed password.
- The Password Quality Lab uses fixed fictional examples and does not inspect the analyzer input.
- The Pattern Spotter challenge also uses fixed fictional examples and does not inspect or retain analyzer input.

## Estimator limitations

The entropy and guessing-time outputs are educational heuristics. They compare a character-set ceiling with a simple pattern-adjusted estimate and use illustrative guessing speeds. The app does not know how a password was created, which lists an attacker has, how a service stores passwords, or what account protections are enabled. A 100/100 score is the maximum of SecureCheck's model, not a guarantee that a password can never be guessed. A stronger relative score or a long estimated time is not a security guarantee.
