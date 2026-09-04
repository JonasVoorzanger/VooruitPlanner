# PeriodePlanner

Vue 3 + Vuetify web application for planning school periods from a public Google Spreadsheet.

## Features

- Onboarding flow to pick a leerjaar and vakken, producing a shareable planner link (`/#/jaar/3/NL.EN.WI`)
- Profile shortcuts (C&M, E&M, N&G, N&T) that fill the vakkenpakket in one click
- Week list view with collapsible weeks: school-wide events per day next to subject activities per vak
- Month view with a "Deze week" summary column, weekday grid and compact weekend column
- Compact/Uitgebreid detail levels, an "Alleen toetsen" filter and a light/dark theme toggle
- A4 export of the list or month view, with per-week selection
- Event detail dialog with type, weging and Markdown description
- Google Sheets CSV loading for weeks, events (school-wide, tests, planning activities) and subjects
- Admin upload flow for PDF/DOCX to Claude-powered CSV conversion
- Settings stored in localStorage for spreadsheet and Claude API configuration

## Profiles

The quick-select buttons under *Profiel* on the onboarding screen are defined in
[`src/data/profiles.js`](src/data/profiles.js). Each profile lists its vakken per
leerjaar, on top of the shared `COMMON_COURSES`:

```js
{
  id: 'nt',
  label: 'N&T',
  name: 'Natuur & Techniek',
  courses: {
    4: ['NA', 'SK', 'WB', 'BIO'],
    5: ['NA', 'SK', 'WB', 'WD', 'NLT'],
  },
}
```

Use the abbreviations from the `subjects` tab. Abbreviations that do not exist in
the spreadsheet are skipped silently. The lists shipped in that file are
placeholders — replace them with the school's actual vakkenpakketten.

## Export to A4

The *Exporteren* button in the planner opens a dialog where a student picks the
view (list or month), the detail level, whether to limit the export to toetsen,
and exactly which weeks to include. The export then opens the browser print
dialog; choosing *Save as PDF* there produces a file.

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

School-wide items are never hidden by the "Alleen toetsen" filter: vakanties and
proefwerkweken are the context you read your toetsen in.

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
