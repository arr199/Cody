---
name: Cody
description: A browser HTML/CSS/JS playground whose quiet chrome hands the stage to the code and its preview.
colors:
  bg: "#0c0d12"
  surface: "#16181f"
  surface-2: "#1d2029"
  surface-hover: "#262a35"
  border: "#2a2e3a"
  border-strong: "#353a48"
  text: "#e6e8ee"
  text-muted: "#9aa0ac"
  accent: "#6366f1"
  accent-hover: "#818cf8"
  accent-deep: "color-mix(in srgb, #6366f1 82%, #000)"
  accent-contrast: "#ffffff"
  accent-soft: "rgba(99, 102, 241, 0.16)"
  console-bg: "#0b0d13"
  console-text: "#c9ced8"
  log-ok: "#34d399"
  log-ok-bg: "rgba(52, 211, 153, 0.12)"
  log-err: "#f87171"
  log-err-bg: "rgba(248, 113, 113, 0.12)"
  log-warn: "#fbbf24"
  log-warn-bg: "rgba(251, 191, 36, 0.12)"
  preview-canvas: "#ffffff"
  light-bg: "#e9ebf0"
  light-surface: "#ffffff"
  light-surface-2: "#f3f4f8"
  light-surface-hover: "#e8eaf1"
  light-border: "#e0e3ea"
  light-border-strong: "#d2d6e0"
  light-text: "#1d2230"
  light-text-muted: "#6b7280"
  light-accent: "#5b5bd6"
  light-accent-hover: "#4f46e5"
  light-accent-deep: "color-mix(in srgb, #5b5bd6 82%, #000)"
  light-accent-soft: "rgba(91, 91, 214, 0.14)"
  light-console-bg: "#f7f8fb"
  light-console-text: "#1d2230"
  light-log-ok: "#047857"
  light-log-ok-bg: "rgba(4, 120, 87, 0.1)"
  light-log-err: "#dc2626"
  light-log-err-bg: "rgba(220, 38, 38, 0.1)"
  light-log-warn: "#b45309"
  light-log-warn-bg: "rgba(180, 83, 9, 0.1)"
typography:
  display:
    fontFamily: "Oswald, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    letterSpacing: "0.5px"
  title:
    fontFamily: "'Nunito Sans', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 700
  tab:
    fontFamily: "'Nunito Sans', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 700
    letterSpacing: "0.04em"
  body:
    fontFamily: "'Nunito Sans', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 400
  body-small:
    fontFamily: "'Nunito Sans', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  toolbar:
    fontFamily: "'Nunito Sans', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 700
    fontFeature: "\"tnum\""
  label:
    fontFamily: "'Nunito Sans', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 400
  mono:
    fontFamily: "'Cascadia Code', 'Consolas', monospace"
    fontSize: "13px"
    fontWeight: 400
    letterSpacing: "0.3px"
rounded:
  radius: "10px"
  radius-sm: "7px"
  row: "6px"
  item: "5px"
  grip: "2px"
