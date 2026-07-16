---
name: index.html merge conflict recurrence
description: The index.html conflict at line 30 keeps being reintroduced; only a full WriteFile reliably fixes it.
---

## Rule
When the `index.html` merge conflict reappears (two branches: HEAD adds canonical/favicon/LD-JSON block vs. incoming adds a minimal emoji favicon), **always use WriteFile with the full clean content** rather than an Edit patch. Edit patches targeting `<<<<<<< HEAD` fail because the conflict markers are literal bytes that break the Vite HTML parser before any tool can match them.

**Why:** The conflict was introduced by a git merge that was never fully resolved. Vite's parse5 HTML parser errors on `<` at the start of `<<<<<<< HEAD`, crashing the dev server. Each time the server restarts after an HMR-triggered re-parse, the stale bytes in the file cause the overlay error even if the WriteFile ran.

**How to apply:** If you see `parse5 error code invalid-first-character-of-tag-name at index.html:30`, run `cat -n index.html | head -40` to confirm the conflict is back, then WriteFile the entire file with the HEAD version's richer meta tags plus the incoming favicon line (they are compatible — keep both).
