// api/index.js - Point d'entrée principal pour Vercel

// Base de données en mémoire simple
const integrations = new Map();

export default function handler(req, res) {
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
    if (url === '/config' || url === '/api/config') {
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
    if (url === '/payment' || url === '/api/payment') {
      return handlePayment(req, res);
    }
    
    // Route auth callback
    if (url.startsWith('/auth/callback')) {
      return handleAuthCallback(req, res);
    }
    
    // Route query
    if (url === '/query' || url === '/api/query') {
      return handleQuery(req, res);
    }
    
    // Route webhooks
    if (url === '/webhooks/papi' || url === '/api/webhooks/papi') {
      return handleWebhookPapi(req, res);
    }
    
    if (url === '/webhooks/ghl' || url === '/api/webhooks/ghl') {
      return handleWebhookGHL(req, res);
    }
    
    // 404
    res.status(404).json({ error: 'Route non trouvée', url, method });
    
  } catch (error) {
    console.error('Erreur handler:', error);
    res.status(500).json({ 
      error: 'Erreur serveur', 
      message: error.message,
      stack: error.stack 
    });
  }
}

// Handlers pour chaque route
function handleHome(req, res) {
  const BACKEND_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  
  res.json({
    status: '🚀 Backend Papi-GHL fonctionnel!',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      config: '/config',
      payment: '/payment',
      auth: '/auth/callback',
      query: '/query',
      test: '/api/test'
    },
    env: {
      hasToken: !!process.env.PAPI_API_TOKEN,
      backendUrl: BACKEND_URL,
      nodeVersion: process.version
    }
  });
}

