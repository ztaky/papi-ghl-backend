// api/webhooks-ghl.js - Webhooks GoHighLevel

export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔔 Webhook GHL reçu:', req.body);
    
    const { event, locationId, appId } = req.body;
    
    // Traiter les différents événements
    switch (event) {
      case 'app.installed':
        console.log('📱 App installée pour location:', locationId);
        // Ici on pourrait initialiser des données pour cette location
        break;
        
      case 'app.uninstalled':
        console.log('🗑️ App désinstallée pour location:', locationId);
        // Ici on pourrait nettoyer les données de cette location
        break;
        
      case 'subscription.created':
        console.log('💳 Abonnement créé pour location:', locationId);
        break;
        
      case 'subscription.updated':
        console.log('🔄 Abonnement mis à jour pour location:', locationId);
        break;
        
      default:
        console.log('📨 Événement GHL non géré:', event);
    }
    
    return res.status(200).json({ 
      status: 'OK',
      event: event || 'unknown',
      locationId: locationId || 'unknown',
      timestamp: new Date().toISOString(),
      processed: true
    });
    
  } catch (error) {
    console.error('❌ Erreur dans webhook GHL:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur lors du traitement du webhook',
      timestamp: new Date().toISOString()
    });
  }
}
