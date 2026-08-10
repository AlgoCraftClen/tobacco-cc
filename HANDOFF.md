# CC Tobacco Tracker Handoff

Updated: 2026-08-09

## Start Here

- Repository: `C:\Users\WorkStation\Desktop\tobacco-cc`
- Branch: `main`
- Starting commit: `f7a1403` (`Preserve unsaved shipment setup edits`)
- Remote: `https://github.com/AlgoCraftClen/tobacco-cc.git`
- Live app: `https://algocraftclen.github.io/tobacco-cc/`
- Primary application file: `index.html`
- Backend: Supabase project `njpkqemgpbstrbsaxpbz`
- This is a static single-file web app with no build step.

Read `MEMORY.md`, `README.md`, and `.codex/AGENTS.md` before editing.

## Current State

The working application is the GitHub-backed version in this repository. Do not replace it with or copy code from an older CC Tobacco folder. The GitHub Pages application is live and actively used, so preserve existing records and accounting behavior.

At the time of this handoff:

- `main` matches `origin/main` at `f7a1403`.
- `.claude/` is an existing untracked directory. Do not add, remove, or modify it unless explicitly requested.
- Shipment #3 exists as a planned Grizzly shipment with its setup values not yet saved.
- No temporary Shipment Setup test data was saved during the last verification.

## Latest Fix

Commit `f7a1403` prevents the 15-second background synchronization from erasing unsaved Shipment Setup entries.

The form now becomes dirty after any setup input, selection, product-line addition, or product-line removal. Polling pauses while the setup is dirty and resumes after a successful save, switching shipments, or leaving Shipment Setup.

Verified behavior:

1. Open Shipment #3 and Shipment Setup.
2. Make an unsaved load-sheet change.
3. Remove focus and wait longer than 15 seconds.
4. The unsaved form remains intact.

## Product Math

Default inventory structure:

- 6 cases per box
- 18 rolls per case
- 5 cans per roll
- 90 cans per case
- 540 cans per box

Default supplier costs:

- Grizzly: $497 per case, $2,982 per box
- Copenhagen: $608 per case, $3,648 per box

Default target sale prices:

- Grizzly: $11 per can
- Copenhagen: $12 per can

For mixed shipments, each product line uses the same inventory structure but retains its own cost per case and target price per can.

## Whole-Can and Operations Law

- Partner can entitlement is calculated per shipment and per product from the partners' original investment percentages, rounded down to whole cans.
- Cans left after both partner entitlements are rounded down are company-owned inventory. Their cost is not operations money, and all sale revenue from them remains company reserve for future operations or investment.
- Approved operations are allocated between the partners by their original investment percentages. Each allocated share reduces that partner's next-run capital once.
- Direct personal withdrawals remain separate from operations and reduce only the withdrawing partner's capital.

## Data and Deployment

Supabase tables:

- `shipments_v2`
- `expenses`
- `sales`

Product-line data is stored in shipment notes metadata for compatibility with older shipments. Database migrations are under `supabase/migrations/` and must be applied in filename order when needed.

Local run options:

```powershell
npx serve . -l 3000
```

The file can also be opened directly, but the live GitHub Pages URL is the authoritative deployed application.

After a change:

1. Review `git diff` and protect unrelated user files.
2. Run `git diff --check`.
3. Parse the inline JavaScript for syntax errors.
4. Test the affected workflow in Google Chrome or BrowserOS with Computer Use.
5. Commit and push only intentional files.
6. Confirm the changed source is present on GitHub Pages before claiming deployment is complete.

## Tool Restrictions

- Use Google Chrome or BrowserOS for application testing.
- Use the Computer Use plugin for UI checks.
- Do not use Playwright for this project.
- Do not use Microsoft Edge.
- Do not save test records to the live database unless the user explicitly approves it.

## Next Session Checklist

1. Run `git status --short --branch` and `git log -5 --oneline --decorate`.
2. Confirm the local repository still matches `origin/main`.
3. Read the newest user request before changing accounting behavior.
4. Reproduce bugs against the real app without saving test data.
5. Explain any accounting or math correction before implementing it when the user asks to discuss first.
