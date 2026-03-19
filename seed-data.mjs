const API = 'https://gestion-locative-fqax.onrender.com/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    console.error(`ERR ${options.method || 'GET'} ${path} -> ${res.status}`, typeof data === 'object' ? JSON.stringify(data).slice(0, 300) : String(data).slice(0, 300));
    return null;
  }
  return data;
}

async function apiFormData(path, obj, token) {
  const formData = new FormData();
  for (const [key, val] of Object.entries(obj)) {
    formData.append(key, String(val));
  }
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    console.error(`ERR POST ${path} -> ${res.status}`, typeof data === 'object' ? JSON.stringify(data).slice(0, 300) : String(data).slice(0, 300));
    return null;
  }
  return data;
}

// 1. Login
console.log('Connexion admin...');
const loginRes = await apiFetch('/auth/login/', {
  method: 'POST',
  body: JSON.stringify({ email: 'fofanaissouf179@gmail.com', password: 'Mariamapp2026@12/^^!' }),
});
if (!loginRes) { console.error('Login failed'); process.exit(1); }
const token = loginRes.data?.tokens?.access;
console.log('Connecte !');

// 2. Creer des maisons (champs: titre, description, type_propriete, prix, caution, commune, quartier, adresse, superficie, nombre_chambres, nombre_salles_bain, nombre_salons, meublee, statut)
const maisons = [
  { titre: 'Villa Cocody Angre', description: 'Belle villa avec jardin et parking dans un quartier residentiel calme a Cocody', type_propriete: 'VILLA', prix: 350000, caution: 700000, commune: 'Cocody', quartier: 'Angre 7eme tranche', adresse: 'Lot 245, Angre', superficie: 250, nombre_chambres: 4, nombre_salles_bain: 3, nombre_salons: 2, meublee: false, statut: 'DISPONIBLE' },
  { titre: 'Appartement Plateau Centre', description: 'Appartement moderne au coeur du Plateau avec vue sur la lagune et acces aux commodites', type_propriete: 'APPARTEMENT', prix: 250000, caution: 500000, commune: 'Plateau', quartier: 'Centre', adresse: 'Rue du Commerce', superficie: 120, nombre_chambres: 3, nombre_salles_bain: 2, nombre_salons: 1, meublee: true, statut: 'DISPONIBLE' },
  { titre: 'Studio Marcory Zone 4', description: 'Studio meuble ideal pour etudiant ou jeune professionnel dans un quartier dynamique', type_propriete: 'STUDIO', prix: 85000, caution: 170000, commune: 'Marcory', quartier: 'Zone 4', adresse: 'Rue des jardins', superficie: 45, nombre_chambres: 1, nombre_salles_bain: 1, nombre_salons: 0, meublee: true, statut: 'DISPONIBLE' },
  { titre: 'Villa Riviera Bonoumin', description: 'Villa de luxe avec piscine et 5 chambres dans le quartier huppe de Bonoumin a Cocody', type_propriete: 'VILLA', prix: 500000, caution: 1000000, commune: 'Cocody', quartier: 'Riviera Bonoumin', adresse: 'Rue des ambassades', superficie: 350, nombre_chambres: 5, nombre_salles_bain: 4, nombre_salons: 2, meublee: false, statut: 'DISPONIBLE' },
  { titre: 'Appartement Yopougon Maroc', description: 'Appartement familial proche du marche et des ecoles, ideal pour famille avec enfants', type_propriete: 'APPARTEMENT', prix: 120000, caution: 240000, commune: 'Yopougon', quartier: 'Maroc', adresse: 'Carrefour Maroc', superficie: 80, nombre_chambres: 2, nombre_salles_bain: 1, nombre_salons: 1, meublee: false, statut: 'DISPONIBLE' },
  { titre: 'Duplex Cocody Danga', description: 'Duplex spacieux avec terrasse panoramique et vue degagee sur la ville dans quartier calme', type_propriete: 'DUPLEX', prix: 400000, caution: 800000, commune: 'Cocody', quartier: 'Danga', adresse: 'Boulevard de France', superficie: 280, nombre_chambres: 4, nombre_salles_bain: 3, nombre_salons: 2, meublee: false, statut: 'DISPONIBLE' },
  { titre: 'Studio Treichville Avenue 12', description: 'Petit studio bien situe pres du port et des transports, ideal premier logement en ville', type_propriete: 'STUDIO', prix: 55000, caution: 110000, commune: 'Treichville', quartier: 'Avenue 12', adresse: 'Av 12 Rue 15', superficie: 30, nombre_chambres: 1, nombre_salles_bain: 1, nombre_salons: 0, meublee: false, statut: 'DISPONIBLE' },
  { titre: 'Appartement Abobo Gare', description: 'Appartement 3 chambres dans un quartier anime avec bon rapport qualite-prix et securite', type_propriete: 'APPARTEMENT', prix: 100000, caution: 200000, commune: 'Abobo', quartier: 'Gare', adresse: 'Pres de la gare routiere', superficie: 95, nombre_chambres: 3, nombre_salles_bain: 2, nombre_salons: 1, meublee: false, statut: 'DISPONIBLE' },
  { titre: 'Villa Bingerville Centre', description: 'Villa avec grand jardin dans un cadre verdoyant et calme a Bingerville pres du jardin botanique', type_propriete: 'VILLA', prix: 280000, caution: 560000, commune: 'Bingerville', quartier: 'Centre', adresse: 'Pres du jardin botanique', superficie: 200, nombre_chambres: 3, nombre_salles_bain: 2, nombre_salons: 1, meublee: false, statut: 'DISPONIBLE' },
  { titre: 'Appartement 2 Plateaux Vallons', description: 'Bel appartement renove dans un quartier prise par les expatries avec securite renforcee', type_propriete: 'APPARTEMENT', prix: 180000, caution: 360000, commune: 'Cocody', quartier: '2 Plateaux Vallons', adresse: 'Rue des vallons', superficie: 90, nombre_chambres: 2, nombre_salles_bain: 1, nombre_salons: 1, meublee: true, statut: 'DISPONIBLE' },
  { titre: 'Villa Grand-Bassam France', description: 'Villa bord de mer dans le quartier historique de Grand-Bassam, ideale residence secondaire', type_propriete: 'VILLA', prix: 200000, caution: 400000, commune: 'Grand-Bassam', quartier: 'Quartier France', adresse: 'Boulevard du bord de mer', superficie: 180, nombre_chambres: 3, nombre_salles_bain: 2, nombre_salons: 1, meublee: true, statut: 'DISPONIBLE' },
  { titre: 'Studio Koumassi Remblais', description: 'Studio propre et securise proche des transports en commun dans un quartier populaire anime', type_propriete: 'STUDIO', prix: 65000, caution: 130000, commune: 'Koumassi', quartier: 'Remblais', adresse: 'Rue principale', superficie: 40, nombre_chambres: 1, nombre_salles_bain: 1, nombre_salons: 0, meublee: false, statut: 'DISPONIBLE' },
  { titre: 'Appartement Adjame Liberte', description: 'Appartement bien entretenu avec acces facile au centre-ville et proche de toutes commodites', type_propriete: 'APPARTEMENT', prix: 95000, caution: 190000, commune: 'Adjame', quartier: 'Liberte', adresse: 'Av de la Liberte', superficie: 75, nombre_chambres: 2, nombre_salles_bain: 1, nombre_salons: 1, meublee: false, statut: 'DISPONIBLE' },
  { titre: 'Villa Assinie Mafia', description: 'Villa pieds dans eau dans un cadre paradisiaque, parfaite pour week-ends et vacances en famille', type_propriete: 'VILLA', prix: 450000, caution: 900000, commune: 'Assinie', quartier: 'Mafia', adresse: 'Bord de plage', superficie: 220, nombre_chambres: 4, nombre_salles_bain: 3, nombre_salons: 2, meublee: true, statut: 'DISPONIBLE' },
  { titre: 'Duplex Riviera Palmeraie', description: 'Duplex haut standing avec 5 chambres chacune avec salle de bain privative et grand salon', type_propriete: 'DUPLEX', prix: 550000, caution: 1100000, commune: 'Cocody', quartier: 'Riviera Palmeraie', adresse: 'Cite les palmiers', superficie: 380, nombre_chambres: 5, nombre_salles_bain: 5, nombre_salons: 2, meublee: false, statut: 'DISPONIBLE' },
];

