import { useState, useEffect } from 'react'
import { getAnalytics } from '../api/client'
import { notify } from './Toast'

function Sparkline({ data, color = '#3b82f6' }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 100, h = 28
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MetricCard({ label, value, sub, icon, accent }) {
  return (
    <div className={`bg-white rounded-2xl p-5 border-l-4 shadow-sm ${accent}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  )
}

export default function Analytics() {
  const [data, setData]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [selectedBar, setSelectedBar] = useState(null)
  const [refreshedAt, setRefreshedAt] = useState(null)

  const load = () => {
    setLoading(true)
    getAnalytics()
      .then(r => {
        setData(r.data)
        setRefreshedAt(new Date())
        setLoading(false)
      })
      .catch(() => {
        notify.error('Failed to load analytics')
        setLoading(false)
      })
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 font-medium text-sm">Loading analytics...</p>
    </div>
  )

  if (!data) return null

  const revenues     = data.daily_revenue.map(d => parseFloat(d.revenue))
  const maxRevenue   = Math.max(...revenues, 1)
  const totalRevenue = revenues.reduce((s, v) => s + v, 0)
  const avgRevenue   = totalRevenue / (revenues.length || 1)
  const totalSales   = data.top_products.reduce((s, p) => s + p.total_sales, 0)
  const peakDay      = data.daily_revenue.reduce(
    (best, d) => parseFloat(d.revenue) > parseFloat(best.revenue) ? d : best,
    data.daily_revenue[0] || { date: '—', revenue: 0 }
  )
  const peakLabel = peakDay?.date
    ? new Date(peakDay.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—'

  const selectedDay = selectedBar !== null ? data.daily_revenue[selectedBar] : null

  // Fixed bar dimensions — every bar is always visible
  const BAR_W   = 26   // px per bar
  const BAR_GAP = 5    // px gap between bars
  const CHART_H = 160  // chart area height in px
  const LABEL_H = 20   // x-axis label row height
  const totalChartW = data.daily_revenue.length * (BAR_W + BAR_GAP) - BAR_GAP

  const avgPct   = avgRevenue / maxRevenue        // 0–1
  const avgTopPx = CHART_H - avgPct * CHART_H    // px from top of chart area

  const medals    = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']
  const progColors = ['bg-amber-400', 'bg-slate-300', 'bg-orange-300', 'bg-blue-300', 'bg-blue-200']

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">📊 Analytics Dashboard</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Last 30 days · {refreshedAt ? `Updated ${refreshedAt.toLocaleTimeString()}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full font-bold">
            ⚡ {data.query_time_ms}ms query
          </span>
          <button onClick={load}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-full font-semibold transition-colors">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="30-Day Revenue"
          value={`$${(totalRevenue / 1000).toFixed(1)}K`}
          sub={`Avg $${(avgRevenue / 1000).toFixed(1)}K/day`}
          icon="💰" accent="border-blue-500" />
        <MetricCard label="Peak Day"
          value={peakLabel}
          sub={`$${(parseFloat(peakDay?.revenue || 0) / 1000).toFixed(1)}K revenue`}
          icon="🚀" accent="border-amber-500" />
        <MetricCard label="Top Product"
          value={data.top_products[0]?.product.split(' ').slice(0, 2).join(' ') || '—'}
          sub={`$${(data.top_products[0]?.total_revenue / 1000).toFixed(1)}K total`}
          icon="🏆" accent="border-emerald-500" />
        <MetricCard label="Total Sales"
          value={totalSales.toLocaleString()}
          sub="Across top 5 products"
          icon="🛒" accent="border-purple-500" />
      </div>

      {/* Revenue Chart Card */}
      <div className="bg-white rounded-2xl shadow-sm p-6">

        {/* Chart header */}
        <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
          <div>
            <h3 className="font-bold text-slate-700 text-lg">30-Day Daily Revenue</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any bar to inspect · {data.daily_revenue.length} days shown
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            {selectedDay ? (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-right">
                <p className="text-xs text-slate-500">
                  {new Date(selectedDay.date + 'T00:00:00').toLocaleDateString('en-US',
                    { weekday: 'short', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-xl font-bold text-blue-600">
                  ${Number(selectedDay.revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-400">
                  {((parseFloat(selectedDay.revenue) / avgRevenue - 1) * 100).toFixed(1)}% vs avg
                </p>
                <button onClick={() => setSelectedBar(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 mt-0.5">✕ clear</button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-400">Total</p>
                <p className="text-xl font-bold text-slate-700">
                  ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Scrollable chart ── */}
        <div
          className="overflow-x-auto rounded-xl"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Inner container — exactly wide enough for all bars */}
          <div style={{ width: `${totalChartW}px`, minWidth: `${totalChartW}px` }}>

            {/* Chart drawing area */}
            <div
              className="relative"
              style={{ height: `${CHART_H + LABEL_H}px` }}
            >
              {/* Average dashed line — spans full chart width */}
              <div
                className="absolute left-0 pointer-events-none z-10"
                style={{ top: `${avgTopPx}px`, width: `${totalChartW}px` }}
              >
                <div
                  className="w-full relative"
                  style={{
                    borderTop: '2px dashed #f59e0b',
                  }}
                >
                  <span
                    className="absolute text-[9px] text-amber-500 font-bold bg-white px-1 whitespace-nowrap"
                    style={{ right: 0, top: '-14px' }}
                  >
                    avg ${(avgRevenue / 1000).toFixed(1)}K
                  </span>
                </div>
              </div>

              {/* Bars + labels */}
              <div
                className="absolute bottom-0 left-0 flex items-end"
                style={{ gap: `${BAR_GAP}px`, height: `${CHART_H + LABEL_H}px` }}
              >
                {data.daily_revenue.map((d, i) => {
                  const rev     = parseFloat(d.revenue)
                  const barH    = Math.max((rev / maxRevenue) * CHART_H, 3)
                  const date    = new Date(d.date + 'T00:00:00')
                  const isWknd  = date.getDay() === 0 || date.getDay() === 6
                  const isActive = selectedBar === i
                  const label   = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  // Show label every 3 bars for readability
                  const showLbl = i % 3 === 0 || i === data.daily_revenue.length - 1

                  return (
                    <div
                      key={i}
                      className="relative flex flex-col items-center justify-end group"
                      style={{ width: `${BAR_W}px`, height: `${CHART_H + LABEL_H}px`, flexShrink: 0 }}
                    >
                      {/* Tooltip */}
                      <div className={`
                        absolute z-20 pointer-events-none
                        bg-slate-900 text-white text-xs rounded-lg px-2.5 py-1.5
                        whitespace-nowrap shadow-xl transition-all duration-100
                        left-1/2 -translate-x-1/2
                        ${isActive
                          ? 'opacity-100'
                          : 'opacity-0 group-hover:opacity-100'}
                      `}
                        style={{ bottom: `${barH + LABEL_H + 8}px` }}
                      >
                        <p className="font-bold text-blue-300">{label}</p>
                        <p className="font-semibold">${(rev / 1000).toFixed(1)}K</p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2
                          border-4 border-transparent border-t-slate-900" />
                      </div>

                      {/* Bar */}
                      <div
                        onClick={() => setSelectedBar(isActive ? null : i)}
                        title={`${label}: $${rev.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        className={`
                          w-full rounded-t cursor-pointer transition-all duration-150
                          ${isActive
                            ? 'bg-blue-600 shadow-md shadow-blue-200'
                            : isWknd
                              ? 'bg-slate-300 hover:bg-slate-400'
                              : 'bg-blue-400 hover:bg-blue-600'}
                        `}
                        style={{ height: `${barH}px`, marginBottom: `${LABEL_H}px` }}
                      />

                      {/* X-axis label */}
                      <div
                        className="absolute bottom-0 left-0 w-full flex items-center justify-center"
                        style={{ height: `${LABEL_H}px` }}
                      >
                        {showLbl && (
                          <span className="text-[9px] text-slate-400 whitespace-nowrap leading-none">
                            {label}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-5 mt-4 pt-4 border-t border-slate-100 flex-wrap items-center">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-3 h-3 rounded-sm bg-blue-400" /> Normal day
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-3 h-3 rounded-sm bg-slate-300" /> Weekend
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-8 border-t-2 border-dashed border-amber-400" /> Daily average
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-3 h-3 rounded-sm bg-blue-600" /> Selected
          </div>
          <p className="ml-auto text-xs text-slate-400">← scroll to see all →</p>
        </div>
      </div>

      {/* Top 5 Products */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="mb-5">
          <h3 className="font-bold text-slate-700 text-lg">🏆 Top 5 Products by Revenue</h3>
          <p className="text-xs text-slate-400 mt-0.5">All-time ranking from transaction history</p>
        </div>

        <div className="space-y-3">
          {data.top_products.map((p, i) => {
            const pct       = (p.total_revenue / data.top_products[0].total_revenue) * 100
            const sparkData = revenues.slice(-10)
            return (
              <div key={i}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
              >
                <span className="text-2xl w-8 text-center flex-shrink-0">{medals[i]}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <p className="font-bold text-slate-800 truncate">{p.product}</p>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="hidden sm:block">
                        <Sparkline data={sparkData} color={i === 0 ? '#f59e0b' : '#3b82f6'} />
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800 text-sm">
                          ${Number(p.total_revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-slate-400">
                          {Number(p.total_sales).toLocaleString()} sales
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${progColors[i]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-4 mt-1.5">
                    <span className="text-xs text-slate-400">{pct.toFixed(1)}% of #1</span>
                    <span className="text-xs text-slate-400">
                      Avg ${(p.total_revenue / p.total_sales).toFixed(2)}/sale
                    </span>
                    <span className={`text-xs font-semibold ml-auto px-2 py-0.5 rounded-full
                      ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {i === 0 ? '👑 Best Seller' : `Rank #${i + 1}`}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom totals */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-slate-400">Combined Revenue</p>
            <p className="font-bold text-slate-700">
              ${data.top_products.reduce((s, p) => s + parseFloat(p.total_revenue), 0)
                .toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Combined Sales</p>
            <p className="font-bold text-slate-700">
              {data.top_products.reduce((s, p) => s + p.total_sales, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Avg Revenue / Product</p>
            <p className="font-bold text-slate-700">
              ${(data.top_products.reduce((s, p) => s + parseFloat(p.total_revenue), 0) / 5)
                .toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}