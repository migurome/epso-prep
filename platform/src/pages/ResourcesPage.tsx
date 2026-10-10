import { ExternalLink } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { useCompetition } from '../lib/studyStore'
import { COMPETITIONS } from '../data/competition'
import { REFERENCE_LINKS } from '../data/content'
import { useLocaleStore, pick } from '../lib/localeStore'
import { useT } from '../lib/useT'

function groupByCategory<T extends { category: string }>(items: T[]) {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const list = groups.get(item.category) ?? []
    list.push(item)
    groups.set(item.category, list)
  }
  return groups
}

export function ResourcesPage() {
  const t = useT()
  const locale = useLocaleStore((s) => s.locale)
  const competition = useCompetition()
  // Sin filtrar por convocatoria. Antes se escondían los enlaces de la otra
  // —once de treinta y tres—, y había que cambiar de convocatoria entera para
  // llegar a ellos. Pero las pruebas de razonamiento y la redacción son las
  // mismas en las dos, así que casi todo ese material sirve igual; lo poco que
  // es específico se marca con su convocatoria y el candidato decide.
  const grouped = groupByCategory(REFERENCE_LINKS)

  return (
    <div>
      <PageHeader eyebrow={t('resources_eyebrow')} title={t('resources_title')} description={t('resources_description')} />

      <div className="mb-8 rounded-xl border border-line bg-raised p-5">
        <h3 className="text-sm font-semibold text-ink">
          {competition.id} — {pick(locale, competition.title)}
        </h3>
        <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-muted">{t('total_posts')}</dt>
            <dd className="font-medium text-ink-soft">{competition.postsTotal}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">{t('fields_label')}</dt>
            <dd className="font-medium text-ink-soft">
              {competition.fields.map((f) => `${pick(locale, f.label)} (${f.posts})`).join(' · ')}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">{t('application_window')}</dt>
            <dd className="font-medium text-ink-soft">
              {competition.applicationWindow.open} → {competition.applicationWindow.close}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">{t('language_regime')}</dt>
            <dd className="font-medium text-ink-soft">{pick(locale, competition.languageRule)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-ink-muted">
          {t('resources_verified_note', { notice: competition.id })}{' '}
          <code className="rounded bg-sunken px-1 py-0.5">
            Docs/0.- Selection procedure overview.md
          </code>
          .
        </p>
      </div>

      <div className="space-y-8">
        {[...grouped.entries()].map(([category, links]) => (
          <div key={category}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {category}
            </h3>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-start gap-2 rounded-lg border border-line bg-raised px-4 py-3 text-sm transition-colors hover:border-accent"
                  >
                    <ExternalLink
                      size={15}
                      className="mt-0.5 shrink-0 text-ink-muted group-hover:text-accent"
                    />
                    <span>
                      <span className="font-medium text-ink">{link.title}</span>
                      {link.competition && (
                        <span className="ml-2 rounded bg-sunken px-1.5 py-0.5 align-middle text-[11px] font-semibold tabular-nums text-ink-muted">
                          {COMPETITIONS[link.competition].grade}
                        </span>
                      )}
                      {link.notes && (
                        <span className="mt-0.5 block text-xs text-ink-muted">
                          {link.notes}
                        </span>
                      )}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
