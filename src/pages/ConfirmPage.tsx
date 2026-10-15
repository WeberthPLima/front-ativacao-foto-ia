import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { useFlow } from '@/context/FlowContext'
import { queenAssets } from '@/rainha-de-copas-assets/assets'

export function ConfirmPage() {
  const navigate = useNavigate()
  const { clearPhoto, photo, selectedStyleId, styles } = useFlow()

  const styleName = useMemo(
    () => styles.find((style) => style.id === selectedStyleId)?.name ?? 'Estilo escolhido',
    [selectedStyleId, styles],
  )

  useEffect(() => {
    if (!photo) {
      navigate('/camera', { replace: true })
    }
  }, [navigate, photo])

  if (!photo) return null

  return (
    <div className="screen-body">
      <div className="frame-panel rose-glow">
        <div className="portrait-card">
          <div className="queen-reference-photo">
            <div className="queen-reference-photo-inner">
              <div className="photo-window">
                <img src={photo.previewUrl} alt="Foto capturada" className="photo" />
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
      </div>

      <div className="mt-3 flex justify-center">
        <span className="gold-chip">{styleName}</span>
      </div>

      <div className="queen-bottom-actions">
        <button type="button" onClick={() => navigate('/processando')} className="primary-button">
          ♥ Usar esta foto
        </button>
        <button
          type="button"
          onClick={() => {
            clearPhoto()
            navigate('/camera')
          }}
          className="secondary-button"
        >
          ↺ Tirar novamente
        </button>
      </div>
      <button type="button" onClick={() => navigate('/camera')} className="secondary-button">
        Voltar
      </button>
    </div>
  )
}
