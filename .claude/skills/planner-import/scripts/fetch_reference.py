#!/usr/bin/env python3
"""Refresh the weeks + subjects reference from the live Google Spreadsheet.

The weeks tab is the mapping from a teacher's "Lesweek 3" to the calendar week
number the events tab actually keys on, so it must match the school year you
are importing. Run this once per school year (or whenever the weeks tab changes).

Usage:
    python3 fetch_reference.py                    # default spreadsheet
    python3 fetch_reference.py --id SPREADSHEET_ID
"""

import argparse
import csv
import io
import json
import os
import shutil
import ssl
import subprocess
import sys
import urllib.parse
import urllib.request

DEFAULT_ID = "1FdRh5rWw4Mybxa3FpddUm62BbhS3hSs8QuAQHVu4Pyk"
REFERENCE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "reference")


def http_get(url):
    """curl first: python.org builds on macOS often lack a CA bundle."""
    if shutil.which("curl"):
        result = subprocess.run(
            ["curl", "-sSL", "--max-time", "30", url], capture_output=True, text=True
        )
        if result.returncode == 0 and result.stdout:
            return result.stdout
    with urllib.request.urlopen(url, timeout=30, context=ssl.create_default_context()) as response:
        return response.read().decode("utf-8")


def fetch_tab(spreadsheet_id, tab):
    url = (
        f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}"
        f"/gviz/tq?tqx=out:csv&sheet={urllib.parse.quote(tab)}"
    )
    text = http_get(url)
    rows = list(csv.DictReader(io.StringIO(text)))
    # gviz pads every row out to the sheet's full column count; drop the blanks.
    return [
        {k.strip(): (v or "").strip() for k, v in row.items() if k and k.strip()}
        for row in rows
        if any((v or "").strip() for k, v in row.items() if k and k.strip())
    ]


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--id", default=DEFAULT_ID, help="Google Spreadsheet ID")
    args = parser.parse_args()

    try:
        weeks = fetch_tab(args.id, "weeks")
        subjects = fetch_tab(args.id, "subjects")
    except Exception as exc:  # noqa: BLE001 - surface the reason to the operator
        sys.exit(f"Could not fetch the spreadsheet ({exc}).\nCheck that it is published/shared publicly.")

    weeks = sorted(
        (
            {
                "week_number": int(w["week_number"]),
                "start_date": w.get("start_date", ""),
                "end_date": w.get("end_date", ""),
                "label": w.get("label", ""),
            }
            for w in weeks
            if w.get("week_number", "").isdigit()
        ),
        key=lambda w: (w["start_date"], w["week_number"]),
    )
    subjects = sorted(
        (
            {"abbreviation": s["abbreviation"].upper(), "full_name": s.get("full_name", "")}
            for s in subjects
            if s.get("abbreviation")
        ),
        key=lambda s: s["abbreviation"],
    )

    os.makedirs(REFERENCE_DIR, exist_ok=True)
    path = os.path.join(REFERENCE_DIR, "calendar.json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(
            {"spreadsheet_id": args.id, "weeks": weeks, "subjects": subjects},
            fh, ensure_ascii=False, indent=2,
        )
        fh.write("\n")

    print(f"Wrote {os.path.normpath(path)}")
    print(f"  {len(weeks)} weeks, {len(subjects)} subjects")
    if weeks:
        print(f"  weeks {weeks[0]['week_number']}-{weeks[-1]['week_number']}, "
              f"{weeks[0]['start_date']} to {weeks[-1]['end_date']}")


if __name__ == "__main__":
    main()
