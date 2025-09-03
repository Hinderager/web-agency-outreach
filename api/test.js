export default function handler(req, res) {
  res.status(200).json({
    status: 'working',
    timestamp: new Date().toISOString(),
    message: 'API endpoint is functional',
    method: req.method,
    url: req.url
  })
}
