import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/base.css'
import './styles/nav.css'
import './styles/identity.css'
import './styles/discovery.css'
import './styles/components.css'
import './styles/settings.css'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { checkBackendHealth } from './lib/supabaseClient.js'

// Verify the backend before mounting so every context sees the correct
// live/demo mode from its very first render.
const root = createRoot(document.getElementById('root'))

checkBackendHealth().finally(() => {
  root.render(
    <StrictMode>
      <BrowserRouter>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </BrowserRouter>
    </StrictMode>,
  )
})
