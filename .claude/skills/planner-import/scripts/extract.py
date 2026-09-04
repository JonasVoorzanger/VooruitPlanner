#!/usr/bin/env python3
"""Extract readable text and tables from a teacher's planner document.

Stdlib only (plus poppler's pdftotext / macOS textutil when present), so it
runs anywhere without a pip install.

Usage:
    python3 extract.py PLANNER.docx
    python3 extract.py PLANNER.xlsx --sheet "Periode 1"
    python3 extract.py PLANNER.pdf

Tables are printed as pipe tables so the row/column structure survives, which
is what almost every school planner actually encodes its meaning in.
"""

import argparse
import csv
import os
import re
import shutil
import subprocess
import sys
import zipfile
from xml.etree import ElementTree

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
S = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
PKG_R = "{http://schemas.openxmlformats.org/package/2006/relationships}"


def clean(text):
    return re.sub(r"[ \t]+", " ", (text or "").replace("\xa0", " ")).strip()


def pipe_table(rows):
    """Render a list-of-lists as a markdown pipe table."""
    rows = [[clean(cell) for cell in row] for row in rows]
    rows = [row for row in rows if any(row)]
    if not rows:
        return ""
    width = max(len(row) for row in rows)
    rows = [row + [""] * (width - len(row)) for row in rows]
    out = ["| " + " | ".join(c.replace("|", "\\|").replace("\n", "<br>") for c in rows[0]) + " |"]
    out.append("|" + "|".join([" --- "] * width) + "|")
    for row in rows[1:]:
        out.append("| " + " | ".join(c.replace("|", "\\|").replace("\n", "<br>") for c in row) + " |")
    return "\n".join(out)


# --------------------------------------------------------------------------- docx


def docx_paragraph(node):
    parts = []
    for child in node.iter():
        if child.tag == W + "t":
            parts.append(child.text or "")
        elif child.tag in (W + "tab",):
            parts.append("\t")
        elif child.tag in (W + "br", W + "cr"):
            parts.append("\n")
    return clean("".join(parts))


def docx_cell_text(cell):
    """Text of one table cell, including any nested paragraphs."""
    lines = [docx_paragraph(p) for p in cell.findall(W + "p")]
    return " ".join(line for line in lines if line)


def docx_table(tbl):
    rows = []
    for tr in tbl.findall(W + "tr"):
        rows.append([docx_cell_text(tc) for tc in tr.findall(W + "tc")])
    return rows


def extract_docx(path):
    out = []
    with zipfile.ZipFile(path) as zf:
        names = ["word/document.xml"]
        # Headers often carry the subject / leerjaar, which we need.
        names += sorted(n for n in zf.namelist() if re.match(r"word/header\d*\.xml$", n))
        for name in names:
            try:
                xml = zf.read(name)
            except KeyError:
                continue
            root = ElementTree.fromstring(xml)
            body = root.find(W + "body")
            container = body if body is not None else root
            if name.startswith("word/header"):
                out.append(f"\n## [{os.path.basename(name)}]")
            parents = {child: parent for parent in container.iter() for child in parent}
            for node in container.iter():
                if node.tag == W + "p":
                    # Skip paragraphs inside a table; the table itself prints them.
                    text = docx_paragraph(node)
                    if text and not _inside_table(parents, node):
                        out.append(text)
                elif node.tag == W + "tbl" and not _inside_table(parents, node):
                    table = pipe_table(docx_table(node))
                    if table:
                        out.append("\n" + table + "\n")
    return "\n".join(out)


def _inside_table(parents, node):
    node = parents.get(node)
    while node is not None:
        if node.tag == W + "tbl":
            return True
        node = parents.get(node)
    return False


# --------------------------------------------------------------------------- xlsx


def col_index(ref):
    letters = re.match(r"([A-Z]+)", ref or "")
    if not letters:
        return 0
    index = 0
    for ch in letters.group(1):
        index = index * 26 + (ord(ch) - 64)
    return index - 1


