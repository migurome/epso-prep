import { useMemo, useState } from 'react'
import { Check, ChevronDown, Pause, Play, RotateCcw, TimerReset, X } from 'lucide-react'
import clsx from 'clsx'
import { QuestionCard } from './QuestionCard'
import { PromptWithChart } from './QuestionChart'
import { TestLocaleSelector } from './TestLocaleSelector'
import { extractPromptFigures } from '../lib/abstractFigure'
import { pick, useLocaleStore, type Locale } from '../lib/localeStore'
import { usePracticeStore, type PracticeAnswer, type PracticeBankRef } from '../lib/practiceStore'
import {
  DEFAULT_PACE_SECONDS,
  answeredOn,
  countsFor,
  firstLine,
  formatPace,
  paceFor,
  paceOf,
  showsUnder,
  type PracticeFilter,
} from '../lib/practiceView'
import { shuffleWithSeed } from '../lib/shuffle'
import { useStopwatch } from '../lib/useStopwatch'
import { useTestLocaleStore } from '../lib/testLocaleStore'
import { useT } from '../lib/useT'
import type { DictKey } from '../lib/dictionary'
import type { Question } from '../types/content'
import { SOURCE_LABEL_KEY, defaultSource, sourceOf, sourcesIn, type QuestionSource } from '../lib/questionSource'

interface PracticeBankProps {
  questions: Question[]
  /** Identifica el banco para guardar aparte su orden. Ámbito, destreza o
   * módulo del curso: lo que distinga a este banco de los demás. */
  bankId: string
  /** El formato de la prueba de la que sale este banco, para el ritmo del
   * reloj. Sin él se usa el de referencia: los bancos del curso de fundamentos
   * no cuelgan de ninguna prueba oficial. */
  format?: { questions: number; minutes: number }
}

// El enunciado de la cabecera. Va entero: cortarlo a mitad de frase obligaba a
// abrir la pregunta sólo para saber cuál era, y dejaba la lista llena de
// oraciones truncadas.
//
// La excepción es el razonamiento abstracto, donde el enunciado no es texto
// sino la secuencia de figuras: ahí la cabecera lleva la prosa que describe la
// regla —lo que identifica la pregunta— y las figuras se quedan en la tarjeta,
// que es donde se pueden dibujar.
function headerPrompt(question: Question, prompt: string): string {
  if (question.skill !== 'abstract') return prompt
  const prose = extractPromptFigures(prompt)?.remainderMd?.trim()
  return prose ? prose : prompt
}

// null mientras no se ha respondido; después, si la opción elegida era la buena.
function verdictOf(question: Question, optionId: string | undefined): boolean | null {
  if (optionId == null) return null
  return question.options.find((o) => o.id === optionId)?.isCorrect === true
}

const FILTERS: { value: PracticeFilter; key: DictKey }[] = [
  { value: 'all', key: 'practice_filter_all' },
  { value: 'pending', key: 'practice_filter_pending' },
  { value: 'answered', key: 'practice_filter_answered' },
]

