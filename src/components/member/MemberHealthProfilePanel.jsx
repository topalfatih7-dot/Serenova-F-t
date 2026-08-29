import {
  HeartPulse, Activity, Target, Salad, Sparkles, CheckCircle2, AlertCircle,
} from 'lucide-react'
import {
  describeHealthTest,
  HEALTH_AUDIENCE_META,
  isHealthTestComplete,
  hasHealthTestProgress,
} from '../../data/healthTest'
import { collectHealthLabFiles } from '../../utils/healthLabFiles'
import HealthLabFilesPanel from './HealthLabFilesPanel'
import { GOAL_LABELS, FITNESS_LABELS, NUTRITION_LABELS } from '../../services/health'
import HealthStaffNotesPanel from './HealthStaffNotesPanel'
import StaffHealthBrief from '../staff/StaffHealthBrief'
import StaffWaterProgress from '../water/StaffWaterProgress'
import { isPaidMembership } from '../../data/membershipPlans'
import { normalizeStaffRole } from '../../utils/staffRoles'

/** Rolün görebileceği sağlık testi audience etiketleri */
function sectionVisibleForRole(sectionAudience, viewerRole) {
  const role = normalizeStaffRole(viewerRole)
  if (!role || role === 'admin') return true
  const aud = sectionAudience || 'shared'
  if (aud === 'shared') return true
  if (role === 'coach') return aud === 'coach'
  if (role === 'dietitian') return aud === 'dietitian'
  if (role === 'doctor') return aud === 'shared' // doktor-specific section yok; shared
  return true
}

/** Brief alanları — role göre */
export function briefKeysForRole(viewerRole) {
  const role = normalizeStaffRole(viewerRole)
  if (!role || role === 'admin') return ['general', 'nutrition', 'movement', 'risks', 'actions']
  if (role === 'coach') return ['general', 'movement', 'risks', 'actions']
  if (role === 'dietitian') return ['general', 'nutrition', 'risks', 'actions']
  if (role === 'doctor') return ['general', 'nutrition', 'movement', 'risks', 'actions']
  return ['general', 'risks', 'actions']
}

function Chips({ values, map, tone = 'cream' }) {
  if (!values?.length) return <span className="text-sm text-cream-800/40">—</span>
  const toneClass = tone === 'sage'
    ? 'bg-sage-50 text-sage-800 ring-sage-100'
    : tone === 'brand'
      ? 'bg-brand-50 text-brand-800 ring-brand-100'
      : 'bg-cream-100 text-cream-800 ring-cream-200'
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v) => (
        <span key={v} className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${toneClass}`}>
          {map[v] || v}
        </span>
      ))}
    </div>
  )
}

function AnalysisSummary({ analysis }) {
  if (!analysis) return null
  const cal = analysis.dailyCalories
  const scores = analysis.scores || analysis.radarScores || {}
  const overall = analysis.overallScore ?? analysis.radarScores?.overall ?? analysis.fitnessScore
  return (
    <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/80 to-white p-5">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-cream-900">
        <Sparkles className="h-4 w-4 text-brand-500" /> YeniForm Sağlık Skoru
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {analysis.bmi != null && (
          <div className="rounded-xl bg-white/90 px-3 py-2.5 ring-1 ring-brand-100/60">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-cream-800/45">VKİ</p>
            <p className="mt-1 text-lg font-bold text-cream-900">
              {analysis.bmi}
              {analysis.bmiCategory?.label ? <span className="ml-1 text-sm font-medium text-cream-800/60">· {analysis.bmiCategory.label}</span> : null}
            </p>
          </div>
        )}
        {overall != null && (
          <div className="rounded-xl bg-white/90 px-3 py-2.5 ring-1 ring-brand-100/60">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-cream-800/45">Genel Skor</p>
            <p className="mt-1 text-lg font-bold text-cream-900">{overall}/100</p>
          </div>
        )}
        {cal?.recommended != null && (
          <div className="rounded-xl bg-white/90 px-3 py-2.5 ring-1 ring-brand-100/60">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-cream-800/45">Günlük Kalori</p>
            <p className="mt-1 text-lg font-bold text-cream-900">{cal.recommended} kcal</p>
          </div>
        )}
      </div>
      {analysis.summary && (
        <p className="mt-3 text-xs leading-relaxed text-cream-800/70">{analysis.summary}</p>
      )}
      {scores && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            ['general', 'Genel'],
            ['nutrition', 'Beslenme'],
            ['movement', 'Hareket'],
            ['activity', 'Aktivite'],
            ['sleep', 'Uyku'],
            ['stress', 'Stres'],
            ['lifestyle', 'Yaşam tarzı'],
            ['motivation', 'Motivasyon'],
            ['readiness', 'Hazır oluş'],
            ['metabolic', 'Metabolik'],
            ['digestion', 'Sindirim'],
          ].map(([key, label]) => (
            scores[key] != null ? (
              <div key={key} className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-1.5 text-xs ring-1 ring-brand-100/50">
                <span className="text-cream-800/60">{label}</span>
                <span className="font-semibold text-cream-900">{scores[key]}</span>
              </div>
            ) : null
          ))}
        </div>
      )}
      {analysis.coachRecommendations?.message && (
        <p className="mt-4 rounded-xl bg-white/80 px-3 py-2 text-xs leading-relaxed text-cream-800/75">
          <span className="font-semibold text-brand-700">Antrenman: </span>
          {analysis.coachRecommendations.message}
        </p>
      )}
      {analysis.dietitianRecommendations?.tips?.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-xl bg-white/80 px-3 py-2">
          {analysis.dietitianRecommendations.tips.slice(0, 5).map((tip, i) => (
            <li key={i} className="text-xs text-cream-800/75">• {tip}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AnswerCard({ label, value, audience }) {
  const aud = HEALTH_AUDIENCE_META[audience] || HEALTH_AUDIENCE_META.shared
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${aud.border}`}>
      <p className="text-[11px] font-medium text-cream-800/50">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-snug text-cream-900">{value}</p>
    </div>
  )
}

