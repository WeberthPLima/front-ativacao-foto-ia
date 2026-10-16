import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useFlow } from '@/context/FlowContext'
import { queenAssets, queenFallbackPortrait } from '@/rainha-de-copas-assets/assets'

export function StylesPage() {
  const navigate = useNavigate()
  const { styles, stylesLoading, stylesError, selectStyle, selectedStyleId } = useFlow()
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSelectStyle = async (styleId: string) => {
    setSubmittingId(styleId)
    setError(null)

    try {
      await selectStyle(styleId)
      navigate('/camera')
    } catch (currentError) {
      setError(
        currentError instanceof Error
          ? currentError.message
          : 'Não foi possível registrar o estilo selecionado.',
      )

    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <>
      <div className="screen-body styles-screen-body" style={{ maxHeight: '80vh' }}>

        {stylesError ? (
          <div className="mt-4 rounded-[16px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {stylesError}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-[16px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {stylesLoading && styles.length === 0 ? (
          <div className="styles-grid mt-3 grid grid-cols-2 gap-2.5">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="mini-style-card flex min-h-0 flex-col animate-pulse">
                <div className="min-h-[60px] flex-1 rounded-[10px] bg-white/10" />
                <div className="mt-2 h-3 rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        ) : (
          <div className="styles-grid mt-3 grid grid-cols-2 gap-2.5">
            {styles.map((style) => {
              const isSelected = style.id === selectedStyleId
              const isSubmitting = style.id === submittingId

              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => void handleSelectStyle(style.id)}
                  disabled={Boolean(submittingId)}
                  className={`mini-style-card flex min-h-0 flex-col p-1.5 ${isSelected ? 'is-active' : ''} disabled:cursor-not-allowed disabled:opacity-80`}
                >
                  <div className="min-h-0 flex-1 overflow-hidden rounded-[10px] border border-[#f4d06f]/20">
                    <img
                      src={queenAssets.retratos[style.id as keyof typeof queenAssets.retratos] ?? queenFallbackPortrait}
                      alt={`Prévia do estilo ${style.name}`}
                      className="h-full min-h-[60px] w-full object-cover"
                    />
                  </div>
                  <p className="mt-1.5 rounded-[8px] bg-black/55 px-2 py-1 text-center text-[50px] font-semibold text-white">
                    {style.name}
                  </p>
                  {isSubmitting ? (
                    <p className="mt-1 text-center text-[60px] text-[#f7e8bc]/85">Salvando...</p>
                  ) : null}
                </button>
              )
            })}
          </div>
        )}
      </div>
      <button type="button" onClick={() => navigate('/')} className="secondary-button">
        Voltar
      </button>
      {/* <button
          type="button"
          onClick={() => navigate('/camera')}
          disabled={!selectedStyleId || Boolean(submittingId)}
          className="primary-button disabled:cursor-not-allowed disabled:opacity-60"
        >
          ♥ Continuar
        </button> */}
    </>
  )
}