export function PracticeBank({ questions, bankId, format }: PracticeBankProps) {
  const t = useT()
  const testLocale = useTestLocaleStore((s) => s.locale)
  const paceSeconds = format ? paceFor(format) : DEFAULT_PACE_SECONDS

  // Las respuestas se guardan en el navegador. Antes vivían en el estado del
  // componente: bastaba recargar para que todo volviera a aparecer sin marcar
  // y no hubiera forma de saber qué se había trabajado ya.
  const answers = usePracticeStore((s) => s.answers)
  const recordAnswer = usePracticeStore((s) => s.answer)
  const reactivate = usePracticeStore((s) => s.reactivate)
  const reactivateAll = usePracticeStore((s) => s.reactivateAll)
  const seed = usePracticeStore((s) => s.orderSeed[bankId] ?? 0)

  const sources = useMemo(() => sourcesIn(questions), [questions])

  const [sourceFilter, setSourceFilter] = useState<QuestionSource | 'all'>(defaultSource(sources))
  const [stateFilter, setStateFilter] = useState<PracticeFilter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const bank: PracticeBankRef = useMemo(
    () => ({ id: bankId, questionIds: questions.map((q) => q.id) }),
    [bankId, questions],
  )

  const ordered = useMemo(() => shuffleWithSeed(questions, seed), [questions, seed])

  const filtered = useMemo(
    () =>
      ordered.filter(
        (q) =>
          (sourceFilter === 'all' || sourceOf(q.tags) === sourceFilter) &&
          showsUnder(stateFilter, answers[q.id], q.id === expandedId),
      ),
    [ordered, sourceFilter, stateFilter, answers, expandedId],
  )

  const counts = useMemo(() => countsFor(bank.questionIds, answers), [bank.questionIds, answers])

  return (
    <div>
      <TestLocaleSelector />
      {sources.length >= 2 && (
        <div className="mb-3 flex gap-1 rounded-lg bg-sunken p-1 text-xs sm:text-sm">
          {[
            ...sources.map((source) => [source, t(SOURCE_LABEL_KEY[source])] as const),
            ['all', t('filter_all')] as const,
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSourceFilter(value)}
              className={clsx(
                'flex-1 rounded-md px-2 py-1.5 font-medium transition-colors sm:px-3',
                sourceFilter === value ? 'bg-raised text-accent shadow-sm' : 'text-ink-muted hover:text-ink-soft',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* El filtro por estado va aparte del de procedencia y no fundido con él:
          son dos preguntas distintas —de dónde sale y si ya la he trabajado— y
          un solo grupo de pestañas obligaría a elegir una de las dos. */}
      <div className="mb-4 flex gap-1 rounded-lg bg-sunken p-1 text-xs sm:text-sm">
        {FILTERS.map(({ value, key }) => (
          <button
            key={value}
            type="button"
            onClick={() => setStateFilter(value)}
            className={clsx(
              'flex-1 rounded-md px-2 py-1.5 font-medium tabular-nums transition-colors sm:px-3',
              stateFilter === value ? 'bg-raised text-accent shadow-sm' : 'text-ink-muted hover:text-ink-soft',
            )}
          >
            {t(key)}{' '}
            <span className="text-ink-muted">
              {value === 'all' ? counts.total : value === 'answered' ? counts.answered : counts.pending}
            </span>
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="text-xs text-ink-muted">{t('n_questions', { n: filtered.length })}</p>
        {counts.answered > 0 && (
          <>
            <p className="text-xs text-ink-muted tabular-nums">
              {t('practice_answered', { done: counts.answered, total: counts.total })}
            </p>
            <button
              type="button"
              onClick={() => reactivateAll(bank)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-raised px-2.5 py-1 text-xs font-medium text-ink-soft transition-colors hover:bg-sunken"
            >
              <RotateCcw size={13} />
              {t('practice_reactivate_all')}
            </button>
          </>
        )}
        {counts.answered === 0 && seed !== 0 && (
          <p className="text-xs text-ink-muted">{t('practice_reshuffled')}</p>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-muted">
          {t('practice_none_under_filter')}
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((q, i) => (
            <PracticeRow
              key={q.id}
              question={q}
              index={i}
              answer={answers[q.id]}
              isOpen={expandedId === q.id}
              testLocale={testLocale}
              paceSeconds={paceSeconds}
              onToggle={() => setExpandedId(expandedId === q.id ? null : q.id)}
              // Contestar no pliega nada: la explicación aparece ahí y se
              // queda. La pregunta se cierra al abrir la siguiente, que es lo
              // que ya hacía el acordeón, y entonces se resume en una línea.
              onAnswer={(optionId, seconds) => recordAnswer(q.id, optionId, seconds)}
              onReactivate={() => reactivate(q.id, bank)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

interface RowProps {
  question: Question
  index: number
  answer: PracticeAnswer | undefined
  isOpen: boolean
  testLocale: Locale
  /** El ritmo de esta prueba, en segundos por pregunta. */
  paceSeconds: number
  onToggle: () => void
  /** `seconds` va sin definir cuando el reloj no llegó a correr: un cero sería
   * decir que se contestó al instante, que es un dato falso. */
  onAnswer: (optionId: string, seconds: number | undefined) => void
  onReactivate: () => void
}

// Una fila de la lista.
//
// Dos cosas del diseño que no son estéticas:
//
//   · **Sólo la flecha pliega.** Antes la fila entera era un botón, y eso
//     tenía un efecto que no se buscaba: arrastrar el ratón para subrayar una
//     palabra del enunciado terminaba en un clic y cerraba la pregunta. En un
//     texto de razonamiento verbal, señalar con el dedo es parte de leerlo.
//   · **El contador corre por fila.** Cada pregunta monta el suyo, así que
//     pasar de una abierta a la siguiente lo reinicia solo. Con un contador
//     único arriba, abrir la segunda sin contestar la primera heredaba el
//     tiempo de aquélla.
function PracticeRow({
  question,
  index,
  answer,
  isOpen,
  testLocale,
  paceSeconds,
  onToggle,
  onAnswer,
  onReactivate,
}: RowProps) {
  const t = useT()
  const locale = useLocaleStore((s) => s.locale)
  // El reloj lo maneja quien estudia: no arranca solo al abrir la pregunta.
  // Abrir una para ojearla, o volver a leer la explicación de algo ya
  // contestado, no es tiempo de examen, y contarlo inflaba el número hasta
  // dejarlo sin uso.
  const clock = useStopwatch()
  const showClock = isOpen && answer == null

  const compact = answer != null && !isOpen
  const verdict = verdictOf(question, answer?.optionId)
  const when = answeredOn(answer)
  const intl = locale === 'es' ? 'es-ES' : 'en-GB'
  const pace = paceOf(clock.seconds, paceSeconds)

  return (
    <li
      className={clsx(
        'overflow-hidden rounded-xl border bg-raised',
        verdict === true && 'border-good',
        verdict === false && 'border-bad',
        verdict === null && 'border-line',
      )}
    >
      <div className="flex w-full items-start gap-3 px-4 py-3 text-left">
        <span
          className={clsx(
            'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
            verdict === true && 'bg-good-soft text-good-ink',
            verdict === false && 'bg-bad-soft text-bad-ink',
            verdict === null && 'bg-sunken text-ink-muted',
          )}
        >
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          {/* Contestada y plegada, basta una línea: el trabajo está hecho y
              diez renglones de un texto de verbal convierten la lista en un
              muro. Abierta vuelve el enunciado entero, y no es un capricho —en
              todo lo que no es abstracto la tarjeta NO lo repite, así que si
              aquí se recortara, al reabrirla el texto no estaría en ninguna
              parte. */}
          {compact ? (
            <p className="truncate text-sm text-ink-muted">
              {firstLine(pick(testLocale, question.prompt))}
            </p>
          ) : (
            <PromptWithChart className="text-sm">
              {headerPrompt(question, pick(testLocale, question.prompt))}
            </PromptWithChart>
          )}
          {when && (
            <p className="mt-1 text-[11px] text-ink-muted" title={when.toLocaleString(intl)}>
              {t('practice_answered_on', {
                date: when.toLocaleDateString(intl, { day: 'numeric', month: 'short' }),
              })}
            </p>
          )}
        </div>

        {showClock && (
          <div className="mt-0.5 flex shrink-0 items-center gap-1">
            {/* El propio contador es el botón de marcha y parada: es el sitio
                donde ya está mirando quien quiere pararlo, y así no hace falta
                un control aparte que compita con él por el espacio. */}
            <button
              type="button"
              onClick={clock.toggle}
              aria-pressed={clock.running}
              title={t(clock.running ? 'practice_clock_stop' : 'practice_clock_start')}
              className={clsx(
                'flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums transition-colors',
                clock.running ? 'hover:bg-sunken' : 'hover:bg-sunken',
                pace.over ? 'text-bad' : clock.running ? 'text-ink-soft' : 'text-ink-muted',
              )}
            >
              {clock.running ? (
                <Pause size={12} aria-hidden="true" />
              ) : (
                <Play size={12} aria-hidden="true" />
              )}
              {formatPace(clock.seconds, paceSeconds)}
              {/* El nombre accesible del botón sería sólo «1:40» —el texto gana
                  al title—, y eso no dice que pulsarlo arranque o pare nada.
                  Con este añadido oculto se oyen las dos cosas: el tiempo y lo
                  que hace pulsarlo. */}
              <span className="sr-only">
                {t(clock.running ? 'practice_clock_stop' : 'practice_clock_start')}
              </span>
            </button>
            <button
              type="button"
              onClick={clock.reset}
              disabled={clock.seconds === 0 && !clock.running}
              title={t('practice_clock_reset')}
              className={clsx(
                'rounded-md p-1 transition-colors',
                clock.seconds === 0 && !clock.running
                  ? 'cursor-not-allowed text-ink-faint'
                  : 'text-ink-muted hover:bg-sunken hover:text-ink-soft',
              )}
            >
              <TimerReset size={13} aria-hidden="true" />
              <span className="sr-only">{t('practice_clock_reset')}</span>
            </button>
          </div>
        )}

        {verdict === true && (
          <span className="mt-0.5 flex shrink-0 items-center text-good">
            <Check size={16} aria-hidden="true" />
            <span className="sr-only">{t('answered_correct')}</span>
          </span>
        )}
        {verdict === false && (
          <span className="mt-0.5 flex shrink-0 items-center text-bad">
            <X size={16} aria-hidden="true" />
            <span className="sr-only">{t('answered_wrong')}</span>
          </span>
        )}

        {answer != null && (
          <button
            type="button"
            aria-label={t('practice_reactivate_one')}
            title={t('practice_reactivate_one')}
            onClick={onReactivate}
            className="mt-0.5 shrink-0 rounded p-0.5 text-ink-muted transition-colors hover:bg-sunken hover:text-ink-soft"
          >
            <RotateCcw size={14} />
          </button>
        )}

        <button
          type="button"
          aria-expanded={isOpen}
          aria-label={isOpen ? t('practice_collapse') : t('practice_expand')}
          title={isOpen ? t('practice_collapse') : t('practice_expand')}
          onClick={onToggle}
          className="-mt-0.5 shrink-0 rounded p-1.5 text-ink-muted transition-colors hover:bg-sunken hover:text-ink-soft"
        >
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={clsx('transition-transform', isOpen && 'rotate-180')}
          />
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-line-soft px-4 py-4">
          <QuestionCard
            question={question}
            selectedOptionId={answer?.optionId ?? null}
            revealed={answer != null}
            onSelect={(optionId) => onAnswer(optionId, clock.seconds || undefined)}
            hidePrompt={question.skill !== 'abstract'}
          />
        </div>
      )}
    </li>
  )
}
