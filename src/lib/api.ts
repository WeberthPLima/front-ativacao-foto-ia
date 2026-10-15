export interface ApiResponse<T, M = undefined> {
  data: T
  meta?: M
  message?: string
}

export interface StylePreset {
  id: string
  name: string
  description: string
  promptSuffix: string
  previewPath: string
}

export type InteractionStatus =
  | 'started'
  | 'style_selected'
  | 'photo_confirmed'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'finished'

export interface InteractionRecord {
  id: string
  eventSlug: string
  stationSlug: string
  status: InteractionStatus
  styleId: string | null
  shareToken: string
  shareUrl: string
  originalPhotoPath: string | null
  generatedImagePath: string | null
  storiesImagePath: string | null
  printImagePath: string | null
  openAiModel: string
  promptVersion: string
  errorCode: string | null
  legalNoticeAccepted: boolean
  legalNoticeVersion: string | null
  processingStartedAt: string | null
  processingFinishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface InteractionEventRecord {
  id: string
  interactionId: string
  eventType: string
  metadata: Record<string, unknown>
  createdAt: string
}

export interface InteractionStatusMeta {
  steps: string[]
  events: InteractionEventRecord[]
}

export interface ResultMeta {
  downloadUrl: string | null
  storiesUrl: string | null
}

type StartInteractionBody = {
  eventSlug?: string
  stationSlug?: string
  legalNoticeAccepted?: boolean
  legalNoticeVersion?: string
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

async function fetchJson<T, M = undefined>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T, M>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  const payload = (await response.json().catch(() => null)) as ApiResponse<T, M> | null

  if (!response.ok) {
    throw new Error(payload?.message ?? 'Não foi possível concluir a requisição.')
  }

  if (!payload) {
    throw new Error('Resposta vazia da API.')
  }

  return payload
}

export function getPublicBaseUrl() {
  return (import.meta.env.VITE_PUBLIC_APP_URL ?? window.location.origin).replace(/\/$/, '')
}

export function buildPublicResultUrl(shareToken?: string | null, shareUrl?: string | null) {
  if (shareUrl) {
    return shareUrl
  }

  if (!shareToken) {
    return ''
  }

  return `${getPublicBaseUrl()}/resultado/${shareToken}`
}

export function resolveRenderableUrl(url?: string | null) {
  if (!url) {
    return null
  }

  if (/^blob:|^data:|^https?:\/\//.test(url)) {
    return url
  }

  if (url.startsWith('/')) {
    return `${getPublicBaseUrl()}${url}`
  }

  return null
}

export function getStatusLabel(status?: InteractionStatus | null) {
  switch (status) {
    case 'started':
      return 'Sessão iniciada'
    case 'style_selected':
      return 'Estilo confirmado'
    case 'photo_confirmed':
      return 'Foto confirmada'
    case 'queued':
      return 'Na fila de geração'
    case 'processing':
      return 'Processando imagem'
    case 'completed':
      return 'Resultado pronto'
    case 'failed':
      return 'Falha no processamento'
    case 'finished':
      return 'Atendimento encerrado'
    default:
      return 'Aguardando'
  }
}

export function getProgressFromStatus(status?: InteractionStatus | null) {
  switch (status) {
    case 'started':
      return 12
    case 'style_selected':
      return 28
    case 'photo_confirmed':
      return 40
    case 'queued':
      return 58
    case 'processing':
      return 82
    case 'completed':
    case 'finished':
      return 100
    case 'failed':
      return 100
    default:
      return 0
  }
}

export async function listStyles() {
  return fetchJson<StylePreset[]>('/v1/styles')
}

export async function startInteraction(body: StartInteractionBody = {}) {
  return fetchJson<InteractionRecord>('/v1/interactions/start', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function chooseInteractionStyle(interactionId: string, styleId: string) {
  return fetchJson<InteractionRecord>(`/v1/interactions/${interactionId}/style`, {
    method: 'POST',
    body: JSON.stringify({ styleId }),
  })
}

export async function generateInteraction(
  interactionId: string,
  payload?: {
    originalPhotoPath?: string
    originalPhotoDataUrl?: string
    originalPhotoFileName?: string
  },
) {
  return fetchJson<InteractionRecord, { nextStatusPoll?: string }>(
    `/v1/interactions/${interactionId}/generate`,
    {
      method: 'POST',
      body: JSON.stringify(payload ?? {}),
    },
  )
}

export async function getInteractionStatus(interactionId: string) {
  return fetchJson<InteractionRecord, InteractionStatusMeta>(
    `/v1/interactions/${interactionId}/status`,
  )
}

export async function getResultByToken(token: string) {
  return fetchJson<InteractionRecord, ResultMeta>(`/v1/results/${token}`)
}

export async function requestPrint(interactionId: string) {
  return fetchJson<{
    interactionId: string
    provider: string
    destination: string
    copies: number
    status: string
  }>(`/v1/interactions/${interactionId}/print`, {
    method: 'POST',
    body: JSON.stringify({ destination: 'browser' }),
  })
}

export async function finishInteraction(interactionId: string) {
  return fetchJson<InteractionRecord>(`/v1/interactions/${interactionId}/finish`, {
    method: 'POST',
  })
}
