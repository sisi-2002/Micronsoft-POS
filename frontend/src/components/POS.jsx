import { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Minus, Trash2, CreditCard } from 'lucide-react'
import { getProducts, postCheckout } from '../api/client'
import { notify } from './Toast'
import Receipt from './Receipt'

export default function POS() {
  const [products, setProducts] = useState([])
  const [cart, setCart]         = useState([])
  const [loading, setLoading]   = useState(false)
  const [receipt, setReceipt]   = useState(null)
  const [category, setCategory] = useState('All')

  useEffect(() => {
    getProducts()
      .then(r => setProducts(r.data))
      .catch(() => notify.error('Failed to load products'))
  }, [])

  const categories = ['All', ...new Set(products.map(p => p.category))]
  const filtered   = category === 'All'
    ? products
    : products.filter(p => p.category === category)

  const addToCart = (product) => {
    if (product.stock < 1) {
      notify.error(`${product.name} is out of stock`)
      return
    }

    // Determine update using current cart state; perform notifications outside the updater
    const existing = cart.find(i => i.id === product.id)
    if (existing) {
      if (existing.qty >= product.stock) {
        notify.error('Cannot exceed available stock')
        return
      }
      // use functional update to avoid stale state
      setCart(prev => prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
      return
    }

    // Add new item and notify once
    setCart(prev => [...prev, { ...product, qty: 1 }])
    notify.success(`${product.name} added to cart`)
  }

  const adjustQty = (id, delta) => {
    setCart(prev =>
      prev
        .map(i => i.id === id ? { ...i, qty: i.qty + delta } : i)
        .filter(i => i.qty > 0)
    )
  }

  const removeItem = (id) => {
    setCart(prev => prev.filter(i => i.id !== id))
    notify.info('Item removed from cart')
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)

  const handleCheckout = async () => {
    if (cart.length === 0) {
      notify.error('Your cart is empty')
      return
    }
    setLoading(true)
    try {
      const payload = {
        items: cart.map(i => ({ product_id: i.id, quantity: i.qty })),
        total_amount: total.toFixed(2),
      }
     const res = await postCheckout(payload)
notify.success('Order placed successfully!')
setReceipt({
  order: { id: res.data.order_id },   // ← map order_id → id
  items: cart,
  total,
})
      setCart([])
    } catch (err) {
      const msg = err.response?.data?.error || 'Checkout failed'
      notify.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* ── Product panel ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b px-6 py-4 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-800">
            🏪 Micronsoft POS
          </h1>
          {/* Category tabs */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                  ${category === c
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock < 1}
                className={`bg-white rounded-2xl p-4 text-left shadow-sm border-2 transition-all
                  ${product.stock < 1
                    ? 'opacity-40 cursor-not-allowed border-transparent'
                    : 'border-transparent hover:border-blue-400 hover:shadow-md active:scale-95'}`}
              >
                <div className="text-4xl mb-2">{product.image_emoji}</div>
                <p className="font-semibold text-slate-800 text-sm leading-tight">
                  {product.name}
                </p>
                <p className="text-blue-600 font-bold mt-1">
                  ${product.price.toFixed(2)}
                </p>
                <p className={`text-xs mt-1 ${product.stock < 10 ? 'text-red-500' : 'text-slate-400'}`}>
                  {product.stock < 1 ? 'Out of stock' : `${product.stock} left`}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Cart panel ── */}
      <div className="w-96 bg-white shadow-xl flex flex-col border-l">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-blue-600" size={22} />
            <h2 className="text-lg font-bold text-slate-800">Cart</h2>
            <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {cart.reduce((s, i) => s + i.qty, 0)} items
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {cart.length === 0 && (
            <div className="text-center text-slate-400 mt-16">
              <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Cart is empty</p>
              <p className="text-sm">Click products to add them</p>
            </div>
          )}
          {cart.map(item => (
            <div key={item.id}
                 className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
              <span className="text-2xl">{item.image_emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-700 text-sm truncate">
                  {item.name}
                </p>
                <p className="text-blue-600 font-bold text-sm">
                  ${(item.price * item.qty).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => adjustQty(item.id, -1)}
                  className="w-7 h-7 bg-slate-200 hover:bg-slate-300 rounded-lg flex items-center justify-center transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center font-bold text-sm">
                  {item.qty}
                </span>
                <button
                  onClick={() => adjustQty(item.id, 1)}
                  className="w-7 h-7 bg-slate-200 hover:bg-slate-300 rounded-lg flex items-center justify-center transition-colors"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  className="w-7 h-7 bg-red-100 hover:bg-red-200 text-red-500 rounded-lg flex items-center justify-center transition-colors ml-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Grand total + checkout */}
        <div className="border-t p-4 space-y-3">
          <div className="flex justify-between items-center text-xl font-bold text-slate-800">
            <span>Grand Total</span>
            <span className="text-blue-600">${total.toFixed(2)}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            className={`w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all
              ${loading || cart.length === 0
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-200'}`}
          >
            <CreditCard size={20} />
            {loading ? 'Processing...' : 'Checkout'}
          </button>
        </div>
      </div>

      {/* Receipt modal */}
      {receipt && (
        <Receipt
          order={receipt.order}
          items={receipt.items}
          total={receipt.total}
          onClose={() => setReceipt(null)}
        />
      )}
    </div>
  )
}