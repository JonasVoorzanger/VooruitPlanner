// Tests voor de adresregels in src/data/slugs.js.
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { isSchoolAddress, isValidSlug } from '../src/data/slugs.js'

describe('slugs', () => {
  test('kleine letters, cijfers en losse streepjes', () => {
    assert.ok(isValidSlug('hal'))
    assert.ok(isValidSlug('het-baarnsch-lyceum'))
    assert.ok(isValidSlug('csg2'))
    assert.ok(!isValidSlug('HAL'))
    assert.ok(!isValidSlug('a'))
    assert.ok(!isValidSlug('-hal'))
    assert.ok(!isValidSlug('hal-'))
    assert.ok(!isValidSlug('ha--l'))
    assert.ok(!isValidSlug('hal.nl'))
    assert.ok(!isValidSlug('x'.repeat(41)))
  })

  test('paden van de app zelf zijn geen slug', () => {
    for (const slug of ['beheer', 'admin', 'aanmelden', 'login', 'api', 'static', 'assets', 'privacy']) {
      assert.ok(!isValidSlug(slug), slug)
    }
  })

  test('een adres is een slug of een school-id', () => {
    assert.ok(isSchoolAddress('hal'))
    assert.ok(isSchoolAddress('HAL'))
    assert.ok(isSchoolAddress('Xy3kP9qLmN2vB7cD4fGh'))
    assert.ok(!isSchoolAddress('Beheer'))
    assert.ok(!isSchoolAddress('__name__'))
    assert.ok(!isSchoolAddress('..'))
    assert.ok(!isSchoolAddress(''))
  })
})
