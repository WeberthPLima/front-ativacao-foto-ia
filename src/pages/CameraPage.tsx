import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { useFlow } from '@/context/FlowContext'
import { queenAssets } from '@/rainha-de-copas-assets/assets'

type CameraState = 'idle' | 'ready' | 'blocked' | 'unsupported'
type CameraDevice = Pick<MediaDeviceInfo, 'deviceId' | 'label'>

function getCameraErrorMessage(error: unknown) {
  if (!(error instanceof DOMException)) {
    return 'Não foi possível iniciar a câmera. Verifique a conexão da webcam e tente novamente.'
  }

  switch (error.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Acesso à câmera bloqueado. Autorize a câmera para este site nas configurações do navegador e do macOS.'
    case 'NotFoundError':
      return 'Nenhuma câmera foi encontrada. Verifique se a webcam Letron está conectada.'
    case 'NotReadableError':
      return 'A câmera está sendo usada por outro aplicativo. Feche-o e tente novamente.'
    case 'OverconstrainedError':
      return 'A webcam não aceitou a configuração solicitada. Selecione outra câmera ou reconecte a Letron.'
    default:
      return `Falha ao acessar a câmera: ${error.message || error.name}`
  }
}

function readFileAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem selecionada.'))
    reader.readAsDataURL(file)
  })
}

