import React from 'react'
import { createRoot } from 'react-dom/client'

function App() {
  return (
    <main>
      <h1>Vela</h1>
      <p>Эквалайзер появится здесь.</p>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
