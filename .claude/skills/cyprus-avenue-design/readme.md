# Cyprus Avenue Design System

Design system for the **Cyprus Avenue Archive**, a website that memorializes the playlists of *Cyprus Avenue*, Bill Shapiro's Saturday-night show on KCUR 89.3 FM in Kansas City (1978–2018). The site serves two audiences: longtime fans revisiting shows, and new visitors using the archive to discover music.

This is a ground-up visual system that replaces the current dark, gradient-heavy Tailwind UI. It borrows the structure of music magazines like Pitchfork and Resident Advisor: light paper, heavy ink type, ruled sections, mono metadata, and one accent color.

**Sources**
- Repo: `riebschlager/cyprus-avenue` (branch `master`). Vue 3 + Tailwind app in `web/`, data in `json/individual/*.json`.
- Live site: https://riebschlager.github.io/cyprus-avenue
- Content model (from code): Show `{date, title, description, tracks[{artist, song}]}`; Artist (derived) with Last.fm bio/tags and Spotify image; Spotify web player and playlist export; JSON/CSV/TXT download; "This Week in History"; random suggestions.

## Index
- `styles.css`: the entry point, made up only of `@import`s
- `tokens/`: `fonts.css`, `colors.css`, `typography.css`, `layout.css` (spacing, radii, rules, shadow, motion, z), `base.css`
- `components/components.css`: all component classes (`ca-` prefix)
- `components/core`: Icon, Button, IconButton + PlayButton, Tag + Badge, Label + DateStamp
- `components/forms`: SearchField, Select + SegmentedControl + Checkbox
- `components/music`: TrackRow + TrackList, ShowRow + ShowList, ShowCard, ArtistRow, PlayerBar, Equalizer, StreamingLinks + StreamingMenu
- `components/editorial`: SectionHeader, Stat + StatRow, PullQuote
- `components/navigation`: SiteHeader + Wordmark + SiteFooter, Tabs + AlphaIndex
- `components/feedback`: Dialog, Toast, Tooltip, Menu
- `guidelines/`: foundation specimen cards
- `ui_kits/website/`: click-through site (`index.html`) + `mobile.html`
- `assets/`: `cyprus-avenue-og.jpg` (share image), `ds-loader.js` (dev-only loader for cards/kits)
- `SKILL.md`

## Content fundamentals
- **Voice.** The voice is a knowledgeable record-store clerk. It is warm and specific, and it never hypes. The archive lets Bill's show notes speak, so we keep them **verbatim**, including their quirks ("Nelson & Parton (Not A Law Firm)").
- **Person.** Site copy speaks about the show in third person ("Bill Shapiro curated…"). UI copy addresses the visitor as *you* only when needed ("Connect your Spotify").
- **Casing.** Sentence case for UI, buttons and headings we write ("Browse shows", "This week in history"). Show titles keep their original casing. Tags are lowercase (`soul`, `outlaw country`). Mono labels are UPPERCASE.
- **Buttons.** Buttons are verb first and short: "Play show", "Add to Spotify", "Download", "Surprise me".
- **Numbers.** Use real counts with thousands separators (1,506). Dates are always `DD MON YYYY` (03 JAN 2015), with an optional weekday (SAT).
- **No emoji.** The current site uses 🎧📅💿🎲. They are retired.
- **Facts.** Use only verifiable facts. Don't invent bios or descriptions. If data is missing, omit the block.
- Examples: "Every recovered playlist, December 2009 to July 2017." · "No shows match “bowie”. Try an artist name." · "Playlist created · 13 tracks".

