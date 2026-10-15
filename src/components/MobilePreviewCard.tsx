type MobilePreviewCardProps = {
  title: string
  description: string
}

export function MobilePreviewCard({
  title,
  description,
}: MobilePreviewCardProps) {
  return (
    <div className="mx-auto w-full max-w-xs rounded-[2.5rem] border border-white/15 bg-slate-950 p-3 shadow-soft">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-brand-500/25 via-slate-900 to-slate-950 p-5">
        <div className="mx-auto mb-4 h-1.5 w-20 rounded-full bg-white/10" />
        <div className="space-y-4">
          <div className="rounded-3xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-brand-100/70">
              Página pública
            </p>
            <h3 className="mt-2 text-lg font-bold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
          </div>

          <div className="rounded-3xl bg-white p-4 text-slate-900">
            <p className="text-sm font-semibold">Compartilhe sua foto</p>
            <p className="mt-1 text-sm text-slate-600">
              Link público, otimizado para mobile e com CTA para download.
            </p>
            <button type="button" className="mt-4 w-full rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white">
              Abrir galeria
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