console.log('\nCreation des maisons...');
let maisonIds = [];
for (const m of maisons) {
  const res = await apiFormData('/properties/maisons/', m, token);
  if (res) {
    const id = res.id || res.data?.id;
    maisonIds.push(id);
    console.log(`  OK ${m.titre} (ID: ${id})`);
  }
}

// 3. Les locataires sont deja crees (12 locataires du run precedent)
console.log('\nLocataires: deja crees (12 locataires)');

// 4. Creer des depenses (champs: titre, categorie, montant, date_depense, description)
// Categories valides: REPARATION, ENTRETIEN, FOURNITURES, TAXES, SALAIRES, AUTRES
const depenses = [
  { titre: 'Plomberie Villa Cocody', categorie: 'REPARATION', montant: 75000, date_depense: '2026-03-01', description: 'Reparation fuite eau salle de bain principale' },
  { titre: 'Peinture Appart Plateau', categorie: 'REPARATION', montant: 120000, date_depense: '2026-03-05', description: 'Peinture complete appartement avant nouvelle location' },
  { titre: 'Electricien urgence', categorie: 'REPARATION', montant: 45000, date_depense: '2026-02-20', description: 'Intervention urgente court-circuit Studio Marcory' },
  { titre: 'Assurance immeubles 2026', categorie: 'AUTRES', montant: 350000, date_depense: '2026-01-15', description: 'Prime assurance annuelle tous les biens' },
  { titre: 'Gardiennage mars', categorie: 'SALAIRES', montant: 80000, date_depense: '2026-03-01', description: 'Salaire gardien mensuel pour 3 proprietes' },
  { titre: 'Nettoyage parties communes', categorie: 'ENTRETIEN', montant: 35000, date_depense: '2026-03-10', description: 'Nettoyage mensuel escaliers et couloirs' },
  { titre: 'Climatiseur Studio Marcory', categorie: 'FOURNITURES', montant: 250000, date_depense: '2026-02-28', description: 'Achat et installation nouveau climatiseur split' },
  { titre: 'Taxe fonciere 2026', categorie: 'TAXES', montant: 500000, date_depense: '2026-02-01', description: 'Paiement taxe fonciere annuelle' },
  { titre: 'Toiture Villa Bingerville', categorie: 'REPARATION', montant: 180000, date_depense: '2026-03-12', description: 'Reparation infiltration eau toiture' },
  { titre: 'Fumigation termites', categorie: 'ENTRETIEN', montant: 95000, date_depense: '2026-01-20', description: 'Traitement anti-termites Villa Cocody' },
  { titre: 'Serrures Appart Yopougon', categorie: 'FOURNITURES', montant: 45000, date_depense: '2026-03-08', description: 'Changement serrures porte entree et chambres' },
  { titre: 'Salaire agent entretien', categorie: 'SALAIRES', montant: 60000, date_depense: '2026-03-01', description: 'Salaire mensuel agent entretien espaces verts' },
  { titre: 'Vidange fosse septique', categorie: 'ENTRETIEN', montant: 70000, date_depense: '2026-02-15', description: 'Vidange fosse Villa Riviera Bonoumin' },
  { titre: 'Taxe habitation Q1', categorie: 'TAXES', montant: 125000, date_depense: '2026-03-15', description: 'Taxe habitation premier trimestre 2026' },
  { titre: 'Portail electrique Duplex', categorie: 'FOURNITURES', montant: 320000, date_depense: '2026-02-10', description: 'Installation portail electrique Duplex Cocody Danga' },
];

console.log('\nCreation des depenses...');
let depenseCount = 0;
for (const d of depenses) {
  const res = await apiFormData('/expenses/', d, token);
  if (res) {
    depenseCount++;
    console.log(`  OK ${d.titre} - ${d.montant} FCFA`);
  }
}

console.log('\n--- Seed termine ! ---');
console.log(`   Maisons creees: ${maisonIds.length}`);
console.log(`   Locataires: 12 (deja en base)`);
console.log(`   Depenses creees: ${depenseCount}`);
