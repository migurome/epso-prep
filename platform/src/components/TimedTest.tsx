import { useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { Play, RotateCcw, Timer as TimerIcon } from 'lucide-react'
import { QuestionCard } from './QuestionCard'
import { TestLocaleSelector } from './TestLocaleSelector'
import { useCountdown } from '../lib/useCountdown'
import { formatClock } from '../lib/time'
import { shuffle } from '../lib/shuffle'
import { useProgressStore } from '../lib/progressStore'
import { useT } from '../lib/useT'
import type { TestFormat } from '../data/competition'
import type { Field, PhaseId, Question, QuestionResult, ReasoningSkill, TestAttempt } from '../types/content'

interface TimedTestProps {
  questions: Question[]
  format: TestFormat
  phase: PhaseId
  skill?: ReasoningSkill
  field?: Field
}

type Stage = 'setup' | 'running' | 'results'

export function TimedTest({ questions, format, phase, skill, field }: TimedTestProps) {
  const t = useT()
  const addTestAttempt = useProgressStore((s) => s.addTestAttempt)

  const [stage, setStage] = useState<Stage>('setup')
  const [testQuestions, setTestQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const finishedRef = useRef(false)

  const totalSeconds = format.minutes * 60
  const remaining = useCountdown(totalSeconds, stage === 'running', () => finish())

  const preferredPool = useMemo(() => {
    const real = questions.filter((q) => q.tags?.includes('real'))
    return real.length >= format.questions ? real : questions
  }, [questions, format.questions])

  function start() {
    const picked = shuffle(preferredPool).slice(0, Math.min(format.questions, preferredPool.length))
    finishedRef.current = false
    setTestQuestions(picked)
    setAnswers({})
    setCurrent(0)
    setStartedAt(new Date().toISOString())
    setStage('running')
  }

  function finish() {
    if (finishedRef.current) return
    finishedRef.current = true

    // Tiempo empleado medido contra el reloj, no como `total - restante`: si
    // el test termina porque se agota el tiempo, `remaining` todavía vale 1 en
    // el render vigente y el intento quedaría guardado con un segundo de menos.
    const startedAtIso = startedAt ?? new Date().toISOString()
    const timeSpent = Math.min(
      totalSeconds,
      Math.max(0, Math.round((Date.now() - new Date(startedAtIso).getTime()) / 1000)),
    )
    setElapsedSeconds(timeSpent)

    const results: QuestionResult[] = testQuestions.map((q) => {
      const selected = answers[q.id] ?? null
      const correctOption = q.options.find((o) => o.isCorrect)
      return {
        questionId: q.id,
        selectedOptionId: selected,
        correct: selected != null && selected === correctOption?.id,
      }
    })

    const attempt: TestAttempt = {
      id: `attempt-${Date.now()}`,
      phase,
      skill,
      field,
      startedAt: startedAtIso,
      finishedAt: new Date().toISOString(),
      results,
      totalQuestions: testQuestions.length,
      timeSpentSeconds: timeSpent,
    }
    addTestAttempt(attempt)
    setStage('results')
  }

  function reset() {
    setStage('setup')
  }

  if (preferredPool.length === 0) {
    return <p className="text-sm text-ink-muted">{t('no_questions_available')}</p>
  }

  if (stage === 'setup') {
    return (
      <div>
        <TestLocaleSelector />
        <div className="rounded-xl border border-line bg-raised p-8 text-center">
          <TimerIcon size={28} className="mx-auto mb-3 text-accent" />
          <h3 className="text-base font-semibold text-ink">{t('timed_test_title')}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
            {t('timed_test_setup_description', {
              n: Math.min(format.questions, preferredPool.length),
              m: format.minutes,
            })}
          </p>
          <button
            type="button"
            onClick={start}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-dark"
          >
            <Play size={16} />
            {t('start_test')}
          </button>
        </div>
      </div>
    )
  }

  if (stage === 'running') {
    const q = testQuestions[current]
    const isLast = current === testQuestions.length - 1
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-ink-muted">
            {t('question_x_of_y', { x: current + 1, y: testQuestions.length })}
          </p>
          <span
            className={clsx(
              'rounded-full px-3 py-1 text-sm font-semibold tabular-nums',
              remaining <= 60 ? 'bg-bad-soft text-bad-ink' : 'bg-sunken text-ink-soft',
            )}
          >
            {formatClock(remaining)}
          </span>
        </div>

        <div className="mb-4 flex gap-1">
          {testQuestions.map((tq, i) => (
            <button
              key={tq.id}
              type="button"
              onClick={() => setCurrent(i)}
              className={clsx(
                'h-1.5 flex-1 rounded-full transition-colors',
                i === current ? 'bg-accent' : answers[tq.id] ? 'bg-accent/40' : 'bg-line',
              )}
            />
          ))}
        </div>

        <div className="rounded-xl border border-line bg-raised p-5">
          <QuestionCard
            question={q}
            selectedOptionId={answers[q.id] ?? null}
            revealed={false}
            onSelect={(optionId) => setAnswers((prev) => ({ ...prev, [q.id]: optionId }))}
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            disabled={current === 0}
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-soft disabled:opacity-40"
          >
            {t('previous')}
          </button>
          {isLast ? (
            <button
              type="button"
              onClick={finish}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-on-accent hover:bg-accent-dark"
            >
              {t('finish_test')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrent((c) => Math.min(testQuestions.length - 1, c + 1))}
              className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-soft"
            >
              {t('next')}
            </button>
          )}
        </div>
      </div>
    )
  }

  // results
  const score = testQuestions.filter((q) => {
    const correctOption = q.options.find((o) => o.isCorrect)
    return answers[q.id] != null && answers[q.id] === correctOption?.id
  }).length
  const scaledScore = testQuestions.length > 0 ? (score / testQuestions.length) * format.maxScore : 0
  const passed = format.passMark != null ? scaledScore >= format.passMark : null

  return (
    <div>
      <div className="mb-6 rounded-xl border border-line bg-raised p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t('result')}</p>
        <p className="mt-1 text-3xl font-bold text-ink">
          {score} / {testQuestions.length}
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          {t('points_and_time', {
            scaled: scaledScore.toFixed(1),
            max: format.maxScore,
            time: formatClock(elapsedSeconds),
          })}
        </p>
        {passed != null && (
          <p className={clsx('mt-2 text-sm font-semibold', passed ? 'text-good' : 'text-bad')}>
            {passed ? t('passed') : t('not_passed')}{' '}
            {t('pass_mark_paren', { min: format.passMark ?? 0, max: format.maxScore })}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mx-auto mt-4 inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-soft hover:border-line"
        >
          <RotateCcw size={14} />
          {t('retry_new_questions')}
        </button>
      </div>

      <div className="space-y-4">
        {testQuestions.map((q, i) => (
          <div key={q.id} className="rounded-xl border border-line bg-raised p-5">
            <QuestionCard question={q} index={i} selectedOptionId={answers[q.id] ?? null} revealed onSelect={() => {}} />
          </div>
        ))}
      </div>
    </div>
  )
}
