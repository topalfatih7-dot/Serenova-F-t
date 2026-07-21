import { writeFileSync } from 'fs'
import { HEALTH_SECTIONS } from '../src/data/healthTestSections.js'
import { HEALTH_AUDIENCE_META } from '../src/data/healthTest.js'

function stripFns(obj) {
  if (obj == null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(stripFns)
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'function') {
      out[k] = '[function]'
      continue
    }
    out[k] = stripFns(v)
  }
  return out
}

function countQuestions(questions = []) {
  let n = questions.length
  for (const q of questions) {
    if (q.followUps?.length) n += countQuestions(q.followUps)
  }
  return n
}

const sections = HEALTH_SECTIONS.map((s) => ({
  id: s.id,
  title: s.title,
  subtitle: s.subtitle,
  icon: s.icon,
  audience: s.audience || 'shared',
  genderOnly: s.genderOnly || null,
  topLevelQuestionCount: s.questions?.length || 0,
  totalQuestionAndFollowUpCount: countQuestions(s.questions || []),
  questions: stripFns(s.questions || []),
}))

const payload = {
  exportedAt: new Date().toISOString(),
  source: 'src/data/healthTestSections.js + healthTestDietitianSections.js',
  audienceMeta: HEALTH_AUDIENCE_META,
  sectionCount: sections.length,
  topLevelQuestionCount: sections.reduce((n, s) => n + s.topLevelQuestionCount, 0),
  totalQuestionAndFollowUpCount: sections.reduce((n, s) => n + s.totalQuestionAndFollowUpCount, 0),
  sections,
}

const outPath = 'docs/mobile/domains/health-test-full-export.json'
writeFileSync(outPath, JSON.stringify(payload, null, 2))
console.log(JSON.stringify({
  outPath,
  sectionCount: payload.sectionCount,
  topLevelQuestionCount: payload.topLevelQuestionCount,
  totalQuestionAndFollowUpCount: payload.totalQuestionAndFollowUpCount,
  sections: sections.map((s) => ({
    id: s.id,
    title: s.title,
    audience: s.audience,
    genderOnly: s.genderOnly,
    topLevel: s.topLevelQuestionCount,
    withFollowUps: s.totalQuestionAndFollowUpCount,
  })),
}, null, 2))
