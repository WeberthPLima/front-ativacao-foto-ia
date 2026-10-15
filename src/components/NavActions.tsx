type NavActionsProps = {
  currentStep: number
  totalSteps: number
  onPrev: () => void
  onNext: () => void
}

export function NavActions({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
}: NavActionsProps) {
  const isLastStep = currentStep === totalSteps - 1

  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-between">
      <button
        type="button"
        onClick={onPrev}
        disabled={currentStep === 0}
        className="secondary-button disabled:cursor-not-allowed disabled:opacity-40"
      >
        Voltar etapa
      </button>

      <button type="button" onClick={onNext} className="primary-button">
        {isLastStep ? 'Reiniciar fluxo' : 'Avançar etapa'}
      </button>
    </div>
  )
}
