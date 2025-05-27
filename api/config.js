// api/config.js - Page de configuration séparée

export default function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'text/html');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Configuration Papi</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          margin: 0; padding: 20px; background: #f8f9fa; min-height: 100vh;
        }
        .container {
          max-width: 600px; margin: 0 auto; background: white;
          padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        h1 { color: #2c3e50; text-align: center; margin-bottom: 30px; }
        .status {
          background: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 30px;
          border-left: 4px solid #28a745; color: #155724;
        }
        .form-group { margin-bottom: 25px; }
        label { 
          display: block; margin-bottom: 8px; font-weight: 600; color: #495057;
        }
        input { 
          width: 100%; padding: 15px; border: 2px solid #ced4da; 
          border-radius: 8px; font-size: 16px;
        }
        input:focus { border-color: #007bff; outline: none; }
        button { 
          background: #007bff; color: white; padding: 15px 30px; border: none; 
          border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; width: 100%;
        }
        button:hover { background: #0056b3; }
        button:disabled { background: #6c757d; cursor: not-allowed; }
        .success { 
          color: #155724; background: #d4edda; padding: 15px; border-radius: 8px;
          margin-top: 20px; border-left: 4px solid #28a745;
        }
        .error { 
          color: #721c24; background: #f8d7da; padding: 15px; border-radius: 8px;
          margin-top: 20px; border-left: 4px solid #dc3545;
        }
        small { color: #6c757d; font-size: 14px; margin-top: 5px; display: block; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏦 Configuration Papi Payment Gateway</h1>
        
        <div class="status">
          <strong>✅ Statut:</strong> Backend opérationnel<br>
          <strong>🌐 URL:</strong> https://${req.headers.host}<br>
          <strong>⏰ Timestamp:</strong> ${new Date().toLocaleString()}
        </div>
        
        <form id="configForm">
          <div class="form-group">
            <label>🧪 Token API Test</label>
            <input type="text" id="testToken" placeholder="Saisissez votre token de test Papi" />
            <small>Utilisé pour les paiements de test (aucun argent réel)</small>
          </div>
          
          <div class="form-group">
            <label>🔥 Token API Production</label>
            <input type="password" id="liveToken" placeholder="Saisissez votre token de production Papi" />
            <small>Utilisé pour les vrais paiements avec de l'argent réel</small>
          </div>
          
          <button type="submit" id="saveBtn">💾 Sauvegarder Configuration</button>
        </form>
        
        <div id="message"></div>
      </div>
      
      <script>
        const urlParams = new URLSearchParams(window.location.search);
        const locationId = urlParams.get('locationId') || 'demo-' + Date.now();
        
        console.log('🏢 LocationId:', locationId);
        
        document.getElementById('configForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const testToken = document.getElementById('testToken').value.trim();
          const liveToken = document.getElementById('liveToken').value.trim();
          const messageDiv = document.getElementById('message');
          const saveBtn = document.getElementById('saveBtn');
          
          if (!testToken && !liveToken) {
            messageDiv.innerHTML = '<div class="error">❌ Veuillez saisir au moins un token (test ou production)</div>';
            return;
          }
          
          // Feedback UI
          saveBtn.textContent = '⏳ Sauvegarde en cours...';
          saveBtn.disabled = true;
          
          try {
            const response = await fetch('/api/save-config', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({ 
                locationId, 
                testToken, 
                liveToken 
              })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
              messageDiv.innerHTML = \`
                <div class="success">
                  ✅ Configuration sauvegardée avec succès !<br>
                  <strong>Location ID:</strong> \${locationId}<br>
                  <strong>Tokens configurés:</strong> \${testToken ? '🧪 Test ' : ''}\${liveToken ? '🔥 Production' : ''}
                </div>
              \`;
              
              // Notification au parent iframe si applicable
              if (window.parent !== window) {
                window.parent.postMessage({ 
                  type: 'config_saved', 
                  locationId,
                  hasTest: !!testToken,
                  hasLive: !!liveToken
                }, '*');
              }
            } else {
              throw new Error(result.error || 'Erreur inconnue');
            }
          } catch (error) {
            console.error('❌ Erreur:', error);
            messageDiv.innerHTML = \`
              <div class="error">
                ❌ Erreur de sauvegarde: \${error.message}<br>
                <small>Vérifiez votre connexion et réessayez</small>
              </div>
            \`;
          } finally {
            saveBtn.textContent = '💾 Sauvegarder Configuration';
            saveBtn.disabled = false;
          }
        });
        
        // Test de connexion au chargement
        fetch('/api/hello')
          .then(r => r.json())
          .then(data => {
            console.log('✅ Test API réussi:', data);
          })
          .catch(err => {
            console.error('❌ Erreur test API:', err);
          });
      </script>
    </body>
    </html>
  `;

  return res.status(200).send(html);
}
