// api/index.js - Version qui fonctionne à 100%

export default function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = {
      status: '🚀 Backend Papi-GHL opérationnel !',
      version: '5.0.0',
      timestamp: new Date().toISOString(),
      baseUrl: `https://${req.headers.host}`,
      method: req.method,
      path: req.url,
      endpoints: {
        home: '/',
        config: '/config',
        payment: '/payment',
        test: '/api/hello',
        saveConfig: '/api/save-config'
      },
      env: {
        nodeVersion: process.version,
        hasToken: !!process.env.PAPI_API_TOKEN
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
