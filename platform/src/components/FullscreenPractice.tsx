import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { KindTabs } from './KindTabs'
import { QuestionCard } from './QuestionCard'
import { TestLocaleSelector } from './TestLocaleSelector'
import { useT } from '../lib/useT'
import type { Question } from '../types/content'
import { SOURCE_LABEL_KEY, defaultSource, sourceOf, sourcesIn, type QuestionSource } from '../lib/questionSource'
import { showsInKind, type KindCatalogue } from '../lib/questionKind'

interface FullscreenPracticeProps {
  questions: Question[]
  /** Catálogo de tipos de ejercicio, para las pestañas. En abstracto son las
   * familias del motor —serie, rejilla 3×3, la que sobra— más los atributos
   * que avanzan en las series del libro. */
  kinds?: KindCatalogue
}

// Vista de práctica "una pregunta a pantalla completa": una sola pregunta
// grande y centrada por vez, con navegación anterior/siguiente, en vez del
// acordeón de PracticeBank. Pensada para razonamiento abstracto, donde el
// contenido (figuras/símbolos) se beneficia de más tamaño y foco visual.
export function FullscreenPractice({ questions, kinds }: FullscreenPracticeProps) {
  const t = useT()
  const sources = useMemo(() => sourcesIn(questions), [questions])

  const [sourceFilter, setSourceFilter] = useState<QuestionSource | 'all'>(defaultSource(sources))
  const [kindFilter, setKindFilter] = useState<string>('all')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const filtered = useMemo(
    () =>
      questions.filter(
        (q) =>
          (sourceFilter === 'all' || sourceOf(q.tags) === sourceFilter) &&
          showsInKind(kindFilter, q.tags),
      ),
    [questions, sourceFilter, kindFilter],
  )

  const safeIndex = Math.min(index, Math.max(0, filtered.length - 1))
  const current = filtered[safeIndex]

  function changeFilter(next: QuestionSource | 'all') {
    setSourceFilter(next)
    setIndex(0)
  }


  // Cambiar de pestaña vuelve a la primera pregunta: quedarse en la número
  // catorce de una familia que ahora tiene seis deja la pantalla en blanco.
  function changeKind(next: string) {
    setKindFilter(next)
    setIndex(0)
  }

  // Sin banco no se pinta nada: ni selector, ni pestañas, ni marco vacío. Es
  // distinto de «los filtros no dejan pasar ninguna», que sí se explica abajo:
  // aquí no hay nada que filtrar y la pantalla no tiene por qué fingir que sí.
  if (questions.length === 0) return null

  return (
    <div>
      <TestLocaleSelector />
      <div className="mx-auto mb-4 max-w-3xl">
        <KindTabs
          questions={questions}
          catalogue={kinds}
          value={kindFilter}
          onChange={changeKind}
        />
      </div>
      {!current && (
        /* Cruzar una pestaña con el filtro de procedencia puede dejar cero
           preguntas. Devolver null aquí —que es lo que hacía— borraba también
           las pestañas y dejaba la pantalla en blanco sin forma de volver. */
        <p className="mx-auto mb-4 max-w-md rounded-lg border border-dashed border-line bg-raised p-4 text-center text-sm text-ink-muted">
          {t('practice_kind_empty')}
        </p>
      )}
      {sources.length >= 2 && (
        <div className="mx-auto mb-4 flex max-w-md gap-1 rounded-lg bg-sunken p-1 text-xs sm:text-sm">
          {[
            ...sources.map((source) => [source, t(SOURCE_LABEL_KEY[source])] as const),
            ['all', t('filter_all')] as const,
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => changeFilter(value)}
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

      {current && (
        <>
        <p className="mb-3 text-center text-sm font-medium text-ink-muted">
          {t('question_x_of_y', { x: safeIndex + 1, y: filtered.length })}
        </p>

        <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-raised p-4 shadow-sm sm:p-8 md:p-10">
          <QuestionCard
            question={current}
            selectedOptionId={answers[current.id] ?? null}
            revealed={Boolean(answers[current.id])}
            onSelect={(optionId) => setAnswers((prev) => ({ ...prev, [current.id]: optionId }))}
            size="large"
          />
        </div>

        <div className="mx-auto mt-6 flex max-w-2xl items-center justify-between">
          <button
            type="button"
            disabled={safeIndex === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="inline-flex items-center gap-1 rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-soft disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            {t('previous')}
          </button>
          <button
            type="button"
            disabled={safeIndex === filtered.length - 1}
            onClick={() => setIndex((i) => Math.min(filtered.length - 1, i + 1))}
            className="inline-flex items-center gap-1 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-on-accent disabled:opacity-40"
          >
            {t('next')}
            <ChevronRight size={16} />
          </button>
        </div>
        </>
      )}
    </div>
  )
}
