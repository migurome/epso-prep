import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useT } from '../lib/useT'

interface PhaseCardProps {
  to: string
  order?: number
  title: string
  description: string
  meta?: string
  icon?: ReactNode
}

export function PhaseCard({ to, order, title, description, meta, icon }: PhaseCardProps) {
  const t = useT()
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-xl border border-line bg-raised p-5 transition-all hover:border-accent hover:shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {icon && <div className="text-accent">{icon}</div>}
          {order && (
            <span className="text-xs font-semibold text-ink-muted">
              {t('phase_n', { n: order })}
            </span>
          )}
        </div>
        <ArrowRight
          size={16}
          className="text-ink-muted transition-transform group-hover:translate-x-1 group-hover:text-accent"
        />
      </div>
      <h3 className="mt-3 text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 flex-1 text-sm text-ink-muted">{description}</p>
      {meta && (
        <p className="mt-3 text-xs font-medium text-ink-muted">{meta}</p>
      )}
    </Link>
  )
}
