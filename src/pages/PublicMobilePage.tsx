import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import './PublicMobilePage.css'
import { prepareShareFile, sharePhotoFile } from '@/lib/photoSharing'

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
  const [prepared, setPrepared] = useState<{ url: string; file: File } | null>(null)
  const [preparingShare, setPreparingShare] = useState(false)
  const [sharePreparationError, setSharePreparationError] = useState<string | null>(null)
  const [prepareAttempt, setPrepareAttempt] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.classList.add('public-result-active')
    return () => document.documentElement.classList.remove('public-result-active')
  }, [])

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
    setLoading(true)

    const loadResult = async () => {
      setError(null)

      try {
        const response = await getResultByToken(token)

        if (cancelled) {
          return
        }

        setInteraction(response.data)
        setMeta(response.meta ?? null)
        if (response.data.status !== 'failed') {
          const delay = ['completed', 'finished'].includes(response.data.status) ? 45 * 60 * 1000 : 2000
          timer = window.setTimeout(() => void loadResult(), delay)
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

  const imageUrl = resolveRenderableUrl(meta?.imageUrl ?? interaction?.generatedImageUrl)

  const downloadUrl = useMemo(
    () => resolveRenderableUrl(meta?.downloadUrl) ?? resolveRenderableUrl(interaction?.generatedImageUrl),
    [interaction?.generatedImageUrl, meta?.downloadUrl],
  )

  useEffect(() => {
    setPrepared(null)
    setSharePreparationError(null)
    if (!downloadUrl) {
      setPreparingShare(false)
      return
    }
    const controller = new AbortController()
    setPreparingShare(true)
    void prepareShareFile(downloadUrl, controller.signal)
      .then((file) => { if (!controller.signal.aborted) setPrepared({ url: downloadUrl, file }) })
      .catch((cause) => {
        if (!controller.signal.aborted) setSharePreparationError(cause instanceof Error ? cause.message : 'Falha ao preparar a foto.')
      })
      .finally(() => { if (!controller.signal.aborted) setPreparingShare(false) })
    return () => controller.abort()
  }, [downloadUrl, prepareAttempt])

  const shareFile = prepared?.url === downloadUrl ? prepared.file : null

  const handleShare = async () => {
    if (!shareFile || sharing) return
    setSharing(true)
    setError(null)
    setFeedback(null)
    try {
      const result = await sharePhotoFile(shareFile)
      if (result === 'unsupported') {
        setFeedback(window.isSecureContext
          ? 'Este navegador não oferece compartilhamento de fotos. Tente abrir esta página no navegador do celular ou use Baixar foto.'
          : 'Para compartilhar a foto, abra esta página pelo endereço HTTPS do site.')
      } else if (result === 'cancelled') {
        setFeedback(null)
      }
    } catch {
      setError('Não foi possível abrir o compartilhamento. Use Baixar foto e selecione a imagem no aplicativo.')
    } finally {
      setSharing(false)
    }
  }

  return (
    <main className="public-result" style={{ backgroundImage: `linear-gradient(rgba(24, 2, 6, .84), rgba(24, 2, 6, .96)), url(${queenAssets.fundo4k})` }}>
      <div className="public-result__content">
        <header className="public-result__header">
          <span className="public-result__crown" aria-hidden="true">♥ ♛ ♥</span>
          <p className="public-result__brand">Rainha de Copas</p>
          <h1>{imageUrl ? 'Sua lembrança ficou pronta!' : 'Sua lembrança'}</h1>
          <p>Uma recordação do niver da Dani para guardar e compartilhar.</p>
        </header>

        <figure className="public-result__photo" aria-busy={loading}>
          {imageUrl ? (
            <img src={imageUrl}
              onError={() => setError('Não foi possível carregar a imagem. Recarregue a página para renovar o acesso.')}
              alt="Sua foto com a Dani no tema Rainha de Copas" />
          ) : (
            <div className="public-result__placeholder" role="status">
              {error ? 'Foto indisponível' : 'Preparando sua foto...'}
            </div>
          )}
        </figure>

        {loading ? <p className="public-result__notice" role="status">Carregando sua foto...</p> : null}
        {!loading && interaction && !imageUrl ? (
          <p className="public-result__notice" role="status">{getStatusLabel(interaction.status)}</p>
        ) : null}
        {error ? <p className="public-result__notice public-result__notice--error" role="alert">{error}</p> : null}

        <div className="public-result__actions" aria-label="Salvar e compartilhar sua foto">
          <button type="button" disabled={!downloadUrl}
            onClick={() => downloadUrl && void downloadImage(downloadUrl).catch(() => setError('Não foi possível baixar a foto.'))}
            className="public-result__button public-result__button--primary">
            {downloadUrl ? 'Baixar foto' : 'Foto em preparação'}
          </button>
          <button type="button" onClick={() => void handleShare()} disabled={!shareFile || sharing}
            className="public-result__button">
            {sharing ? 'Compartilhando...' : preparingShare ? 'Preparando foto...' : 'Compartilhar'}
          </button>
        </div>
        {sharePreparationError ? (
          <div className="public-result__notice public-result__notice--error" role="alert">
            <p>{sharePreparationError}</p>
            <button type="button" className="public-result__button" onClick={() => setPrepareAttempt((attempt) => attempt + 1)}>Tentar novamente</button>
          </div>
        ) : null}
        {feedback ? <p className="public-result__notice" role="status">{feedback}</p> : null}
        <footer className="public-result__footer">Niver da DANI, eu fui! ♥</footer>
      </div>
    </main>
  )
}
