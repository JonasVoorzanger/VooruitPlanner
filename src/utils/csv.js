// CSV-uitvoer voor de bewerkpagina. De kolomvolgorde is gelijk aan het
// `events`-tabblad van de spreadsheet, zodat het resultaat er rechtstreeks in
// geplakt kan worden.
export const EVENT_COLUMNS = [
  'cal_year',
  'cal_week_number',
  'subject_abbreviation',
  'year',
  'type',
  'weight',
  'label',
  'description',
  'date',
  'end_date',
  'year_1',
  'year_2',
  'year_3',
  'year_4',
  'year_5',
  'year_6',
]

function escapeCell(value) {
  const text = value === null || value === undefined ? '' : String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function toCsv(columns, rows) {
  const lines = [columns.join(',')]
  rows.forEach((row) => {
    lines.push(columns.map((column) => escapeCell(row[column])).join(','))
  })
  return lines.join('\n')
}

// Zet de tekst als bestand klaar in de browser.
export function downloadCsv(filename, text) {
  // BOM, zodat Excel de accenten goed leest.
  const blob = new Blob([`﻿${text}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
