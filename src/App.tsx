import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { ConfirmPage } from '@/pages/ConfirmPage'
import { TotemRouteShell } from '@/components/TotemRouteShell'
import { FlowProvider } from '@/context/FlowContext'
import { CameraPage } from '@/pages/CameraPage'
import { InitialPage } from '@/pages/InitialPage'
import { ProcessingPage } from '@/pages/ProcessingPage'
import { PublicMobilePage } from '@/pages/PublicMobilePage'
import { ResultPage } from '@/pages/ResultPage'
import { StylesPage } from '@/pages/StylesPage'

export default function App() {
  return (
    <BrowserRouter>
      <FlowProvider>
        <Routes>
          <Route element={<TotemRouteShell />}>
            <Route path="/" element={<InitialPage />} />
            <Route path="/estilos" element={<StylesPage />} />
            <Route path="/camera" element={<CameraPage />} />
            <Route path="/confirmar" element={<ConfirmPage />} />
            <Route path="/processando" element={<ProcessingPage />} />
            <Route path="/final" element={<ResultPage />} />
          </Route>

          <Route path="/resultado/:token" element={<PublicMobilePage />} />
        </Routes>
      </FlowProvider>
    </BrowserRouter>
  )
}
