# VooruitPlanner

A period planner for secondary schools, at [vooruitplanner.nl](https://vooruitplanner.nl).
Every school gets its own page at `vooruitplanner.nl/<school>` (for example
`/hal`). Students pick their leerjaar and vakken there and get a planner with
tests, planning and school activities per week. Teachers edit their subject's
planning with a shared school password, and a small team of admins per school
manages the rest. The interface is in Dutch.

See [PLAN.md](PLAN.md) for the build plan and the decisions behind it.

## Features

- Onboarding flow to pick a leerjaar and vakken, producing a shareable planner link
- Profile shortcuts (C&M, E&M, N&G, N&T) that fill the vakkenpakket in one click
- Three views over the same data: **Lijst** (scroll the whole year, weeks collapse and expand), **Maand** (one month at a glance) and **Per vak** (one subject, every week, all detail visible)
- Compact/Uitgebreid detail levels, a Filter menu (Toetsen / Planning / Overig) and a light/dark theme toggle
- A4 export of the list, month or subject view, with per-week selection
- Event detail dialog with type, weging and Markdown description
- Bulk export (`/export`): one PDF per vak, or every vak in one document, for sending to teachers to check
- Teacher entry point (`/bewerklijst`) and per-vak editor (`/bewerk/<jaar>/<VAK>`)
- Installable on a phone's home screen, a **Delen** button and Open Graph tags for link previews

## Intro tour

First-time visitors to the main page (`/`) get a five-step walkthrough. The
step images are placeholders in [`public/intro/`](public/intro/) — replace
`stap-1.png` … `stap-5.png` with real screenshots at the same names (960×540, 16:9).
Text and order live in `STEPS` in
[`src/components/IntroTour.vue`](src/components/IntroTour.vue).

It only auto-opens on the main page; shared links straight to a planner never
trigger it. The auto-shown tour has no close button and ignores Escape and
backdrop clicks — you walk it through and close it on the last step. Reopened
from the **?** button it is dismissible as usual. The **?** button next to the theme toggle reopens it any time, and
the last step offers "Deze uitleg niet meer tonen" (stored as
`plannerIntroHidden`).

## Export to A4

The *Exporteren* button in the planner opens a dialog where a student picks the
view (list, month or per vak), the detail level (or, for per vak, which subject),
which item types to include (Toetsen, Planning, Overig), and exactly which weeks
to include. The export then opens the
browser print dialog; choosing *Save as PDF* there produces a file named
`Planner [start]-[end]` after the selected week range, e.g.
`Planner 24/08/26-16/10/26`.

The list view prints on A4 portrait and the month view on A4 landscape — the page
size is written into a `@page` rule right before printing (see
[`src/utils/print.js`](src/utils/print.js)). The print layout lives in
[`PrintDocument.vue`](src/components/planner/PrintDocument.vue) and always uses
the light palette, so a dark-themed planner does not print as a black page.

## Item fields

Every planner item (school-wide event, holiday, subject activity or test) has these fields. The `type` field determines how an item is displayed and where it appears.

**School-wide types** (appear in the top section of each week card, matched to weeks via `date`/`end_date`):

| `type` value | Description |
| ------------ | ----------- |
| `school-wide` | Announcements, holidays, studiedagen, etc. |

School-wide items are the *Overig* category in the Filter menu, so they can be
shown or hidden independently of Toetsen and Planning.

**Subject types** (appear inside the subject section, matched to weeks via `cal_year` + `cal_week_number`):

| `type` value | Description |
| ------------ | ----------- |
| `plan` | Regular planning activity (e.g. `Herhaling H1-H3`) |
| `proefwerk` | Proefwerk |
| `so` | Schriftelijke overhoring |
| `schoolexamen` | Schoolexamen — shown in the exam colour (dark yellow) |
| `praktische opdracht` | Praktische opdracht — shown in the exam colour (`po` also works) |
| `presentatie` | Presentatie |
| `luistertoets` | Luistertoets |

**Columns:**

| Column | Description |
| ------ | ----------- |
| `cal_year` | Calendar year of the target week (e.g. `2026`) |
| `cal_week_number` | Calendar week number of the target week (e.g. `35`) |
| `type` | Item type — see tables above |
| `label` | Short title (e.g. `Studiedag`, `Herhaling H1-H3`) |
| `description` | Optional longer description (Markdown supported) |
| `date` | Start date (`YYYY-MM-DD`) — used for school-wide items |
| `end_date` | Optional end date for multi-day items like holidays (`YYYY-MM-DD`) |
| `subject_abbreviation` | Subject abbreviation for subject items (stored uppercased) |
| `year` | School year for subject items (e.g. `3`) |
| `weight` | Grading weight for test items (e.g. `1`, `2`, or `formatief`) |
| `year_1` … `year_6` | Boolean flags for school-wide items — mark with `1`, `true`, `yes`, or `x` |

## Development

Firebase projects: `vooruitplanner-development` (alias `dev`) and
`vooruitplanner` (alias `prod`). Copy `.env.example` to
`.env.development.local` and `.env.production.local` and fill in the web app
config of each project.

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
