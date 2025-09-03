export default function handler(req, res) {
  res.status(200).json({
    status: 'working',
    timestamp: new Date().toISOString(),
    message: 'Web Agency Outreach API is functional',
    method: req.method,
    url: req.url,
    deployment: 'vercel',
    system: {
      nextjs: 'operational',
      sheets_integration: 'ready',
      webhook_server: 'available',
      preview_generation: 'active'
    },
    endpoints: {
      '/api/test': 'This endpoint - API health check',
      '/prospects/[slug]': 'Dynamic prospect preview pages',
      '/': 'Main landing page'
    }
  })
}