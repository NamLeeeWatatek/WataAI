import { toast as sonnerToast } from 'sonner'

export const toast = {
  success: (message: string, options?: any) => {
    return sonnerToast.success(message, options)
  },

  error: (message: string, options?: any) => {
    return sonnerToast.error(message, options)
  },

  loading: (message: string, options?: any) => {
    return sonnerToast.loading(message, options)
  },

  info: (message: string, options?: any) => {
    return sonnerToast.info(message, options)
  },

  warning: (message: string, options?: any) => {
    return sonnerToast.warning(message, options)
  },

  promise: <T,>(
    promise: Promise<T>,
    msgs: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((_error: any) => string)
    },
    options?: any
  ) => {
    return sonnerToast.promise(promise, msgs as any)
  },

  dismiss: (toastId?: string | number) => {
    return sonnerToast.dismiss(toastId)
  },
}

export default toast

