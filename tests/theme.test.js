import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_THEME_PREF,
  getChartColors,
  normalizeThemePref,
  resolveIsDark,
} from '../src/utils/theme.js'

describe('theme', () => {
  it('normalizes unknown prefs to light', () => {
    assert.equal(normalizeThemePref('light'), 'light')
    assert.equal(normalizeThemePref('dark'), 'dark')
    assert.equal(normalizeThemePref('system'), 'system')
    assert.equal(normalizeThemePref(''), DEFAULT_THEME_PREF)
    assert.equal(normalizeThemePref('nope'), 'light')
    assert.equal(normalizeThemePref(null), 'light')
  })

  it('resolves dark from explicit and system prefs', () => {
    assert.equal(resolveIsDark('light', true), false)
    assert.equal(resolveIsDark('dark', false), true)
    assert.equal(resolveIsDark('system', true), true)
    assert.equal(resolveIsDark('system', false), false)
    assert.equal(resolveIsDark('garbage', true), false)
  })

  it('returns contrast-safe chart colors', () => {
    const light = getChartColors(false)
    const dark = getChartColors(true)
    assert.equal(light.grid, '#efe8de')
    assert.notEqual(dark.grid, light.grid)
    assert.ok(dark.tick.startsWith('#'))
    assert.notEqual(dark.tooltipBg, light.tooltipBg)
  })
})