spacing:
  xxs: "4px"
  xs: "6px"
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "18px"
components:
  rail-button:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
    typography: "{typography.title}"
    rounded: "{rounded.radius-sm}"
    padding: "11px 13px"
  rail-button-hover:
    backgroundColor: "{colors.surface-hover}"
    textColor: "{colors.accent-hover}"
  rail-button-compact:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
    rounded: "{rounded.radius-sm}"
    padding: "0"
    size: "40px"
  button-primary:
    backgroundColor: "{colors.accent-deep}"
    textColor: "{colors.accent-contrast}"
    typography: "{typography.title}"
    rounded: "{rounded.radius-sm}"
    padding: "7px 14px"
  dropdown:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.radius-sm}"
    padding: "6px"
  menu-item:
    textColor: "{colors.text}"
    rounded: "{rounded.item}"
    padding: "8px 10px"
  menu-item-hover:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-hover}"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.radius}"
  editor-tab:
    textColor: "{colors.text-muted}"
    typography: "{typography.tab}"
    rounded: "{rounded.radius-sm}"
    padding: "7px 14px"
  editor-tab-selected:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
  resize-grip:
    backgroundColor: "{colors.border-strong}"
    rounded: "{rounded.grip}"
    width: "2px"
    height: "40px"
  resize-grip-active:
    backgroundColor: "{colors.accent}"
  device-toolbar:
    textColor: "{colors.text-muted}"
    typography: "{typography.toolbar}"
    height: "40px"
    padding: "0 10px"
  device-preset:
    textColor: "{colors.text-muted}"
    typography: "{typography.toolbar}"
    padding: "4px 10px"
  device-preset-pressed:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.text}"
  preview-action:
    textColor: "{colors.text-muted}"
    typography: "{typography.toolbar}"
    rounded: "{rounded.radius-sm}"
    padding: "4px 10px"
  preview-stage:
    backgroundColor: "{colors.surface-2}"
  preview-frame:
    backgroundColor: "{colors.preview-canvas}"
  mobile-tab-bar:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.radius}"
    padding: "4px"
  mobile-tab:
    textColor: "{colors.text-muted}"
    typography: "{typography.tab}"
    rounded: "{rounded.radius-sm}"
    height: "44px"
  mobile-tab-selected:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.text}"
  toast:
    backgroundColor: "{colors.accent-deep}"
    textColor: "{colors.accent-contrast}"
    typography: "{typography.title}"
    rounded: "{rounded.radius}"
    width: "240px"
    height: "48px"
  console-row-log:
    backgroundColor: "{colors.log-ok-bg}"
    textColor: "{colors.log-ok}"
    typography: "{typography.mono}"
    rounded: "{rounded.row}"
    padding: "6px 10px"
  console-row-warn:
    backgroundColor: "{colors.log-warn-bg}"
    textColor: "{colors.log-warn}"
    typography: "{typography.mono}"
    rounded: "{rounded.row}"
    padding: "6px 10px"
  console-row-error:
    backgroundColor: "{colors.log-err-bg}"
    textColor: "{colors.log-err}"
    typography: "{typography.mono}"
    rounded: "{rounded.row}"
    padding: "6px 10px"
---

# Design System: Cody

## Overview

**Creative North Star: "The Quiet Workbench"**

Cody's chrome is a workbench: dark, even, and close-grained, so the user's code and its preview are the only things that glow. The app speaks in one family (Nunito Sans), one cool indigo, and two radii. Panels sit flat on a near-black floor, separated by 12px gutters that double as resize handles, and by hairline borders instead of shadows. Only things that float (dropdowns, the toast) lift off the surface. Dark is the default. The light theme is a full token override, not an afterthought, and the app's theme follows the Monaco editor theme the user picks.

The preview is a different place. Its frame is always a white browser canvas, and the app's tokens never reach into it. The frame is set on a quiet Raised Key stage, so a phone- or tablet-width frame reads as a device on a bench. The starter examples use this: each one is its own small world (a demoscene void, a Stripe-grade card grid, a jar of fireflies at dusk, a cork board), with its own palette and its own single typeface. The chrome stays neutral so that four loud worlds can sit inside it without clashing. The Examples menu belongs to the chrome. It shows those worlds in a scaled live preview, but it is drawn entirely with the app's own surfaces.

Density is that of a tool, not a page: 14px bold controls, a 168px labelled rail under a 64px brand header, 40px toolbars, 40–44px touch targets on phones, and 12px as the floor for any text.

**Key Characteristics:**

- A near-black, cool-neutral surface ladder (bg, surface, surface-2, surface-hover) with matching light overrides.
- One indigo accent, reserved for state and the single primary action.
- Flat resting panels with hairline borders; shadows only on floating layers.
- Nunito Sans everywhere in the chrome, Oswald only on the wordmark, and a monospace face only in the console.
- One tabbed editor beside the preview, with a console drawer below, all resized by 12px grip gutters.
- A white, token-free preview canvas where each starter example brings its own world.

## Colors

A cool, low-chroma neutral ladder carries everything, with a single indigo accent and three semantic console hues.

### Primary

