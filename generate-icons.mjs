#!/usr/bin/env node
// Génère logo-192.png et logo-512.png : icône carrée navy + triangle maroon + rayures steel
import zlib from 'zlib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── CRC32 ──────────────────────────────────────────────────────────────────
const CRC = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  CRC[n] = c;
}
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// ── PNG builder ────────────────────────────────────────────────────────────
function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(d.length);
  const crc = Buffer.allocUnsafe(4); crc.writeUInt32BE(crc32(Buffer.concat([t, d])));
  return Buffer.concat([len, t, d, crc]);
}

function buildPNG(S, pixels) {
  // pixels: Uint8Array length S*S*4 (RGBA)
  const rows = [];
  for (let y = 0; y < S; y++) {
    rows.push(Buffer.from([0]));
    rows.push(Buffer.from(pixels.buffer, pixels.byteOffset + y * S * 4, S * 4));
  }
  const comp = zlib.deflateSync(Buffer.concat(rows), { level: 6 });
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4);
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
  return Buffer.concat([
    Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', comp),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Dessin de l'icône ──────────────────────────────────────────────────────
function paintIcon(S) {
  const px = new Uint8Array(S * S * 4);
  const put = (x, y, r, g, b) => {
    if (x < 0 || x >= S || y < 0 || y >= S) return;
    const i = (y * S + x) * 4;
    px[i]=r; px[i+1]=g; px[i+2]=b; px[i+3]=255;
  };

  // Fond navy
  for (let i = 0; i < S * S * 4; i += 4) {
    px[i]=30; px[i+1]=58; px[i+2]=95; px[i+3]=255;
  }

  // Paramètres triangle (marge 12% pour zone safe maskable)
  const pad   = Math.round(S * 0.12);
  const TX    = S / 2;           // sommet x (centre)
  const TY    = pad;             // sommet y (haut)
  const LX    = pad;             // bas gauche x
  const RX    = S - pad;         // bas droite x
  const BY    = Math.round(S * 0.86); // bas y

  const thick = Math.max(3, Math.round(S * 0.032)); // épaisseur bordure

  // Pente côté gauche du triangle
  const slope = (LX - TX) / (BY - TY); // négatif

  for (let y = TY; y <= BY; y++) {
    const t  = (y - TY) / (BY - TY);
    const lx = Math.round(TX + (LX - TX) * t);
    const rx = Math.round(TX + (RX - TX) * t);

    for (let x = lx; x <= rx; x++) {
      const fL = x - lx;
      const fR = rx - x;
      const fB = BY - y;

      if (fL < thick || fR < thick || fB < thick) {
        // Bordure maroon
        put(x, y, 139, 42, 54);
      } else {
        // Rayures diagonales (parallèles au côté gauche du triangle)
        // d = constante le long d'une droite parallèle au côté gauche
        const d = (y / S) - slope * (x / S);
        //  stripe 1 : clair
        if      (d >= 0.52 && d < 0.59) put(x, y, 150, 185, 215);
        // stripe 2 : moyen
        else if (d >= 0.63 && d < 0.70) put(x, y, 120, 160, 195);
        // stripe 3 : foncé
        else if (d >= 0.74 && d < 0.81) put(x, y,  90, 130, 165);
        // sinon : fond navy (déjà rempli)
      }
    }
  }

  return px;
}

// ── Génération ─────────────────────────────────────────────────────────────
for (const S of [192, 512]) {
  const pixels = paintIcon(S);
  const png    = buildPNG(S, pixels);
  const out    = path.join(__dirname, 'public', `logo-${S}.png`);
  fs.writeFileSync(out, png);
  console.log(`✓ ${out}  (${png.length} octets)`);
}
console.log('Icônes générées !');
