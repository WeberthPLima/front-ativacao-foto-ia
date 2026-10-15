import { Outlet, useLocation } from 'react-router-dom'

import { TotemShell } from '@/components/TotemShell'

const routeMeta = [
  {
    path: '/',
    eyebrow: '01 · Início',
    title: 'A magia tem o seu rosto',
    subtitle: 'Uma lembrança digna da realeza.',
  },
  {
    path: '/estilos',
    eyebrow: '02 · Estilos',
    title: 'Escolha seu estilo',
    subtitle: 'Selecione a versão que mais combina com você.',
  },
  {
    path: '/camera',
    eyebrow: '03 · Câmera',
    title: 'Prepare sua melhor pose',
    subtitle: 'Olhe para a câmera e espere o contador terminar.',
  },
  {
    path: '/confirmar',
    eyebrow: '04 · Confirmação',
    title: 'Gostou da sua foto?',
    subtitle: 'Confirme sua imagem ou tire novamente.',
  },
  {
    path: '/processando',
    eyebrow: '05 · Processamento',
    title: 'Criando sua versão encantada',
    subtitle: 'A magia está acontecendo...',
  },
  {
    path: '/final',
    eyebrow: '06 · Resultado',
    title: 'Sua foto ficou pronta!',
    subtitle: 'Baixe, compartilhe e imprima sua lembrança.',
  },
]

export function TotemRouteShell() {
  const location = useLocation()

  const currentIndex = routeMeta.findIndex((item) => item.path === location.pathname)
  const currentMeta = routeMeta[Math.max(currentIndex, 0)]

  return (
    <TotemShell eyebrow={currentMeta.eyebrow} title={currentMeta.title} subtitle={currentMeta.subtitle}>
      <Outlet />
    </TotemShell>
  )
}
