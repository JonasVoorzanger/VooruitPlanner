# PeriodePlanner

Vue 3 + Vuetify web application for planning school periods from a public Google Spreadsheet.

## Features

- Onboarding flow to pick a leerjaar and vakken, producing a shareable planner link (`/#/jaar/3/NL.EN.WI`)
- Week list view with collapsible weeks: school-wide events per day next to subject activities per vak
- Month view with a "Deze week" summary column, weekday grid and compact weekend column
- Compact/Uitgebreid detail levels and a light/dark theme toggle
- Event detail dialog with type, weging and Markdown description
- Google Sheets CSV loading for weeks, events (school-wide, tests, planning activities) and subjects
- Admin upload flow for PDF/DOCX to Claude-powered CSV conversion
- Settings stored in localStorage for spreadsheet and Claude API configuration

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

**Subject types** (appear inside the subject section, matched to weeks via `week_number`):

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
| `type` | Item type — see tables above |
| `label` | Short title (e.g. `Studiedag`, `Herhaling H1-H3`) |
| `description` | Optional longer description (Markdown supported) |
| `date` | Start date (`YYYY-MM-DD`) — used for school-wide items |
| `end_date` | Optional end date for multi-day items like holidays (`YYYY-MM-DD`) |
| `week_number` | Week number — used for subject items |
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
