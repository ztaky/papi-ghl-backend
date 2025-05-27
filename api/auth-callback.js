// api/auth-callback.js - Callback OAuth

export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'text/html');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Récupérer les paramètres de l'URL
  const url = new URL(req.url, `https://${req.headers.host}`);
  const code = url.searchParams.get('code');
  const locationId = url.searchParams.get('locationId');
  
  console.log('🔐 OAuth callback reçu:', { code: !!code, locationId });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Installation Papi</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          margin: 0; padding: 40px; text-align: center; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
        }
        .container {
          background: white; color: #333; padding: 40px; border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 500px; width: 100%;
        }
        .success { color: #27ae60; font-size: 48px; margin-bottom: 20px; }
        h1 { margin-bottom: 20px; color: #2c3e50; }
        p { margin-bottom: 15px; color: #6c757d; }
        .button { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; padding: 15px 30px; text-decoration: none; 
          border-radius: 8px; display: inline-block; margin-top: 25px; 
          font-weight: 600; transition: transform 0.2s;
        }
        .button:hover { transform: translateY(-2px); }
        .info {
          background: #f8f9fa; padding: 20px; border-radius: 8px; 
          margin: 20px 0; text-align: left;
        }
        .countdown {
          color: #007bff; font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success">✅</div>
        <h1>Installation réussie !</h1>
        <p>Papi Payment Gateway a été installé avec succès sur votre compte GoHighLevel.</p>
        
        <div class="info">
          <strong>📋 Informations d'installation :</strong><br>
          <strong>Location ID :</strong> ${locationId || 'Non spécifié'}<br>
          <strong>Code OAuth :</strong> ${code ? '✅ Reçu' : '❌ Manquant'}<br>
          <strong>Timestamp :</strong> ${new Date().toLocaleString()}
        </div>
        
        <p>Vous allez maintenant pouvoir configurer vos clés API Papi.</p>
        
        <a href="/config?locationId=${locationId || 'demo'}" class="button">
          🔧 Configurer maintenant
        </a>
        
        <p style="margin-top: 30px; font-size: 14px; color: #666;">
          Redirection automatique dans <span class="countdown" id="countdown">5</span> secondes...
        </p>
      </div>
      
      <script>
        console.log('🔐 Callback OAuth:', {
          code: '${code || 'none'}',
          locationId: '${locationId || 'none'}'
        });
        
        let count = 5;
        const countdown = document.getElementById('countdown');
        
        const timer = setInterval(() => {
          count--;
          countdown.textContent = count;
          
          if (count <= 0) {
            clearInterval(timer);
            window.location.href = '/config?locationId=${locationId || 'demo'}';
          }
        }, 1000);
        
        // Permettre la redirection manuelle
        document.querySelector('.button').addEventListener('click', () => {
          clearInterval(timer);
        });
      </script>
    </body>
    </html>
  `;

  return res.status(200).send(html);
}
