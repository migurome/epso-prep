import { use } from 'react'
import { Markdown } from '../components/Markdown'
import { PageHeader } from '../components/PageHeader'
import { loadStrategyContent } from '../data/contentLoader'
import { useLocaleStore, pick } from '../lib/localeStore'
import { useT } from '../lib/useT'

/**
 * La estrategia, leída de los propios bancos.
 *
 * No cuelga de una fase: habla de las cuatro, y su valor está en que las
 * cifras salieron de contar las preguntas que hay en esta plataforma. Por eso
 * no vive dentro de la página de razonamiento ni de la de campo.
 */
export function StrategyPage() {
  const t = useT()
  const locale = useLocaleStore((s) => s.locale)
  const { THEORY_DOCS: theory } = use(loadStrategyContent())
  const doc = theory[0]

  return (
    <div>
      <PageHeader
        eyebrow={t('strategy_eyebrow')}
        title={t('strategy_title')}
        description={t('strategy_description')}
      />
      {doc && (
        <div className="rounded-xl border border-line bg-raised p-6">
          <Markdown>{pick(locale, doc.summaryMd)}</Markdown>
        </div>
      )}
    </div>
  )
}
