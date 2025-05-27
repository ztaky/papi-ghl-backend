const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Variables d'environnement
const PAPI_API_TOKEN = process.env.PAPI_API_TOKEN;
const GHL_CLIENT_ID = process.env.GHL_CLIENT_ID;
const GHL_CLIENT_SECRET = process.env.GHL_CLIENT_SECRET;
const BACKEND_URL = process.env.BACKEND_URL || 'https://ton-backend.vercel.app';

// Base de données en mémoire simple (remplace par une vraie DB en prod)
const integrations = new Map();

// ROUTE 1: Page de configuration (Custom Page)
app.get('/config', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Configuration Papi</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        button { background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .success { color: green; margin-top: 10px; }
        .error { color: red; margin-top: 10px; }
      </style>
    </head>
    <body>
      <h1>🏦 Configuration Papi Payment Gateway</h1>
      <p>Configurez vos clés API Papi pour activer les paiements.</p>
      
      <form id="configForm">
        <div class="form-group">
          <label>Mode Test API Token:</label>
          <input type="text" id="testToken" placeholder="Votre token de test Papi" />
        </div>
        
        <div class="form-group">
          <label>Mode Live API Token:</label>
          <input type="text" id="liveToken" placeholder="Votre token live Papi" />
        </div>
        
        <button type="submit">💾 Sauvegarder Configuration</button>
      </form>
      
      <div id="message"></div>
      
      <script>
        // Récupérer locationId depuis URL ou parent
        const urlParams = new URLSearchParams(window.location.search);
        const locationId = urlParams.get('locationId') || 'demo-location';
        
        document.getElementById('configForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const testToken = document.getElementById('testToken').value;
          const liveToken = document.getElementById('liveToken').value;
          const messageDiv = document.getElementById('message');
          
          try {
            const response = await fetch('/api/save-config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ locationId, testToken, liveToken })
            });
            
            const result = await response.json();
            
            if (result.success) {
              messageDiv.innerHTML = '<div class="success">✅ Configuration sauvegardée avec succès!</div>';
            } else {
              messageDiv.innerHTML = '<div class="error">❌ Erreur: ' + result.error + '</div>';
            }
          } catch (error) {
            messageDiv.innerHTML = '<div class="error">❌ Erreur de connexion</div>';
          }
        });
      </script>
    </body>
    </html>
  `);
});

// ROUTE 2: Sauvegarder la configuration
app.post('/api/save-config', async (req, res) => {
  const { locationId, testToken, liveToken } = req.body;
  
  try {
    // Sauvegarder en local
    integrations.set(locationId, { testToken, liveToken });
    
    // Créer la config dans GHL
    await createGHLIntegration(locationId, testToken, liveToken);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur sauvegarde config:', error);
    res.json({ success: false, error: error.message });
  }
});

// ROUTE 3: Callback OAuth GHL
app.get('/auth/callback', async (req, res) => {
  const { code, locationId } = req.query;
  
  try {
    // Échanger le code contre un access token
    const tokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', {
      client_id: GHL_CLIENT_ID,
      client_secret: GHL_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code
    });
    
    const { access_token } = tokenResponse.data;
    
    // Sauvegarder le token pour cette location
    const config = integrations.get(locationId) || {};
    config.accessToken = access_token;
    integrations.set(locationId, config);
    
    res.redirect(`/config?locationId=${locationId}`);
  } catch (error) {
    console.error('Erreur OAuth:', error);
    res.status(500).send('Erreur d\'authentification');
  }
});

// ROUTE 4: Page de paiement (iFrame)
app.get('/payment', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Paiement Papi</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .payment-form { max-width: 400px; margin: 0 auto; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        button { width: 100%; background: #28a745; color: white; padding: 15px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
        button:hover { background: #218838; }
        .loading { display: none; text-align: center; }
      </style>
    </head>
    <body>
      <div class="payment-form">
        <h2>💳 Paiement Sécurisé Papi</h2>
        <div id="paymentDetails"></div>
        
        <form id="paymentForm">
          <div class="form-group">
            <label>Numéro de carte:</label>
            <input type="text" id="cardNumber" placeholder="4000 0000 0000 5126" maxlength="19" />
          </div>
          
          <div class="form-group">
            <label>CVV:</label>
            <input type="text" id="cvv" placeholder="123" maxlength="3" />
          </div>
          
          <div class="form-group">
            <label>Expiration:</label>
            <input type="text" id="expiry" placeholder="01/2028" maxlength="7" />
          </div>
          
          <button type="submit">🔒 Payer Maintenant</button>
        </form>
        
        <div class="loading" id="loading">
          <p>⏳ Traitement du paiement en cours...</p>
        </div>
      </div>
      
      <script>
        let paymentData = null;
        
        // Signaler que l'iframe est prête
        window.parent.postMessage({ type: 'custom_provider_ready', loaded: true }, '*');
        
        // Écouter les données de paiement depuis GHL
        window.addEventListener('message', (event) => {
          if (event.data.type === 'payment_initiate_props') {
            paymentData = event.data;
            displayPaymentDetails();
          }
        });
        
        function displayPaymentDetails() {
          if (!paymentData) return;
          
          document.getElementById('paymentDetails').innerHTML = \`
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <h3>Détails du paiement</h3>
              <p><strong>Montant:</strong> \${paymentData.amount} \${paymentData.currency}</p>
              <p><strong>Client:</strong> \${paymentData.contact?.name || 'N/A'}</p>
            </div>
          \`;
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
            const response = await fetch('/api/process-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...paymentData,
                cardNumber: document.getElementById('cardNumber').value,
                cvv: document.getElementById('cvv').value,
                expiry: document.getElementById('expiry').value
              })
            });
            
            const result = await response.json();
            
            if (result.success) {
              // Notifier GHL du succès
              window.parent.postMessage({
                type: 'custom_element_success_response',
                chargeId: result.chargeId
              }, '*');
            } else {
              // Notifier GHL de l'erreur
              window.parent.postMessage({
                type: 'custom_element_error_response',
                error: { description: result.error }
              }, '*');
            }
          } catch (error) {
            window.parent.postMessage({
              type: 'custom_element_error_response',
              error: { description: 'Erreur de connexion' }
            }, '*');
          }
          
          loading.style.display = 'none';
          form.style.display = 'block';
        });
        
        // Formatage automatique de la carte
        document.getElementById('cardNumber').addEventListener('input', (e) => {
          let value = e.target.value.replace(/\\s/g, '');
          let formattedValue = value.replace(/(\\d{4})(?=\\d)/g, '$1 ');
          e.target.value = formattedValue;
        });
        
        // Formatage automatique expiration
        document.getElementById('expiry').addEventListener('input', (e) => {
          let value = e.target.value.replace(/\\D/g, '');
          if (value.length >= 2) {
            value = value.substring(0,2) + '/' + value.substring(2,6);
          }
          e.target.value = value;
        });
      </script>
    </body>
    </html>
  `);
});

