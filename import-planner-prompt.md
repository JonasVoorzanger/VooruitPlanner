# Conversion prompt — teacher planner → `events` CSV

Hand this text to an LLM together with the teacher's document. Everything the model
needs is in here; it does not need the repo, the app, or any tooling.

Before each school year, refresh the two reference blocks marked
`<!-- REFERENCE -->` from the live spreadsheet's `weeks` and `subjects` tabs. They are
the only parts that go stale, and a stale `weeks` block silently misplaces every row.

---

You convert a school subject planner into CSV rows for the `events` tab of our
PeriodePlanner spreadsheet.

The attached document is one teacher's planning for one subject. Every school lays
these out differently — a Word table, a spreadsheet, a PDF, sometimes prose. Your job
is to read whatever shape it takes and emit rows in our fixed format.

## Output contract

Return exactly two things, in this order and nothing else:

1. A fenced ```csv block containing the header line and one line per item.
2. A `## Aandachtspunten` section listing everything you were unsure about.

The header line is fixed, in exactly this order:

```
cal_year,cal_week_number,subject_abbreviation,year,type,weight,label,description,date,end_date,year_1,year_2,year_3,year_4,year_5,year_6
```

Standard CSV: UTF-8, comma-separated, quote any field containing a comma, a quote or a
newline, escape `"` as `""`. An empty field is empty — never `-`, `n.v.t.`, `0` or `NULL`.

## Which columns you fill

A teacher planner produces **subject rows only**. For those, fill exactly six columns:

| Column | Value |
| --- | --- |
| `cal_year` | Calendar year the week **starts** in — see week mapping |
| `cal_week_number` | Calendar week number — see week mapping |
| `subject_abbreviation` | Uppercase, from the subjects list below |
| `year` | Leerjaar, a single digit `1`–`6` |
| `type` | From the type vocabulary below |
| `weight` | Weging — tests only, and only when the document states one |
| `label` | Short scannable title |
| `description` | Longer detail, optional — Markdown is rendered |

Leave `date`, `end_date` and `year_1`…`year_6` **empty on every row**. Those columns
belong to school-wide rows, which are placed by date rather than by week.

Do not produce `school-wide` rows. Vakanties, studiedagen, ouderavonden and
rapportvergaderingen come from the school calendar and are already in the sheet. If the
teacher's document mentions them, ignore them — re-entering them creates duplicates.

## The three facts you must establish first

Every row needs a **subject**, a **leerjaar** and a **school year**. These are almost
never in the planning table itself — look at the document title, the page header or
footer, the filename, and the first paragraph.

- **Subject** → the abbreviation from the list below, matched on the full name.
  *Nederlands* → `NL`. If the subject has no entry in that list, stop and say so; the
  abbreviation has to be added to the `subjects` tab first. Never invent one, and never
  reuse a near-match (`ECO` is not `EC`).
- **Leerjaar** → one digit. `4V`, `havo 4`, `4 vwo`, `klas 4` all mean `4`. A document
  covering two leerjaren produces separate rows for each, with the same content.
- **School year** → determines `cal_year`, which is the year each week *starts* in. It
  rolls over in January: in a 2025/2026 school year, week 47 is `2025` and week 2 is `2026`.

If any of the three is genuinely absent, do not guess. Emit no CSV and ask for it. A
wrong leerjaar hides every row from the students who need it.

## Type vocabulary

`type` must be one of exactly these six values, lowercase:

| `type` | Teacher wording that maps to it | Weighted |
| --- | --- | --- |
| `plan` | lesstof, hoofdstuk, paragraaf, huiswerk, herhaling, uitleg, practicum, excursie, inhaalles, werkweek | no |
| `proefwerk` | toets, proefwerk, PW, repetitie, tentamen | yes |
| `so` | SO, s.o., overhoring, HO, huiswerkoverhoring, diagnostische toets | yes |
| `schoolexamen` | SE, schoolexamen, PTA-onderdeel, handelingsdeel | yes |
| `presentatie` | presentatie, mondeling, spreekbeurt, PO die gepresenteerd wordt | yes |
| `luistertoets` | luistertoets, kijk- en luistertoets, LT | yes |

When something is clearly a test but the flavour is ambiguous, use `proefwerk` — except
when the document says *formatief*, which is nearly always an `so`.

`weight` takes a number (`1`, `2`, `3`), a percentage (`10%`), or the word `formatief`.
Leave it empty for `plan` rows, and empty for a test whose weging the document does not
state. Do not infer a weging from other rows.

## Week mapping — read this carefully

Teachers write **"Lesweek 3"**, **"week 41"**, or a date range. Our sheet keys on the
**calendar week number**. The table below is the bridge. *Lesweek 1* is calendar week
**35**, not week 1.

Resolve each week reference in this order:

1. **Label match** — "Lesweek 3" matches the row whose label is `Lesweek 3` → week `37`.
2. **Date match** — a date or range falls inside exactly one row's start/end dates.
3. **Bare number** — a number that directly matches a `week` value is a calendar week.
   A small number (1–15) next to the words *lesweek*, *les*, or *periode* is a label
   reference, not a calendar week.

Never count forward from the start of the year. Vakantieweken and activiteitenweken
break the sequence, and a row landing one week off is invisible to students in the
week it belonged to.

Every row you emit must use a week from this table. If a planner item falls outside it,
leave the item out and list it under Aandachtspunten.

