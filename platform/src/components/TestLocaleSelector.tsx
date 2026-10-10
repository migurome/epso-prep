import clsx from 'clsx'
import { Languages } from 'lucide-react'
import { useTestLocaleStore } from '../lib/testLocaleStore'
import { useT } from '../lib/useT'

/** Selector del idioma en que se muestran enunciados/opciones/explicaciones
 * de las preguntas — independiente del idioma de la interfaz. Se muestra en
 * las pestañas de banco de práctica y test cronometrado. */
export function TestLocaleSelector() {
  const t = useT()
  const locale = useTestLocaleStore((s) => s.locale)
  const setLocale = useTestLocaleStore((s) => s.setLocale)

  return (
    <div className="mb-4 flex items-center justify-center gap-2 text-sm">
      <Languages size={15} className="text-ink-muted" />
      <span className="text-ink-muted">{t('test_language_label')}</span>
      <div className="flex gap-1 rounded-lg bg-sunken p-1">
        {(['es', 'en'] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            className={clsx(
              'rounded-md px-3 py-1 text-xs font-semibold uppercase transition-colors',
              locale === l ? 'bg-raised text-accent shadow-sm' : 'text-ink-muted hover:text-ink-soft',
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}
