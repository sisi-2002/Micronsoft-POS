import { useState, useEffect } from 'react'
import { getAnalytics } from '../api/client'
import { notify } from './Toast'

export default function Analytics() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalytics()
      .then(r => { setData(r.data); setLoading(false) })
      .catch(() => {
        notify.error('Failed to load analytics')
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      Loading analytics...
    </div>
  )

  if (!data) return null

  const maxRevenue = Math.max(...data.daily_revenue.map(d => d.revenue), 1)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">📊 Analytics</h2>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
          Query: {data.query_time_ms}ms
        </span>
      </div>

      {/* 30-day revenue chart */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-bold text-slate-700 mb-4">30-Day Daily Revenue</h3>
        <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
          {data.daily_revenue.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1 min-w-[18px] group relative">
              <div
                className="bg-blue-500 hover:bg-blue-600 rounded-t-sm w-full transition-colors cursor-pointer"
                style={{ height: `${(d.revenue / maxRevenue) * 140}px` }}
                title={`${d.date}: $${parseFloat(d.revenue).toFixed(2)}`}
              />
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                ${parseFloat(d.revenue).toFixed(0)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top 5 products */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-bold text-slate-700 mb-4">🏆 Top 5 Products</h3>
        <div className="space-y-3">
          {data.top_products.map((p, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="text-lg font-bold text-slate-400 w-5">
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-slate-700">{p.product}</span>
                  <span className="font-bold text-blue-600">
                    ${parseFloat(p.total_revenue).toFixed(2)}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${(p.total_revenue / data.top_products[0].total_revenue) * 100}%`
                    }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {p.total_sales.toLocaleString()} sales
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}