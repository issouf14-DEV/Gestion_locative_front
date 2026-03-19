/**
 * WhatsApp Integration Utilities
 */

export const cleanPhoneForWhatsApp = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('225')) cleaned = '225' + cleaned;
  return cleaned;
};

export const generateWhatsAppLink = (phone, message = '') => {
  const cleanedPhone = cleanPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
};

export const openWhatsApp = (phone, message = '') => {
  const link = generateWhatsAppLink(phone, message);
  window.open(link, '_blank', 'noopener,noreferrer');
};

export const generateFactureMessage = (facture) => {
  const { reference, type_facture, montant, montant_restant, date_echeance, locataire_nom, mois, annee } = facture;
  const typeLabel = { LOYER: 'Loyer', SODECI: 'Eau (SODECI)', CIE: 'Électricité (CIE)' }[type_facture] || type_facture;
  const montantAPayer = montant_restant || montant;

  return `Bonjour ${locataire_nom || ''},

📋 *Facture ${reference}*
Type: ${typeLabel}
Période: ${mois}/${annee}
Montant: ${new Intl.NumberFormat('fr-FR').format(montantAPayer)} FCFA
Échéance: ${new Date(date_echeance).toLocaleDateString('fr-FR')}

Merci de procéder au paiement dans les délais.

🏠 *Gestion Locative*`;
};
