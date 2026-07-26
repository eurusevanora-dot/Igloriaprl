# Descargador de multimedia de WhatsApp

Descarga automáticamente fotos, PDFs y documentos Word del grupo de WhatsApp
**"Prueba"** a la carpeta local:

```
/Users/pepe/Desktop/PDF PRL SERVEO
```

Este script usa [`whatsapp-web.js`](https://wwebjs.dev/), que se conecta a
WhatsApp Web con tu propia cuenta (el mismo número que ya tienes vinculado
a WhatsApp Web). **Debe ejecutarse en tu Mac**, no en un servidor remoto.

## Requisitos

- Node.js 18 o superior instalado en tu Mac.
- Tener WhatsApp instalado en tu teléfono (el mismo número ya vinculado a
  WhatsApp Web).

## Instalación

```bash
cd whatsapp-media-downloader
npm install
```

## Uso

```bash
npm start
```

1. La primera vez aparecerá un código QR en la terminal. Escanéalo desde
   tu teléfono: **WhatsApp → Ajustes → Dispositivos vinculados → Vincular
   un dispositivo**.
2. Una vez autenticado, la sesión queda guardada en la carpeta
   `.wwebjs_auth/` (no se sube a git), así que no tendrás que volver a
   escanear el QR en próximas ejecuciones.
3. El script buscará el grupo llamado exactamente **"Prueba"**, descargará
   todo el contenido multimedia ya existente en el historial del grupo
   (imágenes, PDF, .doc, .docx) y se quedará escuchando para descargar
   automáticamente cualquier nuevo archivo que se envíe al grupo.
4. Deja la terminal abierta mientras quieras que siga escuchando nuevos
   mensajes. Para detenerlo, pulsa `Ctrl+C`.

## Configuración

Si cambias el nombre del grupo o la carpeta de destino, edita estas líneas
en `index.js`:

```js
const GROUP_NAME = 'Prueba';
const DOWNLOAD_DIR = '/Users/pepe/Desktop/PDF PRL SERVEO';
```

## Notas

- Solo se descargan imágenes, PDF y documentos Word (`.doc`/`.docx`); otros
  tipos de archivo (audios, vídeos, etc.) se ignoran a propósito.
- Los archivos ya descargados no se vuelven a descargar en ejecuciones
  posteriores.
- Esto usa una librería no oficial de WhatsApp Web; úsalo con tu propia
  cuenta y grupo, respetando los términos de servicio de WhatsApp.
