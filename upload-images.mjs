/**
 * Upload images to existing properties
 * Usage: node upload-images.mjs
 */

const API = 'https://gestion-locative-fqax.onrender.com/api';

const IMAGE_MAP = {
  'Villa Prestige Cocody Angre': [
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  ],
  'Appartement Moderne Plateau': [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  ],
  'Studio Meuble Marcory Zone 4': [
    'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80',
    'https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=800&q=80',
  ],
  'Villa de Luxe Riviera Golf': [
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
    'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80',
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80',
  ],
  'Appartement Familial Yopougon': [
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80',
  ],
  'Duplex Standing 2 Plateaux': [
    'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800&q=80',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
  ],
  'Appartement Vue Lagune Marcory': [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
    'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
  ],
  'Villa Bord de Mer Bassam': [
    'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
  ],
  'F2 Moderne Abobo Centre': [
    'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80',
    'https://images.unsplash.com/photo-1560448075-cbc16bb4af8e?w=800&q=80',
  ],
  'Penthouse Cocody Ambassades': [
    'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80',
    'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  ],
  // Anciennes proprietes aussi
  'Villa Cocody Angre': [
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  ],
  'Appartement Plateau Centre': [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  ],
  'Studio Marcory Zone 4': [
    'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80',
  ],
  'Villa Riviera Bonoumin': [
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80',
  ],
  'Appartement Yopougon Maroc': [
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
  ],
  'Duplex Cocody Danga': [
    'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800&q=80',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
  ],
  'Studio Treichville Avenue 12': [
    'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80',
  ],
  'Appartement Abobo Gare': [
    'https://images.unsplash.com/photo-1560448075-cbc16bb4af8e?w=800&q=80',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80',
  ],
  'Villa Bingerville Centre': [
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
  ],
  'Appartement 2 Plateaux Vallons': [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
  ],
  'Villa Grand-Bassam France': [
    'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80',
  ],
  'Studio Koumassi Remblais': [
    'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80',
  ],
  'Appartement Adjame Liberte': [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
  ],
  'Villa Assinie Mafia': [
    'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
  ],
};

// Login
console.log('=== UPLOAD IMAGES ===\n');
console.log('Connexion...');
const lr = await fetch(`${API}/auth/login/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'fofanaissouf179@gmail.com', password: 'Mariamapp2026@12/^^!' }),
});
const ld = await lr.json();
const token = ld.data?.tokens?.access;
console.log('Connecte !\n');

// Get all properties
const res = await fetch(`${API}/properties/maisons/`, { headers: { Authorization: `Bearer ${token}` } });
const data = await res.json();
const list = data?.data?.results || data?.results || data?.data || [];

let uploaded = 0;
let skipped = 0;

for (const m of list) {
  // Check if already has images
  const dr = await fetch(`${API}/properties/maisons/${m.id}/`, { headers: { Authorization: `Bearer ${token}` } });
  const dd = await dr.json();
  const detail = dd?.data || dd;
  const existingImages = detail?.images || [];

  if (existingImages.length > 0) {
    console.log(`  SKIP ${m.titre} (deja ${existingImages.length} images)`);
    skipped++;
    continue;
  }

  const imageUrls = IMAGE_MAP[m.titre];
  if (!imageUrls) {
    console.log(`  SKIP ${m.titre} (pas d'images definies)`);
    skipped++;
    continue;
  }

  console.log(`  ${m.titre} - telechargement ${imageUrls.length} images...`);

  const formData = new FormData();
  let count = 0;
  for (const url of imageUrls) {
    try {
      const imgRes = await fetch(url);
      if (imgRes.ok) {
        const buffer = await imgRes.arrayBuffer();
        const blob = new Blob([buffer], { type: 'image/jpeg' });
        formData.append('images', blob, `photo_${count + 1}.jpg`);
        count++;
      }
    } catch (e) {
      console.log(`    Erreur: ${e.message}`);
    }
  }

  if (count === 0) {
    console.log(`    Aucune image telechargee`);
    continue;
  }

  const upRes = await fetch(`${API}/properties/maisons/${m.id}/ajouter_images/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (upRes.ok) {
    console.log(`    ${count} images uploadees !`);
    uploaded++;
  } else {
    const err = await upRes.text();
    console.log(`    ERREUR upload: ${err.slice(0, 150)}`);
  }
}

console.log(`\n=== TERMINE: ${uploaded} proprietes avec images, ${skipped} ignorees ===`);
