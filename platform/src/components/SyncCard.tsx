import { RefreshCw } from 'lucide-react'
import clsx from 'clsx'
import { useSyncStore, type SyncStatus } from '../lib/syncStore'
import { runSync } from '../lib/syncEngine'
import { useLocaleStore } from '../lib/localeStore'
import { useT } from '../lib/useT'
import type { DictKey } from '../lib/dictionary'

// La sincronización automática, vista desde Ajustes.
//
// Ya no tiene formulario ninguno. Antes había que entrar en la cuenta aquí,
// desde dentro de la web; ahora entrar en la web **es** entrar en la cuenta, y
// esta tarjeta se queda con lo único que sigue siendo una decisión: mirar cómo
// va, forzar una pasada y apagar el guardado automático.
//
// El límite que no se esconde, porque si no el candidato creerá que la web se
// ha roto: el guardado automático sólo corre con la pestaña abierta.

const STATUS_TEXT: Record<SyncStatus, DictKey> = {
  off: 'sync_status_off',
  idle: 'sync_status_idle',
  syncing: 'sync_status_syncing',
  ready: 'sync_status_ready',
  error: 'sync_status_error',
}

const STATUS_DOT: Record<SyncStatus, string> = {
  off: 'bg-line-strong',
  idle: 'bg-warn',
  syncing: 'bg-good',
  ready: 'bg-good',
  error: 'bg-bad',
}

export function SyncCard() {
  const t = useT()
  const locale = useLocaleStore((s) => s.locale)
  const auto = useSyncStore((s) => s.auto)
  const status = useSyncStore((s) => s.status)
  const error = useSyncStore((s) => s.error)
  const lastSyncAt = useSyncStore((s) => s.lastSyncAt)
  const setAuto = useSyncStore((s) => s.setAuto)

  const busy = status === 'syncing'

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={clsx('inline-block h-2.5 w-2.5 shrink-0 rounded-full', STATUS_DOT[status])}
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-ink">{t(STATUS_TEXT[status])}</span>
        <span className="text-xs text-ink-muted">
          {lastSyncAt
            ? t('sync_last', {
                when: new Date(lastSyncAt).toLocaleString(locale === 'es' ? 'es-ES' : 'en-GB'),
              })
            : t('sync_never')}
        </span>
      </div>

      {error && <p className="mt-2 text-xs text-bad">{error}</p>}

      {status === 'off' ? (
        <p className="mt-4 text-xs text-ink-muted">{t('sync_off_hint')}</p>
      ) : (
        <>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => void runSync()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
            >
              <RefreshCw size={15} className={busy ? 'animate-spin' : undefined} />
              {t('sync_now')}
            </button>
          </div>

          <label className="mt-4 flex items-start gap-3">
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-line text-accent"
            />
            <span>
              <span className="block text-sm text-ink-soft">{t('sync_auto')}</span>
              <span className="block text-xs text-ink-muted">{t('sync_auto_hint')}</span>
            </span>
          </label>

          <p className="mt-4 text-xs text-ink-muted">{t('sync_private')}</p>
        </>
      )}
    </div>
  )
}
