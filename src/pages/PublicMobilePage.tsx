import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import { queenAssets } from '@/rainha-de-copas-assets/assets'
import {
  getResultByToken,
  downloadImage,
  getStatusLabel,
  resolveRenderableUrl,
  type InteractionRecord,
  type ResultMeta,
} from '@/lib/api'

export function PublicMobilePage() {
  const { token } = useParams<{ token: string }>()
  const [interaction, setInteraction] = useState<InteractionRecord | null>(null)
  const [meta, setMeta] = useState<ResultMeta | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Token não informado.')
      setLoading(false)
      return
    }

    let cancelled = false
    let timer: number | undefined
    setInteraction(null)
    setMeta(null)

    const loadResult = async () => {
      setError(null)

      try {
        const response = await getResultByToken(token)

        if (cancelled) {
          return
        }

        setInteraction(response.data)
        setMeta(response.meta ?? null)
        if (!['completed', 'finished', 'failed'].includes(response.data.status)) {
          timer = window.setTimeout(() => void loadResult(), 2000)
        }
        if (response.data.status === 'failed') setError('Não foi possível gerar esta foto.')
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
      window.clearTimeout(timer)
    }
  }, [token])

  const downloadUrl = useMemo(
    () => resolveRenderableUrl(meta?.downloadUrl) ?? resolveRenderableUrl(interaction?.generatedImageUrl),
    [interaction?.generatedImageUrl, meta?.downloadUrl],
  )

  const handleShare = async () => {
    if (!downloadUrl) return
    setSharing(true)
    setError(null)
    try {
      if (navigator.share) {
        const response = await fetch(downloadUrl)
        if (!response.ok) throw new Error('Não foi possível carregar a foto para compartilhar.')
        const blob = await response.blob()
        const extension = blob.type.includes('svg') ? 'svg' : blob.type.includes('jpeg') ? 'jpg' : 'png'
        const file = new File([blob], `rainha-de-copas.${extension}`, { type: blob.type })
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Minha foto — Rainha de Copas' })
        } else {
          await navigator.share({ title: 'Minha foto — Rainha de Copas', url: window.location.href })
        }
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href)
        setFeedback('Link copiado! Cole na conversa em que deseja compartilhar.')
      } else {
        setFeedback(`Copie este link para compartilhar: ${window.location.href}`)
      }
    } catch (cause) {
      if (!(cause instanceof Error && cause.name === 'AbortError')) {
        setError(cause instanceof Error ? cause.message : 'Não foi possível compartilhar.')
      }
    } finally {
      setSharing(false)
    }
  }

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
            <h1 className="screen-title">{downloadUrl ? 'Sua lembrança já está disponível' : 'Sua lembrança'}</h1>
            <p className="screen-subtitle">Baixe e compartilhe sua foto no celular.</p>
          </header>

          <div className="mt-5 frame-panel rose-glow">
            <div className="portrait-card overflow-hidden rounded-[18px] border border-[#f4d06f]/30">
              {downloadUrl ? (
                <img src={downloadUrl} alt="Prévia da mídia pública" className="aspect-[9/16] w-full object-contain" />
              ) : (
                <p className="p-8 text-center">{error ? 'Foto indisponível' : 'Preparando sua foto...'}</p>
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
              <button type="button" onClick={() => void downloadImage(downloadUrl).catch(() => setError('Não foi possível baixar a foto.'))} className="primary-button">
                ⭳ Baixar foto
              </button>
            ) : (
              <button type="button" disabled className="secondary-button opacity-70">
                Download em preparação
              </button>
            )}

            <button type="button" onClick={() => void handleShare()} disabled={!downloadUrl || sharing} className="secondary-button disabled:opacity-70">
              {sharing ? 'Compartilhando...' : 'Compartilhar'}
            </button>
            {feedback ? <p className="break-words text-sm text-[#f7e8bc]">{feedback}</p> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
