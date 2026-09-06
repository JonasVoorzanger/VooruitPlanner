# PeriodePlanner

Vue 3 + Vuetify web application for planning school periods from a public Google Spreadsheet.

## Features

- Onboarding flow to pick a leerjaar and vakken, producing a shareable planner link (`/#/jaar/3/NL.EN.WI`)
- Profile shortcuts (C&M, E&M, N&G, N&T) that fill the vakkenpakket in one click
- Three views over the same data: **Lijst** (scroll the whole year, weeks collapse and expand), **Maand** (one month at a glance, nothing to unfold) and **Per vak** (one subject, every week, all detail visible)
- Lijst and Maand share the same split: vakken per week on the left, the days of that week stacked on the right
- Per vak shows weeks without items for that subject as a minimal grey divider, so gaps stay visible
- Compact/Uitgebreid detail levels, a Filter menu (Toetsen / Planning / Overig) and a light/dark theme toggle
- A4 export of the list or month view, with per-week selection
- Event detail dialog with type, weging and Markdown description
- Google Sheets CSV loading for weeks, events (school-wide, tests, planning activities) and subjects
- Admin upload flow for PDF/DOCX to Claude-powered CSV conversion
- Settings stored in localStorage for spreadsheet and Claude API configuration

## Profiles

The quick-select buttons under *Profiel* on the onboarding screen are filled from
the spreadsheet, not from code. The `subjects` tab has one checkbox column per
profile and leerjaar:

| abbreviation | full_name | 4_CM | 5_CM | 4_EM | 5_EM | 4_NG | 5_NG | 4_NT | 5_NT |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AK | Aardrijkskunde | TRUE | TRUE | TRUE | TRUE | FALSE | FALSE | FALSE | FALSE |

Tick a box and the vak joins that profile's quick-select; run `npm run load-data`
to pull the change into [`src/data/spreadsheet.json`](src/data/spreadsheet.json).
[`src/data/profiles.js`](src/data/profiles.js) only holds the four profile labels
and reads the columns — no vakkenlijsten live in code.

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

## School-wide events

[`schoolwide-events-2026-2027.csv`](schoolwide-events-2026-2027.csv) holds the
school-wide items from the jaaragenda that matter to leerjaar 4 and 5 —
vakanties, proefwerkweken, SE-periodes, rapportmomenten, ouderavonden and
schoolbrede activiteiten. The columns match the `events` tab exactly, so the rows
can be pasted straight into the spreadsheet.

## Setup

### Connecting your Google Spreadsheet

The app accepts two URL formats — paste either one into the spreadsheet URL field in the app settings.

#### Option A — Publish to the web (recommended)

1. Open your spreadsheet in Google Sheets.
2. Go to **File → Share → Publish to the web**.
3. Under *Link*, select **Entire document** and **Comma-separated values (.csv)**, then click **Publish**.
4. Copy the URL (it looks like `https://docs.google.com/spreadsheets/d/e/2PACX-…/pub?output=csv`).
5. Paste it into the spreadsheet URL field in the app.

#### Option B — Share as "Anyone with the link"

1. Open your spreadsheet in Google Sheets.
2. Click **Share** (top right) → **Change to anyone with the link** → set role to **Viewer** → click **Done**.
3. Copy the URL from your browser's address bar (it looks like `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit…`).
4. Paste it into the spreadsheet URL field in the app.

## Google Spreadsheet Structure

The spreadsheet must be public (see Setup above) and contain the following 3 tabs:

### `weeks`

| Column | Description |
| ------ | ----------- |
| `week_number` | Numeric week identifier (e.g. `1`, `2`, …) |
| `start_date` | Start date of the week (`YYYY-MM-DD` preferred) |
| `end_date` | End date of the week (`YYYY-MM-DD` preferred) |
| `label` | Display label shown in the planner (e.g. `Week 1`) |

### `events`

All items — school-wide events, holidays, subject activities, and tests — live in this single tab. The `type` column determines how an item is displayed and where it appears.

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
| `schoolexamen` | Schoolexamen |
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

### `subjects`

| Column | Description |
| ------ | ----------- |
| `abbreviation` | Short abbreviation, e.g. `NL` (stored uppercased) |
| `full_name` | Full subject name, e.g. `Nederlands` |
| `4_CM` … `5_NT` | Checkbox per profile and leerjaar — `TRUE` puts the vak in that profile's quick-select |

## Development

```bash
npm install
npm run dev
```

## Load data
```bash
npm run load-data
```

## Build

```bash
npm run build
```
