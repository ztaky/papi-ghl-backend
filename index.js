// index.js - Point d'entrée principal à la racine

const integrations = new Map();

module.exports = (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url, method } = req;
  console.log(`${method} ${url}`);

  try {
    // Route principale
    if (url === '/' || url === '/api') {
      return handleHome(req, res);
    }
    
    // Route config
    if (url === '/config' || url.startsWith('/config')) {
      return handleConfig(req, res);
    }
    
    // Route save config
    if (url === '/api/save-config' && method === 'POST') {
      return handleSaveConfig(req, res);
    }
    
    // Route test
    if (url === '/api/test') {
      return handleTest(req, res);
    }
    
    // Route payment
    if (url === '/payment' || url.startsWith('/payment')) {
      return handlePayment(req, res);
    }
    
    // Route auth callback
    if (url.startsWith('/auth/callback')) {
      return handleAuthCallback(req, res);
    }
    
    // Route query
    if (url === '/query' && method === 'POST') {
      return handleQuery(req, res);
    }
    
    // Route webhooks
    if (url === '/webhooks/papi' && method === 'POST') {
      return handleWebhookPapi(req, res);
    }
    
    if (url === '/webhooks/ghl' && method === 'POST') {
      return handleWebhookGHL(req, res);
    }
    
    // 404
    res.status(404).json({ 
      error: 'Route non trouvée', 
      url, 
      method,
      availableRoutes: ['/', '/config', '/payment', '/auth/callback', '/query']
    });
    
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      error: 'Erreur serveur', 
      message: error.message
    });
  }
};

function handleHome(req, res) {
  const backendUrl = `https://${req.headers.host}`;
  
  res.json({
    status: '🚀 Backend Papi-GHL fonctionnel!',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    url: backendUrl,
    endpoints: {
      config: '/config',
      payment: '/payment',
      auth: '/auth/callback',
      query: '/query',
      test: '/api/test'
    },
    env: {
      hasToken: !!process.env.PAPI_API_TOKEN,
      nodeVersion: process.version
    }
  });
}

