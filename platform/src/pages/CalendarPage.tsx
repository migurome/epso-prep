import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Flame, ListChecks, PenLine, Target, Timer } from 'lucide-react'
import clsx from 'clsx'
import { PageHeader } from '../components/PageHeader'
import { heatClass } from '../lib/calendarHeat'
import { useProgressStore } from '../lib/progressStore'
import { usePracticeStore } from '../lib/practiceStore'
import { useStudyStore } from '../lib/studyStore'
import { useLocaleStore, pick, type Locale } from '../lib/localeStore'
import { useT } from '../lib/useT'
import {
  buildMonth,
  completedWeekStreak,
  currentWeek,
  dayKey,
  formatDuration,
  type CalendarInput,
  type DaySummary,
  type WeekSummary,
} from '../lib/studyCalendar'

function intlLocale(locale: Locale): string {
  return locale === 'es' ? 'es-ES' : 'en-GB'
}

export function CalendarPage() {
  const t = useT()
  const locale = useLocaleStore((s) => s.locale)
  const tests = useProgressStore((s) => s.testAttempts)
  const essays = useProgressStore((s) => s.essayAttempts)
  const answers = usePracticeStore((s) => s.answers)
  // Las respuestas sueltas entran como valores: al calendario le da igual de
  // qué pregunta era cada una, sólo cuándo se contestó.
  const practice = useMemo(() => Object.values(answers), [answers])
  const dayLog = useStudyStore((s) => s.dayLog)
  const weeklyGoalHours = useStudyStore((s) => s.settings.weeklyGoalHours)

  const today = useMemo(() => new Date(), [])
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedKey, setSelectedKey] = useState<string>(() => dayKey(today))

  const input: CalendarInput = useMemo(
    () => ({ tests, essays, practice, dayLog, weeklyGoalHours, now: today }),
    [tests, essays, practice, dayLog, weeklyGoalHours, today],
  )

  const weeks = useMemo(
    () => buildMonth(cursor.getFullYear(), cursor.getMonth(), input),
    [cursor, input],
  )
  const week = useMemo(() => currentWeek(input), [input])
  const streak = useMemo(() => completedWeekStreak(input), [input])

  const selected = useMemo(
    () => weeks.flatMap((w) => w.days).find((d) => d.key === selectedKey) ?? null,
    [weeks, selectedKey],
  )

  const monthLabel = new Intl.DateTimeFormat(intlLocale(locale), {
    month: 'long',
    year: 'numeric',
  }).format(cursor)

  // Cabeceras de columna en el idioma activo, empezando en lunes.
  const weekdayNames = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'short' })
    // 2024-01-01 fue lunes: sirve de semana de referencia para los nombres.
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 1 + i)))
  }, [locale])

  function shiftMonth(months: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + months, 1))
  }

  return (
    <div>
      <PageHeader
        eyebrow={t('calendar_eyebrow')}
        title={t('calendar_title')}
        description={t('calendar_description')}
      />

      <WeekGoalCard week={week} streak={streak} locale={locale} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-xl border border-line bg-raised p-4 sm:p-5">
          <header className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label={t('calendar_previous_month')}
              className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="flex-1 text-center text-sm font-semibold text-ink first-letter:uppercase">
              {monthLabel}
            </h2>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label={t('calendar_next_month')}
              className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
            >
              <ChevronRight size={18} />
            </button>
          </header>

          <div className="mb-1 grid grid-cols-[2.25rem_repeat(7,minmax(0,1fr))] gap-1">
            <span aria-hidden="true" />
            {weekdayNames.map((name) => (
              <span
                key={name}
                className="pb-1 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-ink-muted"
              >
                {name}
              </span>
            ))}
          </div>

          <div className="space-y-1">
            {weeks.map((w) => (
              <div key={w.key} className="grid grid-cols-[2.25rem_repeat(7,minmax(0,1fr))] gap-1">
                <WeekBadge week={w} locale={locale} />
                {w.days.map((day) => (
                  <DayCell
                    key={day.key}
                    day={day}
                    goalHours={weeklyGoalHours}
                    selected={day.key === selectedKey}
                    onSelect={() => setSelectedKey(day.key)}
                  />
                ))}
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-ink-muted">{t('calendar_legend')}</p>
        </section>

        <DayDetail day={selected} locale={locale} />
      </div>
    </div>
  )
}

function WeekGoalCard({
  week,
  streak,
  locale,
}: {
  week: WeekSummary
  streak: number
  locale: Locale
}) {
  const t = useT()
  const percent = Math.round(week.ratio * 100)
  const remaining = Math.max(0, week.goalSeconds - week.seconds)

  return (
    <div
      className={clsx(
        'rounded-xl border p-5',
        week.complete ? 'border-good bg-good-soft' : 'border-line bg-raised',
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Target size={20} className={week.complete ? 'text-good' : 'text-accent'} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">
            {week.complete
              ? t('calendar_week_complete')
              : t('calendar_week_remaining', { time: formatDuration(remaining, locale) })}
          </p>
          <p className="mt-0.5 text-xs text-ink-muted tabular-nums">
            {t('calendar_week_progress', {
              done: formatDuration(week.seconds, locale),
              goal: formatDuration(week.goalSeconds, locale),
              percent,
            })}
          </p>
        </div>
        {streak > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-raised px-3 py-1 text-xs font-semibold text-warn-ink ring-1 ring-warn">
            <Flame size={14} />
            {t('calendar_streak', { n: streak })}
          </span>
        )}
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-line">
        <div
          className={clsx(
            'h-full rounded-full transition-[width] duration-300',
            week.complete ? 'bg-good' : 'bg-accent',
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

/** Marca de la semana a la izquierda de la fila: un anillo que se llena. */
function WeekBadge({ week, locale }: { week: WeekSummary; locale: Locale }) {
  const t = useT()
  const percent = Math.round(week.ratio * 100)
  return (
    <div
      className="flex items-center justify-center"
      title={week.isFuture ? '' : t('calendar_week_progress', {
        done: formatDuration(week.seconds, locale),
        goal: formatDuration(week.goalSeconds, locale),
        percent,
      })}
    >
      <div
        className={clsx(
          'flex h-6 w-6 items-center justify-center rounded-full text-[0.6rem] font-bold',
          week.complete
            ? 'bg-good text-on-accent'
            : percent > 0
              ? 'bg-sunken text-ink-muted ring-1 ring-line'
              : 'text-ink-muted',
        )}
      >
        {week.isFuture ? '' : week.complete ? '✓' : `${percent}`}
      </div>
    </div>
  )
}

function DayCell({
  day,
  goalHours,
  selected,
  onSelect,
}: {
  day: DaySummary
  goalHours: number
  selected: boolean
  onSelect: () => void
}) {
  // La intensidad se mide contra la parte proporcional diaria del objetivo, no
  // contra un valor fijo: si subes el objetivo semanal, un día "lleno" exige
  // más, que es justo lo que se ha pedido al subirlo.
  const dailyTarget = (Math.max(1, goalHours) * 3600) / 7
  const ratio = dailyTarget > 0 ? Math.min(1, day.seconds / dailyTarget) : 0
  const level = day.seconds === 0 ? 0 : ratio >= 1 ? 4 : ratio >= 0.66 ? 3 : ratio >= 0.33 ? 2 : 1

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={day.isToday ? 'date' : undefined}
      aria-pressed={selected}
      className={clsx(
        'relative flex aspect-square min-h-[2.5rem] flex-col items-center justify-center rounded-lg text-xs transition-colors',
        !day.inMonth && 'opacity-35',
        selected
          ? 'ring-2 ring-accent'
          : day.isToday
            ? 'ring-1 ring-accent/50'
            : 'ring-1 ring-transparent',
        // Los cinco pasos viven en lib/calendarHeat.ts: cada uno es el acento a
        // una opacidad, y el contraste de su número hay que comprobarlo contra
        // la MEZCLA, no contra el acento. Ver el comentario de ese fichero.
        heatClass(level),
        day.isFuture && 'bg-transparent text-ink-muted hover:bg-sunken',
      )}
    >
      <span className={clsx('font-semibold tabular-nums', day.isToday && 'underline')}>
        {day.date.getDate()}
      </span>
      {day.events.length > 0 && (
        <span
          aria-hidden="true"
          className={clsx(
            'absolute bottom-1 h-1 w-1 rounded-full',
            level >= 3 ? 'bg-raised' : 'bg-accent',
          )}
        />
      )}
    </button>
  )
}

function DayDetail({ day, locale }: { day: DaySummary | null; locale: Locale }) {
  const t = useT()

  if (!day) {
    return (
      <aside className="rounded-xl border border-line bg-raised p-5">
        <p className="text-sm text-ink-muted">{t('calendar_pick_a_day')}</p>
      </aside>
    )
  }

  const heading = new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(day.date)

  return (
    <aside className="rounded-xl border border-line bg-raised p-5">
      <h3 className="text-sm font-semibold text-ink first-letter:uppercase">{heading}</h3>

      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-muted">{t('calendar_time_total')}</dt>
          <dd className="font-semibold tabular-nums text-ink">
            {formatDuration(day.seconds, locale)}
          </dd>
        </div>
        {day.activeSeconds > 0 && (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-ink-muted">{t('calendar_time_usage')}</dt>
            <dd className="tabular-nums text-ink-soft">
              {formatDuration(day.activeSeconds, locale)}
            </dd>
          </div>
        )}
        {day.eventSeconds > 0 && (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-ink-muted">{t('calendar_time_tests')}</dt>
            <dd className="tabular-nums text-ink-soft">
              {formatDuration(day.eventSeconds, locale)}
            </dd>
          </div>
        )}
      </dl>

      <h4 className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {t('calendar_activity_heading')}
      </h4>

      {day.events.length === 0 ? (
        <p className="text-sm text-ink-muted">
          {day.seconds > 0 ? t('calendar_only_usage') : t('calendar_nothing_that_day')}
        </p>
      ) : (
        <ul className="space-y-3">
          {day.events.map((event) => (
            <li key={event.id} className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-ink-muted">
                {event.kind === 'essay' ? (
                  <PenLine size={15} />
                ) : event.kind === 'practice' ? (
                  <ListChecks size={15} />
                ) : (
                  <Timer size={15} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{pick(locale, event.label)}</p>
                <p className="text-xs text-ink-muted">
                  {pick(locale, event.detail)}
                  {event.score && ` · ${event.score.value}/${event.score.max}`}
                  {/* Las preguntas sueltas no aportan tiempo al día —ocurren
                      dentro del uso ya registrado—, así que no se les pinta un
                      «0 min» que parecería una avería. */}
                  {event.seconds > 0 && ` · ${formatDuration(event.seconds, locale)}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
