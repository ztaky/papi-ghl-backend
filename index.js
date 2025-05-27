const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Variables d'environnement avec valeurs par défaut
const PAPI_API_TOKEN = process.env.PAPI_API_TOKEN || 'demo-token';
const GHL_CLIENT_ID = process.env.GHL_CLIENT_ID || 'demo-client-id';
const GHL_CLIENT_SECRET = process.env.GHL_CLIENT_SECRET || 'demo-secret';
const BACKEND_URL = process.env.BACKEND_URL || process.env.VERCEL_URL || 'http://localhost:3000';

// Base de données en mémoire simple
const integrations = new Map();

// ROUTE PRINCIPALE - Test de fonctionnement
app.get('/', (req, res) => {
  res.json({
    status: '🚀 Backend Papi-GHL fonctionnel!',
    version: '1.0.0',
    endpoints: {
      config: '/config',
      payment: '/payment',
      auth: '/auth/callback',
      query: '/query'
    },
    env: {
      hasToken: !!process.env.PAPI_API_TOKEN,
      backendUrl: BACKEND_URL
    }
  });
});

// ROUTE 1: Page de configuration (Custom Page)
app.get('/config', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Configuration Papi</title>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          padding: 20px; 
          max-width: 600px; 
          margin: 0 auto; 
          background: #f5f5f5;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .form-group { margin-bottom: 20px; }
        label { 
          display: block; 
          margin-bottom: 8px; 
          font-weight: bold; 
          color: #333;
        }
        input { 
          width: 100%; 
          padding: 12px; 
          border: 2px solid #ddd; 
          border-radius: 8px; 
          font-size: 16px;
          box-sizing: border-box;
        }
        input:focus {
          border-color: #007bff;
          outline: none;
        }
        button { 
          background: #007bff; 
          color: white; 
          padding: 15px 30px; 
          border: none; 
          border-radius: 8px; 
          cursor: pointer; 
          font-size: 16px;
          width: 100%;
        }
        button:hover { background: #0056b3; }
        .success { 
          color: #28a745; 
          background: #d4edda;
          padding: 15px;
          border-radius: 5px;
          margin-top: 15px; 
        }
        .error { 
          color: #dc3545; 
          background: #f8d7da;
          padding: 15px;
          border-radius: 5px;
          margin-top: 15px; 
        }
        .status {
          background: #e3f2fd;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏦 Configuration Papi Payment Gateway</h1>
        
        <div class="status">
          <strong>Status:</strong> Backend fonctionnel ✅<br>
          <strong>URL:</strong> ${BACKEND_URL}
        </div>
        
        <p>Configurez vos clés API Papi pour activer les paiements.</p>
        
        <form id="configForm">
          <div class="form-group">
            <label>🧪 Mode Test API Token:</label>
            <input type="text" id="testToken" placeholder="Votre token de test Papi" />
            <small>Utilisé pour les paiements de test</small>
          </div>
          
          <div class="form-group">
            <label>🔥 Mode Live API Token:</label>
            <input type="text" id="liveToken" placeholder="Votre token live Papi" />
            <small>Utilisé pour les vrais paiements</small>
          </div>
          
          <button type="submit">💾 Sauvegarder Configuration</button>
        </form>
        
        <div id="message"></div>
      </div>
      
      <script>
        // Récupérer locationId depuis URL
        const urlParams = new URLSearchParams(window.location.search);
        const locationId = urlParams.get('locationId') || 'demo-location-' + Date.now();
        
        console.log('LocationId:', locationId);
        
        document.getElementById('configForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const testToken = document.getElementById('testToken').value;
          const liveToken = document.getElementById('liveToken').value;
          const messageDiv = document.getElementById('message');
          
          if (!testToken && !liveToken) {
            messageDiv.innerHTML = '<div class="error">❌ Veuillez saisir au moins un token</div>';
            return;
          }
          
          try {
            const response = await fetch('/api/save-config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ locationId, testToken, liveToken })
            });
            
            const result = await response.json();
            
            if (result.success) {
              messageDiv.innerHTML = '<div class="success">✅ Configuration sauvegardée avec succès!</div>';
              // Optionnel: notification au parent iframe
              if (window.parent !== window) {
                window.parent.postMessage({ type: 'config_saved', locationId }, '*');
              }
            } else {
              messageDiv.innerHTML = '<div class="error">❌ Erreur: ' + (result.error || 'Erreur inconnue') + '</div>';
            }
          } catch (error) {
            console.error('Erreur:', error);
            messageDiv.innerHTML = '<div class="error">❌ Erreur de connexion au serveur</div>';
          }
        });
        
        // Test de connexion au chargement
        fetch('/api/test')
          .then(r => r.json())
          .then(data => console.log('Test API:', data))
          .catch(err => console.error('Erreur test API:', err));
      </script>
    </body>
    </html>
  `);
});

// ROUTE 2: Sauvegarder la configuration
app.post('/api/save-config', (req, res) => {
  try {
    const { locationId, testToken, liveToken } = req.body;
    
    if (!locationId) {
      return res.json({ success: false, error: 'LocationId manquant' });
    }
    
    // Sauvegarder en mémoire
    const config = {
      testToken: testToken || null,
      liveToken: liveToken || null,
      createdAt: new Date().toISOString(),
      locationId
    };
    
    integrations.set(locationId, config);
    
    console.log('Config sauvegardée pour:', locationId);
    
    res.json({ 
      success: true, 
      message: 'Configuration sauvegardée',
      locationId 
    });
    
  } catch (error) {
    console.error('Erreur sauvegarde config:', error);
    res.json({ success: false, error: error.message });
  }
});

// ROUTE 3: Test de l'API
app.get('/api/test', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    configurationsCount: integrations.size,
    env: {
      nodeVersion: process.version,
      platform: process.platform
    }
  });
});

// ROUTE 4: Callback OAuth GHL
app.get('/auth/callback', (req, res) => {
  const { code, locationId } = req.query;
  
  console.log('OAuth callback:', { code: !!code, locationId });
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Installation Papi</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
        .success { color: #28a745; font-size: 24px; }
        .button { 
          background: #007bff; 
          color: white; 
          padding: 15px 30px; 
          text-decoration: none; 
          border-radius: 5px; 
          display: inline-block; 
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <h1 class="success">✅ Installation réussie !</h1>
      <p>Papi Payment Gateway a été installé avec succès.</p>
      <a href="/config?locationId=${locationId || 'demo'}" class="button">
        🔧 Configurer maintenant
      </a>
      
      <script>
        // Redirection automatique après 3 secondes
        setTimeout(() => {
          window.location.href = '/config?locationId=${locationId || 'demo'}';
        }, 3000);
      </script>
    </body>
    </html>
  `);
});

