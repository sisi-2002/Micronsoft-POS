import { Toaster, toast } from 'react-hot-toast'

export const notify = {
  success: (msg) => toast.success(msg, {
    duration: 3000,
    style: { background: '#10b981', color: '#fff', fontWeight: 600 }
  }),
  error: (msg) => toast.error(msg, {
    duration: 4000,
    style: { background: '#ef4444', color: '#fff', fontWeight: 600 }
  }),
  info: (msg) => toast(msg, {
    duration: 3000,
    icon: 'ℹ️',
    style: { background: '#3b82f6', color: '#fff', fontWeight: 600 }
  }),
}

export default function ToastProvider() {
  return <Toaster position="top-right" reverseOrder={false} />
}