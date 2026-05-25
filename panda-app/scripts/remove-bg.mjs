import sharp from 'sharp';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ORIG = join(__dirname, '..', '..', 'Nuevos productos');
const DEST = join(__dirname, '..', 'public', 'assets', 'productos');

// Flood-fill desde TODO el borde, 8-conectado para no dejar fondo atrapado
async function removeBg(inputPath, outputPath, { bright = 175, sat = 30 } = {}) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const px      = new Uint8ClampedArray(data);
  const visited = new Uint8Array(width * height);

  function isBg(i) {
    if (px[i + 3] === 0) return true;
    const r = px[i], g = px[i+1], b = px[i+2];
    return (r+g+b)/3 > bright && Math.max(r,g,b) - Math.min(r,g,b) < sat;
  }

  const stack = new Int32Array(width * height * 2);
  let top = 0;
  function push(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    if (!isBg(idx * 4)) return;
    visited[idx] = 1; stack[top++] = x; stack[top++] = y;
  }

  for (let x = 0; x < width; x++)        { push(x, 0); push(x, height-1); }
  for (let y = 1; y < height-1; y++)     { push(0, y); push(width-1, y); }

  while (top > 0) {
    const y = stack[--top], x = stack[--top];
    px[(y * width + x) * 4 + 3] = 0;
    // 8-conectado: alcanza fondo atrapado entre diagonal de producto
    push(x+1,y); push(x-1,y); push(x,y+1); push(x,y-1);
    push(x+1,y+1); push(x-1,y-1); push(x+1,y-1); push(x-1,y+1);
  }

  const buf = await sharp(Buffer.from(px.buffer), { raw: { width, height, channels: 4 } })
    .png().toBuffer();
  await applyTrim(buf, outputPath);
}

// Solo recorte de márgenes (para imágenes que ya tienen transparencia correcta)
async function applyTrim(input, outputPath) {
  const buf = await sharp(input).ensureAlpha().trim().png({ compressionLevel: 8 }).toBuffer();
  await sharp(buf).toFile(outputPath);
  console.log(`OK: ${basename(outputPath)}`);
}

// ─── PASTEL DE LIMÓN ──────────────────────────────────────────────────────────
// El original YA tiene transparencia. NO flood-fill (el betún blanco es igual
// al fondo y se destruye). Solo trimear para zoom.
await applyTrim(join(ORIG, 'pastelLimon.png'), join(DEST, 'pastelLimon.png'));

// ─── JIAN DUI ─────────────────────────────────────────────────────────────────
// JPEG con checkerboard baked-in, bolitas crean fondo atrapado entre ellas.
// Usar 8-conectado para rodear las esquinas.
await removeBg(
  join(ORIG, 'WhatsApp Image 2026-05-24 at 2.23.05 PM.jpeg'),
  join(DEST, 'jianDui.png'),
  { bright: 175, sat: 28 }
);

// ─── PASTEL DE LUNA ───────────────────────────────────────────────────────────
// JPEG con fondo gris liso. Flood-fill estándar → guardar como PNG.
await removeBg(
  join(ORIG, 'WhatsApp Image 2026-05-24 at 2.15.10 PM.jpeg'),
  join(DEST, 'pastelLuna.png'),
  { bright: 165, sat: 25 }
);

// ─── RESTO: solo trim para zoom ───────────────────────────────────────────────
for (const f of ['baoCerdo.png', 'galletasAlmendra.png', 'tangHulu.png', 'tartaHuevo.png']) {
  await applyTrim(join(DEST, f), join(DEST, f));
}
