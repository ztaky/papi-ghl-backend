// api/hello.js - Test simple pour vérifier que Vercel fonctionne

export default function handler(req, res) {
  res.status(200).json({
    message: '🎉 Vercel fonctionne !',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
}