export function CameraPage() {
  const navigate = useNavigate()
  const { photo, selectedStyleId, setPhoto, styles } = useFlow()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const countdownTimerRef = useRef<number | null>(null)

  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraDevices, setCameraDevices] = useState<CameraDevice[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState('')
  const [cameraRequest, setCameraRequest] = useState('')
  const [cameraAttempt, setCameraAttempt] = useState(0)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [processingCapture, setProcessingCapture] = useState(false)

  useEffect(() => {
    if (!selectedStyleId) {
      navigate('/estilos', { replace: true })
      return
    }

    let cancelled = false
    setCameraState('idle')
    setCameraError(null)
    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState('unsupported')
        setCameraError(
          window.isSecureContext
            ? 'Este navegador não suporta captura por câmera. Use o upload abaixo.'
            : 'A câmera exige uma conexão segura. Abra o totem por HTTPS ou em localhost.',
        )
        return
      }

      try {
        let stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          // Não force facingMode/resolução: webcams USB como a Letron podem não
          // anunciar essas capacidades e acabar não iniciando no navegador.
          video: cameraRequest ? { deviceId: { exact: cameraRequest } } : true,
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        const devices = (await navigator.mediaDevices.enumerateDevices()).filter(device => device.kind === 'videoinput')
        if (cancelled) { stream.getTracks().forEach(track => track.stop()); return }
        const preferred = devices.find(device => /letron/i.test(device.label))
        if (!cameraRequest && preferred && preferred.deviceId !== stream.getVideoTracks()[0]?.getSettings().deviceId) {
          stream.getTracks().forEach(track => track.stop())
          stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { deviceId: { exact: preferred.deviceId } } })
          if (cancelled) { stream.getTracks().forEach(track => track.stop()); return }
          streamRef.current = stream
        }
        setCameraDevices(devices.map(({ deviceId, label }) => ({ deviceId, label })))
        setSelectedCameraId(stream.getVideoTracks()[0]?.getSettings().deviceId ?? '')
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        if (cancelled) return
        stream.getVideoTracks()[0]?.addEventListener('ended', () => {
          if (!cancelled) { setCameraState('blocked'); setCameraError('A webcam foi desconectada. Reconecte e clique em Tentar novamente.') }
        })
        setCameraState('ready')
        setCameraError(null)
      } catch (error) {
        if (cancelled) return
        streamRef.current?.getTracks().forEach(track => track.stop())
        setCameraState('blocked')
        setCameraError(getCameraErrorMessage(error))
      }
    }

    void startCamera()

    return () => {
      cancelled = true
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current)
      }

      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [navigate, selectedStyleId, cameraRequest, cameraAttempt])

  const handleCameraChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setCameraRequest(event.target.value)
  }

  const selectedStyleName =
    styles.find((style) => style.id === selectedStyleId)?.name ?? 'Estilo selecionado'

  const captureFrame = () => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas || video.readyState < 2 || !video.videoWidth) {
      setProcessingCapture(false)
      setCameraError('Aguarde a imagem da câmera ficar pronta e tente novamente.')
      return
    }

    canvas.width = video.videoWidth || 720
    canvas.height = video.videoHeight || 960

    const context = canvas.getContext('2d')

    if (!context) {
      setProcessingCapture(false)
      setCameraError('Não foi possível preparar a imagem capturada.')
      return
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setProcessingCapture(false)
          setCameraError('A captura falhou. Tente novamente.')
          return
        }

        try {
          const previewUrl = URL.createObjectURL(blob)
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          const dataUrl = await readFileAsDataUrl(blob)

          setPhoto({
            previewUrl,
            fileName: `captura-totem-${timestamp}.jpg`,
            dataUrl,
            source: 'camera',
          })
          navigate('/confirmar')
        } catch (error) {
          setCameraError(
            error instanceof Error ? error.message : 'A captura falhou. Tente novamente.',
          )
        } finally {
          setProcessingCapture(false)
        }
      },
      'image/jpeg',
      0.92,
    )
  }

  const startCountdown = () => {
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current)
    }

    setProcessingCapture(true)
    setCountdown(3)

    let remaining = 3
    countdownTimerRef.current = window.setInterval(() => {
      remaining -= 1
      if (remaining > 0) { setCountdown(remaining); return }
      window.clearInterval(countdownTimerRef.current!)
      countdownTimerRef.current = null
      setCountdown(null)
      captureFrame()
    }, 1000)
  }

  const handleCapture = () => {
    if (processingCapture) return
    if (cameraState === 'ready') {
      startCountdown()
      return
    }

    if (photo) {
      navigate('/confirmar')
      return
    }

    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const previewUrl = URL.createObjectURL(file)
      const dataUrl = await readFileAsDataUrl(file)

      setPhoto({
        previewUrl,
        fileName: file.name,
        dataUrl,
        source: 'upload',
      })
      setCameraError(null)
      navigate('/confirmar')
    } catch (error) {
      setCameraError(
        error instanceof Error ? error.message : 'Não foi possível carregar a foto enviada.',
      )
    }
  }

  return (
    <div className="screen-body">
      <div className="frame-panel rose-glow">
        <div className="portrait-card relative overflow-hidden">
          <div className="relative h-full min-h-[448px] rounded-[18px] border border-[#f4d06f]/35">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`absolute inset-0 h-full min-h-[448px] w-full rounded-[18px] object-cover ${cameraState === 'ready' ? '' : 'hidden'}`}
            />
            {cameraState === 'ready' ? null : photo ? (
              <img
                src={photo.previewUrl}
                alt="Prévia da foto selecionada"
                className="h-full min-h-[448px] w-full object-cover"
              />
            ) : (
              <div className="flex min-h-[448px] items-center justify-center px-6 text-center">
                <div>
                  <div className="mx-auto h-24 w-24 rounded-full border border-[#f4d06f]/25 bg-white/5" />
                  <h3 className="serif-display mt-5 text-2xl text-white">
                    {cameraState === 'blocked' || cameraState === 'unsupported'
                      ? 'Use o fallback por upload'
                      : 'Prévia da câmera'}
                  </h3>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-[#f7e8bc]/80">
                    {cameraError ??
                      'Ao liberar a câmera, a prévia aparece aqui. Se preferir, envie uma imagem manualmente.'}
                  </p>
                </div>
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
              <div className="h-[84%] w-full max-w-[300px] rounded-[30px] border-[3px] border-[#f4d06f] shadow-[0_0_0_999px_rgba(14,1,4,0.24)]" />
            </div>

            <img
              src={queenAssets.logoCoroaQ}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-5 z-10 h-16 -translate-x-1/2 opacity-90"
            />

            {processingCapture && countdown !== null ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[#180204]/50 backdrop-blur-sm">
                <div className="flex h-28 w-28 items-center justify-center rounded-full border border-[#f4d06f]/50 bg-black/30 text-5xl font-bold text-white">
                  {countdown}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-center">
        <span className="gold-chip">{selectedStyleName}</span>
      </div>

      {cameraDevices.length > 1 ? (
        <label className="mx-auto mt-3 flex w-full max-w-xl flex-col gap-2 text-center text-sm text-[#f7e8bc]/85">
          Câmera conectada
          <select
            value={selectedCameraId}
            onChange={handleCameraChange}
            disabled={processingCapture || cameraState === 'idle'}
            className="rounded-xl border border-[#f4d06f]/45 bg-[#180204] px-4 py-3 text-base text-white"
          >
            {cameraDevices.map((device, index) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Câmera ${index + 1}`}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="queen-bottom-actions">
        {/* <p className="queen-soft-note">
          {cameraState === 'ready'
            ? 'Olhe para a câmera e aguarde a contagem.'
            : 'Se a câmera não abrir, envie uma foto do dispositivo.'}
        </p> */}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={handleCapture}
          className="primary-button"
          disabled={processingCapture || cameraState === 'idle'}
        >
          {cameraState === 'ready'
            ? processingCapture
              ? 'Capturando...'
              : '📸 Tirar foto'
            : photo
              ? 'Usar foto enviada'
              : 'Enviar foto'}
        </button>

        <button
          type="button"
          onClick={() => {
            fileInputRef.current?.click()
          }}
          className="secondary-button"
          disabled={processingCapture}
        >
          Upload manual
        </button>

        {cameraError ? (
          <div className="rounded-[16px] border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {cameraError}
          </div>
        ) : null}
      </div>

      {cameraState === 'blocked' ? <button type="button" className="secondary-button" onClick={() => setCameraAttempt(attempt => attempt + 1)}>Tentar novamente</button> : null}
      <canvas ref={canvasRef} className="hidden" />
      <button type="button" onClick={() => navigate('/estilos')} disabled={processingCapture} className="secondary-button">
        Voltar
      </button>
    </div>
  )
}