function handleConfig(req, res) {
  const backendUrl = `https://${req.headers.host}`;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Configuration Papi</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          margin: 0; padding: 20px; background: #f5f7fa; min-height: 100vh;
        }
        .container {
          max-width: 600px; margin: 0 auto; background: white;
          padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        h1 { color: #2c3e50; text-align: center; margin-bottom: 30px; }
        .status {
          background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 30px;
          border-left: 4px solid #28a745;
        }
        .form-group { margin-bottom: 25px; }
        label { 
          display: block; margin-bottom: 8px; font-weight: 600; color: #34495e;
        }
        input { 
          width: 100%; padding: 15px; border: 2px solid #e9ecef; 
          border-radius: 8px; font-size: 16px; box-sizing: border-box;
        }
        input:focus { border-color: #007bff; outline: none; }
        button { 
          background: linear-gradient(135deg, #007bff, #0056b3);
          color: white; padding: 18px 30px; border: none; border-radius: 8px; 
          cursor: pointer; font-size: 16px; font-weight: 600; width: 100%;
        }
        button:hover { transform: translateY(-1px); }
        .success { 
          color: #28a745; background: #d4edda; padding: 15px; border-radius: 8px;
          margin-top: 20px; border-left: 4px solid #28a745;
        }
        .error { 
          color: #dc3545; background: #f8d7da; padding: 15px; border-radius: 8px;
          margin-top: 20px; border-left: 4px solid #dc3545;
        }
        small { color: #6c757d; font-size: 14px; margin-top: 5px; display: block; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏦 Configuration Papi</h1>
        
        <div class="status">
          <strong>✅ Statut:</strong> Backend opérationnel<br>
          <strong>🌐 URL:</strong> ${backendUrl}<br>
          <strong>⏰ Heure:</strong> ${new Date().toLocaleString()}
        </div>
        
        <form id="configForm">
          <div class="form-group">
            <label>🧪 Token API Test</label>
            <input type="text" id="testToken" placeholder="Token de test Papi" />
            <small>Pour les paiements de test (sans argent réel)</small>
          </div>
          
          <div class="form-group">
            <label>🔥 Token API Production</label>
            <input type="password" id="liveToken" placeholder="Token de production Papi" />
            <small>Pour les vrais paiements</small>
          </div>
          
          <button type="submit">💾 Sauvegarder</button>
        </form>
        
        <div id="message"></div>
      </div>
      
      <script>
        const urlParams = new URLSearchParams(window.location.search);
        const locationId = urlParams.get('locationId') || 'demo-' + Date.now();
        
        document.getElementById('configForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const testToken = document.getElementById('testToken').value.trim();
          const liveToken = document.getElementById('liveToken').value.trim();
          const messageDiv = document.getElementById('message');
          const btn = e.target.querySelector('button');
          
          if (!testToken && !liveToken) {
            messageDiv.innerHTML = '<div class="error">❌ Saisissez au moins un token</div>';
            return;
          }
          
          btn.textContent = '⏳ Sauvegarde...';
          btn.disabled = true;
          
          try {
            const response = await fetch('/api/save-config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ locationId, testToken, liveToken })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
              messageDiv.innerHTML = \`
                <div class="success">
                  ✅ Configuration sauvegardée!<br>
                  <strong>Location:</strong> \${locationId}
                </div>
              \`;
            } else {
              messageDiv.innerHTML = \`<div class="error">❌ \${result.error || 'Erreur inconnue'}</div>\`;
            }
          } catch (error) {
            messageDiv.innerHTML = '<div class="error">❌ Erreur de connexion</div>';
          } finally {
            btn.textContent = '💾 Sauvegarder';
            btn.disabled = false;
          }
        });
      </script>
    </body>
    </html>
  `);
}

function handleSaveConfig(req, res) {
  try {
    const { locationId, testToken, liveToken } = req.body;
    
    if (!locationId) {
      return res.status(400).json({ success: false, error: 'LocationId requis' });
    }
    
    if (!testToken && !liveToken) {
      return res.status(400).json({ success: false, error: 'Au moins un token requis' });
    }
    
    const config = {
      testToken: testToken || null,
      liveToken: liveToken || null,
      createdAt: new Date().toISOString(),
      locationId
    };
    
    integrations.set(locationId, config);
    console.log('Config sauvée:', locationId);
    
    res.json({ 
      success: true, 
      message: 'Configuration sauvegardée',
      locationId
    });
    
  } catch (error) {
    console.error('Erreur save config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

function handleTest(req, res) {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    configurationsCount: integrations.size,
    env: {
      nodeVersion: process.version,
      hasToken: !!process.env.PAPI_API_TOKEN
    }
  });
}

function handlePayment(req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Paiement Papi</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .container { 
          max-width: 400px; margin: 0 auto; background: white;
          border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white; padding: 30px; text-align: center;
        }
        .content { padding: 30px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; }
        input { 
          width: 100%; padding: 15px; border: 2px solid #e9ecef; border-radius: 10px; 
          font-size: 16px; box-sizing: border-box;
        }
        input:focus { border-color: #4facfe; outline: none; }
        .pay-btn { 
          width: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; padding: 18px; border: none; border-radius: 12px; 
          cursor: pointer; font-size: 18px; font-weight: 700;
        }
        .pay-btn:hover { transform: translateY(-2px); }
        .loading { display: none; text-align: center; padding: 40px; }
        .details {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white; padding: 25px; border-radius: 12px; margin-bottom: 25px;
        }
        .demo {
          background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px;
          margin-bottom: 20px; font-size: 14px;
        }
        .spinner {
          border: 3px solid #f3f3f3; border-top: 3px solid #667eea;
          border-radius: 50%; width: 40px; height: 40px;
          animation: spin 1s linear infinite; margin: 0 auto 20px;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💳 Paiement Sécurisé</h1>
          <p>Powered by Papi</p>
        </div>
        
        <div class="content">
          <div class="demo">
            <strong>🧪 Mode Démo:</strong> Carte de test pré-remplie
          </div>
          
          <div id="paymentDetails" class="details">
            <div style="text-align: center;">
              <div class="spinner"></div>
              <p>Chargement...</p>
            </div>
          </div>
          
          <form id="paymentForm" style="display: none;">
            <div class="form-group">
              <label>💳 Numéro de carte</label>
              <input type="text" id="cardNumber" value="4000 0000 0000 5126" maxlength="19" />
            </div>
            
            <div style="display: flex; gap: 15px;">
              <div class="form-group" style="flex: 1;">
                <label>📅 Expiration</label>
                <input type="text" id="expiry" value="01/28" maxlength="5" />
              </div>
              
              <div class="form-group" style="flex: 1;">
                <label>🔒 CVV</label>
                <input type="text" id="cvv" value="123" maxlength="4" />
              </div>
            </div>
            
            <button type="submit" class="pay-btn">🔒 Payer Maintenant</button>
          </form>
          
          <div class="loading" id="loading">
            <div class="spinner"></div>
            <h3>Traitement...</h3>
            <p>Veuillez patienter</p>
          </div>
        </div>
      </div>
      
      <script>
        let paymentData = null;
        
        function notifyReady() {
          const message = { 
            type: 'custom_provider_ready', 
            loaded: true,
            addCardOnFileSupported: false
          };
          
          console.log('Ready message:', message);
          
          if (window.parent !== window) {
            window.parent.postMessage(message, '*');
          } else {
            // Mode test
            setTimeout(() => {
              const testData = {
                type: 'payment_initiate_props',
                amount: 100.00,
                currency: 'USD',
                contact: { name: 'Test Client', email: 'test@example.com' },
                orderId: 'ORDER-' + Date.now(),
                transactionId: 'TXN-' + Date.now(),
                locationId: 'test-location'
              };
              handlePaymentData(testData);
            }, 1500);
          }
        }
        
        window.addEventListener('message', (event) => {
          if (event.data.type === 'payment_initiate_props') {
            handlePaymentData(event.data);
          }
        });
        
        function handlePaymentData(data) {
          paymentData = data;
          displayPaymentDetails();
          document.getElementById('paymentForm').style.display = 'block';
        }
        
        function displayPaymentDetails() {
          if (!paymentData) return;
          
          document.getElementById('paymentDetails').innerHTML = \`
            <h3 style="margin-top: 0;">💰 Récapitulatif</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Montant:</span>
              <strong>\${paymentData.amount} \${paymentData.currency}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Client:</span>
              <strong>\${paymentData.contact?.name || 'N/A'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Commande:</span>
              <strong>#\${paymentData.orderId || 'N/A'}</strong>
            </div>
          \`;
        }
        
        document.getElementById('paymentForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          if (!paymentData) {
            alert('Données manquantes');
            return;
          }
          
          const loading = document.getElementById('loading');
          const form = document.getElementById('paymentForm');
          
          form.style.display = 'none';
          loading.style.display = 'block';
          
          try {
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const chargeId = 'papi_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const successMessage = {
              type: 'custom_element_success_response',
              chargeId: chargeId
            };
            
            if (window.parent !== window) {
              window.parent.postMessage(successMessage, '*');
            } else {
              alert('Paiement simulé réussi! ID: ' + chargeId);
              location.reload();
            }
            
          } catch (error) {
            const errorMessage = {
              type: 'custom_element_error_response',
              error: { description: 'Erreur de paiement' }
            };
            
            if (window.parent !== window) {
              window.parent.postMessage(errorMessage, '*');
            } else {
              alert('Erreur simulée');
            }
            
            form.style.display = 'block';
            loading.style.display = 'none';
          }
        });
        
        // Formatage
        document.getElementById('cardNumber').addEventListener('input', (e) => {
          let value = e.target.value.replace(/\\s/g, '').replace(/\\D/g, '');
          let formatted = value.replace(/(\\d{4})(?=\\d)/g, '$1 ');
          if (formatted.length <= 19) e.target.value = formatted;
        });
        
        document.getElementById('expiry').addEventListener('input', (e) => {
          let value = e.target.value.replace(/\\D/g, '');
          if (value.length >= 2) {
            value = value.substring(0,2) + '/' + value.substring(2,4);
          }
          e.target.value = value;
        });
        
        document.getElementById('cvv').addEventListener('input', (e) => {
          e.target.value = e.target.value.replace(/\\D/g, '');
        });
        
        notifyReady();
      </script>
    </body>
    </html>
  `);
}

function handleAuthCallback(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const code = url.searchParams.get('code');
  const locationId = url.searchParams.get('locationId');
  
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Installation Réussie</title>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: Arial, sans-serif; padding: 40px; text-align: center; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; min-height: 100vh; margin: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .container {
          background: white; color: #333; padding: 40px; border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 500px;
        }
        .success { color: #27ae60; font-size: 48px; margin-bottom: 20px; }
        .button { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; padding: 15px 30px; text-decoration: none; 
          border-radius: 8px; display: inline-block; margin-top: 25px; font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success">✅</div>
        <h1>Installation réussie !</h1>
        <p>Papi Payment Gateway installé avec succès.</p>
        <p><strong>Location:</strong> ${locationId || 'N/A'}</p>
        
        <a href="/config?locationId=${locationId || 'demo'}" class="button">
          🔧 Configurer
        </a>
        
        <script>
          setTimeout(() => {
            window.location.href = '/config?locationId=${locationId || 'demo'}';
          }, 3000);
        </script>
      </div>
    </body>
    </html>
  `);
}

function handleQuery(req, res) {
  try {
    const { type, transactionId, chargeId } = req.body;
    
    console.log('Query:', { type, transactionId, chargeId });
    
    if (type === 'verify') {
      res.json({ success: true });
    } else {
      res.json({ success: false, error: 'Type non supporté: ' + type });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

function handleWebhookPapi(req, res) {
  console.log('Webhook Papi:', req.body);
  res.status(200).json({ status: 'OK' });
}

function handleWebhookGHL(req, res) {
  console.log('Webhook GHL:', req.body);
  res.status(200).json({ status: 'OK' });
}
