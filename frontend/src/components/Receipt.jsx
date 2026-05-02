export default function Receipt({ order, items, total, onClose }) {
  const handlePrint = () => window.print()

  const now        = new Date()
  const dateStr    = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr    = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const subtotal   = items.reduce((s, i) => s + parseFloat(i.price) * i.qty, 0)
  const tax        = subtotal * 0.08
  const grandTotal = subtotal + tax
  const totalItems = items.reduce((s, i) => s + i.qty, 0)

  // Real order number — from API response order_id mapped to id in POS.jsx
  const orderId    = order?.id ?? order?.order_id ?? null
  const orderNum   = orderId ? String(orderId).padStart(6, '0') : '??????'
  const barcode    = `MNS-${orderNum}-${now.getFullYear()}`

  return (
    <>
      {/* ── Print styles ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #receipt-print-root,
          #receipt-print-root * { visibility: visible !important; }
          #receipt-print-root {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 302px !important;
            background: white !important;
            padding: 16px !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      >
        {/* ── Modal shell ── */}
        <div
          className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          style={{ maxHeight: '92vh', width: '420px' }}
        >
          {/* Modal header — not printed */}
          <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧾</span>
              <span className="font-bold text-slate-800 text-lg">Order Receipt</span>
              {orderId && (
                <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                  #{orderNum}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors text-sm font-bold"
            >
              ✕
            </button>
          </div>

          {/* ── Scrollable receipt body ── */}
          <div className="overflow-y-auto flex-1 px-6 py-4">

            {/* The actual 80mm receipt — 302px wide */}
            <div
              id="receipt-print-root"
              className="mx-auto font-mono text-black"
              style={{
                width: '302px',
                background: '#fff',
                boxShadow: '0 0 0 1px #e2e8f0, 0 8px 32px rgba(0,0,0,0.10)',
                borderRadius: '4px',
                padding: '20px 16px',
                position: 'relative',
              }}
            >
              {/* ── Torn edge top ── */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '8px',
                background: 'repeating-linear-gradient(90deg,#fff 0px,#fff 6px,#f1f5f9 6px,#f1f5f9 12px)',
              }} />

              <div style={{ paddingTop: '8px' }}>

                {/* Store logo / name */}
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <div style={{ fontSize: '22px', marginBottom: '4px' }}>🏪</div>
                  <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '4px', textTransform: 'uppercase' }}>
                    MICRONSOFT
                  </div>
                  <div style={{ fontSize: '9px', letterSpacing: '3px', color: '#64748b', marginTop: '2px' }}>
                    POINT OF SALE SYSTEM
                  </div>
                  <div style={{ fontSize: '8px', color: '#94a3b8', marginTop: '4px' }}>
                    www.micronsoft.lk · +94 11 000 0000
                  </div>
                </div>

                <Divider />

                {/* Order meta */}
                <div style={{ fontSize: '9px', color: '#475569', marginBottom: '10px' }}>
                  <Row left="Date"    right={dateStr} />
                  <Row left="Time"    right={timeStr} />
                  <Row left="Order #" right={`#${orderNum}`} bold />
                  <Row left="Cashier" right="POS Terminal 01" />
                  <Row left="Items"   right={`${totalItems} item${totalItems !== 1 ? 's' : ''}`} />
                </div>

                <Divider />

                {/* Column headers */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: '8px', fontWeight: 700, color: '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px',
                }}>
                  <span style={{ flex: 1 }}>Item</span>
                  <span style={{ width: '28px', textAlign: 'center' }}>Qty</span>
                  <span style={{ width: '52px', textAlign: 'right' }}>Price</span>
                  <span style={{ width: '56px', textAlign: 'right' }}>Total</span>
                </div>

                {/* Line items */}
                <div style={{ marginBottom: '10px' }}>
                  {items.map((item, i) => {
                    const lineTotal = parseFloat(item.price) * item.qty
                    return (
                      <div key={i} style={{ marginBottom: '7px' }}>
                        <div style={{
                          display: 'flex', justifyContent: 'space-between',
                          alignItems: 'flex-start', fontSize: '10px', fontWeight: 700,
                        }}>
                          <span style={{ flex: 1, paddingRight: '4px', lineHeight: '1.3', wordBreak: 'break-word' }}>
                            {item.image_emoji || '📦'} {item.name}
                          </span>
                          <span style={{ width: '28px', textAlign: 'center', flexShrink: 0 }}>
                            {item.qty}
                          </span>
                          <span style={{ width: '52px', textAlign: 'right', fontSize: '9px', color: '#64748b', flexShrink: 0 }}>
                            ${parseFloat(item.price).toFixed(2)}
                          </span>
                          <span style={{ width: '56px', textAlign: 'right', fontWeight: 800, flexShrink: 0 }}>
                            ${lineTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <Divider />

                {/* Subtotal / Tax */}
                <div style={{ fontSize: '10px', marginBottom: '10px' }}>
                  <Row left="Subtotal" right={`$${subtotal.toFixed(2)}`} />
                  <Row left="Tax (8%)" right={`$${tax.toFixed(2)}`} light />
                </div>

                {/* Grand Total */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#0f172a', color: '#fff', borderRadius: '4px',
                  padding: '8px 10px', marginBottom: '12px',
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>TOTAL</span>
                  <span style={{ fontSize: '16px', fontWeight: 900 }}>${grandTotal.toFixed(2)}</span>
                </div>

                {/* Payment info */}
                <div style={{ fontSize: '9px', color: '#475569', marginBottom: '10px' }}>
                  <Row left="Payment" right="CARD" />
                  <Row left="Card"    right="**** **** **** 1234" />
                  <Row left="Status"  right="✓ APPROVED" />
                </div>

                <Divider />

                {/* Barcode */}
                <div style={{ textAlign: 'center', margin: '10px 0' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'center', gap: '1px',
                    height: '36px', alignItems: 'flex-end', marginBottom: '4px',
                  }}>
                    {generateBars(barcode).map((w, i) => (
                      <div key={i} style={{
                        width: `${w}px`,
                        height: `${i % 3 === 0 ? 36 : i % 2 === 0 ? 28 : 32}px`,
                        background: '#0f172a',
                        borderRadius: '0.5px',
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: '8px', color: '#94a3b8', letterSpacing: '2px' }}>
                    {barcode}
                  </div>
                </div>

                <Divider />

                {/* Footer */}
                <div style={{
                  textAlign: 'center', fontSize: '9px', color: '#64748b',
                  lineHeight: '1.6', marginTop: '10px',
                }}>
                  <div style={{ fontSize: '13px', marginBottom: '4px' }}>🙏</div>
                  <div style={{ fontWeight: 700, fontSize: '10px', marginBottom: '2px' }}>
                    Thank you for shopping!
                  </div>
                  <div>Please keep this receipt for your records.</div>
                  <div style={{ marginTop: '6px', color: '#94a3b8' }}>
                    Returns accepted within 14 days
                  </div>
                  <div style={{ color: '#94a3b8' }}>with original receipt</div>
                </div>

              </div>

              {/* ── Torn edge bottom ── */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '8px',
                background: 'repeating-linear-gradient(90deg,#fff 0px,#fff 6px,#f1f5f9 6px,#f1f5f9 12px)',
              }} />
            </div>
          </div>

          {/* ── Action buttons — not printed ── */}
          <div className="no-print flex gap-3 px-6 py-4 border-t border-slate-100">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl transition-colors text-sm"
            >
              🖨️ Print Receipt
            </button>
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl transition-colors text-sm"
            >
              ✕ Close
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Divider() {
  return <div style={{ borderTop: '1px dashed #cbd5e1', margin: '8px 0' }} />
}

function Row({ left, right, light, bold }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', marginBottom: '2px',
      color: light ? '#94a3b8' : 'inherit',
    }}>
      <span>{left}</span>
      <span style={{ fontWeight: bold ? 900 : light ? 400 : 600 }}>{right}</span>
    </div>
  )
}

function generateBars(seed) {
  const bars = []
  let hash = 0
  for (let c of seed) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  for (let i = 0; i < 40; i++) {
    hash = (hash * 1664525 + 1013904223) & 0xffffffff
    bars.push((Math.abs(hash) % 3) + 1)
  }
  return bars
}