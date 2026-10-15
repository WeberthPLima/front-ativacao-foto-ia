type StepSidebarProps = {
  steps: string[]
  currentStep: number
  onSelectStep: (step: number) => void
}

export function StepSidebar({
  steps,
  currentStep,
  onSelectStep,
}: StepSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div>
        <p className="section-title">Fluxo do totem</p>
        <h2 className="mt-3 text-2xl font-bold text-white">Jornada vertical PT-BR</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Base visual para demonstração do fluxo inicial, seleção de estilo, captura,
          processamento, resultado e página pública no celular.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {steps.map((step, index) => {
          const isActive = index === currentStep
          const isPast = index < currentStep

          return (
            <button
              key={step}
              type="button"
              onClick={() => onSelectStep(index)}
              className={`flex items-center gap-4 rounded-2xl border px-4 py-4 text-left transition ${
                isActive
                  ? 'border-brand-500 bg-brand-500/15'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  isActive
                    ? 'bg-brand-500 text-white'
                    : isPast
                      ? 'bg-accent text-ink'
                      : 'bg-white/10 text-slate-200'
                }`}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-white">{step}</span>
                <span className="text-xs text-slate-400">
                  {isActive ? 'Etapa atual' : isPast ? 'Concluída' : 'Disponível'}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-auto rounded-3xl border border-dashed border-white/15 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Viewport</p>
        <p className="mt-2 text-sm text-slate-200">
          Layout pensado para totem vertical com CTA grandes, leitura rápida e alto
          contraste.
        </p>
      </div>
    </div>
  )
}
