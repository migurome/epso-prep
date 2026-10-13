import { useMemo } from 'react'
import clsx from 'clsx'
import { kindTabs, unclassifiedCount, type KindCatalogue } from '../lib/questionKind'
import { pick, useLocaleStore } from '../lib/localeStore'
import { useT } from '../lib/useT'
import type { Question } from '../types/content'

/**
 * Una pestaña por tipo de ejercicio.
 *
 * Saber que 25 preguntas del banco numérico son reglas de tres no sirve de
 * nada si no se pueden hacer esas 25 seguidas: practicar un patrón en fila es
 * lo que hace que luego se reconozca de un vistazo. Esto es lo que convierte
 * la clasificación en algo que se usa.
 *
 * Se comparte entre el banco en acordeón y la práctica a pantalla completa
 * porque es el mismo control haciendo lo mismo; tenerlo dos veces garantizaba
 * que un día dejaran de parecerse.
 */
export function KindTabs({
  questions,
  catalogue,
  value,
  onChange,
}: {
  questions: Question[]
  catalogue: KindCatalogue | undefined
  value: string
  onChange: (kind: string) => void
}) {
  const t = useT()
  const locale = useLocaleStore((s) => s.locale)
  const tabs = useMemo(() => kindTabs(questions, catalogue, locale), [questions, catalogue, locale])
  const sinTipo = useMemo(() => unclassifiedCount(questions), [questions])

  // Con una sola pestaña no hay nada que elegir, y una barra de una pestaña es
  // decorar la pantalla con una mentira. En verbal pasa justamente eso: todas
  // sus preguntas son el mismo ejercicio.
  if (tabs.length < 2) return null

  return (
    <div>
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        <Tab
          label={t('practice_kind_all')}
          count={questions.length}
          on={value === 'all'}
          onClick={() => onChange('all')}
        />
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            label={pick(locale, tab.label)}
            count={tab.count}
            on={value === tab.id}
            onClick={() => onChange(tab.id)}
          />
        ))}
        {sinTipo > 0 && (
          <Tab
            label={t('practice_kind_none')}
            count={sinTipo}
            on={value === 'none'}
            onClick={() => onChange('none')}
          />
        )}
      </div>
      <p className="mt-2 text-xs text-ink-muted">{t('practice_kind_hint')}</p>
    </div>
  )
}

/**
 * Una pestaña, con cuántas preguntas tiene detrás.
 *
 * La cuenta va siempre, también en la activa: es lo que deja decidir si merece
 * la pena entrar —una familia de dos preguntas no es una sesión de estudio—
 * sin tener que entrar para averiguarlo.
 */
function Tab({
  label,
  count,
  on,
  onClick,
}: {
  label: string
  count: number
  on: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={clsx(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
        on
          ? 'border-accent bg-accent-soft text-accent-ink'
          : 'border-line bg-raised text-ink-soft hover:border-accent hover:text-accent',
      )}
    >
      {label}
      <span className={clsx('tabular-nums', on ? 'text-accent' : 'text-ink-muted')}>{count}</span>
    </button>
  )
}
