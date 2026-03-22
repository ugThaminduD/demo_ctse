const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')
const helmet = require('helmet')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(helmet())
app.use(cors())

const PORT = process.env.PORT || 3005
const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001'
const COURSE_URL = process.env.COURSE_SERVICE_URL || 'http://localhost:3002'
const ENROLL_URL = process.env.ENROLLMENT_SERVICE_URL || 'http://localhost:3003'
const NOTIFY_URL =
  process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004'

const proxyDefaults = {
  changeOrigin: true,
  proxyTimeout: 10000,
  timeout: 10000,
  onError(err, req, res) {
    console.error('Proxy error:', err.message)
    if (!res.headersSent) {
      res.status(502).json({ error: 'Bad gateway' })
    }
  },
}

app.use(
  '/api/auth',
  createProxyMiddleware({ target: AUTH_URL, ...proxyDefaults }),
)
app.use(
  '/api/users',
  createProxyMiddleware({ target: AUTH_URL, ...proxyDefaults }),
)
app.use(
  '/api/courses',
  createProxyMiddleware({ target: COURSE_URL, ...proxyDefaults }),
)
app.use(
  '/api/enrollments',
  createProxyMiddleware({ target: ENROLL_URL, ...proxyDefaults }),
)
app.use(
  '/api/notifications',
  createProxyMiddleware({ target: NOTIFY_URL, ...proxyDefaults }),
)

app.get('/health', (req, res) =>
  res.json({ status: 'API Gateway OK', port: PORT }),
)

app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`))
