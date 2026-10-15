import type { PropsWithChildren, ReactNode } from 'react'
import { queenAssets } from '@/rainha-de-copas-assets/assets'

type TotemShellProps = PropsWithChildren<{
  title: string
  subtitle: string
  eyebrow: string
  aside?: ReactNode
}>

export function TotemShell({
  title,
  subtitle,
  eyebrow,
  children,
}: TotemShellProps) {
  return (
    <div className="kiosk-stage">
      <main className="kiosk-shell" style={{ backgroundImage: `url(${queenAssets.fundo4k})` }}>
        <div className="kiosk-content">
          <header className="queen-brand">
            <p className="screen-step">{eyebrow}</p>
            <img
              src={queenAssets.logoCoroaQ}
              alt="Rainha de Copas"
              className="mx-auto h-auto w-[clamp(28px,3.8vw,64px)] object-contain"
            />
            <p className="queen-brand-title">Rainha de Copas</p>
            <img
              src={queenAssets.divisorDourado}
              alt=""
              aria-hidden="true"
              className="mx-auto mt-2 h-auto w-[clamp(92px,18vw,220px)] object-contain opacity-90"
            />
            <h1 className="screen-title">{title}</h1>
            <p className="screen-subtitle">{subtitle}</p>
          </header>

          <section className="mt-4 flex flex-1 flex-col">{children}</section>
        </div>
      </main>
    </div>
  )
}
