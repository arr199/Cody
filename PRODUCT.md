# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Evaluators (primary):** recruiters and developers who open the live site, often from a portfolio or a shared link, to judge the builder's craft within a few minutes.
- **Real use:** people, the builder included, who use Cody to try HTML/CSS/JS snippets and share them. Day-to-day usability matters, not only the first impression.

## Product Purpose

Cody is a browser-based HTML/CSS/JS playground. You write code in three editors, see it run in a live preview, and read its console output in the app. You share your work as a link. It's a portfolio showcase, so success means an evaluator understands and enjoys the core loop (*edit → preview updates → console reports*) within one visit, and a real user can prototype and share a snippet without friction.

## Positioning

- **Instant, no account:** open a link and start coding. There's no sign-up, and nothing about the user is stored.
- **VS Code's editor:** Monaco, with IntelliSense, Emmet and live error markers.
- **Hand-built, no framework:** vanilla JavaScript and Vite, built from scratch as a craft piece. The codebase is part of what gets evaluated.

The preview's sandboxing is a property of the product, but it's not something to promote.

## Operating Context

- Usually reached by opening the live site or a shared link, cold, on desktop and often on phones.
- Code lives in the URL hash. Links can be shortened through the builder's own small Express/MongoDB service.
- Deployed on Vercel (previously Netlify). Old share links must keep working.

## Capabilities and Constraints

- Three Monaco editors (HTML, CSS, JS) with Emmet. A live preview in a sandboxed iframe, without same-origin access. A console panel showing logs, warnings, uncaught errors and editor errors. A tabbed editor beside a resizable preview (device presets, free width, fullscreen, open in a new tab), with a console drawer below; on phones, a bottom tab bar shows one panel at a time. Editor themes and font size persist.
- Planned work, in order:
  1. starter examples
  2. layout: mobile-friendly app, resizable panels, device preview
  3. run control and loop guard
  4. interactive console
  5. npm imports via esm.sh
  6. saved short links

  Small backend changes are allowed; accounts and auth are out of scope.
- Code running in the preview can't use `localStorage`, `sessionStorage` or cookies, because of the sandbox.
- Engineering rules (testing, pnpm, no commits by agents) live in AGENTS.md.

## Brand Commitments

- The product name is **Cody** (page title "Cody-Studio").
- The builder is credited quietly, with a small "built by" line and links in the app chrome, never inside the examples. **Open decision:** the exact name and links haven't been provided yet. Don't invent them.

## Evidence on Hand

- Screenshot: `public/cody.png` (used by the README).
- Backend source: <https://github.com/arr199/Simple-API-Server>.
- There are no testimonials, user counts, press or metrics. Don't fabricate any.

## Product Principles

1. **Prove it in one viewport.** The first visit should show the edit → preview → console loop working, not describe it.
2. **Zero friction.** Nothing stands between opening a link and running code: no accounts, no modals, no setup.
3. **Craft is the claim.** Every detail, including the code, is evidence of the builder's skill. Polish beats feature count.
4. **Links are forever.** Shared code must keep loading across redesigns and hosting moves.