function handleConfig(req, res) {
  const BACKEND_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  
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
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 20px; 
          max-width: 600px; 
          margin: 0 auto; 
          background: #f8f9fa;
          line-height: 1.6;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        h1 {
          color: #2c3e50;
          text-align: center;
          margin-bottom: 30px;
        }
        .form-group { 
          margin-bottom: 25px; 
        }
        label { 
          display: block; 
          margin-bottom: 8px; 
          font-weight: 600; 
          color: #34495e;
        }
        input { 
          width: 100%; 
          padding: 15px; 
          border: 2px solid #e9ecef; 
          border-radius: 8px; 
          font-size: 16px;
          box-sizing: border-box;
          transition: border-color 0.3s;
        }
        input:focus {
          border-color: #3498db;
          outline: none;
          box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }
        button { 
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white; 
          padding: 18px 30px; 
          border: none; 
          border-radius: 8px; 
          cursor: pointer; 
          font-size: 16px;
          font-weight: 600;
          width: 100%;
          transition: transform 0.2s;
        }
        button:hover { 
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
        }
        .success { 
          color: #27ae60; 
          background: #d5f4e6;
          padding: 15px;
          border-radius: 8px;
          margin-top: 20px; 
          border-left: 4px solid #27ae60;
        }
        .error { 
          color: #e74c3c; 
          background: #fdeaea;
          padding: 15px;
          border-radius: 8px;
          margin-top: 20px; 
          border-left: 4px solid #e74c3c;
        }
        .status {
          background: #e8f4fd;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          border-left: 4px solid #3498db;
        }
        small {
          color: #7f8c8d;
          font-size: 14px;
          margin-top: 5px;
          display: block;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏦 Configuration Papi Payment Gateway</h1>
        
        <div class="status">
          <strong>✅ Status:</strong> Backend fonctionnel<br>
          <strong>🌐 URL:</strong> ${BACKEND_URL}<br>
          <strong>⏰ Dernière mise à jour:</strong> ${new Date().toLocaleString()}
        </div>
        
        <p style="text-align: center; color: #7f8c8d; margin-bottom: 30px;">
          Configurez vos clés API Papi pour activer les paiements sécurisés
        </p>
        
        <form id="configForm">
          <div class="form-group">
            <label>🧪 Token API Mode Test</label>
            <input 
              type="text" 
              id="testToken" 
              placeholder="Saisissez votre token de test Papi"
              autocomplete="off"
            />
            <small>Ce token sera utilisé pour les paiements de test (aucun argent réel)</small>
          </div>
          
          <div class="form-group">
            <label>🔥 Token API Mode Production</label>
            <input 
              type="password" 
              id="liveToken" 
              placeholder="Saisissez votre token de production Papi"
              autocomplete="off"
            />
            <small>Ce token sera utilisé pour les vrais paiements avec de l'argent réel</small>
          </div>
          
          <button type="submit">💾 Sauvegarder la Configuration</button>
        </form>
        
        <div id="message"></div>
        
        <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center;">
          <small style="color: #6c757d;">
            🔒 Vos tokens sont stockés de manière sécurisée et ne sont jamais partagés
          </small>
        </div>
      </div>
      
      <script>
        // Récupérer locationId depuis URL
        const urlParams = new URLSearchParams(window.location.search);
        const locationId = urlParams.get('locationId') || 'demo-location-' + Date.now();
        
        console.log('🏢 LocationId:', locationId);
        console.log('🌐 Backend URL:', '${BACKEND_URL}');
        
        document.getElementById('configForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const testToken = document.getElementById('testToken').value.trim();
          const liveToken = document.getElementById('liveToken').value.trim();
          const messageDiv = document.getElementById('message');
          const submitBtn = e.target.querySelector('button');
          
          if (!testToken && !liveToken) {
            messageDiv.innerHTML = '<div class="error">❌ Veuillez saisir au moins un token (test ou production)</div>';
            return;
          }
          
          // UI feedback
          submitBtn.textContent = '⏳ Sauvegarde en cours...';
          submitBtn.disabled = true;
          
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
                  ✅ Configuration sauvegardée avec succès!<br>
                  <strong>Location:</strong> \${result.locationId}<br>
                  <strong>Tokens configurés:</strong> \${testToken ? '🧪 Test' : ''} \${liveToken ? '🔥 Production' : ''}
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
            submitBtn.textContent = '💾 Sauvegarder la Configuration';
            submitBtn.disabled = false;
          }
        });
        
        // Test de connexion au chargement
        fetch('/api/test')
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
  `);
}

function handleSaveConfig(req, res) {
  try {
    const { locationId, testToken, liveToken } = req.body;
    
    if (!locationId) {
      return res.status(400).json({ 
        success: false, 
        error: 'LocationId est requis' 
      });
    }
    
    // Validation des tokens
    if (!testToken && !liveToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Au moins un token (test ou live) est requis' 
      });
    }
    
    // Sauvegarder en mémoire
    const config = {
      testToken: testToken || null,
      liveToken: liveToken || null,
      createdAt: new Date().toISOString(),
      locationId,
      lastUpdated: new Date().toISOString()
    };
    
    integrations.set(locationId, config);
    
    console.log('✅ Config sauvegardée pour:', locationId);
    
    res.json({ 
      success: true, 
      message: 'Configuration sauvegardée avec succès',
      locationId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur sauvegarde config:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

function handleTest(req, res) {
  res.json({
    status: 'OK',
    service: 'Papi-GHL Integration',
    timestamp: new Date().toISOString(),
    configurationsCount: integrations.size,
    env: {
      nodeVersion: process.version,
      platform: process.platform,
      hasToken: !!process.env.PAPI_API_TOKEN,
      vercelUrl: process.env.VERCEL_URL
    },
    uptime: process.uptime()
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
        * { box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .payment-container { 
          max-width: 450px; 
          margin: 0 auto; 
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .content {
          padding: 30px;
        }
        .form-group { margin-bottom: 25px; }
        label { 
          display: block; 
          margin-bottom: 8px; 
          font-weight: 600;
          color: #2c3e50;
        }
        input { 
          width: 100%; 
          padding: 15px; 
          border: 2px solid #e9ecef; 
          border-radius: 10px; 
          font-size: 16px;
          transition: all 0.3s;
        }
        input:focus {
          border-color: #4facfe;
          outline: none;
          box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.1);
        }
        .pay-button { 
          width: 100%; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 18px; 
          border: none; 
          border-radius: 12px; 
          cursor: pointer; 
          font-size: 18px; 
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: transform 0.2s;
        }
        .pay-button:hover { 
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
        }
        .loading { 
          display: none; 
          text-align: center; 
          padding: 40px;
        }
        .payment-details {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 25px;
          border-radius: 12px;
          margin-bottom: 30px;
        }
        .demo-notice {
          background: #fff3cd;
          color: #856404;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 25px;
          font-size: 14px;
          border-left: 4px solid #ffc107;
        }
        .spinner {
          border: 3px solid #f3f3f3;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="payment-container">
        <div class="header">
          <h1>💳 Paiement Sécurisé</h1>
          <p>Powered by Papi Madagascar</p>
        </div>
        
        <div class="content">
          <div class="demo-notice">
            <strong>🧪 Mode Démo:</strong> Utilisez la carte de test pré-remplie ci-dessous
          </div>
          
          <div id="paymentDetails" class="payment-details">
            <div style="text-align: center;">
              <div class="spinner"></div>
              <p>⏳ Chargement des détails du paiement...</p>
            </div>
          </div>
          
          <form id="paymentForm" style="display: none;">
            <div class="form-group">
              <label>💳 Numéro de carte</label>
              <input 
                type="text" 
                id="cardNumber" 
                placeholder="0000 0000 0000 0000" 
                maxlength="19" 
                value="4000 0000 0000 5126"
                autocomplete="cc-number"
              />
            </div>
            
            <div style="display: flex; gap: 15px;">
              <div class="form-group" style="flex: 1;">
                <label>📅 Expiration</label>
                <input 
                  type="text" 
                  id="expiry" 
                  placeholder="MM/AA" 
                  maxlength="5"
                  value="01/28"
                  autocomplete="cc-exp"
                />
              </div>
              
              <div class="form-group" style="flex: 1;">
                <label>🔒 CVV</label>
                <input 
                  type="text" 
                  id="cvv" 
                  placeholder="123" 
                  maxlength="4"
                  value="123"
                  autocomplete="cc-csc"
                />
              </div>
            </div>
            
            <button type="submit" class="pay-button">
              🔒 Payer Maintenant
            </button>
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
        
        console.log('💳 Payment page loaded');
        
        // Signaler que l'iframe est prête
        function notifyReady() {
          const message = { 
            type: 'custom_provider_ready', 
            loaded: true,
            addCardOnFileSupported: false,
            timestamp: new Date().toISOString()
          };
          
          console.log('📤 Sending ready message:', message);
          
          if (window.parent !== window) {
            window.parent.postMessage(message, '*');
          } else {
            console.log('🧪 Mode test - simulation des données');
            // Simuler des données de test
            setTimeout(() => {
              const testData = {
                type: 'payment_initiate_props',
                amount: 150.00,
                currency: 'USD',
                contact: { 
                  name: 'Jean Dupont', 
                  email: 'jean.dupont@example.com',
                  phone: '+261 32 12 345 67'
                },
                orderId: 'ORDER-' + Date.now(),
                transactionId: 'TXN-' + Date.now(),
                locationId: 'test-location-' + Date.now()
              };
              handlePaymentData(testData);
            }, 1500);
          }
        }
        
        // Écouter les messages du parent
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
          
          const detailsHtml = \`
            <h3 style="margin-top: 0;">💰 Récapitulatif</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Montant:</span>
              <strong>\${paymentData.amount} \${paymentData.currency}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Client:</span>
              <strong>\${paymentData.contact?.name || 'Non spécifié'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Commande:</span>
              <strong>#\${paymentData.orderId || 'N/A'}</strong>
            </div>
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.3); margin: 15px 0;">
            <div style="text-align: center; font-size: 14px; opacity: 0.9;">
              🔒 Paiement 100% sécurisé
            </div>
          \`;
          
          document.getElementById('paymentDetails').innerHTML = detailsHtml;
        }
        
        // Gérer le paiement
        document.getElementById('paymentForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          if (!paymentData) {
            alert('❌ Données de paiement manquantes');
            return;
          }
          
          const loading = document.getElementById('loading');
          const form = document.getElementById('paymentForm');
          
          // Animation de chargement
          form.style.display = 'none';
          loading.style.display = 'block';
          
          try {
            // Simuler le traitement
            console.log('💳 Traitement du paiement...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Générer un ID de transaction
            const chargeId = 'papi_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            console.log('✅ Paiement réussi, chargeId:', chargeId);
            
            // Notifier le succès
            const successMessage = {
              type: 'custom_element_success_response',
              chargeId: chargeId,
              timestamp: new Date().toISOString()
            };
            
            console.log('📤 Envoi du succès:', successMessage);
            
            if (window.parent !== window) {
              window.parent.postMessage(successMessage, '*');
            } else {
              alert('✅ Paiement simulé réussi!\\nChargeId: ' + chargeId);
              location.reload();
            }
            
          } catch (error) {
            console.error('❌ Erreur paiement:', error);
            
            const errorMessage = {
              type: 'custom_element_error_response',
              error: { description: 'Erreur lors du traitement du paiement' },
              timestamp: new Date().toISOString()
            };
            
            console.log('📤 Envoi de l\\'erreur:', errorMessage);
            
            if (window.parent !== window) {
              window.parent.postMessage(errorMessage, '*');
            } else {
              alert('❌ Erreur de paiement simulée');
            }
            
            form.style.display = 'block';
            loading.style.display = 'none';
          }
        });
        
        // Formatage des champs
        document.getElementById('cardNumber').addEventListener('input', (e) => {
          let value = e.target.value.replace(/\\s/g, '').replace(/\\D/g, '');
          let formattedValue = value.replace(/(\\d{4})(?=\\d)/g, '$1 ');
          if (formattedValue.length <= 19) {
            e.target.value = formattedValue;
          }
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
        
        // Initialiser
        notifyReady();
      </script>
    </body>
    </html>
  `);
}

function handleAuthCallback(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const code = url.searchParams.get('code');
  const locationId = url.searchParams.get('locationId');
  
  console.log('🔐 OAuth callback:', { code: !!code, locationId });
  
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Installation Papi</title>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          padding: 40px; 
          text-align: center; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          background: white;
          color: #333;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          max-width: 500px;
        }
        .success { color: #27ae60; font-size: 48px; margin-bottom: 20px; }
        .button { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 15px 30px; 
          text-decoration: none; 
          border-radius: 8px; 
          display: inline-block; 
          margin-top: 25px;
          font-weight: 600;
          transition: transform 0.2s;
        }
        .button:hover {
          transform: translateY(-2px);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success">✅</div>
        <h1>Installation réussie !</h1>
        <p>Papi Payment Gateway a été installé avec succès sur votre compte GoHighLevel.</p>
        <p><strong>Location ID:</strong> ${locationId || 'Non spécifié'}</p>
        
        <a href="/config?locationId=${locationId || 'demo'}" class="button">
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
            window.location.href = '/config?locationId=${locationId || 'demo'}';
          }
        
