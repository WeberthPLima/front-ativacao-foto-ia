import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useFlow } from '@/context/FlowContext'
import { queenAssets, queenFallbackPortrait } from '@/rainha-de-copas-assets/assets'

export function InitialPage() {
  const navigate = useNavigate()
  const { ensureInteraction, ensureStylesLoaded, resetFlow, styles } = useFlow()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStart = async () => {
    setLoading(true)
    setError(null)

    try {
      resetFlow()
      await Promise.all([ensureInteraction(true), ensureStylesLoaded()])
      navigate('/estilos')
    } catch (currentError) {
      setError(
        currentError instanceof Error
          ? currentError.message
          : 'Não foi possível iniciar o atendimento agora.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen-body initial-screen-body">
      <div className="initial-card-slot">
        <div className="queen-reference-photo rotate-[-8deg]">
          <div className="queen-reference-photo-inner">
            <div className="photo-window">
              <img
                src={queenAssets.rainha ?? queenFallbackPortrait}
                alt="Exemplo do estilo realista"
                className="photo"
              />
            </div>
            <img
              src={queenAssets.molduraCarta}
              alt=""
              aria-hidden="true"
              className="frame"
            />
          </div>
        </div>
      </div>

      <div className="queen-bottom-actions">
        <button
          type="button"
          onClick={() => void handleStart()}
          disabled={loading}
          className="primary-button disabled:cursor-not-allowed disabled:opacity-70"
        >
          ♛ {loading ? 'Preparando experiência...' : 'Iniciar'}
        </button>
      </div>
      
      <p className="queen-soft-note">
        {styles.length || 8} estilos disponíveis para transformar sua foto em uma lembrança especial.
      </p>


      {error ? (
        <div className="mt-4 rounded-[16px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
    </div>
  )
}
