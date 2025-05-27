// api/payment.js - Page de paiement séparée

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
          font-size: 16px; transition: border-color 0.3s;
        }
        input:focus { border-color: #4facfe; outline: none; }
        .pay-btn { 
          width: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; padding: 18px; border: none; border-radius: 12px; 
          cursor: pointer; font-size: 18px; font-weight: 700; text-transform: uppercase;
          transition: transform 0.2s;
        }
        .pay-btn:hover { transform: translateY(-2px); }
        .pay-btn:disabled { background: #6c757d; cursor: not-allowed; transform: none; }
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
        .flex { display: flex; gap: 15px; }
        .flex .form-group { flex: 1; }
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
            <strong>🧪 Mode Démo:</strong> Utilisez la carte de test pré-remplie ci-dessous
          </div>
          
          <div id="paymentDetails" class="details">
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
            
            <div class="flex">
              <div class="form-group">
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
              
              <div class="form-group">
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
            
            <button type="submit" class="pay-btn" id="payBtn">
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
        
        console.log('💳 Page de paiement chargée');
        
        // Signaler que l'iframe est prête
        function notifyReady() {
          const message = { 
            type: 'custom_provider_ready', 
            loaded: true,
            addCardOnFileSupported: false,
            timestamp: new Date().toISOString()
          };
          
          console.log('📤 Envoi du message ready:', message);
          
          if (window.parent !== window) {
            window.parent.postMessage(message, '*');
          } else {
            console.log('🧪 Mode test détecté - simulation des données');
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
            <h3 style="margin-top: 0;">💰 Récapitulatif du paiement</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Montant:</span>
              <strong>\${paymentData.amount} \${paymentData.currency}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Client:</span>
              <strong>\${paymentData.contact?.name || 'Non spécifié'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span>Email:</span>
              <strong>\${paymentData.contact?.email || 'Non spécifié'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
              <span>Commande:</span>
              <strong>#\${paymentData.orderId || 'N/A'}</strong>
            </div>
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.3); margin: 15px 0;">
            <div style="text-align: center; font-size: 14px; opacity: 0.9;">
              🔒 Paiement 100% sécurisé par Papi
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
          const payBtn = document.getElementById('payBtn');
          
          // Animation de chargement
          form.style.display = 'none';
          loading.style.display = 'block';
          
          try {
            console.log('💳 Début du traitement du paiement...');
            
            // Simuler le traitement (3 secondes)
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Générer un ID de transaction Papi
            const chargeId = 'papi_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            console.log('✅ Paiement réussi, chargeId:', chargeId);
            
            // Notifier GHL du succès
            const successMessage = {
              type: 'custom_element_success_response',
              chargeId: chargeId,
              timestamp: new Date().toISOString()
            };
            
            console.log('📤 Envoi du message de succès:', successMessage);
            
            if (window.parent !== window) {
              window.parent.postMessage(successMessage, '*');
            } else {
              // Mode test
              alert('✅ Paiement simulé réussi!\\nID de transaction: ' + chargeId);
              location.reload();
            }
            
          } catch (error) {
            console.error('❌ Erreur lors du paiement:', error);
            
            // Notifier GHL de l'erreur
            const errorMessage = {
              type: 'custom_element_error_response',
              error: { description: 'Erreur lors du traitement du paiement' },
              timestamp: new Date().toISOString()
            };
            
            console.log('📤 Envoi du message d\\'erreur:', errorMessage);
            
            if (window.parent !== window) {
              window.parent.postMessage(errorMessage, '*');
            } else {
              alert('❌ Erreur de paiement simulée');
            }
            
            // Réafficher le formulaire
            form.style.display = 'block';
            loading.style.display = 'none';
          }
        });
        
        // Formatage automatique des champs
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
  `;

  return res.status(200).send(html);
}
