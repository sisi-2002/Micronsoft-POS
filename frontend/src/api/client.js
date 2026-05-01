
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

export const getProducts   = ()       => api.get('/products/')
export const postCheckout  = (data)   => api.post('/checkout/', data)
export const postPurchase  = (data)   => api.post('/purchase/', data)
export const getAnalytics  = ()       => api.get('/analytics/')

export default api