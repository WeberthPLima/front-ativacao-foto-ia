import { useEffect, useMemo, useState } from 'react'
import QRCode from 'react-qr-code'
import { useNavigate } from 'react-router-dom'

import { useFlow } from '@/context/FlowContext'
import { queenAssets, queenFallbackPortrait } from '@/rainha-de-copas-assets/assets'
import {
  buildPublicResultUrl,
  finishInteraction,
  downloadImage,
  getStatusLabel,
  getInteractionStatus,
  requestPrint,
  resolveRenderableUrl,
} from '@/lib/api'

export function ResultPage() {
  const navigate = useNavigate()
  const { interaction, resetFlow, setInteraction } = useFlow()
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    if (!interaction) {
      navigate('/', { replace: true })
      return
    }

    if (['completed', 'finished'].includes(interaction.status) && interaction.generatedImageUrl) {
      return
    }

    navigate('/processando', { replace: true })
  }, [interaction, navigate])

  const interactionId = interaction?.id
  useEffect(() => {
    if (!interactionId) return
    let cancelled = false
    const refresh = async () => {
      try {
        const response = await getInteractionStatus(interactionId)
        if (!cancelled) setInteraction(response.data)
      } catch {
        if (!cancelled) setError('Não foi possível atualizar a imagem. Recarregue a página.')
      }
    }
    void refresh()
    const timer = window.setInterval(() => void refresh(), 45 * 60 * 1000)
    return () => { cancelled = true; window.clearInterval(timer) }
  }, [interactionId, setInteraction])

  const publicUrl = useMemo(
    () => buildPublicResultUrl(interaction?.shareToken, interaction?.shareUrl),
    [interaction?.shareToken, interaction?.shareUrl],
  )

  const previewUrl = useMemo(
    () => resolveRenderableUrl(interaction?.generatedImageUrl) ?? null,
    [interaction?.generatedImageUrl],
  )

  const handleDownload = async () => {
    const targetUrl = resolveRenderableUrl(interaction?.imageDownloadUrl ?? interaction?.generatedImageUrl) ?? publicUrl

    if (!targetUrl) {
      return
    }

    try {
      await downloadImage(targetUrl)
      setFeedbackMessage('Arquivo aberto para download no dispositivo.')
      setError(null)
    } catch {
      setError('Não foi possível abrir o download automaticamente.')
    }
  }

  const handlePrint = async () => {
    if (!interaction) {
      return
    }

    setPrinting(true)
    setError(null)
    setFeedbackMessage(null)

    try {
      const response = await requestPrint(interaction.id)
      setFeedbackMessage(
        `Solicitação enviada para ${response.data.destination} com status ${response.data.status}.`,
      )
    } catch (currentError) {
      setError(
        currentError instanceof Error ? currentError.message : 'Falha ao solicitar a impressão.',
      )
    } finally {
      setPrinting(false)
    }
  }

  const handleRetake = () => {
    resetFlow()
    navigate('/estilos')
  }

  const handleFinish = async () => {
    try {
      if (interaction) {
        await finishInteraction(interaction.id)
      }
    } catch {
      // segue encerrando a UI mesmo com falha no backend
    } finally {
      resetFlow()
      navigate('/')
    }
  }

  return (
    <div className="screen-body">
      <div className="mt-1 grid gap-3">
        <div className="frame-panel rose-glow">
          <div className="portrait-card p-0">
            <div className="queen-reference-photo rotate-[-7deg]">
              <div className="queen-reference-photo-inner">
                <div className="photo-window">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Prévia do resultado" className="photo" />
                  ) : (
                    <img
                      src={queenAssets.retratos.realistic ?? queenFallbackPortrait}
                      alt="Prévia do resultado"
                      className="photo"
                    />
                  )}
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
      </div>

      <div className="queen-bottom-actions">
        {/* <button type="button" onClick={() => void handleDownload()} className="primary-button">
          ⭳ Baixar foto
        </button>
        
        <button
          type="button"
          onClick={() => void handlePrint()}
          disabled={printing}
          className="secondary-button disabled:cursor-not-allowed disabled:opacity-70"
        >
          🖨 Imprimir
        </button>
        <button type="button" onClick={handleRetake} className="secondary-button">
          ↺ Recomeçar
        </button>
        <button type="button" onClick={() => void handleFinish()} className="secondary-button">
          Encerrar
        </button> */}
        <button type="button" onClick={() => void handleFinish()} className="primary-button">
          ↺ Recomeçar
        </button>
      </div>

      {/* <div className="mt-3 flex items-center justify-between gap-3">
        <span className="gold-chip">{getStatusLabel(interaction?.status)}</span>
        <span className="gold-chip">{interaction?.shareToken?.slice(0, 8) ?? 'sem token'}</span>
      </div> */}

      {feedbackMessage ? (
        <div className="mt-4 rounded-[16px] border border-[#f4d06f]/25 bg-white/5 px-4 py-3 text-sm text-[#f6dfa1]">
          {feedbackMessage}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-[16px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="screen-card scanear-card flex flex-col items-center justify-center bg-white p-2">
        {publicUrl && previewUrl ? <QRCode value={publicUrl} size={94} className="h-auto w-full" /> : null}
        <p className="mt-2 text-center text-[50px] font-semibold text-[#8f1320]">
          Escaneie para baixar e compartilhar
        </p>
      </div>
    </div>
  )
}
