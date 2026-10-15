import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import { queenAssets, queenFallbackPortrait } from '@/rainha-de-copas-assets/assets'
import {
  getResultByToken,
  getStatusLabel,
  resolveRenderableUrl,
  type InteractionRecord,
  type ResultMeta,
} from '@/lib/api'

export function PublicMobilePage() {
  const { token } = useParams<{ token: string }>()
  const [interaction, setInteraction] = useState<InteractionRecord | null>(null)
  const [meta, setMeta] = useState<ResultMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Token não informado.')
      setLoading(false)
      return
    }

    let cancelled = false

    const loadResult = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await getResultByToken(token)

        if (cancelled) {
          return
        }

        setInteraction(response.data)
        setMeta(response.meta ?? null)
      } catch (currentError) {
        if (!cancelled) {
          setError(
            currentError instanceof Error
              ? currentError.message
              : 'Não foi possível carregar o resultado público.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadResult()

    return () => {
      cancelled = true
    }
  }, [token])

  const downloadUrl = useMemo(
    () => resolveRenderableUrl(meta?.downloadUrl) ?? resolveRenderableUrl(interaction?.generatedImagePath),
    [interaction?.generatedImagePath, meta?.downloadUrl],
  )

  return (
    <div
      className="kiosk-stage px-3 py-4"
      style={{ backgroundImage: `url(${queenAssets.fundo4k})` }}
    >
      <div className="kiosk-shell max-w-[430px]">
        <div className="kiosk-content">
          <header className="queen-brand">
            <div className="queen-brand-mark">♥ ♛ ♥</div>
            <p className="queen-brand-title">Rainha de Copas</p>
            <div className="ornamental-divider">♥</div>
            <h1 className="screen-title">Sua lembrança já está disponível</h1>
            <p className="screen-subtitle">Baixe e compartilhe sua foto no celular.</p>
          </header>

          <div className="mt-5 frame-panel rose-glow">
            <div className="portrait-card overflow-hidden rounded-[18px] border border-[#f4d06f]/30">
              {downloadUrl ? (
                <img src={downloadUrl} alt="Prévia da mídia pública" className="aspect-[3/4] w-full object-cover" />
              ) : (
                <img
                  src={queenAssets.retratos.realistic ?? queenFallbackPortrait}
                  alt="Prévia da mídia pública"
                  className="aspect-[3/4] w-full object-cover"
                />
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="gold-chip">{getStatusLabel(interaction?.status)}</span>
            <span className="gold-chip">{token?.slice(0, 8) ?? 'token'}</span>
          </div>

          {loading ? (
            <div className="mt-4 rounded-[16px] border border-white/10 bg-white/5 p-4 text-sm text-[#f7e8bc]/82">
              Carregando sua foto...
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-[16px] border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <div className="mt-4 grid gap-3">
            {downloadUrl ? (
              <a href={downloadUrl} target="_blank" rel="noreferrer" className="primary-button">
                ⭳ Baixar foto
              </a>
            ) : (
              <button type="button" disabled className="secondary-button opacity-70">
                Download em preparação
              </button>
            )}

            {meta?.storiesUrl ? (
              <a href={meta.storiesUrl} target="_blank" rel="noreferrer" className="secondary-button">
                Compartilhar
              </a>
            ) : (
              <button type="button" disabled className="secondary-button opacity-70">
                Compartilhar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
