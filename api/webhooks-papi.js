// api/webhooks-papi.js - Webhooks Papi

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
    console.log('🔔 Webhook Papi reçu:', req.body);
    
    const { 
      paymentStatus, 
      paymentMethod, 
      amount, 
      fee, 
      clientName, 
      description, 
      merchantPaymentReference, 
      paymentReference, 
      notificationToken 
    } = req.body;
    
    // Traiter les différents statuts de paiement
    switch (paymentStatus) {
      case 'SUCCESS':
        console.log('✅ Paiement Papi confirmé:', paymentReference);
        // Ici on pourrait notifier GHL du succès du paiement
        // ou mettre à jour le statut d'une commande
        break;
        
      case 'FAILED':
        console.log('❌ Paiement Papi échoué:', paymentReference);
        // Ici on pourrait notifier GHL de l'échec du paiement
        break;
        
      case 'PENDING':
        console.log('⏳ Paiement Papi en attente:', paymentReference);
        break;
        
      default:
        console.log('📨 Statut Papi non géré:', paymentStatus);
    }
    
    // Log des détails du paiement
    if (paymentStatus === 'SUCCESS') {
      console.log('💰 Détails du paiement:', {
        montant: amount,
        frais: fee,
        client: clientName,
        methode: paymentMethod,
        reference: paymentReference
      });
    }
    
    return res.status(200).json({ 
      status: 'OK',
      received: true,
      paymentReference: paymentReference || 'unknown',
      timestamp: new Date().toISOString(),
      processed: true
    });
    
  } catch (error) {
    console.error('❌ Erreur dans webhook Papi:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur lors du traitement du webhook',
      timestamp: new Date().toISOString()
    });
  }
}
