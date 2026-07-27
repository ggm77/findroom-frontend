import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './tokens/colors.css'
import './tokens/typography.css'
import './tokens/spacing.css'
import './tokens/radius.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
