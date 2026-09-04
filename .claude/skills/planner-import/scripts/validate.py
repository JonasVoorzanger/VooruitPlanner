#!/usr/bin/env python3
"""Validate a generated events CSV against the PeriodePlanner events schema.

Checks the header, the per-type column rules, and cross-checks every
subject_abbreviation and cal_year/cal_week_number pair against reference/calendar.json
so a row can never land in a week the planner does not render.

Usage:
    python3 validate.py events.csv
    python3 validate.py events.csv --calendar /path/to/calendar.json

Exit code 0 = clean (warnings allowed), 1 = errors found.
"""

import argparse
import csv
import datetime
import json
import os
import re
import sys
from collections import Counter

HEADER = [
    "cal_year", "cal_week_number", "subject_abbreviation", "year", "type", "weight",
    "label", "description", "date", "end_date",
    "year_1", "year_2", "year_3", "year_4", "year_5", "year_6",
]
YEAR_FLAGS = HEADER[10:]
SCHOOL_WIDE = "school-wide"
TEST_TYPES = {"proefwerk", "so", "schoolexamen", "presentatie", "luistertoets"}
SUBJECT_TYPES = TEST_TYPES | {"plan"}
ALL_TYPES = SUBJECT_TYPES | {SCHOOL_WIDE}
TRUTHY = {"1", "true", "yes", "x"}

DEFAULT_CALENDAR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "reference", "calendar.json"
)


