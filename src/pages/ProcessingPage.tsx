import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useFlow } from '@/context/FlowContext'
import { queenAssets } from '@/rainha-de-copas-assets/assets'
import {
  generateInteraction,
  getInteractionStatus,
  getProgressFromStatus,
  getStatusLabel,
} from '@/lib/api'

const AUTO_ADVANCE_AFTER_MS = 9000

export function ProcessingPage() {
  const navigate = useNavigate()
  const { interaction, photo, processingMeta, selectedStyleId, setInteraction, setProcessingMeta } =
    useFlow()
  const [error, setError] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const generationRequestedRef = useRef(false)
  const interactionId = interaction?.id
  const interactionStatus = interaction?.status
  const currentStatus = interactionStatus ?? 'started'

  useEffect(() => {
    if (!interaction) {
      navigate('/', { replace: true })
      return
    }

    if (!selectedStyleId) {
      navigate('/estilos', { replace: true })
      return
    }

    if (!photo) {
      navigate('/camera', { replace: true })
    }
  }, [interaction, navigate, photo, selectedStyleId])

  useEffect(() => {
    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt)
    }, 500)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!interactionId || !photo) {
      return
    }

    let cancelled = false
    let intervalId: number | null = null

    const syncStatus = async () => {
      const response = await getInteractionStatus(interactionId)

      if (cancelled) {
        return
      }

      setInteraction(response.data)
      setProcessingMeta(response.meta ?? null)

      const shouldGoToResult =
        ['completed', 'failed', 'finished'].includes(response.data.status) ||
        (Date.now() - pollingStartedAt >= AUTO_ADVANCE_AFTER_MS && Boolean(response.data.shareToken))

      if (shouldGoToResult) {
        if (intervalId) {
          window.clearInterval(intervalId)
        }

        navigate('/final', { replace: true })
      }
    }

    const pollingStartedAt = Date.now()

    const bootstrap = async () => {
      try {
        if (
          !generationRequestedRef.current &&
          !['queued', 'processing', 'completed', 'failed', 'finished'].includes(currentStatus)
        ) {
          generationRequestedRef.current = true

          const response = await generateInteraction(interactionId, {
            originalPhotoFileName: photo.fileName,
            originalPhotoDataUrl: photo.dataUrl,
          })

          if (cancelled) {
            return
          }

          setInteraction(response.data)
        }

        await syncStatus()

        intervalId = window.setInterval(() => {
          void syncStatus().catch((currentError) => {
            if (!cancelled) {
              setError(
                currentError instanceof Error
                  ? currentError.message
                  : 'Falha ao consultar o andamento.',
              )
            }
          })
        }, 2000)
      } catch (currentError) {
        if (!cancelled) {
          setError(
            currentError instanceof Error
              ? currentError.message
              : 'Falha ao iniciar o processamento da foto.',
          )
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true

      if (intervalId) {
        window.clearInterval(intervalId)
      }
    }
  }, [
    interactionId,
    navigate,
    photo,
    setInteraction,
    setProcessingMeta,
  ])

  const baseProgress = useMemo(
    () => getProgressFromStatus(interaction?.status) + Math.min(12, Math.floor(elapsedMs / 1500)),
    [elapsedMs, interaction?.status],
  )

  const progress = Math.min(
    interaction?.status === 'completed' ? 100 : interaction?.status === 'failed' ? 100 : 94,
    baseProgress,
  )

  return (
    <div className="screen-body items-center justify-center">
      <div className="relative mx-auto mt-6 flex h-[230px] w-[230px] items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-[#f4d06f]/30" />
        <div className="absolute inset-[14px] rounded-full border border-[#f4d06f]/50" />
        <div className="absolute inset-[28px] rounded-full border border-[#f4d06f]/20" />
        <img
          src={queenAssets.loadingCoracao}
          alt="Coração de processamento"
          className="absolute inset-[18px] h-auto w-[calc(100%-36px)] animate-pulse object-contain drop-shadow-[0_0_28px_rgba(255,83,111,0.24)]"
        />
      </div>

      <div className="mt-5 w-full text-center">
        <p className="serif-display text-[22px] text-[#fff5d7]">Criando sua versão encantada</p>
        <p className="mt-2 text-[15px] text-[#f7e8bc]/82">A magia está acontecendo...</p>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 text-[20px] text-[#f4d06f]">
        <span className={progress > 20 ? 'opacity-100' : 'opacity-30'}>♥</span>
        <span className={progress > 55 ? 'opacity-100' : 'opacity-30'}>♡</span>
        <span className={progress > 80 ? 'opacity-100' : 'opacity-30'}>♡</span>
      </div>

      {processingMeta?.events?.length ? (
        <p className="mt-6 text-center text-[12px] text-[#f7e8bc]/68">
          Último evento: {processingMeta.events[processingMeta.events.length - 1]?.eventType}
        </p>
      ) : null}

      <p className="mt-2 text-center text-[12px] uppercase tracking-[0.22em] text-[#d7af54]">
        {getStatusLabel(interaction?.status)}
      </p>

      {error ? (
        <div className="mt-4 w-full rounded-[16px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
    </div>
  )
}
