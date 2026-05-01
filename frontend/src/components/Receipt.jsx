// 80mm thermal receipt = 302px at 96dpi
export default function Receipt({ order, items, total, onClose }) {
  const handlePrint = () => window.print()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
        {/* Print area — styled to 302px (80mm) */}
        <div
          id="receipt-print"
          className="mx-auto font-mono text-sm"
          style={{ width: '302px' }}
        >
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-gray-400 pb-3 mb-3">
            <p className="text-xl font-bold tracking-widest">MICRONSOFT POS</p>
            <p className="text-xs text-gray-500">Point of Sale System</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date().toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">Order #{order?.id || '—'}</p>
          </div>

          {/* Items */}
          <div className="space-y-1 border-b border-dashed border-gray-300 pb-3 mb-3">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between">
                <div>
                  <p className="font-medium text-xs leading-tight">{item.name}</p>
                  <p className="text-gray-500 text-xs">
                    {item.qty} × ${parseFloat(item.price).toFixed(2)}
                  </p>
                </div>
                <p className="font-semibold text-xs">
                  ${(item.qty * parseFloat(item.price)).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-between font-bold text-base border-b-2 border-dashed border-gray-400 pb-3 mb-3">
            <span>TOTAL</span>
            <span>${parseFloat(total).toFixed(2)}</span>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 space-y-1">
            <p>Thank you for your purchase!</p>
            <p>**** **** **** 1234  APPROVED</p>
            <p className="tracking-widest mt-2">|||||||||||||||||||||||</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={handlePrint}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            🖨️ Print Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Print-only CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-print, #receipt-print * { visibility: visible; }
          #receipt-print { position: fixed; left: 0; top: 0; width: 302px; }
        }
      `}</style>
    </div>
  )
}