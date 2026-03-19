/**
 * Script de seed avec images pour demo client
 * Usage: node seed-demo.mjs
 */

const API = 'https://gestion-locative-fqax.onrender.com/api';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    console.error(`  ERR ${options.method || 'GET'} ${path} -> ${res.status}`, typeof data === 'object' ? JSON.stringify(data).slice(0, 300) : String(data).slice(0, 300));
    return null;
  }
  return data;
}

async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  const buffer = await res.arrayBuffer();
  return new Blob([buffer], { type: 'image/jpeg' });
}

async function uploadImages(maisonId, imageUrls, token) {
  const formData = new FormData();
  let count = 0;
  for (const url of imageUrls) {
    try {
      const blob = await downloadImage(url);
      if (blob) {
        formData.append('images', blob, `photo_${count + 1}.jpg`);
        count++;
      }
    } catch (e) {
      console.error(`    Erreur telechargement image: ${e.message}`);
    }
  }
  if (count === 0) return false;

  const res = await fetch(`${API}/properties/maisons/${maisonId}/images/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`    ERR upload images -> ${res.status}`, err.slice(0, 200));
    return false;
  }
  return true;
}

// ─── Login ──────────────────────────────────────────────────────────────────

console.log('=== SEED DEMO - Gestion Locative ===\n');
console.log('1. Connexion admin...');
const loginRes = await apiFetch('/auth/login/', {
  method: 'POST',
  body: JSON.stringify({ email: 'fofanaissouf179@gmail.com', password: 'Mariamapp2026@12/^^!' }),
});
if (!loginRes) { console.error('Login echoue !'); process.exit(1); }
const token = loginRes.data?.tokens?.access || loginRes.tokens?.access;
console.log('   Connecte !\n');

// ─── Proprietes avec images ─────────────────────────────────────────────────

const maisons = [
  {
    titre: 'Villa Prestige Cocody Angre',
    description: 'Magnifique villa de standing dans le quartier residentiel d\'Angre. 4 chambres spacieuses avec placards integres, 3 salles de bain modernes, grand salon avec baie vitree, cuisine equipee, jardin paysager de 200m2, garage 2 voitures, systeme de securite. Quartier calme et securise, proche ecoles internationales et supermarches.',
    type_propriete: 'VILLA', prix: 450000, caution: 900000, commune: 'Cocody', quartier: 'Angre 8eme tranche', adresse: 'Lot 245 Angre', superficie: 280, nombre_chambres: 4, nombre_salles_bain: 3, nombre_salons: 2, meublee: false, statut: 'DISPONIBLE',
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    ],
  },
  {
    titre: 'Appartement Moderne Plateau',
    description: 'Superbe appartement au 8eme etage avec vue panoramique sur la lagune Ebrie. 3 chambres climatisees, 2 salles de bain avec finitions haut de gamme, cuisine americaine equipee, balcon spacieux. Immeuble avec ascenseur, gardien 24h/24, parking souterrain. Au coeur du quartier des affaires.',
    type_propriete: 'APPARTEMENT', prix: 300000, caution: 600000, commune: 'Plateau', quartier: 'Centre des affaires', adresse: 'Boulevard de la Republique', superficie: 130, nombre_chambres: 3, nombre_salles_bain: 2, nombre_salons: 1, meublee: true, statut: 'DISPONIBLE',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    ],
  },
  {
    titre: 'Studio Meuble Marcory Zone 4',
    description: 'Studio entierement meuble et equipe, pret a vivre. Coin nuit confortable, kitchenette moderne, salle de bain avec douche italienne, espace bureau. Internet haut debit inclus. Ideal jeune professionnel ou expatrie. Quartier vivant avec restaurants, pharmacies et commerces a proximite.',
    type_propriete: 'STUDIO', prix: 95000, caution: 190000, commune: 'Marcory', quartier: 'Zone 4', adresse: 'Rue des jardins', superficie: 45, nombre_chambres: 1, nombre_salles_bain: 1, nombre_salons: 0, meublee: true, statut: 'DISPONIBLE',
    images: [
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80',
      'https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=800&q=80',
    ],
  },
  {
    titre: 'Villa de Luxe Riviera Golf',
    description: 'Villa d\'exception face au golf de la Riviera. 5 chambres en suite, piscine a debordement, pool house, terrasse de 100m2, jardin tropical de 500m2. Cuisine professionnelle, home cinema, salle de sport privee. Personnel de maison inclus. Le summum du luxe a Abidjan.',
    type_propriete: 'VILLA', prix: 1200000, caution: 2400000, commune: 'Cocody', quartier: 'Riviera Golf', adresse: 'Boulevard du Golf', superficie: 500, nombre_chambres: 5, nombre_salles_bain: 5, nombre_salons: 3, meublee: true, statut: 'DISPONIBLE',
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
      'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80',
    ],
  },
  {
    titre: 'Appartement Familial Yopougon',
    description: 'Bel appartement F3 dans une residence securisee a Yopougon Maroc. 2 grandes chambres, salon lumineux, cuisine fermee, balcon. Residence calme avec aires de jeux pour enfants. Proche marche, ecoles et transports. Excellent rapport qualite-prix pour une famille.',
    type_propriete: 'APPARTEMENT', prix: 130000, caution: 260000, commune: 'Yopougon', quartier: 'Maroc', adresse: 'Residence Les Palmiers', superficie: 85, nombre_chambres: 2, nombre_salles_bain: 1, nombre_salons: 1, meublee: false, statut: 'DISPONIBLE',
    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80',
    ],
  },
  {
    titre: 'Duplex Standing 2 Plateaux',
    description: 'Duplex contemporain dans les 2 Plateaux Vallons. Rez-de-chaussee: grand salon double, cuisine ouverte equipee, chambre d\'amis avec SDB. Etage: suite parentale avec dressing et SDB, 2 chambres enfants, salle de bain familiale. Terrasse sur toit amenagee. Garage et jardin.',
    type_propriete: 'DUPLEX', prix: 500000, caution: 1000000, commune: 'Cocody', quartier: '2 Plateaux Vallons', adresse: 'Rue des Vallons', superficie: 320, nombre_chambres: 4, nombre_salles_bain: 3, nombre_salons: 2, meublee: false, statut: 'DISPONIBLE',
    images: [
      'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800&q=80',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
    ],
  },
  {
    titre: 'Appartement Vue Lagune Marcory',
    description: 'Appartement haut standing avec vue imprenable sur la lagune. 3 chambres climatisees, salon spacieux, cuisine moderne, 2 balcons. Residence avec piscine commune, salle de sport et gardiennage 24h. A 5 minutes du Plateau en bateau-bus.',
    type_propriete: 'APPARTEMENT', prix: 250000, caution: 500000, commune: 'Marcory', quartier: 'Bietry', adresse: 'Residence Laguna', superficie: 110, nombre_chambres: 3, nombre_salles_bain: 2, nombre_salons: 1, meublee: false, statut: 'DISPONIBLE',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
      'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
    ],
  },
  {
    titre: 'Villa Bord de Mer Bassam',
    description: 'Charmante villa les pieds dans l\'eau a Grand-Bassam. 3 chambres avec vue mer, terrasse ombragee face a l\'ocean, jardin tropical cloture. Cuisine ouverte, salon ventile, 2 salles de bain. Ideale comme residence secondaire ou investissement locatif saisonnier.',
    type_propriete: 'VILLA', prix: 280000, caution: 560000, commune: 'Grand-Bassam', quartier: 'Quartier France', adresse: 'Boulevard Ocean', superficie: 200, nombre_chambres: 3, nombre_salles_bain: 2, nombre_salons: 1, meublee: true, statut: 'DISPONIBLE',
    images: [
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    ],
  },
  {
    titre: 'F2 Moderne Abobo Centre',
    description: 'Appartement F2 neuf dans un immeuble recent a Abobo centre. Grande chambre avec placard, salon avec coin repas, cuisine equipee, salle de bain avec baignoire. Residence avec gardien. Proche de la gare routiere et du marche central. Premier loyer offert.',
    type_propriete: 'F2', prix: 85000, caution: 170000, commune: 'Abobo', quartier: 'Centre', adresse: 'Pres de la Gare', superficie: 60, nombre_chambres: 1, nombre_salles_bain: 1, nombre_salons: 1, meublee: false, statut: 'DISPONIBLE',
    images: [
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80',
      'https://images.unsplash.com/photo-1560448075-cbc16bb4af8e?w=800&q=80',
    ],
  },
  {
    titre: 'Penthouse Cocody Ambassades',
    description: 'Exceptionnel penthouse dans le quartier des Ambassades. 4 chambres, immense terrasse avec vue 360° sur Abidjan, jacuzzi exterieur, double sejour, cuisine d\'architecte. Parking prive, ascenseur privatif. Le prestige absolu pour les plus exigeants.',
    type_propriete: 'APPARTEMENT', prix: 800000, caution: 1600000, commune: 'Cocody', quartier: 'Ambassades', adresse: 'Rue des Ambassades', superficie: 250, nombre_chambres: 4, nombre_salles_bain: 3, nombre_salons: 2, meublee: true, statut: 'DISPONIBLE',
    images: [
      'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
      'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    ],
  },
];

// ─── Creation ───────────────────────────────────────────────────────────────

console.log('2. Creation des proprietes avec images...\n');
let created = 0;

for (const m of maisons) {
  const { images, ...propertyData } = m;

  // Create property
  const formData = new FormData();
  for (const [key, val] of Object.entries(propertyData)) {
    formData.append(key, String(val));
  }

  const res = await fetch(`${API}/properties/maisons/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!res.ok) {
    console.error(`  ERREUR ${m.titre}:`, typeof data === 'object' ? JSON.stringify(data).slice(0, 200) : String(data).slice(0, 200));
    continue;
  }

  const id = data?.id || data?.data?.id;
  console.log(`  + ${m.titre} (${m.prix.toLocaleString()} FCFA) - ID: ${id}`);

  // Upload images
  if (id && images.length > 0) {
    console.log(`    Telechargement de ${images.length} images...`);
    const ok = await uploadImages(id, images, token);
    if (ok) {
      console.log(`    Images uploadees !`);
    } else {
      console.log(`    Echec upload images (la propriete est creee sans images)`);
    }
  }
  created++;
}