- **Workbench Indigo** (#6366f1 dark / #5b5bd6 light): the brand gear, the open menu's rail button, and a resize grip under hover, focus or drag. It marks "this is selected" or "this is in your hand" and nothing else.
- **Lifted Indigo** (#818cf8 dark / #4f46e5 light): the accent as text, used for hovered rail buttons and hovered or current menu items. On dark surfaces it reads at 5.9:1.
- **Deep Indigo** (`color-mix(in srgb, accent 82%, #000)`, which resolves to about #5154c6 dark and #4b4baf light): the fill for anything indigo that carries white text: the Examples menu's Load button and the toast (6.1:1 dark, 7.2:1 light). It is defined once as `--accent-deep` on `:root` and follows the light theme's accent automatically.
- **Indigo Wash** (accent at 16% dark / 14% light): the hover and current background for menu items, the pressed device preset, the selected phone tab, and the 3px focus ring.

### Tertiary

- **Console Green / Amber / Coral** (log-ok, log-warn, log-err, with 10–12% tinted backgrounds): appear only in console rows, for logs, warnings and errors. Coral also fills the 7px error dot on a language tab. The light theme swaps in darker versions (#047857, #b45309, #dc2626).

### Neutral

- **Ink Well** (#0c0d12 / light #e9ebf0): the app floor, visible as the 12px handle gutters between panes.
- **Bench Top** (#16181f / light #ffffff): the rail (and the phone top bar), the editor and preview panes, dropdowns, and the phone tab bar.
- **Raised Key** (#1d2029 / light #f3f4f8): the resting fill of every rail button, the selected editor tab, the preview stage around the frame, and the menu thumbnail placeholder.
- **Pressed Key** (#262a35 / light #e8eaf1): the hover fill for rail buttons.
- **Hairline / Strong Hairline** (#2a2e3a, #353a48 / light #e0e3ea, #d2d6e0): every border. The strong one appears on hover, as the resting resize grip, and as the edge of a sized preview frame.
- **Chalk** (#e6e8ee / light #1d2230): primary text, and the label of any selected tab or pressed preset.
- **Graphite** (#9aa0ac / light #6b7280): secondary text, example meta lines, descriptions, unselected tabs, the device toolbar, the clamped-preset underline, and the empty-console hint.
- **Console Night** (#0b0d13 / light #f7f8fb): the console drawer, one step darker than the panes in dark mode.
- **Preview Canvas** (#ffffff, both themes): the background of the preview iframe and the menu's scaled preview iframe.

### Named Rules

**The One Indigo Rule.** The accent marks selection, focus, the brand gear, a grip in use, and the one primary action in a view. It is never decoration, never a border on resting elements, and never a second button style.

**The Contrast Floor Rule.** White text on an indigo fill must clear 4.5:1. The raw dark-theme accent does not (4.47:1), so every filled control carrying text uses Deep Indigo, as the Load button and the toast do. The active rail-button fill on the raw accent is known drift, not precedent.

**The Wash Not Fill Rule.** Selection inside a tab set or segmented control is a tonal step, never a solid indigo fill: the desktop editor tab steps up to Raised Key, and device presets and phone tabs take the Indigo Wash, each with a Chalk label.

**The Paired Token Rule.** Every chrome color is defined twice: on `:root` for dark and under `[data-theme="light"]` for light (or derived from a paired token, as Deep Indigo is). The white preview canvas is the one deliberate constant. Any other color that exists in only one theme is a bug.

## Typography

**Display Font:** Oswald (with sans-serif), on the wordmark only
**Body Font:** Nunito Sans (with system-ui, -apple-system, Segoe UI, sans-serif), at weights 400 and 700
**Label/Mono Font:** Cascadia Code (with Consolas, monospace), for the console

**Character:** Nunito Sans has rounded terminals, which keep a dense tool friendly. Its 700 weight carries every control label, so hierarchy comes from weight and color more than from size. Oswald's condensed caps-height appears once, as the "Cody" wordmark beside the gear.

### Hierarchy

- **Display** (700, 19px, 0.5px tracking): the "Cody" wordmark in the rail header and the phone top bar. Nowhere else.
- **Title** (700, 14px): rail button labels, example titles in the menu, the toast, and the Load button (at 13px).
- **Tab** (700, 13px, 0.04em tracking): the desktop editor tabs (HTML, CSS, JS). The phone tab bar uses the same size and weight without the tracking.
- **Body** (400, 14px): dropdown options such as font sizes and theme names.
- **Body Small** (400, 13px, line-height 1.45): the example description beside the menu preview.
- **Toolbar** (700, 12px, tabular numerals): the device toolbar's presets, actions and width readout, and the "Console output appears here" hint. Tabular figures keep the readout from jittering while a width is dragged.
- **Label** (400, 12px, Graphite): the "what it teaches" meta line under each example title.
- **Mono** (400, 13px, 0.3px tracking): console rows. Editor text is Monaco's, sized by the user's Font-Size preference (14–20px).

### Named Rules

**The 12px Floor Rule.** No text in the app, the menu or the examples is smaller than 12px.

**The One Family Rule.** The chrome uses Nunito Sans only. Oswald stays on the wordmark, and monospace stays in the console and the editors.

## Layout

The app is a full-viewport flex row: a fixed 168px rail on the left, then the workspace. The rail opens with a 64px brand header and stacks full-width buttons below it with a 10px gap and an 18px gutter.

The workspace is a CSS grid with 12px padding and no gap, because the 12px handle gutters do the separating. The top row holds the tabbed editor, a vertical handle, and the preview. Below a full-width horizontal handle, the console drawer spans the whole width. Two custom properties size it:

- `--split` is the editor's share of the width: 20–80%, defaulting to 50%. The editor never drops below 280px and the preview never below 240px.
- `--console` is the drawer height: 80px to 70% of the workspace's content height, defaulting to 160px.

Both sizes persist in localStorage, reset on double-click, and move from the keyboard (the split by 2%, or 10% with Shift; the console by 16px, or 64px with Shift).

Only one editor is visible at a time. The other two stay mounted and hidden, and the tab strip above them picks which shows. The preview pane stacks a 40px device toolbar over a Raised Key stage that centres the frame; on a narrow pane the toolbar wraps to a second row rather than clipping a control. A preset sets the frame's width (Phone 375px, Tablet 768px, Full 100%). Dragging the frame's edge sets any width from 240px to the stage width, and the frame always fills the stage's height.

Dropdowns hang 6px below their rail button and match its width. The exception is the Examples menu, a 600px (capped at `100vw - 32px`) two-column grid: a 220px list and a detail column holding a 16:10 scaled preview, the title, the description and the Load button. The preview renders the example at twice its box size and scales it to 0.5, so it composes like the real preview pane. Below 700px the menu becomes a single-column list, and the detail column is hidden.

### Phones (900px and narrower)

- The body becomes a column. The rail turns into a compact top bar: the wordmark on the left, then four 40px square icon buttons with 18px icons. Their labels are visually hidden but stay as the accessible names. The bar uses a 6px gap and 6px × 10px padding, with a hairline underneath.
- Every menu, including Examples, opens fixed and full width under the bar (60px from the top, 8px from each edge).
- The workspace shows one panel at a time above a bottom tab bar (HTML · CSS · JS · Preview · Console), with 8px padding and an 8px gap. The app opens on Preview.
- The handles, the editor tab strip, the presets and the readout are hidden, because the phone is the device. The device toolbar keeps Fullscreen and Open in new tab.

The spacing rhythm is 4 / 6 / 8 / 10 / 12 / 18px:

- 4px for the phone tab bar's inset and gaps, and between console rows;
- 6px for menu insets and phone top-bar gaps;
- 8px for small gaps, console padding and phone workspace padding;
- 10px for rail gaps, item padding and the device toolbar's side padding;
- 12px for workspace padding and the handle gutters;
- 18px for the rail gutter.

### Named Rules

**The Gutter Is the Handle Rule.** Every resizable boundary is a 12px gutter of floor showing a centred 2 × 40px grip. There are no separate drag bars, and no boundary resizes without a grip, a `separator` role and keyboard steps.

## Elevation & Depth

Depth comes from tone first: the floor is darkest, panes and bars sit one step up, and the preview stage steps up once more so the white frame reads as an object on it. Resting panes carry only a hairline lift. True shadow is reserved for layers that float above the workspace. In the light theme the large shadow softens to a cool, low-opacity spread.

### Shadow Vocabulary

- **Hairline lift** (`box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12)`): the editor, preview and console panes at rest.
- **Float** (`box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35)`; light `0 8px 28px rgba(31, 35, 48, 0.12)`): dropdown menus, the Examples menu, and the toast.
- **Focus ring** (`box-shadow: 0 0 0 3px` accent-soft): replaces the outline on every `:focus-visible`, including the resize handles.

### Named Rules

**The Float Only Rule.** Only elements that sit above the workspace (menus and the toast) cast the Float shadow. Panes stay flat apart from the hairline lift.

## Shapes

The corners are soft and consistent, and they nest. Panes, the phone tab bar and the toast use 10px. Buttons, dropdowns, the preset group, the handles' focus area and the preview thumbnail use 7px. Editor tabs round only their top corners (7px) and sit flat on the strip's hairline. Console rows use 6px and items inside a menu use 5px. Grips end in 2px, and the error dot is a 7px circle. An inner element always has a tighter radius than its container. The preview pane drops its radius in fullscreen.

Every edge is a 1px hairline. A sized preview frame draws its 1px Strong Hairline edge as a spread ring outside the frame, so the stated width stays exact; a Full frame has no edge. There are two heavier strokes: the 3px left rule on console rows, colored by severity, and the 2px inset Graphite underline on a clamped preset. Icons are inline SVG at 16–24px, filled with `currentColor`, so they follow the button's text color.

## Components

### Buttons

Tactile but quiet: filled keys that press down 1px.

- **Shape:** gently rounded (7px).
- **Rail button:** Raised Key fill, hairline border, Chalk label at 14px/700, an icon before the label, and 11px × 13px padding at full rail width.
- **Compact rail button (phones):** the same key as a 40px square, icon only (18px), with the label kept as a visually hidden accessible name.
- **Hover / Focus:** on hover, the fill steps to Pressed Key, the border to Strong Hairline, and the label to Lifted Indigo. Transitions take 0.15s on the standard ease. On `:active` the button moves `translateY(1px)`. Focus uses the 3px indigo-wash ring.
- **Active (open menu):** an indigo fill with a white label marks the rail button whose menu is open. In the dark theme this pairing is 4.47:1, and its hover (white on Lifted Indigo) is 2.98:1. This is recorded drift, so don't copy it for new filled controls.
- **Primary:** Deep Indigo fill, white 13px/700 label, 7px × 14px padding, no border. It brightens to the raw accent on hover. It is used once per view, for the Load button.

### Dropdowns and menu items

- **Container:** Bench Top fill, hairline border, 7px radius, 6px inset, Float shadow. It enters with a 0.16s scale-from-0.96 fade.
- **Items:** transparent, 5px radius, 8px × 10px padding (7px × 10px for single-line options). On hover, focus or `aria-current`, they take the Indigo Wash background with Lifted Indigo text. A two-line item stacks a Title over a Graphite Label, and the label inherits the accent when the item is active.

### Cards / Containers (panes)

- **Corner Style:** 10px.
- **Background:** Bench Top. The console uses Console Night.
- **Shadow Strategy:** hairline lift only (see Elevation & Depth).
- **Border:** a 1px hairline.
- **Internal Padding:** none. Monaco fills the pane edge to edge, and the console uses 8px.
- **Watermark:** each editor carries its language logo centred at 8% opacity behind the code, as a quiet label for the pane.

### Editor tabs

A folder-tab strip at the top of the editor pane, a WAI-ARIA tablist driven by click, the arrow keys, Home and End.

- **Strip:** a hairline along the bottom, 6px × 8px top and side inset, 2px between tabs.
- **Tab:** no fill, Graphite Tab type, 7px × 14px padding, top corners rounded. Hover turns the label Chalk.
- **Selected:** a Raised Key fill with a Chalk label, joined to the editor below. No indigo.
- **Error dot:** a 7px Console Coral circle after the label whenever that language has error markers. The phone tab bar shows the same dot on its HTML, CSS and JS tabs.

### Resize handles

- **Shape:** a transparent 12px gutter with a centred 2 × 40px grip (40 × 2px for the console drawer), 2px radius, in Strong Hairline.
- **States:** on hover, focus or drag the grip turns Workbench Indigo over 0.15s. Focus also draws the 3px ring around the gutter. While a handle is dragged, iframes stop taking the pointer.
- **Frame handle:** the preview frame carries its own grip on its right edge. While the frame fills the stage, the grip moves inside the edge and stays hidden until hover or focus, so it never sits on top of the user's page.

### Device toolbar (signature)

- **Bar:** 40px tall, 10px side padding, 8px gaps, a hairline underneath, in Graphite Toolbar type.
- **Presets:** Phone, Tablet and Full as a segmented group inside one hairline outline with a 7px radius. Each segment has 4px × 10px padding and no fill, and hover turns it Chalk. The pressed segment (`aria-pressed`) takes the Indigo Wash with a Chalk label.
- **Clamped preset:** when a preset is wider than the pane, the segment stays chosen but loses its fill and shows a 2px inset Graphite underline. The readout then shows the actual and requested width ("610 / 768 px").
- **Readout:** the live frame width ("375 px"), in tabular numerals.
- **Actions:** Fullscreen and Open in new tab, pushed to the right, as outlined hairline buttons with a 7px radius and no fill. Fullscreen relabels itself "Exit fullscreen" while active.

### Preview stage and frame

- **Stage:** Raised Key, centring the frame and giving it the full height.
- **Frame:** the sandboxed iframe on Preview Canvas white. A sized frame (a preset or a dragged width) shows its 1px Strong Hairline edge against the stage, and a Full frame runs edge to edge with none.

### Console

- **Rows:** mono 13px, 6px × 10px padding, 6px radius, a 3px left rule and a 10–12% tinted background in the severity color (green for logs, amber for warnings, coral for errors), with a leading 18px status icon.
- **Layout:** errors and logs are separate regions that still flow as one list, with 4px between rows. On desktop, rows extend to their content width and scroll horizontally. On phones each row flows as one wrapping paragraph, with the icon inline and the logged values separated by 8px.
- **Empty:** an empty console shows "Console output appears here" in Graphite Toolbar type.

### Phone tab bar

- **Container:** Bench Top, hairline border, 10px radius, 4px inset and gap, at the bottom of the screen.
- **Tabs:** five equal, labels-only segments (HTML · CSS · JS · Preview · Console), at least 44px tall, Graphite 13px/700, 7px radius, no fill.
- **Selected:** the Indigo Wash with a Chalk label, the same pressed state as the device presets.

### Toast

A centred 240 × 48px Deep Indigo pill with a 10px radius, the Float shadow and a white bold label. It enters with the same scale fade at 0.18s and stays for 1.5s. It is a polite status region that carries short confirmations and refusals ("URL Copied to Clipboard", "Allow pop-ups to open the preview").

### Examples menu (signature)

A list with a live window. The left column lists each example as a Title over a "what it teaches" Label. The right column runs the hovered or focused example for real, in a sandboxed iframe scaled to half size inside a 16:10, 7px-radius frame. The description sits below it in Body Small Graphite, followed by the Load button. Pointer hovers are debounced by 120ms, and focus updates the preview immediately. While the menu is closed, the preview is emptied so that nothing animates out of sight.

### Starter examples (signature)

Each example is a self-contained world that renders in the preview and inherits nothing from the chrome:

- It declares its own palette as custom properties on its own `:root`.
- It loads at most one Google Fonts face through a single `<link>`.
- Line 1 of its CSS is a comment naming one custom property whose edit visibly reshapes the object, for example `--wave`, `--card-min`, `--glow` or `--tilt`.
- It has one signature interaction, which it reports to the console.
- Its animation is dt-scaled and honours `prefers-reduced-motion`. It uses no images or network APIs, keeps text at 12px or larger, and stays within about 100 lines per editor.

## Do's and Don'ts

### Do:

- **Do** define every new color twice, on `:root` (dark) and under `[data-theme="light"]`, and reference it through `var(--token)`.
- **Do** use Deep Indigo (`var(--accent-deep)`) for any indigo fill that carries white text.
- **Do** keep resting panes flat with a 1px hairline, and give the Float shadow plus the 0.16s scale-fade entry only to menus and the toast.
- **Do** nest radii: 10px for panes, 7px for controls, 6px for console rows, 5px for menu items.
- **Do** show selection in tab sets and segmented controls as a tonal step: Raised Key for editor tabs, the Indigo Wash for presets and phone tabs.
- **Do** make every resizable boundary a 12px gutter with a 2 × 40px Strong Hairline grip that turns indigo on hover, focus or drag, and persist its size.
- **Do** set changing numbers, such as the width readout, in tabular numerals.
- **Do** use inline SVG icons at 16–24px, filled with `currentColor`.
- **Do** keep the preview canvas white and free of app tokens, and let each starter example bring its own palette and single typeface.
- **Do** open every starter example's CSS with a line-1 comment naming the custom property to edit, and log its one signature interaction to the console.

### Don't:

- **Don't** put white text on the raw dark-theme accent (#6366f1, 4.47:1) or on Lifted Indigo (#818cf8, 2.98:1) in any new component.
- **Don't** use indigo as decoration, as a resting border, or for a second button style. It means selection, focus, a grip in use, or the one primary action.
- **Don't** fill a selected tab or pressed preset with solid indigo.
- **Don't** add a display face to the chrome. Oswald stays on the wordmark.
- **Don't** set any text below 12px.
- **Don't** let the chrome's indigo, Nunito Sans or surface tokens leak into a starter example, or an example's palette leak into the chrome.
- **Don't** credit the builder inside the examples. The credit belongs in the app chrome.
