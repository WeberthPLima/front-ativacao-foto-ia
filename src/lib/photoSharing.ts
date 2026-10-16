export async function prepareShareFile(url: string, signal?: AbortSignal): Promise<File> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('Não foi possível preparar a foto para compartilhar.')
  const blob = await response.blob()
  const extensions: Record<string, string> = {
    'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg',
  }
  const mime = blob.type.split(';')[0]
  if (!extensions[mime] || !blob.size) throw new Error('O arquivo recebido não é uma foto válida.')
  return new File([blob], `niver-da-dani-eu-fui.${extensions[mime]}`, { type: mime })
}

export async function sharePhotoFile(file: File): Promise<'shared' | 'unsupported' | 'cancelled'> {
  if (!navigator.share || !navigator.canShare?.({ files: [file] })) return 'unsupported'
  try {
    // Invoke synchronously from the tap: fetching here would lose iOS user activation.
    // The OS chooses available apps; Web Share cannot force a particular target.
    await navigator.share({ files: [file] })
    return 'shared'
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return 'cancelled'
    throw error
  }
}