## Visual foundations
- **Palette.** The palette comes from the show's record label in the share image:
  - Paper (`--paper-50` #FAF8F4 page) and warm ink (`--ink-900` #161513).
  - One accent, **label orange** (`--orange-500` #DE8A3E). It is used as a *fill* with ink text on top. Orange text on paper uses `--orange-700` for AA contrast.
  - Ring blue is only for focus rings.
  - Streaming brand colors appear only as 8px dots inside the "Listen on" menu.
- **Type.** Three families, each with one job:
  - **Schibsted Grotesk** for display, headings and UI. Display is 850 weight with tight tracking (−0.045em) and line-height 0.9–0.95.
  - **Newsreader** for editorial text: show notes, about pages and ledes. Italic marks album titles.
  - **IBM Plex Mono** for metadata only: dates, counts, track numbers and eyebrows. It is set uppercase, 12px, with +0.08em tracking.
- **Hierarchy.** Hierarchy comes from **scale and rules, not boxes**:
  - A 4px ink rule opens a section (`SectionHeader`).
  - A 2px ink rule tops each list.
  - 1px paper-200 hairlines separate rows.
  - Cards have no fill, no border and no shadow, with one exception: the single orange **feature** block per page.
- **Layout.**
  - Container is 1240px with a 24px gutter (16px on mobile). Text measure is capped at 680px.
  - Pages use asymmetric two-column grids (1.4fr / 1fr, or content plus a 240–300px aside).
  - Section spacing is 96px (64px on mobile), set by `--space-section` / `--space-section-mobile`. Wrap every top-level page section in `.ca-section`, which owns that gap. Never add top margin to `SectionHeader`. The 4px spacing scale lives in `layout.css`.
  - The header is sticky, 64px, on paper with a hairline. The player is fixed to the bottom at 64px in ink.
- **Backgrounds.** Backgrounds are flat paper: no gradients, no blur blobs, no textures. The PlayerBar is the only dark surface (`data-theme="dark"` scope); dark tokens exist for a future dark mode.
- **Imagery.** The site is text-led. Album art appears only at 40px in the player. The single brand photo is the OG turntable image (warm, slightly faded).
- **Corners.** Radii are 0–2px on most things and 4px on floating layers (menu, dialog, toast). Pill shape is only for the play button.
- **Shadows.** The page is flat. `--shadow-pop` is for menus and toasts; `--shadow-dialog` for dialogs over a 55% ink scrim.
- **Hover states.**
  - Titles turn `--orange-700`.
  - Rows get a `--bg-sunken` fill.
  - Arrows nudge 3px right.
  - Secondary buttons invert to an ink fill.
  - Links go from a hairline underline to a currentColor underline.
- **Press.** Buttons shift down 1px; the play button scales to 0.96.
- **Focus.** 2px ring-blue outline with a 2px offset. Inputs get an ink border plus a 3px blue-100 halo.
- **Motion.** 120–320ms with `--ease-out`. No bounce or parallax. The equalizer is the only looping animation.
- **Track rows.** On hover, the number swaps to a round ink play button and the row actions appear. The playing row shows the orange equalizer and an orange title. A deep-linked row gets an orange-50 tint.

## Iconography
- **Set.** [Lucide](https://lucide.dev) at 1.75 stroke, loaded as inline SVG from jsDelivr (`lucide-static@0.460.0`) by `<Icon name>`. Icons inherit `currentColor`.
  - This is a substitution: the current site hand-pastes Heroicons-style outline paths, and Lucide is the closest maintained match.
- **Common icons.** `play`, `pause`, `skip-back`, `skip-forward`, `search`, `link`, `audio-lines` (listen elsewhere), `download`, `list-plus` (Spotify), `arrow-right`, `arrow-left`, `chevron-down`, `shuffle`, `x`, `menu`, `disc-3` (empty art).
- **Other glyphs.** No emoji and no icon font. Unicode is used only for the ↗ hint in menus and the “ quote mark.
- **Logo.** There is **no logo file** in the source. The wordmark is typeset as "CYPRUS AVENUE" in Schibsted Grotesk 850, followed by the mono sub-line "KCUR 89.3 · 1978–2018".

## Intentional additions
The source app had no component library, so this is a from-scratch set sized to the site. The following are music/editorial-specific:
- TrackRow/TrackList, ShowRow, ShowCard, ArtistRow, PlayerBar, Equalizer, StreamingLinks
- SectionHeader, Stat/StatRow, PullQuote
- AlphaIndex
- DateStamp: enforces the one date format

## Caveats
- UI-kit artist tags are sample values, because `artist-bios.json` (Last.fm) is gitignored. Artist bios are omitted for the same reason.
- Fonts load from Google Fonts. There are no local binaries.
