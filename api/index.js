// api/index.js - Format Vercel standard

const integrations = new Map();

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, method } = req;
  const path = url.split('?')[0]; // Enlever les query params
  
  console.log(`${method} ${path}`);

  try {
    // Route principale
    if (path === '/' || path === '/api') {
      return res.json({
        status: '🚀 Backend Papi-GHL fonctionnel!',
        version: '4.0.0',
        timestamp: new Date().toISOString(),
        url: `https://${req.headers.host}`,
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
    
    // Route config
    if (path === '/config') {
      return res.setHeader('Content-Type', 'text/html').send(`
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
            <h1>🏦 Configuration Papi</h1>
            
            <div class="status">
              <strong>✅ Statut:</strong> Backend opérationnel<br>
              <strong>🌐 URL:</strong> https://${req.headers.host}<br>
              <strong>⏰ Timestamp:</strong> ${new Date().toLocaleString()}
            </div>
            
            <form id="configForm">
              <div class="form-group">
                <label>🧪 Token API Test</label>
                <input type="text" id="testToken" placeholder="Token de test Papi" />
                <small>Utilisé pour les paiements de test sans argent réel</small>
              </div>
              
              <div class="form-group">
                <label>🔥 Token API Production</label>
                <input type="password" id="liveToken" placeholder="Token de production Papi" />
                <small>Utilisé pour les vrais paiements</small>
              </div>
              
              <button type="submit">💾 Sauvegarder Configuration</button>
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
                messageDiv.innerHTML = '<div class="error">❌ Veuillez saisir au moins un token</div>';
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
                      ✅ Configuration sauvegardée avec succès!<br>
                      <strong>Location ID:</strong> \${locationId}
                    </div>
                  \`;
                } else {
                  messageDiv.innerHTML = \`<div class="error">❌ \${result.error || 'Erreur inconnue'}</div>\`;
                }
              } catch (error) {
                messageDiv.innerHTML = '<div class="error">❌ Erreur de connexion</div>';
              } finally {
                btn.textContent = '💾 Sauvegarder Configuration';
                btn.disabled = false;
              }
            });
            
            // Test de connexion
            fetch('/api/test')
              .then(r => r.json())
              .then(data => console.log('✅ Test réussi:', data))
              .catch(err => console.error('❌ Test échoué:', err));
          </script>
        </body>
        </html>
      `);
    }
    
    // Route save config
    if (path === '/api/save-config' && method === 'POST') {
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
      console.log('✅ Config sauvée:', locationId);
      
      return res.json({ 
        success: true, 
        message: 'Configuration sauvegardée',
        locationId,
        timestamp: new Date().toISOString()
      });
    }
    
    // Route test
    if (path === '/api/test') {
      return res.json({
        status: 'OK',
        service: 'Papi-GHL Integration',
        timestamp: new Date().toISOString(),
        configurationsCount: integrations.size,
        env: {
          nodeVersion: process.version,
          hasToken: !!process.env.PAPI_API_TOKEN,
          platform: process.platform
        }
      });
    }
    
    // Route payment
    if (path === '/payment') {
      return res.setHeader('Content-Type', 'text/html').send(\`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Paiement Papi</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { box-sizing: border-box; }
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
              font-size: 16px;
            }
            input:focus { border-color: #4facfe; outline: none; }
            .pay-btn { 
              width: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white; padding: 18px; border: none; border-radius: 12px; 
              cursor: pointer; font-size: 18px; font-weight: 700; text-transform: uppercase;
            }
            .pay-btn:hover { transform: translateY(-2px); }
            .loading { display: none; text-align: center; padding: 40px; }
            .details {
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: white; padding: 25px; border-radius: 12px; margin-bottom: 25px;
            }
            .demo {
              background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px;
              margin-bottom: 20px; font-size: 14px; border-left: 4px solid #ffc107;
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
              <p>Powered by Papi Madagascar</p>
            </div>
            
            <div class="content">
              <div class="demo">
                <strong>🧪 Mode Démo:</strong> Carte de test pré-remplie ci-dessous
              </div>
              
              <div id="paymentDetails" class="details">
                <div style="text-align: center;">
                  <div class="spinner"></div>
                  <p>Chargement des détails...</p>
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
                <h3>Traitement en cours...</h3>
                <p>Veuillez ne pas fermer cette fenêtre</p>
              </div>
            </div>
          </div>
          
          <script>
            let paymentData = null;
            
            function notifyReady() {
              const message = { 
                type: 'custom_provider_ready', 
                loaded: true,
                addCardOnFileSupported: false,
                timestamp: new Date().toISOString()
              };
              
              console.log('📤 Envoi message ready:', message);
              
              if (window.parent !== window) {
                window.parent.postMessage(message, '*');
              } else {
                console.log('🧪 Mode test détecté');
                setTimeout(() => {
                  const testData = {
                    type: 'payment_initiate_props',
                    amount: 150.00,
                    currency: 'USD',
                    contact: { 
                      name: 'Client Test', 
                      email: 'test@example.com',
                      phone: '+261 32 12 345 67'
                    },
                    orderId: 'ORDER-' + Date.now(),
                    transactionId: 'TXN-' + Date.now(),
                    locationId: 'test-location'
                  };
                  handlePaymentData(testData);
                }, 1500);
              }
            }
            
            window.addEventListener('message', (event) => {
              console.log('📨 Message reçu:', event.data);
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
              
              document.getElementById('paymentDetails').innerHTML = \\\`
                <h3 style="margin-top: 0;">💰 Récapitulatif</h3>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span>Montant:</span>
                  <strong>\\\${paymentData.amount} \\\${paymentData.currency}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span>Client:</span>
                  <strong>\\\${paymentData.contact?.name || 'Non spécifié'}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>Commande:</span>
                  <strong>#\\\${paymentData.orderId || 'N/A'}</strong>
                </div>
                <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.3); margin: 15px 0;">
                <div style="text-align: center; font-size: 14px; opacity: 0.9;">
                  🔒 Paiement 100% sécurisé
                </div>
              \\\`;
            }
            
            document.getElementById('paymentForm').addEventListener('submit', async (e) => {
              e.preventDefault();
              
              if (!paymentData) {
                alert('❌ Données de paiement manquantes');
                return;
              }
              
              const loading = document.getElementById('loading');
              const form = document.getElementById('paymentForm');
              
              form.style.display = 'none';
              loading.style.display = 'block';
              
              try {
                console.log('💳 Début traitement paiement...');
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                const chargeId = 'papi_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                
                console.log('✅ Paiement réussi, chargeId:', chargeId);
                
                const successMessage = {
                  type: 'custom_element_success_response',
                  chargeId: chargeId,
                  timestamp: new Date().toISOString()
                };
                
                console.log('📤 Envoi succès:', successMessage);
                
                if (window.parent !== window) {
                  window.parent.postMessage(successMessage, '*');
                } else {
                  alert('✅ Paiement simulé réussi!\\\\nID: ' + chargeId);
                  location.reload();
                }
                
              } catch (error) {
                console.error('❌ Erreur paiement:', error);
                
                const errorMessage = {
                  type: 'custom_element_error_response',
                  error: { description: 'Erreur lors du traitement du paiement' },
                  timestamp: new Date().toISOString()
                };
                
                if (window.parent !== window) {
                  window.parent.postMessage(errorMessage, '*');
                } else {
                  alert('❌ Erreur de paiement simulée');
                }
                
                form.style.display = 'block';
                loading.style.display = 'none';
              }
            });
            
            // Formatage automatique des champs
            document.getElementById('cardNumber').addEventListener('input', (e) => {
              let value = e.target.value.replace(/\\\\s/g, '').replace(/\\\\D/g, '');
              let formatted = value.replace(/(\\\\d{4})(?=\\\\d)/g, '$1 ');
              if (formatted.length <= 19) e.target.value = formatted;
            });
            
            document.getElementById('expiry').addEventListener('input', (e) => {
              let value = e.target.value.replace(/\\\\D/g, '');
              if (value.length >= 2) {
                value = value.substring(0,2) + '/' + value.substring(2,4);
              }
              e.target.value = value;
            });
            
            document.getElementById('cvv').addEventListener('input', (e) => {
              e.target.value = e.target.value.replace(/\\\\D/g, '');
            });
            
            // Initialisation
            notifyReady();
          </script>
        </body>
        </html>
      \`);
    }
    
    // Route auth callback
    if (path === '/auth/callback') {
      const urlObj = new URL(req.url, \`https://\${req.headers.host}\`);
      const code = urlObj.searchParams.get('code');
      const locationId = urlObj.searchParams.get('locationId');
      
      console.log('🔐 OAuth callback:', { code: !!code, locationId });
      
      return res.setHeader('Content-Type', 'text/html').send(\`
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
            <p>Papi Payment Gateway a été installé avec succès.</p>
            <p><strong>Location ID:</strong> \${locationId || 'Non spécifié'}</p>
            
            <a href="/config?locationId=\${locationId || 'demo'}" class="button">
              🔧 Configurer maintenant
            </a>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Redirection automatique dans <span id="countdown">5</span> secondes...
            </p>
          </div>
          
          <script>
            let count = 5;
            const countdown = document.getElementById('countdown');
            
            const timer = setInterval(() => {
              count--;
              countdown.textContent = count;
              
              if (count <= 0) {
                clearInterval(timer);
                window.location.href = '/config?locationId=\${locationId || 'demo'}';
              }
            }, 1000);
          </script>
        </body>
        </html>
      \`);
    }
    
    // Route query
    if (path === '/query' && method === 'POST') {
      const { type, transactionId, chargeId, apiKey } = req.body;
      
      console.log('🔍 Query reçue:', { type, transactionId, chargeId });
      
      if (type === 'verify') {
        console.log('✅ Vérification paiement:', chargeId);
        return res.json({ success: true });
      } else if (type === 'refund') {
        console.log('💰 Demande remboursement:', chargeId);
        return res.json({ success: false, error: 'Remboursements non implémentés' });
      } else {
        return res.json({ success: false, error: 'Type non supporté: ' + type });
      }
    }
    
    // Route webhooks
    if (path === '/webhooks/papi' && method === 'POST') {
      console.log('🔔 Webhook Papi:', req.body);
      return res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
    }
    
    if (path === '/webhooks/ghl' && method === 'POST') {
      console.log('🔔 Webhook GHL:', req.body);
      return res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
    }
    
    // 404
    return res.status(404).json({ 
      error: 'Route non trouvée', 
      path, 
      method,
      availableRoutes: ['/', '/config', '/payment', '/auth/callback', '/query']
    });
    
  } catch (error) {
    console.error('❌ Erreur handler:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