def extract_xlsx(path, only_sheet=None):
    out = []
    with zipfile.ZipFile(path) as zf:
        shared = []
        if "xl/sharedStrings.xml" in zf.namelist():
            root = ElementTree.fromstring(zf.read("xl/sharedStrings.xml"))
            for si in root.findall(S + "si"):
                shared.append("".join(t.text or "" for t in si.iter(S + "t")))

        workbook = ElementTree.fromstring(zf.read("xl/workbook.xml"))
        rels = ElementTree.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
        target_by_id = {rel.get("Id"): rel.get("Target") for rel in rels.findall(PKG_R + "Relationship")}

        for sheet in workbook.iter(S + "sheet"):
            title = sheet.get("name")
            if only_sheet and only_sheet.lower() != (title or "").lower():
                continue
            target = target_by_id.get(sheet.get(R + "id"), "")
            name = ("xl/" + target.lstrip("/")).replace("xl/xl/", "xl/")
            if name not in zf.namelist():
                continue
            root = ElementTree.fromstring(zf.read(name))
            rows = []
            for row in root.iter(S + "row"):
                cells = []
                for c in row.findall(S + "c"):
                    idx = col_index(c.get("r", ""))
                    while len(cells) < idx:
                        cells.append("")
                    if c.get("t") == "s":
                        v = c.find(S + "v")
                        value = shared[int(v.text)] if v is not None and v.text else ""
                    elif c.get("t") == "inlineStr":
                        value = "".join(t.text or "" for t in c.iter(S + "t"))
                    else:
                        v = c.find(S + "v")
                        value = v.text if v is not None else ""
                    cells.append(value or "")
                rows.append(cells)
            table = pipe_table(rows)
            if table:
                out.append(f"\n## [sheet: {title}]\n\n{table}\n")
    return "\n".join(out)


# --------------------------------------------------------------------------- other


def extract_pdf(path):
    if not shutil.which("pdftotext"):
        return (
            "[extract.py cannot read PDFs here: pdftotext is not installed.\n"
            " Read the PDF directly with the Read tool instead - it renders PDF pages natively.]"
        )
    # -layout keeps columns aligned, which preserves planner table structure.
    result = subprocess.run(
        ["pdftotext", "-layout", "-enc", "UTF-8", path, "-"],
        capture_output=True, text=True,
    )
    text = result.stdout.strip()
    if not text:
        return (
            "[pdftotext returned no text - this is most likely a scanned PDF.\n"
            " Read the file directly with the Read tool, which renders the pages as images.]"
        )
    return text


def extract_legacy(path):
    if not shutil.which("textutil"):
        return "[.doc/.rtf needs macOS textutil, which is not available here. Ask for a .docx export.]"
    result = subprocess.run(
        ["textutil", "-convert", "txt", "-stdout", path], capture_output=True, text=True
    )
    return result.stdout.strip() or "[textutil produced no text.]"


def extract_csv(path):
    with open(path, newline="", encoding="utf-8-sig", errors="replace") as fh:
        sample = fh.read(8192)
        fh.seek(0)
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",;\t")
        except csv.Error:
            dialect = csv.excel
        return pipe_table(list(csv.reader(fh, dialect)))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("path", help="planner document (.docx .xlsx .pdf .doc .rtf .csv .txt)")
    parser.add_argument("--sheet", help="xlsx only: extract just this sheet")
    args = parser.parse_args()

    if not os.path.exists(args.path):
        sys.exit(f"No such file: {args.path}")

    ext = os.path.splitext(args.path)[1].lower()
    if ext == ".docx":
        text = extract_docx(args.path)
    elif ext in (".xlsx", ".xlsm"):
        text = extract_xlsx(args.path, args.sheet)
    elif ext == ".pdf":
        text = extract_pdf(args.path)
    elif ext in (".doc", ".rtf", ".odt"):
        text = extract_legacy(args.path)
    elif ext in (".csv", ".tsv"):
        text = extract_csv(args.path)
    elif ext in (".txt", ".md"):
        text = open(args.path, encoding="utf-8", errors="replace").read()
    else:
        sys.exit(f"Unsupported file type: {ext}")

    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    sys.stdout.write(f"# {os.path.basename(args.path)}\n\n{text}\n")


if __name__ == "__main__":
    main()
