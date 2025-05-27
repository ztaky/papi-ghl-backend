// api/query.js - Endpoint pour les requêtes GHL

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
    const { type, transactionId, chargeId, apiKey, locationId, contactId, paymentMethodId, amount, currency } = req.body;
    
    console.log('🔍 Query reçue:', { type, transactionId, chargeId, locationId });
    
    switch (type) {
      case 'verify':
        // Vérification d'un paiement
        console.log('✅ Vérification paiement:', chargeId);
        return res.json({ 
          success: true,
          message: 'Paiement vérifié avec succès'
        });
        
      case 'refund':
        // Remboursement
        console.log('💰 Demande de remboursement:', chargeId);
        return res.json({ 
          success: false, 
          error: 'Les remboursements ne sont pas encore implémentés' 
        });
        
      case 'list_payment_methods':
        // Liste des méthodes de paiement sauvegardées
        console.log('📋 Liste des méthodes de paiement pour:', contactId);
        return res.json([
          // Pour l'instant, retourne une liste vide
          // Plus tard, on récupérera les cartes sauvegardées depuis Papi
        ]);
        
      case 'charge_payment':
        // Charger une méthode de paiement sauvegardée
        console.log('💳 Charge payment method:', paymentMethodId);
        return res.json({ 
          success: false, 
          error: 'Charge payment method non implémenté pour le moment' 
        });
        
      default:
        console.log('❌ Type de requête non supporté:', type);
        return res.json({ 
          success: false, 
          error: `Type de requête non supporté: ${type}` 
        });
    }
    
  } catch (error) {
    console.error('❌ Erreur dans query:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors du traitement de la requête',
      details: error.message
    });
  }
}