// ─── Locataires demo ────────────────────────────────────────────────────────

console.log('\n3. Creation de locataires demo...\n');
const locataires = [
  { nom: 'Kone', prenoms: 'Aminata', email: 'aminata.kone@gmail.com', telephone: '+2250701234567', password: 'Demo2026@pass', role: 'LOCATAIRE' },
  { nom: 'Traore', prenoms: 'Moussa', email: 'moussa.traore@gmail.com', telephone: '+2250507654321', password: 'Demo2026@pass', role: 'LOCATAIRE' },
  { nom: 'Coulibaly', prenoms: 'Fatou', email: 'fatou.coulibaly@gmail.com', telephone: '+2250102233445', password: 'Demo2026@pass', role: 'LOCATAIRE' },
  { nom: 'Diallo', prenoms: 'Ibrahim', email: 'ibrahim.diallo@gmail.com', telephone: '+2250708899001', password: 'Demo2026@pass', role: 'LOCATAIRE' },
  { nom: 'Bamba', prenoms: 'Mariam', email: 'mariam.bamba@gmail.com', telephone: '+2250504455667', password: 'Demo2026@pass', role: 'LOCATAIRE' },
];

let locCount = 0;
for (const loc of locataires) {
  const res = await apiFetch('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(loc),
  });
  if (res) {
    locCount++;
    console.log(`  + ${loc.prenoms} ${loc.nom} (${loc.email})`);
  }
}

