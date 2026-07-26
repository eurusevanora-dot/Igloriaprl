'use strict';

const fs = require('fs');
const path = require('path');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// ---- Configuración ----
const GROUP_NAME = 'Prueba';
const DOWNLOAD_DIR = '/Users/pepe/Desktop/PDF PRL SERVEO';

// Tipos de archivo que queremos guardar (imágenes, PDF y Word)
const ALLOWED_MIME_PREFIXES = ['image/'];
const ALLOWED_MIME_EXACT = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

function isWantedMedia(mimetype) {
  if (!mimetype) return false;
  if (ALLOWED_MIME_EXACT.includes(mimetype)) return true;
  return ALLOWED_MIME_PREFIXES.some((prefix) => mimetype.startsWith(prefix));
}

function extensionFor(mimetype, fallbackName) {
  if (MIME_TO_EXT[mimetype]) return MIME_TO_EXT[mimetype];
  if (fallbackName && fallbackName.includes('.')) {
    return fallbackName.split('.').pop();
  }
  return 'bin';
}

function sanitizeFilename(name) {
  return name.replace(/[/\\?%*:|"<>]/g, '_');
}

function ensureDownloadDir() {
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    console.log(`Carpeta creada: ${DOWNLOAD_DIR}`);
  }
}

function buildFilePath(message, media) {
  const timestamp = message.timestamp
    ? new Date(message.timestamp * 1000).toISOString().replace(/[:.]/g, '-')
    : Date.now();
  const ext = extensionFor(media.mimetype, media.filename);
  const baseName = media.filename
    ? sanitizeFilename(path.parse(media.filename).name)
    : `whatsapp_${message.id.id}`;
  const fileName = `${timestamp}_${baseName}.${ext}`;
  return path.join(DOWNLOAD_DIR, fileName);
}

async function downloadMessageMedia(message, seenIds) {
  if (!message.hasMedia) return;
  if (seenIds.has(message.id.id)) return;

  try {
    const media = await message.downloadMedia();
    if (!media) return;
    if (!isWantedMedia(media.mimetype)) return;

    const filePath = buildFilePath(message, media);
    if (fs.existsSync(filePath)) {
      seenIds.add(message.id.id);
      return;
    }

    fs.writeFileSync(filePath, Buffer.from(media.data, 'base64'));
    seenIds.add(message.id.id);
    console.log(`Descargado: ${filePath}`);
  } catch (err) {
    console.error(`Error descargando mensaje ${message.id.id}:`, err.message);
  }
}

async function downloadExistingHistory(chat, seenIds) {
  console.log('Descargando el historial de contenido multimedia del grupo...');
  const messages = await chat.fetchMessages({ limit: Infinity });
  console.log(`Se encontraron ${messages.length} mensajes en el historial.`);

  for (const message of messages) {
    await downloadMessageMedia(message, seenIds);
  }

  console.log('Historial revisado.');
}

async function main() {
  ensureDownloadDir();

  const seenIds = new Set();

  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.wwebjs_auth') }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  client.on('qr', (qr) => {
    console.log('Escanea este código QR con WhatsApp (Dispositivos vinculados) en tu teléfono:');
    qrcode.generate(qr, { small: true });
  });

  client.on('authenticated', () => {
    console.log('Autenticado correctamente. La sesión quedará guardada para próximas ejecuciones.');
  });

  client.on('auth_failure', (msg) => {
    console.error('Fallo de autenticación:', msg);
  });

  client.on('ready', async () => {
    console.log('Cliente de WhatsApp listo.');

    const chats = await client.getChats();
    const group = chats.find((chat) => chat.isGroup && chat.name === GROUP_NAME);

    if (!group) {
      console.error(`No se encontró ningún grupo llamado "${GROUP_NAME}". Revisa el nombre exacto.`);
      return;
    }

    console.log(`Grupo encontrado: "${group.name}" (${group.id._serialized})`);

    await downloadExistingHistory(group, seenIds);

    console.log('Esperando nuevos mensajes con contenido multimedia... (Ctrl+C para salir)');

    client.on('message', async (message) => {
      if (message.from !== group.id._serialized) return;
      await downloadMessageMedia(message, seenIds);
    });
  });

  client.initialize();
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
