import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { apiReady } from './lib/api'
import './index.css'

// Kick off same-origin API detection before first paint so the admin screens
// know whether they are live or demo by the time they mount.
apiReady.then((live) => {
  if (live) console.info('[chikwafu] live mode — same-origin API detected')
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
