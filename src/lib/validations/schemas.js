import { z } from 'zod';

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
});

export const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  password2: z.string(),
  nom: z.string().min(2, 'Nom requis'),
  prenoms: z.string().min(2, 'Prénoms requis'),
  telephone: z.string().min(10, 'Téléphone invalide'),
  role: z.enum(['LOCATAIRE', 'BAILLEUR']),
}).refine(data => data.password === data.password2, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['password2'],
});

// Maison Schemas
export const maisonSchema = z.object({
  titre: z.string().min(5, 'Titre requis (min 5 caractères)'),
  description: z.string().min(20, 'Description requise (min 20 caractères)'),
  type_propriete: z.enum(['APPARTEMENT', 'STUDIO', 'VILLA', 'CHAMBRE', 'DUPLEX']),
  prix: z.number().positive('Prix doit être positif'),
  commune: z.string().min(2, 'Commune requise'),
  quartier: z.string().min(2, 'Quartier requis'),
  adresse: z.string().optional(),
  superficie: z.number().positive().optional(),
  nombre_chambres: z.number().int().min(0),
  nombre_salles_bain: z.number().int().min(0),
  nombre_salons: z.number().int().min(0),
  meublee: z.boolean(),
  equipements: z.array(z.string()).optional(),
  disponible_le: z.string().optional(),
  statut: z.enum(['DISPONIBLE', 'LOUEE', 'EN_MAINTENANCE', 'INDISPONIBLE']),
});

// Location Schema
export const locationSchema = z.object({
  locataire: z.number().positive('Locataire requis'),
  maison: z.number().positive('Maison requise'),
  date_debut: z.string(),
  duree_mois: z.number().int().min(1, 'Durée minimum 1 mois'),
  loyer_mensuel: z.number().positive('Loyer requis'),
  caution: z.number().min(0),
  avance_loyer_mois: z.number().int().min(0),
  frais_agence: z.number().min(0),
  charges_mensuelles: z.number().min(0),
  conditions_particulieres: z.string().optional(),
});

// Facture Schema
export const factureSchema = z.object({
  locataire: z.number().positive(),
  type_facture: z.enum(['LOYER', 'SODECI', 'CIE']),
  mois: z.number().int().min(1).max(12),
  annee: z.number().int().min(2020),
  montant: z.number().positive(),
  date_echeance: z.string(),
  description: z.string().optional(),
});

// Paiement Schema
export const paiementSchema = z.object({
  montant: z.number().positive('Montant requis'),
  mode_paiement: z.enum(['ESPECES', 'VIREMENT', 'MOBILE_MONEY', 'CHEQUE']),
  reference_paiement: z.string().optional(),
  description: z.string().optional(),
});

// Depense Schema
export const depenseSchema = z.object({
  titre: z.string().min(3, 'Titre requis'),
  categorie: z.string().min(2, 'Catégorie requise'),
  montant: z.number().positive('Montant requis'),
  date_depense: z.string(),
  description: z.string().optional(),
  maison: z.number().optional(),
});

// Compteur Schema
export const compteurSchema = z.object({
  numero: z.string().min(3, 'Numéro requis'),
  type_compteur: z.enum(['SODECI', 'CIE']),
  maison: z.number().positive('Maison requise'),
  dernier_index: z.number().min(0),
  date_installation: z.string(),
  actif: z.boolean(),
});

// Index Compteur Schema
export const indexCompteurSchema = z.object({
  compteur: z.number().positive('Compteur requis'),
  index_precedent: z.number().min(0),
  index_actuel: z.number().min(0),
  date_releve: z.string(),
  consommation: z.number().min(0).optional(),
});

export const userSchema = z.object({
  email: z.string().email(),
  nom: z.string().min(2),
  prenoms: z.string().min(2),
  telephone: z.string().min(10),
  role: z.enum(['LOCATAIRE', 'BAILLEUR', 'ADMIN']),
  statut: z.enum(['ACTIF', 'INACTIF', 'SUSPENDU']).optional(),
});
