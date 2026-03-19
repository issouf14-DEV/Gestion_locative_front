/**
 * Script de création de données de test via l'API
 *
 * Usage:
 *   node scripts/seed-data.mjs <email_admin> <password_admin>
 *
 * Exemple:
 *   node scripts/seed-data.mjs admin@test.com MonMotDePasse123!
 *
 * Ce script crée :
 * - 4 maisons avec images (depuis des URLs publiques)
 * - 6 locataires
 * - 6 locations (1 locataire par maison, 2 maisons avec 2 locataires)
 */

const API_URL = 'https://gestion-locative-fqax.onrender.com/api';

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage: node scripts/seed-data.mjs <email_admin> <password_admin>');
  process.exit(1);
}

let TOKEN = '';

async function api(method, path, body = null, isFormData = false) {
  const headers = {};
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const opts = { method, headers };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);

  const res = await fetch(`${API_URL}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!res.ok) {
    console.error(`  ✗ ${method} ${path} → ${res.status}`);
    console.error('   ', typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
    return null;
  }
  return data;
}

// ── 1. Login ──
async function login() {
  console.log('\n🔐 Connexion admin...');
  const data = await api('POST', '/auth/login/', { email, password });
  if (!data) { console.error('Échec connexion. Vérifiez les identifiants.'); process.exit(1); }
  TOKEN = data.data?.tokens?.access || data.tokens?.access || data.access;
  console.log('  ✓ Connecté en tant que', data.data?.user?.email || email);
}

// ── 2. Create maisons ──
const MAISONS = [
  {
    titre: 'Villa Prestige Cocody Riviera',
    description: 'Magnifique villa de standing avec jardin arboré, piscine privée et vue panoramique. Idéal pour une famille. Quartier résidentiel calme et sécurisé.',
    type_logement: 'VILLA',
    prix: 350000,
    caution: 700000,
    adresse: 'Riviera Golf, Lot 234',
    ville: 'Abidjan',
    commune: 'Cocody',
    quartier: 'Riviera Golf',
    nombre_chambres: 4,
    nombre_salles_bain: 3,
    superficie: 250,
    meublee: true,
    statut: 'LOUEE',
  },
  {
    titre: 'Appartement F3 Marcory Zone 4',
    description: 'Bel appartement F3 rénové, proche de toutes commodités. 2 chambres spacieuses, cuisine équipée, salon lumineux. Gardiennage 24h/24.',
    type_logement: 'F3',
    prix: 150000,
    caution: 300000,
    adresse: 'Zone 4, Rue des Jardins',
    ville: 'Abidjan',
    commune: 'Marcory',
    quartier: 'Zone 4',
    nombre_chambres: 2,
    nombre_salles_bain: 2,
    superficie: 85,
    meublee: false,
    statut: 'LOUEE',
  },
  {
    titre: 'Studio Moderne Plateau',
    description: 'Studio moderne au cœur du Plateau, idéal pour jeune professionnel. Entièrement meublé avec électroménager. Proche transports en commun.',
    type_logement: 'STUDIO',
    prix: 80000,
    caution: 160000,
    adresse: 'Boulevard de la République',
    ville: 'Abidjan',
    commune: 'Plateau',
    quartier: 'Centre',
    nombre_chambres: 1,
    nombre_salles_bain: 1,
    superficie: 35,
    meublee: true,
    statut: 'LOUEE',
  },
  {
    titre: 'Appartement F2 Yopougon Maroc',
    description: 'Appartement F2 lumineux à Yopougon. Quartier animé et bien desservi. Idéal pour couple ou célibataire. Eau et électricité disponibles.',
    type_logement: 'F2',
    prix: 65000,
    caution: 130000,
    adresse: 'Quartier Maroc, Rue 12',
    ville: 'Abidjan',
    commune: 'Yopougon',
    quartier: 'Maroc',
    nombre_chambres: 1,
    nombre_salles_bain: 1,
    superficie: 55,
    meublee: false,
    statut: 'DISPONIBLE',
  },
];

// Public domain images for properties
const PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
  'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80',
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
];

async function createMaisons() {
  console.log('\n🏠 Création des maisons...');
  const ids = [];
  for (const maison of MAISONS) {
    const data = await api('POST', '/properties/maisons/', maison);
    if (data) {
      const id = data.data?.id || data.id;
      ids.push(id);
      console.log(`  ✓ ${maison.titre} (${id})`);

      // Upload images via URL — try to download and upload
      const imgIndex = ids.length - 1;
      const imgUrls = [PROPERTY_IMAGES[imgIndex * 2], PROPERTY_IMAGES[imgIndex * 2 + 1]];
      for (const imgUrl of imgUrls) {
        try {
          const imgRes = await fetch(imgUrl);
          if (imgRes.ok) {
            const blob = await imgRes.blob();
            const formData = new FormData();
            formData.append('images', blob, `photo_${Date.now()}.jpg`);
            const uploadRes = await api('POST', `/properties/maisons/${id}/ajouter_images/`, formData, true);
            if (uploadRes) console.log(`    ✓ Image ajoutée`);
          }
        } catch (e) {
          console.log(`    ⚠ Image skip: ${e.message}`);
        }
      }
    }
  }
  return ids;
}

// ── 3. Create locataires ──
const LOCATAIRES = [
  { nom: 'Koné', prenoms: 'Amadou', email: 'amadou.kone@test.com', telephone: '0707010101', password: 'Test1234!', password_confirm: 'Test1234!' },
  { nom: 'Touré', prenoms: 'Fatou', email: 'fatou.toure@test.com', telephone: '0707020202', password: 'Test1234!', password_confirm: 'Test1234!' },
  { nom: 'Diallo', prenoms: 'Mamadou', email: 'mamadou.diallo@test.com', telephone: '0707030303', password: 'Test1234!', password_confirm: 'Test1234!' },
  { nom: 'Bamba', prenoms: 'Aïcha', email: 'aicha.bamba@test.com', telephone: '0707040404', password: 'Test1234!', password_confirm: 'Test1234!' },
  { nom: 'Coulibaly', prenoms: 'Ibrahim', email: 'ibrahim.coulibaly@test.com', telephone: '0707050505', password: 'Test1234!', password_confirm: 'Test1234!' },
  { nom: 'Yao', prenoms: 'Patricia', email: 'patricia.yao@test.com', telephone: '0707060606', password: 'Test1234!', password_confirm: 'Test1234!' },
];

async function createLocataires() {
  console.log('\n👥 Création des locataires...');
  const ids = [];
  for (const loc of LOCATAIRES) {
    const data = await api('POST', '/auth/register/', loc);
    if (data) {
      const id = data.data?.user?.id || data.user?.id || data.id || data.data?.id;
      ids.push(id);
      console.log(`  ✓ ${loc.prenoms} ${loc.nom} (${id}) — ${loc.email} / ${loc.password}`);
    } else {
      // Might already exist, try to find them
      console.log(`  ⚠ ${loc.prenoms} ${loc.nom} — peut-être déjà existant`);
      ids.push(null);
    }
  }
  return ids;
}

// ── 4. Create locations (rentals) ──
async function createLocations(maisonIds, locataireIds) {
  console.log('\n📋 Création des locations...');

  // Get the actual locataire IDs from the API if registration returned null
  const locData = await api('GET', '/users/locataires/');
  const allLocataires = locData?.data?.results || locData?.results || locData?.data || [];
  console.log(`  ℹ ${allLocataires.length} locataires trouvés dans le système`);

  // Map by email
  const locByEmail = {};
  allLocataires.forEach(l => { locByEmail[l.email] = l.id; });

  const finalLocIds = LOCATAIRES.map((l, i) => locataireIds[i] || locByEmail[l.email] || null).filter(Boolean);
  const validMaisonIds = maisonIds.filter(Boolean);

  if (finalLocIds.length === 0 || validMaisonIds.length === 0) {
    console.log('  ⚠ Pas assez de données pour créer des locations');
    return;
  }

  // Assign locataires to maisons
  // Maison 0 (Villa): locataires 0, 1
  // Maison 1 (F3):    locataires 2, 3
  // Maison 2 (Studio): locataire 4
  const assignments = [
    { maison: 0, locataire: 0, duree: 12 },
    { maison: 0, locataire: 1, duree: 12 },
    { maison: 1, locataire: 2, duree: 6 },
    { maison: 1, locataire: 3, duree: 6 },
    { maison: 2, locataire: 4, duree: 12 },
  ];

  for (const a of assignments) {
    if (validMaisonIds[a.maison] && finalLocIds[a.locataire]) {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + a.duree);

      const data = await api('POST', '/rentals/', {
        locataire: finalLocIds[a.locataire],
        maison: validMaisonIds[a.maison],
        date_debut: startDate.toISOString().split('T')[0],
        date_fin: endDate.toISOString().split('T')[0],
        duree_mois: a.duree,
        loyer_mensuel: MAISONS[a.maison].prix,
        caution_payee: true,
      });
      if (data) {
        const locName = LOCATAIRES[a.locataire];
        console.log(`  ✓ ${locName.prenoms} ${locName.nom} → ${MAISONS[a.maison].titre}`);
      }
    }
  }
}

// ── 5. Create expenses ──
async function createExpenses() {
  console.log('\n💰 Création de dépenses test...');
  const expenses = [
    { categorie: 'REPARATION', montant: 45000, description: 'Réparation plomberie - Villa Cocody', date_depense: '2026-02-15' },
    { categorie: 'ENTRETIEN', montant: 25000, description: 'Nettoyage parties communes', date_depense: '2026-03-01' },
    { categorie: 'TAXE', montant: 75000, description: 'Impôt foncier T1 2026', date_depense: '2026-03-10' },
    { categorie: 'AUTRE', montant: 15000, description: 'Achat serrures remplacement', date_depense: '2026-02-28' },
  ];

  for (const exp of expenses) {
    const data = await api('POST', '/expenses/', exp);
    if (data) console.log(`  ✓ ${exp.description} — ${exp.montant} FCFA`);
  }
}

// ── Main ──
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log(' 🌱 Seed Data — Gestion Locative');
  console.log('═══════════════════════════════════════════');

  await login();
  const maisonIds = await createMaisons();
  const locataireIds = await createLocataires();
  await createLocations(maisonIds, locataireIds);
  await createExpenses();

  console.log('\n═══════════════════════════════════════════');
  console.log(' ✅ Données de test créées avec succès !');
  console.log('═══════════════════════════════════════════');
  console.log('\n📌 Comptes locataires créés :');
  LOCATAIRES.forEach(l => {
    console.log(`   ${l.prenoms} ${l.nom} — ${l.email} / ${l.password}`);
  });
  console.log('\n📌 Prochaines étapes :');
  console.log('   1. Connectez-vous en admin pour voir les maisons et locataires');
  console.log('   2. Allez dans Factures > Générer pour tester le calcul SODECI/CIE');
  console.log('   3. Connectez-vous en locataire pour voir le dashboard et les charges');
}

main().catch(console.error);
