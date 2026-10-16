import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

import {
  chooseInteractionStyle,
  listStyles,
  mergeInteraction,
  startInteraction,
  type InteractionRecord,
  type InteractionStatusMeta,
  type StylePreset,
} from '@/lib/api'

export type PhotoCapture = {
  previewUrl: string
  fileName: string
  dataUrl: string
  source: 'camera' | 'upload'
}

type FlowContextValue = {
  styles: StylePreset[]
  stylesLoading: boolean
  stylesError: string | null
  interaction: InteractionRecord | null
  selectedStyleId: string | null
  photo: PhotoCapture | null
  processingMeta: InteractionStatusMeta | null
  ensureStylesLoaded: () => Promise<StylePreset[]>
  ensureInteraction: (force?: boolean) => Promise<InteractionRecord>
  selectStyle: (styleId: string) => Promise<InteractionRecord>
  setPhoto: (photo: PhotoCapture | null) => void
  clearPhoto: () => void
  setInteraction: (interaction: InteractionRecord | null) => void
  setProcessingMeta: (meta: InteractionStatusMeta | null) => void
  resetFlow: () => void
}

const FlowContext = createContext<FlowContextValue | null>(null)

function revokeBlobUrl(url?: string | null) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

export function FlowProvider({ children }: PropsWithChildren) {
  const [styles, setStyles] = useState<StylePreset[]>([])
  const [stylesLoading, setStylesLoading] = useState(false)
  const [stylesError, setStylesError] = useState<string | null>(null)
  const [interaction, setInteractionState] = useState<InteractionRecord | null>(() => {
    try {
      const saved = sessionStorage.getItem('rainha-interaction')
      return saved ? JSON.parse(saved) as InteractionRecord : null
    } catch { return null }
  })
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(interaction?.styleId ?? null)
  const [photo, setPhotoState] = useState<PhotoCapture | null>(null)
  const [processingMeta, setProcessingMeta] = useState<InteractionStatusMeta | null>(null)

  useEffect(() => {
    try {
      if (interaction) sessionStorage.setItem('rainha-interaction', JSON.stringify(interaction))
      else sessionStorage.removeItem('rainha-interaction')
    } catch { /* The flow also works with browser storage disabled. */ }
  }, [interaction])

  // Only session creation returns the raw share token; later responses contain null.
  const setInteraction = useCallback((next: InteractionRecord | null) => {
    setInteractionState((current) => mergeInteraction(current, next))
  }, [])

  const ensureStylesLoaded = useCallback(async () => {
    if (styles.length > 0) {
      return styles
    }

    setStylesLoading(true)
    setStylesError(null)

    try {
      const response = await listStyles()
      setStyles(response.data)
      return response.data
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível carregar os estilos.'
      setStylesError(message)
      throw error
    } finally {
      setStylesLoading(false)
    }
  }, [styles])

  useEffect(() => {
    void ensureStylesLoaded().catch(() => undefined)
  }, [ensureStylesLoaded])

  const ensureInteraction = useCallback(
    async (force = false) => {
      if (interaction && !force) {
        return interaction
      }

      const response = await startInteraction({
        eventSlug: 'dani-niver',
        stationSlug: 'totem-vertical',
        legalNoticeAccepted: true,
        legalNoticeVersion: 'v1',
      })

      setInteraction(response.data)
      setSelectedStyleId(response.data.styleId)
      setProcessingMeta(null)
      return response.data
    },
    [interaction],
  )

  const selectStyle = useCallback(
    async (styleId: string) => {
      const currentInteraction = await ensureInteraction()
      const response = await chooseInteractionStyle(currentInteraction.id, styleId)

      setInteraction(response.data)
      setSelectedStyleId(styleId)
      return response.data
    },
    [ensureInteraction],
  )

  const setPhoto = useCallback((nextPhoto: PhotoCapture | null) => {
    setPhotoState((currentPhoto) => {
      if (currentPhoto?.previewUrl !== nextPhoto?.previewUrl) {
        revokeBlobUrl(currentPhoto?.previewUrl)
      }

      return nextPhoto
    })
  }, [])

  const clearPhoto = useCallback(() => {
    setPhotoState((currentPhoto) => {
      revokeBlobUrl(currentPhoto?.previewUrl)
      return null
    })
  }, [])

  const resetFlow = useCallback(() => {
    setInteraction(null)
    setSelectedStyleId(null)
    setProcessingMeta(null)
    setPhotoState((currentPhoto) => {
      revokeBlobUrl(currentPhoto?.previewUrl)
      return null
    })
  }, [])

  const value = useMemo<FlowContextValue>(
    () => ({
      styles,
      stylesLoading,
      stylesError,
      interaction,
      selectedStyleId,
      photo,
      processingMeta,
      ensureStylesLoaded,
      ensureInteraction,
      selectStyle,
      setPhoto,
      clearPhoto,
      setInteraction,
      setProcessingMeta,
      resetFlow,
    }),
    [
      clearPhoto,
      ensureInteraction,
      ensureStylesLoaded,
      interaction,
      photo,
      processingMeta,
      resetFlow,
      selectStyle,
      selectedStyleId,
      setPhoto,
      styles,
      stylesError,
      stylesLoading,
    ],
  )

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>
}

export function useFlow() {
  const context = useContext(FlowContext)

  if (!context) {
    throw new Error('useFlow deve ser usado dentro de <FlowProvider>.')
  }

  return context
}