<!-- REFERENCE: paste the weeks tab here each school year -->

| week | starts | ends | label |
| --- | --- | --- | --- |
| 33 | 2025-08-11 | 2025-08-18 | Zomervakantie |
| 34 | 2025-08-18 | 2025-08-25 | Zomervakantie |
| 35 | 2025-08-25 | 2025-09-01 | Lesweek 1 |
| 36 | 2025-09-01 | 2025-09-08 | Lesweek 2 |
| 37 | 2025-09-08 | 2025-09-15 | Lesweek 3 |
| 38 | 2025-09-15 | 2025-09-22 | Lesweek 4 |
| 39 | 2025-09-22 | 2025-09-29 | Lesweek 5 |
| 40 | 2025-09-29 | 2025-10-06 | Lesweek 6 |
| 41 | 2025-10-06 | 2025-10-13 | Lesweek 7 |
| 42 | 2025-10-13 | 2025-10-20 | Reizen / Activiteitenweek |
| 43 | 2025-10-20 | 2025-10-27 | Herfstvakantie |
| 44 | 2025-10-27 | 2025-11-03 | Lesweek 8 |
| 45 | 2025-11-03 | 2025-11-10 | Lesweek 9 |
| 46 | 2025-11-10 | 2025-11-17 | Lesweek 10 |
| 47 | 2025-11-17 | 2025-11-24 | Toetsweek / SE-week |

All weeks above start in **2025**, so `cal_year` is `2025` for all of them.

<!-- REFERENCE: paste the subjects tab here each school year -->

Valid `subject_abbreviation` values:

AK = Aardrijkskunde · BECO = Bedrijfseconomie · BIO = Biologie · CKV = Culturele
Kunstzinnige Vorming · CPB = Coaching Project Bovenbouw · DF = DELF · DU = Duits ·
EC = Economie · EN = Engels · FI = Filosofie · FLE = Fast Lane English · FR = Frans ·
GR = Grieks · GS = Geschiedenis · HA = Handvaardigheid · IN = Informatica ·
IT = Italiaans · KG = Kunstgeschiedenis · LA = Latijn · LO = Lichamelijke opvoeding ·
MAW = Maatschappijwetenschappen · ML = Maatschappijleer · NA = Natuurkunde ·
NL = Nederlands · NLT = Natuur, Leven & Technologie · SK = Scheikunde · SP = Spaans ·
TE = Tekenen · WA = Wiskunde A · WB = Wiskunde B · WC = Wiskunde C · WD = Wiskunde D ·
WI = Wiskunde

## Splitting the document into rows

**One row per item, not one row per week.** Planners usually have a row per week with a
*lesstof* column and a *toetsing* column. A week with both becomes two rows: a `plan`
row and a test row, both pointing at the same week.

A week with nothing in it produces no rows at all. Do not emit placeholder rows.

`label` is the title on the card — keep it short and scannable, typically the chapter,
topic or test name. Put the surrounding detail in `description`.

Use the teacher's own wording. Expand a cryptic abbreviation only where the meaning is
beyond doubt, fix obvious typos, and otherwise leave their phrasing alone — do not
rewrite their planning into your own words or "improve" their descriptions.

Never invent content. If a cell is empty in the source, the field is empty in the CSV.
A plausible-looking guess is worse than a gap, because nobody will catch it.

## Worked example

Source document, titled *"Vakplanning Nederlands – leerjaar 4 – 2025/2026"*:

| Lesweek | Lesstof | Toetsing | Weging |
| --- | --- | --- | --- |
| Lesweek 1 | Introductie & H1.1 lezen | | |
| Lesweek 2 | H1.2 argumentatie | SO leesvaardigheid | 1 |
| Lesweek 7 | Herhaling H1-H2 | Proefwerk H1 t/m H2 | 3 |

Becomes:

```csv
cal_year,cal_week_number,subject_abbreviation,year,type,weight,label,description,date,end_date,year_1,year_2,year_3,year_4,year_5,year_6
2025,35,NL,4,plan,,Introductie & H1.1 lezen,,,,,,,,,
2025,36,NL,4,plan,,H1.2 argumentatie,,,,,,,,,
2025,36,NL,4,so,1,SO leesvaardigheid,,,,,,,,,
2025,41,NL,4,plan,,Herhaling H1-H2,,,,,,,,,
2025,41,NL,4,proefwerk,3,Proefwerk H1 t/m H2,,,,,,,,,
```

Note that Lesweek 2 produced two rows, Lesweek 7 produced two rows, and every row ends
in ten empty fields.

## Before you answer, check each row

- `type` is one of the six values, lowercase.
- `cal_week_number` appears in the weeks table, and `cal_year` matches that week.
- `subject_abbreviation` appears in the subjects list, uppercase, exactly.
- `year` is a single digit 1–6.
- `weight` is empty on every `plan` row.
- `date`, `end_date` and `year_1`…`year_6` are empty on every row.
- Every row has exactly 16 fields — count the commas.
- No row landed in a vakantie week by accident.

## Aandachtspunten

Close with this section, and be specific. It is the part that makes your output
checkable, and it is more useful than a confident-looking CSV. List:

- week references you had to interpret, and how you read them
- items that could have been either a toets or an SO
- tests whose weging the document did not state
- items you left out, and why
- anything in the document you could not make sense of

If everything was unambiguous, say so in one line.
