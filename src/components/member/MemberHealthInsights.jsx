import { Activity, HeartPulse, MapPin, Salad, Sparkles, Target, Flame, TrendingUp } from 'lucide-react'
import { describeHealthTest, HEALTH_AUDIENCE_META } from '../../data/healthTest'
import { GOAL_LABELS, FITNESS_LABELS, NUTRITION_LABELS } from '../../services/health'
import StaffHealthBrief from '../staff/StaffHealthBrief'

function Chips({ values, map }) {
  if (!values?.length) return <span className="text-sm text-cream-800/40">—</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v) => (
        <span key={v} className="rounded-full bg-cream-100 px-2.5 py-1 text-xs font-medium text-cream-800">
          {map[v] || v}
        </span>
      ))}
    </div>
  )
}

export function AnalysisBlock({ analysis }) {
  if (!analysis) return null
  const cal = analysis.dailyCalories
  const scores = analysis.scores || {}
  const overall = analysis.overallScore ?? analysis.radarScores?.overall ?? analysis.fitnessScore
  const dims = [
    ['general', 'Genel'],
    ['nutrition', 'Beslenme'],
    ['movement', 'Hareket'],
    ['sleep', 'Uyku'],
    ['stress', 'Stres'],
    ['lifestyle', 'Yaşam tarzı'],
    ['motivation', 'Motivasyon'],
    ['readiness', 'Hazır oluş'],
  ]
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-cream-900">
        <Sparkles className="h-4 w-4 text-brand-500" /> YeniForm Sağlık Skoru
        {analysis.generatedAt && (
          <span className="text-xs font-normal text-cream-800/50">· {analysis.generatedAt}</span>
        )}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {analysis.bmi != null && (
          <div className="rounded-xl bg-white/80 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-cream-800/50">VKİ</p>
            <p className="text-sm font-semibold text-cream-900">
              {analysis.bmi}
              {analysis.bmiCategory?.label ? ` · ${analysis.bmiCategory.label}` : ''}
            </p>
          </div>
        )}
        {overall != null && (
          <div className="rounded-xl bg-white/80 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-cream-800/50">Genel Skor</p>
            <p className="text-sm font-semibold text-cream-900">{overall}/100</p>
          </div>
        )}
        {cal?.recommended != null && (
          <div className="rounded-xl bg-white/80 px-3 py-2 sm:col-span-2">
            <p className="text-[10px] uppercase tracking-wide text-cream-800/50">Önerilen Günlük Kalori</p>
            <p className="text-sm font-semibold text-cream-900">
              {cal.recommended} kcal
              {cal.goal ? ` · ${cal.goal}` : ''}
            </p>
          </div>
        )}
      </div>
      {analysis.summary && (
        <p className="mt-3 text-xs leading-relaxed text-cream-800/75">{analysis.summary}</p>
      )}
      {Object.keys(scores).length > 0 && (
        <div className="mt-3 grid gap-1.5 border-t border-brand-100/80 pt-3 sm:grid-cols-2">
          {dims.map(([key, label]) => (
            scores[key] != null ? (
              <div key={key} className="flex justify-between rounded-lg bg-white/70 px-2.5 py-1.5 text-xs">
                <span className="text-cream-800/55">{label}</span>
                <span className="font-semibold text-cream-900">{scores[key]}</span>
              </div>
            ) : null
          ))}
        </div>
      )}
      {analysis.coachRecommendations?.message && (
        <p className="mt-3 text-xs leading-relaxed text-cream-800/75">
          <span className="font-semibold text-cream-900">Antrenman: </span>
          {analysis.coachRecommendations.message}
        </p>
      )}
      {analysis.dietitianRecommendations?.tips?.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-brand-100/80 pt-3">
          {analysis.dietitianRecommendations.tips.slice(0, 4).map((tip, i) => (
            <li key={i} className="text-xs text-cream-800/70">• {tip}</li>
          ))}
        </ul>
      )}
      {analysis.healthTestInsights?.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-brand-100/80 pt-3">
          {analysis.healthTestInsights.map((tip, i) => (
            <li key={i} className="text-xs text-cream-800/70">• {tip}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function MemberHealthInsights({
  member,
  showLocation = true,
  compact = false,
  showHealthAnalysis = false,
  showStaffBrief = false,
}) {
  if (!member) return null
  const sections = describeHealthTest(member.healthTest, member.gender, member.packageConfig)

  return (
    <div className="space-y-4">
      {showLocation && (member.city || member.district) && (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-cream-800/80">
            <MapPin className="h-4 w-4 text-brand-500" /> Konum
          </p>
          <p className="text-sm text-cream-900">
            {[member.city, member.district].filter(Boolean).join(' / ')}
          </p>
        </div>
      )}

      {!compact && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-cream-800/80">
              <Activity className="h-4 w-4 text-brand-500" /> Spor Seviyesi
            </p>
            <p className="text-sm text-cream-900">{FITNESS_LABELS[member.fitnessLevel] || '—'}</p>
          </div>
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-cream-800/80">
              <Target className="h-4 w-4 text-brand-500" /> Hedefler
            </p>
            <Chips values={member.goals} map={GOAL_LABELS} />
          </div>
          <div className="sm:col-span-2">
            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-cream-800/80">
              <Salad className="h-4 w-4 text-sage-500" /> Beslenme Tercihleri
            </p>
            <Chips values={member.nutritionPrefs} map={NUTRITION_LABELS} />
          </div>
        </div>
      )}

      {showHealthAnalysis && <AnalysisBlock analysis={member.healthAnalysis} />}

      {showStaffBrief && (
        <StaffHealthBrief
          analysis={member.healthAnalysis}
          history={member.healthScoreHistory}
        />
      )}

      {member.progress?.weight?.length > 1 && (
        <div className="rounded-2xl border border-cream-100 bg-cream-50/80 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-cream-900">
            <TrendingUp className="h-4 w-4 text-brand-500" /> Kilo Takibi
          </p>
          <div className="flex flex-wrap gap-2">
            {member.progress.weight.slice(-6).map((w) => (
              <span key={`${w.date}-${w.value}`} className="rounded-lg bg-white px-2.5 py-1 text-xs text-cream-800">
                {w.date}: <strong>{w.value} kg</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {member.calorieHistory?.length > 0 && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-cream-900">
            <Flame className="h-4 w-4 text-amber-600" /> Son Kalori Kayıtları
          </p>
          <ul className="space-y-2">
            {member.calorieHistory.slice(0, 5).map((log) => (
              <li key={log.id} className="rounded-xl bg-white/80 px-3 py-2 text-xs text-cream-800">
                <span className="font-semibold text-cream-900">{log.totalCal || 0} kcal</span>
                {' · '}
                {log.mode === 'photo' ? 'Fotoğraf' : 'Metin'}
                {log.input ? ` · ${log.input.slice(0, 60)}` : ''}
                <span className="block text-[10px] text-cream-800/45">{log.createdAt?.slice(0, 16).replace('T', ' ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sections.length > 0 && (
        <div className="space-y-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-cream-900">
            <HeartPulse className="h-4 w-4 text-amber-600" /> Sağlık Profili
          </p>
          {sections.map((sec) => {
            const aud = HEALTH_AUDIENCE_META[sec.audience] || HEALTH_AUDIENCE_META.shared
            return (
              <div key={sec.id} className={`rounded-2xl border p-4 ${aud.border}`}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cream-900">{sec.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${aud.chip}`}>
                    {aud.label}
                  </span>
                </div>
                <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                  {sec.items.map((it, i) => (
                    <div key={i} className="flex justify-between gap-3 py-1 text-sm">
                      <span className="text-cream-800/55">{it.label}</span>
                      <span className="text-right font-medium text-cream-900">{it.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