// ROUTE 5: Traitement du paiement
app.post('/api/process-payment', async (req, res) => {
  const { amount, currency, contact, locationId, transactionId, orderId } = req.body;
  
  try {
    // Récupérer la config pour cette location
    const config = integrations.get(locationId);
    if (!config) {
      throw new Error('Configuration non trouvée pour cette location');
    }
    
    // Créer le lien de paiement Papi
    const papiResponse = await axios.post(
      'https://app.papi.mg/dashboard/api/payment-links',
      {
        amount: parseFloat(amount),
        validDuration: 1, // 1 heure
        clientName: contact?.name || 'Client',
        reference: transactionId,
        description: \`Commande \${orderId}\`,
        successUrl: \`\${BACKEND_URL}/payment/success\`,
        failureUrl: \`\${BACKEND_URL}/payment/failure\`,
        notificationUrl: \`\${BACKEND_URL}/webhooks/papi\`
      },
      {
        headers: {
          'Token': config.testToken || config.liveToken,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const { paymentReference } = papiResponse.data;
    
    res.json({
      success: true,
      chargeId: paymentReference
    });
    
  } catch (error) {
    console.error('Erreur paiement:', error.response?.data || error.message);
    res.json({
      success: false,
      error: 'Erreur lors du traitement du paiement'
    });
  }
});

// ROUTE 6: Vérification des paiements (appelée par GHL)
app.post('/query', async (req, res) => {
  const { type, transactionId, chargeId, apiKey } = req.body;
  
  try {
    if (type === 'verify') {
      // Pour l'instant, on considère tous les paiements comme réussis
      // En production, tu vérifierais le statut réel chez Papi
      res.json({ success: true });
    } else {
      res.json({ success: false, error: 'Type de requête non supporté' });
    }
  } catch (error) {
    console.error('Erreur vérification:', error);
    res.json({ success: false, error: error.message });
  }
});

// ROUTE 7: Webhooks Papi
app.post('/webhooks/papi', (req, res) => {
  const { paymentStatus, paymentReference, amount } = req.body;
  
  console.log('Webhook Papi reçu:', req.body);
  
  // Ici tu peux notifier GHL du changement de statut
  // via leur webhook endpoint si nécessaire
  
  res.status(200).send('OK');
});

// ROUTE 8: Webhooks GHL
app.post('/webhooks/ghl', (req, res) => {
  console.log('Webhook GHL reçu:', req.body);
  res.status(200).send('OK');
});

// Fonction utilitaire pour créer l'intégration dans GHL
async function createGHLIntegration(locationId, testToken, liveToken) {
  try {
    const config = integrations.get(locationId);
    if (!config?.accessToken) {
      console.log('Access token manquant pour', locationId);
      return;
    }
    
    const integrationData = {
      name: 'Papi Payment Gateway',
      description: 'Passerelle de paiement pour Madagascar et l\'Afrique',
      imageUrl: 'https://via.placeholder.com/100x100?text=PAPI',
      locationId: locationId,
      queryUrl: \`\${BACKEND_URL}/query\`,
      paymentsUrl: \`\${BACKEND_URL}/payment\`
    };
    
    await axios.post(
      'https://services.leadconnectorhq.com/payments/custom-provider',
      integrationData,
      {
        headers: {
          'Authorization': \`Bearer \${config.accessToken}\`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Intégration créée dans GHL pour', locationId);
  } catch (error) {
    console.error('Erreur création intégration GHL:', error.response?.data || error.message);
  }
}

// Route de test
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Backend Papi-GHL fonctionnel!',
    endpoints: {
      config: '/config',
      payment: '/payment',
      auth: '/auth/callback',
      query: '/query'
    }
  });
});

app.listen(PORT, () => {
  console.log(\`🚀 Serveur Papi-GHL démarré sur le port \${PORT}\`);
});
