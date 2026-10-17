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

export function ProcessingPage() {
  const navigate = useNavigate()
  const { interaction, photo, processingMeta, selectedStyleId, setInteraction, setProcessingMeta } =
    useFlow()
  const [error, setError] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const generationRequest = useRef<ReturnType<typeof generateInteraction> | null>(null)
  const [attempt, setAttempt] = useState(0)
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

    if (!photo && !['queued', 'processing', 'completed', 'finished'].includes(interaction.status)) {
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
    if (!interactionId) {
      return
    }

    let cancelled = false
    let timer: number | undefined

    const acceptStatus = (record: NonNullable<typeof interaction>) => {
      setInteraction(record)
      if (record.status === 'failed') {
        setError('Não foi possível gerar sua foto. Tente novamente.')
        return true
      }
      if (['completed', 'finished'].includes(record.status) && record.generatedImageUrl) {
        navigate('/final', { replace: true })
        return true
      }
      return false
    }

    const poll = async () => {
      try {
        const response = await getInteractionStatus(interactionId)
        if (cancelled) return
        setProcessingMeta(response.meta ?? null)
        setError(null)
        if (acceptStatus(response.data)) return
      } catch (currentError) {
        if (cancelled) return
        setError(currentError instanceof Error ? currentError.message : 'Falha ao consultar o andamento.')
      }
      if (!cancelled) timer = window.setTimeout(() => void poll(), 2000)
    }

    const bootstrap = async () => {
      try {
        // Reuse the in-flight promise when StrictMode replays this effect.
        if (photo && !generationRequest.current && !['queued', 'processing', 'completed', 'finished'].includes(currentStatus)) {
          generationRequest.current = generateInteraction(interactionId, {
            originalPhotoFileName: photo.fileName,
            originalPhotoDataUrl: photo.dataUrl,
          })
        }
        if (generationRequest.current) {
          const response = await generationRequest.current
          if (cancelled) return
          if (acceptStatus(response.data)) return
        }
        if (!cancelled) await poll()
      } catch (currentError) {
        if (!cancelled) {
          setError(currentError instanceof Error ? currentError.message : 'Falha ao gerar sua foto.')
        }
      }
    }
    void bootstrap()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [interactionId, navigate, photo, setInteraction, setProcessingMeta, attempt])


  const baseProgress = useMemo(
    () => getProgressFromStatus(interaction?.status) + Math.min(12, Math.floor(elapsedMs / 1500)),
    [elapsedMs, interaction?.status],
  )

  const progress = Math.min(
    interaction?.status === 'completed' ? 100 : interaction?.status === 'failed' ? 100 : 94,
    baseProgress,
  )

  return (
    <div className="screen-body items-center justify-center" style={{ marginTop: '5rem' }}>
      <div className="relative mx-auto flex h-[20vh] w-[20vh] items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-[#f4d06f]/30" />
        <div className="absolute inset-[14px] rounded-full border border-[#f4d06f]/50" />
        <div className="absolute inset-[28px] rounded-full border border-[#f4d06f]/20" />
        <img
          src={queenAssets.loadingCoracao}
          alt="Coração de processamento"
          className="absolute inset-[13px] h-auto w-[calc(100%-36px)] animate-pulse object-contain drop-shadow-[0_0_28px_rgba(255,83,111,0.24)]"
          style={{ marginTop: '-20px' }}
        />
      </div>

      <div className="mt-5 w-full text-center">
        <p className="serif-display text-[20px] text-[#fff5d7]">Criando sua versão encantada</p>
        <p className="mt-2 text-[30px] text-[#f7e8bc]/82">A magia está acontecendo...</p>
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

      <p className="mt-2 text-center text-[20px] uppercase tracking-[0.22em] text-[#d7af54]" style={{ marginBottom: '57rem' }}>
        Isso pode demorar alguns minutos! <br />
        Estamos gerando sua imagem
      </p>

      {error ? (
        <div className="mt-4 w-full rounded-[16px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
          <button type="button" className="secondary-button mt-3" onClick={() => {
            generationRequest.current = null
            setError(null)
            setAttempt((value) => value + 1)
          }}>Tentar novamente</button>
        </div>
      ) : null}
    </div>
  )
}