// ROUTE 5: Page de paiement (iFrame)
app.get('/payment', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Paiement Papi</title>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          padding: 20px; 
          margin: 0;
          background: #f8f9fa;
        }
        .payment-container { 
          max-width: 400px; 
          margin: 0 auto; 
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .form-group { margin-bottom: 20px; }
        label { 
          display: block; 
          margin-bottom: 8px; 
          font-weight: bold;
          color: #333;
        }
        input { 
          width: 100%; 
          padding: 12px; 
          border: 2px solid #ddd; 
          border-radius: 8px; 
          font-size: 16px;
          box-sizing: border-box;
        }
        input:focus {
          border-color: #28a745;
          outline: none;
        }
        button { 
          width: 100%; 
          background: #28a745; 
          color: white; 
          padding: 15px; 
          border: none; 
          border-radius: 8px; 
          cursor: pointer; 
          font-size: 18px; 
          font-weight: bold;
        }
        button:hover { background: #218838; }
        .loading { 
          display: none; 
          text-align: center; 
          padding: 20px;
        }
        .payment-details {
          background: #e3f2fd;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 25px;
        }
        .demo-notice {
          background: #fff3cd;
          color: #856404;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="payment-container">
        <h2>💳 Paiement Sécurisé Papi</h2>
        
        <div class="demo-notice">
          <strong>Mode Démo:</strong> Utilisez la carte 4000 0000 0000 5126 pour tester
        </div>
        
        <div id="paymentDetails" class="payment-details">
          <p>⏳ Chargement des détails du paiement...</p>
        </div>
        
        <form id="paymentForm" style="display: none;">
          <div class="form-group">
            <label>💳 Numéro de carte:</label>
            <input 
              type="text" 
              id="cardNumber" 
              placeholder="4000 0000 0000 5126" 
              maxlength="19" 
              value="4000 0000 0000 5126"
            />
          </div>
          
          <div class="form-group">
            <label>🔒 CVV:</label>
            <input 
              type="text" 
              id="cvv" 
              placeholder="123" 
              maxlength="4"
              value="123"
            />
          </div>
          
          <div class="form-group">
            <label>📅 Expiration (MM/AA):</label>
            <input 
              type="text" 
              id="expiry" 
              placeholder="01/28" 
              maxlength="5"
              value="01/28"
            />
          </div>
          
          <button type="submit">🔒 Payer Maintenant</button>
        </form>
        
        <div class="loading" id="loading">
          <p>⏳ Traitement du paiement en cours...</p>
          <p>Veuillez patienter...</p>
        </div>
      </div>
      
      <script>
        let paymentData = null;
        
        console.log('Payment page loaded');
        
        // Signaler que l'iframe est prête
        function notifyReady() {
          const message = { 
            type: 'custom_provider_ready', 
            loaded: true,
            addCardOnFileSupported: false 
          };
          
          console.log('Sending ready message:', message);
          
          if (window.parent !== window) {
            window.parent.postMessage(message, '*');
          } else {
            console.log('Not in iframe - testing mode');
            // Mode test: simuler des données
            setTimeout(() => {
              const testData = {
                type: 'payment_initiate_props',
                amount: 100.00,
                currency: 'USD',
                contact: { name: 'Test Client', email: 'test@example.com' },
                orderId: 'TEST-001',
                transactionId: 'TXN-' + Date.now(),
                locationId: 'test-location'
              };
              handlePaymentData(testData);
            }, 1000);
          }
        }
        
        // Écouter les données de paiement depuis GHL
        window.addEventListener('message', (event) => {
          console.log('Received message:', event.data);
          
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
            <h3>💰 Détails du paiement</h3>
            <p><strong>Montant:</strong> \${paymentData.amount} \${paymentData.currency}</p>
            <p><strong>Client:</strong> \${paymentData.contact?.name || 'Non spécifié'}</p>
            <p><strong>Email:</strong> \${paymentData.contact?.email || 'Non spécifié'}</p>
            <p><strong>Commande:</strong> #\${paymentData.orderId || 'N/A'}</p>
          \`;
          
          document.getElementById('paymentDetails').innerHTML = detailsHtml;
        }
        
        // Gérer la soumission du formulaire
        document.getElementById('paymentForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          if (!paymentData) {
            alert('Données de paiement manquantes');
            return;
          }
          
          const loading = document.getElementById('loading');
          const form = document.getElementById('paymentForm');
          
          loading.style.display = 'block';
          form.style.display = 'none';
          
          try {
            // Simuler un délai de traitement
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Générer un ID de charge simulé
            const chargeId = 'papi_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            console.log('Payment successful, chargeId:', chargeId);
            
            // Notifier GHL du succès
            const successMessage = {
              type: 'custom_element_success_response',
              chargeId: chargeId
            };
            
            console.log('Sending success message:', successMessage);
            
            if (window.parent !== window) {
              window.parent.postMessage(successMessage, '*');
            } else {
              alert('Paiement simulé réussi! ChargeId: ' + chargeId);
            }
            
          } catch (error) {
            console.error('Payment error:', error);
            
            // Notifier GHL de l'erreur
            const errorMessage = {
              type: 'custom_element_error_response',
              error: { description: 'Erreur de traitement du paiement' }
            };
            
            console.log('Sending error message:', errorMessage);
            
            if (window.parent !== window) {
              window.parent.postMessage(errorMessage, '*');
            } else {
              alert('Erreur de paiement simulée');
            }
          }
          
          loading.style.display = 'none';
          form.style.display = 'block';
        });
        
        // Formatage automatique de la carte
        document.getElementById('cardNumber').addEventListener('input', (e) => {
          let value = e.target.value.replace(/\\s/g, '');
          let formattedValue = value.replace(/(\\d{4})(?=\\d)/g, '$1 ');
          if (formattedValue.length <= 19) {
            e.target.value = formattedValue;
          }
        });
        
        // Formatage automatique expiration
        document.getElementById('expiry').addEventListener('input', (e) => {
          let value = e.target.value.replace(/\\D/g, '');
          if (value.length >= 2) {
            value = value.substring(0,2) + '/' + value.substring(2,4);
          }
          e.target.value = value;
        });
        
        // Initialiser
        notifyReady();
      </script>
    </body>
    </html>
  `);
});

// ROUTE 6: Vérification des paiements (appelée par GHL)
app.post('/query', (req, res) => {
  try {
    const { type, transactionId, chargeId, apiKey } = req.body;
    
    console.log('Query received:', { type, transactionId, chargeId });
    
    if (type === 'verify') {
      // Pour l'instant, on considère tous les paiements comme réussis
      res.json({ success: true });
    } else if (type === 'refund') {
      // Gérer les remboursements plus tard
      res.json({ success: false, error: 'Remboursements non implémentés' });
    } else {
      res.json({ success: false, error: 'Type de requête non supporté: ' + type });
    }
  } catch (error) {
    console.error('Erreur query:', error);
    res.json({ success: false, error: error.message });
  }
});

// ROUTE 7: Webhooks Papi
app.post('/webhooks/papi', (req, res) => {
  console.log('Webhook Papi reçu:', req.body);
  
  try {
    const { paymentStatus, paymentReference, amount } = req.body;
    
    // Traiter la notification Papi
    if (paymentStatus === 'SUCCESS') {
      console.log('Paiement confirmé:', paymentReference);
      // Ici tu pourrais notifier GHL si nécessaire
    }
    
    res.status(200).json({ status: 'OK' });
  } catch (error) {
    console.error('Erreur webhook Papi:', error);
    res.status(500).json({ error: error.message });
  }
});

// ROUTE 8: Webhooks GHL
app.post('/webhooks/ghl', (req, res) => {
  console.log('Webhook GHL reçu:', req.body);
  res.status(200).json({ status: 'OK' });
});

// Export pour Vercel
module.exports = app;

// Démarrage local uniquement
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(\`🚀 Serveur Papi-GHL démarré sur le port \${PORT}\`);
    console.log(\`📍 URL: \${BACKEND_URL}\`);
  });
}