def iso(value):
    try:
        return datetime.date.fromisoformat(value)
    except ValueError:
        return None


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("csv_path")
    parser.add_argument("--calendar", default=DEFAULT_CALENDAR)
    args = parser.parse_args()

    errors, warnings = [], []

    known_subjects, weeks_by_key = set(), {}
    if os.path.exists(args.calendar):
        with open(args.calendar, encoding="utf-8") as fh:
            calendar = json.load(fh)
        known_subjects = {s["abbreviation"].upper() for s in calendar.get("subjects", [])}
        for week in calendar.get("weeks", []):
            start = iso(week.get("start_date", ""))
            if start:
                weeks_by_key[(start.year, int(week["week_number"]))] = week
    else:
        warnings.append(
            f"no calendar reference at {args.calendar} - skipping week and subject cross-checks "
            f"(run fetch_reference.py)"
        )

    with open(args.csv_path, newline="", encoding="utf-8-sig") as fh:
        reader = csv.reader(fh)
        rows = [row for row in reader]

    if not rows:
        sys.exit("File is empty.")

    header = [h.strip() for h in rows[0]]
    if header != HEADER:
        missing = [h for h in HEADER if h not in header]
        extra = [h for h in header if h not in HEADER]
        if missing:
            errors.append(f"header: missing column(s) {missing}")
        if extra:
            errors.append(f"header: unexpected column(s) {extra}")
        if not missing and not extra:
            errors.append("header: columns are in the wrong order; expected " + ",".join(HEADER))
        if missing or extra:
            _report(errors, warnings)
            sys.exit(1)

    index = {name: header.index(name) for name in HEADER}
    seen = Counter()

    for number, raw in enumerate(rows[1:], start=2):
        if not any((cell or "").strip() for cell in raw):
            continue
        if len(raw) != len(header):
            errors.append(f"row {number}: has {len(raw)} fields, expected {len(header)}")
            continue
        row = {name: (raw[i] or "").strip() for name, i in index.items()}
        where = f"row {number} ({row['label'] or 'no label'})"

        event_type = row["type"].lower()
        if event_type not in ALL_TYPES:
            errors.append(f"{where}: unknown type {row['type']!r}; use one of {sorted(ALL_TYPES)}")
            continue
        if not row["label"]:
            errors.append(f"{where}: label is required")

        for field in ("date", "end_date"):
            if row[field] and not iso(row[field]):
                errors.append(f"{where}: {field} {row[field]!r} is not YYYY-MM-DD")
        start, end = iso(row["date"]), iso(row["end_date"])
        if start and end and end < start:
            errors.append(f"{where}: end_date {row['end_date']} is before date {row['date']}")

        if event_type == SCHOOL_WIDE:
            if not row["date"]:
                errors.append(f"{where}: school-wide rows need a date")
            for field in ("cal_year", "cal_week_number", "subject_abbreviation", "year", "weight"):
                if row[field]:
                    errors.append(f"{where}: school-wide rows must leave {field} empty (got {row[field]!r})")
            for flag in YEAR_FLAGS:
                if row[flag] and row[flag].lower() not in TRUTHY:
                    errors.append(f"{where}: {flag} must be one of 1/true/yes/x or empty (got {row[flag]!r})")
            if not any(row[f].lower() in TRUTHY for f in YEAR_FLAGS):
                warnings.append(f"{where}: no year_1..year_6 flag set - the planner shows this to every leerjaar")
            continue

        # Subject row from here on.
        for flag in YEAR_FLAGS:
            if row[flag]:
                errors.append(f"{where}: {flag} is only for school-wide rows")
        for field in ("date", "end_date"):
            if row[field]:
                warnings.append(f"{where}: {field} is ignored for {event_type} rows; the week columns place it")

        if not row["subject_abbreviation"]:
            errors.append(f"{where}: subject_abbreviation is required")
        elif row["subject_abbreviation"] != row["subject_abbreviation"].upper():
            errors.append(f"{where}: subject_abbreviation must be uppercase (got {row['subject_abbreviation']!r})")
        elif known_subjects and row["subject_abbreviation"] not in known_subjects:
            errors.append(
                f"{where}: subject {row['subject_abbreviation']!r} is not in the subjects tab; "
                f"add it there first or use an existing abbreviation"
            )

        if row["year"] not in {"1", "2", "3", "4", "5", "6"}:
            errors.append(f"{where}: year must be 1-6 (got {row['year']!r})")

        if not row["cal_year"].isdigit() or not row["cal_week_number"].isdigit():
            errors.append(f"{where}: cal_year and cal_week_number are required numbers "
                          f"(got {row['cal_year']!r}, {row['cal_week_number']!r})")
        elif weeks_by_key:
            key = (int(row["cal_year"]), int(row["cal_week_number"]))
            if key not in weeks_by_key:
                errors.append(
                    f"{where}: week {key[1]} of {key[0]} is not in the weeks tab - "
                    f"this row would never show up in the planner"
                )
            elif weeks_by_key[key].get("label", "").lower() in {"herfstvakantie", "kerstvakantie",
                                                               "voorjaarsvakantie", "meivakantie",
                                                               "zomervakantie"}:
                warnings.append(f"{where}: falls in {weeks_by_key[key]['label']} - is that intended?")

        if row["weight"]:
            if event_type == "plan":
                errors.append(f"{where}: weight is only for test types, not 'plan'")
            elif not re.fullmatch(r"\d+(\.\d+)?%?|formatief", row["weight"], re.IGNORECASE):
                warnings.append(f"{where}: weight {row['weight']!r} is not a number, a percentage, or 'formatief'")
        elif event_type in TEST_TYPES:
            warnings.append(f"{where}: {event_type} has no weight - leave empty only if the source omits it")

        key = (row["subject_abbreviation"], row["year"], row["cal_year"], row["cal_week_number"], row["label"].lower())
        seen[key] += 1
        if seen[key] == 2:
            warnings.append(f"{where}: duplicate of an earlier row (same subject, year, week and label)")

    counts = Counter()
    for raw in rows[1:]:
        if len(raw) == len(header) and any((c or "").strip() for c in raw):
            counts[raw[index["type"]].strip().lower()] += 1

    print(f"{args.csv_path}: {sum(counts.values())} rows")
    for event_type, count in sorted(counts.items()):
        print(f"  {event_type:<14} {count}")
    print()
    _report(errors, warnings)
    sys.exit(1 if errors else 0)


def _report(errors, warnings):
    for warning in warnings:
        print(f"WARN  {warning}")
    for error in errors:
        print(f"ERROR {error}")
    if not errors and not warnings:
        print("OK - no problems found.")
    elif not errors:
        print(f"\nOK with {len(warnings)} warning(s).")
    else:
        print(f"\n{len(errors)} error(s), {len(warnings)} warning(s).")


if __name__ == "__main__":
    main()