export default function MemberHealthProfilePanel({
  member,
  canWriteNotes = false,
  noteAuthor,
  onSaveNotes,
  notesSaving = false,
  showHealthAnalysis = false,
  showStaffBrief = false,
  viewerRole = 'admin',
  analysisStale = false,
  onRerunAnalysis = null,
  analysisRerunning = false,
  analysisRerunError = null,
}) {
  if (!member) return null

  const memberPaid = isPaidMembership(member.membership)
  const complete = isHealthTestComplete(member.healthTest, member.gender, member.packageConfig)
  const hasProgress = hasHealthTestProgress(member.healthTest, member.gender, member.packageConfig)
  const sections = describeHealthTest(member.healthTest, member.gender, member.packageConfig)
    .filter((sec) => sectionVisibleForRole(sec.audience, viewerRole))
  const briefKeys = briefKeysForRole(viewerRole)

  return (
    <div className="space-y-6">
      <div className={`flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 ${
        complete ? 'border-sage-200 bg-sage-50/50' : hasProgress ? 'border-amber-200 bg-amber-50/40' : 'border-cream-200 bg-cream-50'
      }`}>
        {complete ? (
          <CheckCircle2 className="h-5 w-5 text-sage-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-amber-600" />
        )}
        <div>
          <p className="text-sm font-semibold text-cream-900">
            {complete ? 'Kişisel sağlık analizi tamamlandı' : hasProgress ? 'Kişisel sağlık analizi devam ediyor' : 'Kişisel sağlık analizi başlanmadı'}
          </p>
          <p className="text-xs text-cream-800/55">
            {member.gender === 'female' ? 'Kadın' : member.gender === 'male' ? 'Erkek' : 'Cinsiyet belirtilmemiş'}
            {' · '}
            {member.age ? `${member.age} yaş` : 'Yaş —'}
            {member.weight ? ` · ${member.weight} kg` : ''}
            {member.height ? ` · ${member.height} cm` : ''}
          </p>
        </div>
      </div>

      <StaffWaterProgress member={member} viewerRole={viewerRole} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-cream-200 bg-white p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cream-800/50">
            <Activity className="h-3.5 w-3.5 text-brand-500" /> Spor Seviyesi
          </p>
          <p className="text-sm font-semibold text-cream-900">{FITNESS_LABELS[member.fitnessLevel] || '—'}</p>
        </div>
        <div className="rounded-2xl border border-cream-200 bg-white p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cream-800/50">
            <Target className="h-3.5 w-3.5 text-brand-500" /> Hedefler
          </p>
          <Chips values={member.goals} map={GOAL_LABELS} tone="brand" />
        </div>
        <div className="rounded-2xl border border-cream-200 bg-white p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-cream-800/50">
            <Salad className="h-3.5 w-3.5 text-sage-500" /> Beslenme
          </p>
          <Chips values={member.nutritionPrefs} map={NUTRITION_LABELS} tone="sage" />
        </div>
      </div>

      {showHealthAnalysis && <AnalysisSummary analysis={member.healthAnalysis} />}

      {showStaffBrief && (
        <StaffHealthBrief
          analysis={member.healthAnalysis}
          stale={analysisStale}
          showBrief={memberPaid}
          briefKeys={briefKeys}
          onRerun={memberPaid ? onRerunAnalysis : null}
          rerunning={analysisRerunning}
          rerunError={analysisRerunError}
        />
      )}

      <HealthLabFilesPanel
        memberId={member.id}
        files={collectHealthLabFiles(member.healthTest, member.id)}
      />

      <div className="space-y-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-cream-900">
          <HeartPulse className="h-4 w-4 text-amber-600" />
          Sağlık Analizi Cevapları
        </p>

        {sections.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-cream-200 py-10 text-center text-sm text-cream-800/45">
            Henüz cevaplanmış soru yok.
          </p>
        ) : (
          sections.map((sec) => {
            const aud = HEALTH_AUDIENCE_META[sec.audience] || HEALTH_AUDIENCE_META.shared
            return (
              <section key={sec.id} className={`overflow-hidden rounded-2xl border shadow-sm ${aud.border}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 bg-white/70 px-4 py-3">
                  <h3 className="font-display text-base font-bold text-cream-900">{sec.title}</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${aud.chip}`}>
                    {aud.label}
                  </span>
                </div>
                <div className="grid gap-3 bg-white/50 p-4 sm:grid-cols-2">
                  {sec.items.map((it, i) => (
                    <AnswerCard key={`${sec.id}-${i}`} label={it.label} value={it.value} audience={sec.audience} />
                  ))}
                </div>
              </section>
            )
          })
        )}
      </div>

      {(member.healthAck || member.disclaimer) && (
        <div className="rounded-2xl border border-sage-100 bg-sage-50/40 px-4 py-3 text-xs text-sage-900/80">
          {member.healthAck && <p>✓ Sağlık bilgisi doğruluğu onayı</p>}
          {member.disclaimer && <p>✓ Tıbbi feragat onayı</p>}
        </div>
      )}

      <HealthStaffNotesPanel
        notes={member.healthStaffNotes}
        canWrite={canWriteNotes}
        author={noteAuthor}
        onSave={(nextNotes) => onSaveNotes?.(nextNotes)}
        saving={notesSaving}
      />
    </div>
  )
}