// ─── Depenses ───────────────────────────────────────────────────────────────

console.log('\n4. Creation des depenses...\n');
const depenses = [
  { titre: 'Plomberie Villa Cocody', categorie: 'REPARATION', montant: 75000, date_depense: '2026-03-01', description: 'Reparation fuite eau salle de bain principale' },
  { titre: 'Peinture Appartement Plateau', categorie: 'REPARATION', montant: 120000, date_depense: '2026-03-05', description: 'Peinture complete avant nouvelle location' },
  { titre: 'Assurance immeubles 2026', categorie: 'AUTRES', montant: 350000, date_depense: '2026-01-15', description: 'Prime assurance annuelle tous les biens' },
  { titre: 'Gardiennage mars 2026', categorie: 'SALAIRES', montant: 80000, date_depense: '2026-03-01', description: 'Salaire gardien mensuel pour 3 proprietes' },
  { titre: 'Climatiseur Studio Marcory', categorie: 'FOURNITURES', montant: 250000, date_depense: '2026-02-28', description: 'Achat et installation nouveau climatiseur' },
  { titre: 'Taxe fonciere 2026', categorie: 'TAXES', montant: 500000, date_depense: '2026-02-01', description: 'Paiement taxe fonciere annuelle' },
  { titre: 'Nettoyage parties communes', categorie: 'ENTRETIEN', montant: 35000, date_depense: '2026-03-10', description: 'Nettoyage mensuel escaliers et couloirs' },
  { titre: 'Portail electrique Duplex', categorie: 'FOURNITURES', montant: 320000, date_depense: '2026-02-10', description: 'Installation portail electrique automatique' },
];

let depCount = 0;
for (const d of depenses) {
  const formData = new FormData();
  for (const [key, val] of Object.entries(d)) {
    formData.append(key, String(val));
  }
  const res = await fetch(`${API}/expenses/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (res.ok) {
    depCount++;
    console.log(`  + ${d.titre} - ${d.montant.toLocaleString()} FCFA`);
  } else {
    const err = await res.text();
    console.error(`  ERR ${d.titre}:`, err.slice(0, 150));
  }
}

// ─── Resume ─────────────────────────────────────────────────────────────────

console.log('\n========================================');
console.log('       SEED DEMO TERMINE !');
console.log('========================================');
console.log(`  Proprietes creees : ${created}`);
console.log(`  Locataires crees  : ${locCount}`);
console.log(`  Depenses creees   : ${depCount}`);
console.log('========================================\n');
