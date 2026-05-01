import { useState } from 'react'
import ToastProvider from './components/Toast'
import POS from './components/POS'
import Analytics from './components/Analytics'

export default function App() {
  const [view, setView] = useState('pos')

  return (
    <div className="min-h-screen">
      <ToastProvider />
      <nav className="bg-white border-b px-6 py-3 flex gap-4 shadow-sm">
        <button
          onClick={() => setView('pos')}
          className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors
            ${view === 'pos' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          🏪 POS
        </button>
        <button
          onClick={() => setView('analytics')}
          className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors
            ${view === 'analytics' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          📊 Analytics
        </button>
      </nav>
      {view === 'pos' ? <POS /> : <Analytics />}
    </div>
  )
}