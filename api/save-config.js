// api/save-config.js - Sauvegarder la configuration

const integrations = new Map();

export default async function handler(req, res) {
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
    const { locationId, testToken, liveToken } = req.body;
    
    if (!locationId) {
      return res.status(400).json({ 
        success: false, 
        error: 'LocationId est requis' 
      });
    }
    
    if (!testToken && !liveToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Au moins un token (test ou live) est requis' 
      });
    }
    
    // Sauvegarder la configuration
    const config = {
      testToken: testToken || null,
      liveToken: liveToken || null,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      locationId
    };
    
    integrations.set(locationId, config);
    
    console.log('✅ Configuration sauvegardée pour locationId:', locationId);
    
    // Essayer de créer l'intégration dans GHL
    try {
      await createGHLIntegration(locationId, testToken, liveToken);
    } catch (error) {
      console.log('⚠️ Erreur création intégration GHL (non bloquant):', error.message);
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Configuration sauvegardée avec succès',
      locationId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur sauvegarde config:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

// Fonction pour créer l'intégration dans GHL
async function createGHLIntegration(locationId, testToken, liveToken) {
  const accessToken = process.env.GHL_ACCESS_TOKEN; // À ajouter plus tard
  
  if (!accessToken) {
    console.log('Access token GHL manquant, intégration reportée');
    return;
  }
  
  const integrationData = {
    name: 'Papi Payment Gateway',
    description: 'Passerelle de paiement pour Madagascar et l\'Afrique',
    imageUrl: 'https://via.placeholder.com/100x100?text=PAPI',
    locationId: locationId,
    queryUrl: `https://${process.env.VERCEL_URL || 'papi-payments.vercel.app'}/query`,
    paymentsUrl: `https://${process.env.VERCEL_URL || 'papi-payments.vercel.app'}/payment`
  };
  
  // L'appel API sera implémenté quand on aura l'access token
  console.log('Intégration GHL à créer:', integrationData);
}
