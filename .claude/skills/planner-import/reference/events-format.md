# The `events` tab format

One tab holds everything: school-wide items *and* every subject's activities and
tests. The `type` column decides which of the two shapes a row has.

## Header

The header is fixed and must be written in exactly this order:

```
cal_year,cal_week_number,subject_abbreviation,year,type,weight,label,description,date,end_date,year_1,year_2,year_3,year_4,year_5,year_6
```

## The two row shapes

|  | subject row | school-wide row |
| --- | --- | --- |
| `type` | `plan` `proefwerk` `so` `schoolexamen` `presentatie` `luistertoets` | `school-wide` |
| placed in the planner by | `cal_year` + `cal_week_number` | `date` (+ `end_date`) |
| `cal_year`, `cal_week_number` | **required** | leave empty |
| `subject_abbreviation`, `year` | **required** | leave empty |
| `weight` | tests only | leave empty |
| `date`, `end_date` | leave empty | `date` required |
| `year_1`…`year_6` | leave empty | which leerjaren it applies to |
| `label` | **required** | **required** |
| `description` | optional | optional |

A teacher planner import produces **subject rows only**. School-wide rows
(studiedagen, vakanties, ouderavonden) come from the school calendar, not from a
subject planner — do not invent them from a teacher's document.

## Columns

| Column | Rules |
| --- | --- |
| `cal_year` | Calendar year the week starts in, e.g. `2025`. Not the school year. Week 2 of a school year that began in August is `2026`. |
| `cal_week_number` | ISO calendar week number, e.g. `35`. **Not** "Lesweek 1" — see *Week mapping* below. |
| `subject_abbreviation` | Uppercase, must already exist in the `subjects` tab. |
| `year` | Leerjaar as a single digit `1`–`6`. |
| `type` | Lowercase, from the vocabulary below. |
| `weight` | Weging. A number (`1`, `2`, `3`), a percentage (`10%`), or `formatief`. Empty for `plan`. |
| `label` | Short title shown on the card. Keep it scannable — chapter, topic, or test name. |
| `description` | Longer detail. Markdown is rendered, so `**bold**`, lists and links work. |
| `date` / `end_date` | `YYYY-MM-DD`. School-wide only. `end_date` makes it a multi-day span. |
| `year_1`…`year_6` | School-wide only. `1` where it applies, empty where it does not. All six empty means all leerjaren. |

## Type vocabulary

| `type` | Use for | Weighted |
| --- | --- | --- |
| `plan` | Ordinary lesson planning: chapters, topics, homework, practicals | no |
| `proefwerk` | Proefwerk / toets / repetitie | yes |
| `so` | Schriftelijke overhoring, overhoring, HO | yes |
| `schoolexamen` | SE, schoolexamen, PTA-onderdeel | yes |
| `presentatie` | Presentatie, mondeling, spreekbeurt, praktische opdracht presented | yes |
| `luistertoets` | Luistertoets, kijk- en luistertoets | yes |

Dutch wording teachers actually use, and where it maps:

- *toets, proefwerk, PW, repetitie, tentamen* → `proefwerk`
- *SO, s.o., overhoring, HO, huiswerkoverhoring, diagnostische toets* → `so`
- *SE, schoolexamen, PTA, handelingsdeel* → `schoolexamen`
- *presentatie, mondeling, spreekbeurt, PO (when presented)* → `presentatie`
- *luistertoets, kijk- en luistertoets, LT* → `luistertoets`
- *herhaling, uitleg, huiswerk, lesstof, hoofdstuk, paragraaf, practicum, excursie,
  inhaalles, werkweek* → `plan`

When a row is a test but the flavour is unclear, `proefwerk` is the safe default —
except when the source says *formatief*, which is almost always an `so`.

## Week mapping — the part that goes wrong

Teachers write **"Lesweek 1"**, **"week 3"**, or a date range. The events tab keys on
the **ISO calendar week number**. The `weeks` tab is the bridge, and it is in
`reference/calendar.json`:

```json
{ "week_number": 35, "start_date": "2025-08-25", "end_date": "2025-09-01", "label": "Lesweek 1" }
```

So *Lesweek 1* → `cal_week_number` `35`, `cal_year` `2025` (the year the week **starts**).

Resolve a teacher's week reference in this order:

1. **Label match.** "Lesweek 3" matches the weeks row whose `label` is `Lesweek 3`.
2. **Date match.** A date or date range in the planner falls inside exactly one week's
   `start_date`…`end_date`.
3. **Bare number.** A number in the 33–52 or 1–30 range that matches a `week_number`
   directly is a calendar week. A small number (1–15) next to the word *lesweek*,
   *periode* or *les* is a label reference, not a calendar week.

Never guess by counting forward from the start of the year: vakantieweken and
activiteitenweken break the sequence, and a row landing in the wrong week is invisible
to students in the right one.

## Rules that keep rows from disappearing

- Every `cal_year` + `cal_week_number` pair must exist in the `weeks` tab. A row in a
  week the tab does not list is silently never rendered.
- Every `subject_abbreviation` must exist in the `subjects` tab. Uppercase, exactly.
- `year` must match the leerjaar a student picks during onboarding, or they will not
  see the row.
- Rows landing in a vakantie week are usually a mapping mistake.

## CSV mechanics

- UTF-8, comma-separated, `\n` line endings.
- Quote any field containing a comma, a quote or a newline; escape `"` as `""`.
- Empty means empty — never `-`, `n.v.t.`, `0` or `NULL`.
- One row per item. A week with a toets *and* lesstof is two rows, not one.
