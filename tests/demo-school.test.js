// Tests voor de gegenereerde demoschool (scripts/demo/demo-school.js).
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { buildDemoSchool } from '../scripts/demo/demo-school.js'
import { isValidSlug } from '../src/data/slugs.js'

const demo = buildDemoSchool()
const TYPES = ['plan', 'proefwerk', 'so', 'schoolexamen', 'praktische opdracht', 'presentatie', 'luistertoets']

describe('demoschool', () => {
  test('heeft een geldige slug', () => {
    assert.ok(isValidSlug(demo.slug))
  })

  test('elk vakitem valt in een week van het rooster', () => {
    const weeks = new Set(demo.weeks.map((week) => `${week.start_date.slice(0, 4)}-${week.week_number}`))
    for (const subject of demo.subjects) {
      for (const item of subject.items) {
        assert.ok(weeks.has(`${item.cal_year}-${item.cal_week_number}`), `${subject.abbreviation} ${item.label}`)
        assert.ok(TYPES.includes(item.type), item.type)
        assert.ok(demo.school.years.includes(item.year))
      }
    }
  })

  test('weken sluiten op elkaar aan, van maandag tot zondag', () => {
    demo.weeks.forEach((week, index) => {
      assert.equal(new Date(`${week.start_date}T12:00:00Z`).getUTCDay(), 1, week.start_date)
      assert.equal(new Date(`${week.end_date}T12:00:00Z`).getUTCDay(), 0, week.end_date)
      if (index > 0) {
        assert.ok(demo.weeks[index - 1].end_date < week.start_date)
      }
    })
  })

  test('elk profiel heeft in elk leerjaar een vakkenpakket', () => {
    for (const year of demo.school.years) {
      for (const profile of demo.school.profiles) {
        const picks = demo.subjects.filter((subject) => subject.profiles[`${year}_${profile.key}`])
        assert.ok(picks.length >= 6, `${year} ${profile.key}: ${picks.length}`)
        for (const subject of picks) {
          assert.ok(subject.items.some((item) => item.year === year), `${subject.abbreviation} zonder items in ${year}`)
        }
      }
    }
  })

  test('schoolbrede items hebben een datum en gelden voor minstens één leerjaar', () => {
    for (const item of demo.schoolWide) {
      assert.match(item.date, /^\d{4}-\d{2}-\d{2}$/)
      assert.ok(!item.end_date || item.end_date >= item.date, item.label)
      assert.ok([1, 2, 3, 4, 5, 6].some((year) => item[`year_${year}`]), item.label)
    }
  })
})
