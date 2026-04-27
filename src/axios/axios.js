import axios from "axios";
import Cookies from 'js-cookie';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get('wezume_auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return axiosInstance(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const expiredToken = Cookies.get('wezume_auth_token')

      try {
        const res = await axiosInstance.post(
          '/api/refresh-token',
          null,
          { headers: { Authorization: `Bearer ${expiredToken}` }, _retry: true }
        )
        const newToken = res.data.token
        Cookies.set('wezume_auth_token', newToken, { expires: 0.5, sameSite: 'strict' })
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        processQueue(null, newToken)
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        Cookies.remove('wezume_auth_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance;