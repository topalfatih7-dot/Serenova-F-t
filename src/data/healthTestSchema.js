/**
 * Sağlık testi şeması — admin CMS + runtime resolver.
 * Seed: healthTestSections.js (kilitli 30 soru).
 */

import { HEALTH_SECTIONS as SEED_SECTIONS } from './healthTestSections.js'

export const HEALTH_TEST_SCHEMA_KIND = 'health_test_schema'

export const HEALTH_TEST_ICON_OPTIONS = [
  'Stethoscope',
  'Dumbbell',
  'Apple',
  'HeartPulse',
  'Activity',
  'Moon',
  'Bone',
  'Clock3',
]

const QUESTION_TYPES = new Set(['single', 'multi', 'emoji', 'text'])

function slugify(text) {
  return String(text || '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
}

export function makeQuestionKey(label, existingKeys = []) {
  const base = slugify(label) || 'soru'
  let key = `q_${base}`
  let n = 2
  const used = new Set(existingKeys)
  while (used.has(key)) {
    key = `q_${base}_${n}`
    n += 1
  }
  return key
}

export function makeSectionId(title, existingIds = []) {
  const base = slugify(title) || 'kategori'
  let id = base
  let n = 2
  const used = new Set(existingIds)
  while (used.has(id)) {
    id = `${base}_${n}`
    n += 1
  }
  return id
}

function normalizeOption(opt, idx) {
  if (!opt || typeof opt !== 'object') return null
  const value = String(opt.value || '').trim() || `opt_${idx + 1}`
  const label = String(opt.label || value).trim()
  if (!label) return null
  const out = { value, label }
  if (opt.emoji) out.emoji = String(opt.emoji)
  if (opt.desc) out.desc = String(opt.desc)
  return out
}

function normalizeDetail(detail, questionKey) {
  if (!detail || typeof detail !== 'object') return null
  const key = String(detail.key || `${questionKey}Detail`).trim()
  if (!key) return null
  let when = detail.when
  if (when == null) when = ['yes', 'other']
  if (!Array.isArray(when)) when = [when]
  return {
    key,
    when,
    placeholder: String(detail.placeholder || ''),
  }
}

function normalizeQuestion(q, sort, existingKeys) {
  if (!q || typeof q !== 'object') return null
  let key = String(q.key || '').trim()
  if (!key) key = makeQuestionKey(q.label, existingKeys)
  existingKeys.push(key)

  const type = QUESTION_TYPES.has(q.type) ? q.type : 'single'
  const needsOptions = type === 'single' || type === 'multi' || type === 'emoji'
  const options = needsOptions
    ? (Array.isArray(q.options) ? q.options.map(normalizeOption).filter(Boolean) : [])
    : []

  const out = {
    key,
    type,
    label: String(q.label || key).trim() || key,
    hint: q.hint ? String(q.hint) : '',
    required: q.required !== false,
    sort: Number.isFinite(q.sort) ? q.sort : sort,
    options,
  }
  if (q.placeholder) out.placeholder = String(q.placeholder)
  const detail = normalizeDetail(q.detail, key)
  if (detail) out.detail = detail
  return out
}

function normalizeSection(section, sort, allKeys) {
  if (!section || typeof section !== 'object') return null
  const id = String(section.id || makeSectionId(section.title)).trim()
  if (!id) return null
  const questionsRaw = Array.isArray(section.questions) ? section.questions : []
  const questions = questionsRaw
    .map((q, i) => normalizeQuestion(q, i, allKeys))
    .filter(Boolean)
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .map((q, i) => ({ ...q, sort: i }))

  return {
    id,
    title: String(section.title || id).trim() || id,
    subtitle: String(section.subtitle || ''),
    icon: HEALTH_TEST_ICON_OPTIONS.includes(section.icon) ? section.icon : 'HeartPulse',
    audience: 'shared',
    sort: Number.isFinite(section.sort) ? section.sort : sort,
    questions,
  }
}

/** Seed şema — mevcut 30 soru. */
export function buildDefaultHealthTestSchema() {
  const allKeys = []
  const sections = SEED_SECTIONS.map((s, i) => normalizeSection({
    ...s,
    sort: i,
    questions: (s.questions || []).map((q, qi) => ({ ...q, sort: qi })),
  }, i, allKeys)).filter(Boolean)

  return {
    version: 1,
    sections,
  }
}

export const DEFAULT_HEALTH_TEST_SCHEMA = buildDefaultHealthTestSchema()

/**
 * Ham schema / site_content data → kanonik şema.
 * Geçersizse default döner.
 */
export function normalizeHealthTestSchema(raw) {
  if (!raw || typeof raw !== 'object') {
    return structuredClone(DEFAULT_HEALTH_TEST_SCHEMA)
  }
  const allKeys = []
  const sectionsIn = Array.isArray(raw.sections) ? raw.sections : []
  const sections = sectionsIn
    .map((s, i) => normalizeSection(s, i, allKeys))
    .filter(Boolean)
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .map((s, i) => ({ ...s, sort: i }))

  if (!sections.length) {
    return structuredClone(DEFAULT_HEALTH_TEST_SCHEMA)
  }

  return {
    version: Number(raw.version) || 1,
    id: raw.id || undefined,
    sections,
  }
}

/** Runtime sections listesi (HEALTH_SECTIONS uyumlu). */
export function resolveHealthSections(schemaOrNull) {
  const schema = normalizeHealthTestSchema(schemaOrNull)
  return schema.sections.map((s) => ({
    id: s.id,
    title: s.title,
    subtitle: s.subtitle,
    icon: s.icon,
    audience: 'shared',
    questions: s.questions.map((q) => {
      const out = {
        type: q.type,
        key: q.key,
        label: q.label,
        required: !!q.required,
        options: q.options || [],
      }
      if (q.hint) out.hint = q.hint
      if (q.placeholder) out.placeholder = q.placeholder
      if (q.detail) out.detail = q.detail
      return out
    }),
  }))
}

export function buildEmptyHealthTestFromSections(sections) {
  const obj = {}
  ;(sections || []).forEach((s) => {
    ;(s.questions || []).forEach((q) => {
      obj[q.key] = q.type === 'multi' ? [] : ''
      if (q.detail) obj[q.detail.key] = ''
    })
  })
  return obj
}

export function collectSchemaLabels(schemaOrNull) {
  const sections = resolveHealthSections(schemaOrNull)
  const labels = {}
  sections.forEach((s) => {
    s.questions.forEach((q) => {
      labels[q.key] = q.label
      if (q.detail) labels[q.detail.key] = `${q.label} (açıklama)`
    })
  })
  return labels
}

export function validateHealthTestSchema(schema) {
  const errors = []
  const normalized = normalizeHealthTestSchema(schema)
  if (!normalized.sections.length) errors.push('En az bir kategori gerekli.')
  const ids = new Set()
  const keys = new Set()
  normalized.sections.forEach((s) => {
    if (ids.has(s.id)) errors.push(`Tekrarlayan kategori id: ${s.id}`)
    ids.add(s.id)
    if (!s.title.trim()) errors.push(`Kategori başlığı boş: ${s.id}`)
    s.questions.forEach((q) => {
      if (keys.has(q.key)) errors.push(`Tekrarlayan soru key: ${q.key}`)
      keys.add(q.key)
      if (!q.label.trim()) errors.push(`Soru etiketi boş: ${q.key}`)
      if ((q.type === 'single' || q.type === 'multi' || q.type === 'emoji') && !q.options?.length) {
        errors.push(`Seçenek gerekli: ${q.key}`)
      }
    })
  })
  return { ok: errors.length === 0, errors, schema: normalized }
}
