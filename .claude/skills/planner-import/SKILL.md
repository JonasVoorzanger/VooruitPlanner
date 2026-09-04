---
name: planner-import
description: Convert a teacher's period planner (Word, PDF, Excel) into rows for the PeriodePlanner `events` spreadsheet tab. Use when someone hands over a vakplanning, periodeplanner, PTA or toetsplanning document and wants it as CSV to paste into the events tab, or asks to import/convert a planner into the planner spreadsheet.
---

# Planner → events CSV

Teachers hand in their period planning as Word, PDF or Excel, each in their own
layout. This turns one of those documents into rows for the `events` tab of the
PeriodePlanner Google Spreadsheet.

The output is a CSV whose columns match the events tab exactly, ready to paste
below the existing rows.

## Workflow

### 1. Refresh the calendar reference

`reference/calendar.json` holds the `weeks` and `subjects` tabs — the mapping from
"Lesweek 3" to a calendar week number, and the list of valid subject abbreviations.
It must match the school year being imported.

```bash
python3 scripts/fetch_reference.py            # default spreadsheet
python3 scripts/fetch_reference.py --id SPREADSHEET_ID
```

Check the printed week range covers the period in the document. If it does not, the
weeks tab needs filling in first — say so and stop, because every row would land in a
week that renders nothing.

### 2. Read the document

```bash
python3 scripts/extract.py "Planning NL leerjaar 4.docx"
python3 scripts/extract.py planning.xlsx --sheet "Periode 1"
```

Handles `.docx`, `.xlsx`, `.pdf`, `.doc`, `.rtf`, `.csv`, `.txt`; tables come out as
pipe tables so the row/column structure survives. For a PDF that returns little or no
text, or one whose layout matters, read the file with the **Read tool** instead — it
renders the pages visually.

### 3. Pin down the three header facts

Every subject row needs **subject**, **leerjaar** and **school year**. These are
usually in the document title, header or filename rather than in the table.

- Subject → abbreviation from `reference/calendar.json`. Match on `full_name`
  (*Nederlands* → `NL`). If the document's subject has no entry, stop and say which
  abbreviation needs adding to the `subjects` tab — do not invent one.
- Leerjaar → a single digit. `4V`, `havo 4`, `4 vwo` all mean `year` `4`.
- School year → decides `cal_year`, which is the year each week **starts** in, so it
  rolls over in January.

If any of the three is genuinely absent from the document, ask rather than guess. A
wrong leerjaar hides every row from the students who need it.

### 4. Build the rows

Read `reference/events-format.md` for the column rules, the type vocabulary, the
Dutch wording that maps to each type, and the week-mapping procedure. The short
version:

- One row per item. A week holding both lesstof and a toets becomes two rows.
- Map each week reference through the `weeks` tab — never by counting forward.
- `label` is the scannable title; put the detail in `description` (Markdown renders).
- Fill `weight` only for test types, only when the source states it.
- Leave anything the source does not say **empty**. Never fill a plausible guess.

Keep the teacher's own wording for labels and descriptions. Tidy obvious typos and
expand cryptic abbreviations only where the meaning is unambiguous; do not rewrite
their planning into your own phrasing.

### 5. Write and validate

Write the CSV, then:

```bash
python3 scripts/validate.py events-NL-4.csv
```

It cross-checks every week and subject against the calendar reference and flags rows
that would never render. Fix every ERROR. Read each WARN and either fix it or be able
to explain it.

### 6. Report back

Give a short summary: how many rows per type, which weeks are covered, and — most
importantly — an explicit list of anything ambiguous: week references that were
guessed, items that could be either a toets or an SO, missing wegingen, rows left out.
That list is what makes the result checkable.

## Several subjects or years in one document

Some planners cover multiple leerjaren or a whole vaksectie. Produce one CSV per
subject + leerjaar combination (`events-NL-4.csv`, `events-NL-5.csv`) and validate each
separately — it keeps the paste into the spreadsheet reviewable, and it keeps a mistake
in one subject from being buried in a 400-row file.

## What this skill does not do

- School-wide items — vakanties, studiedagen, ouderavonden — come from the school
  calendar, not from a subject planner. Do not create `school-wide` rows from a
  teacher's document.
- It does not write to the spreadsheet. The result is a CSV to review and paste.
