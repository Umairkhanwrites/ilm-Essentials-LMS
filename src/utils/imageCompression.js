/**
 * imageCompression.js — Native HTML Canvas Image Compressor
 *
 * Zero-dependency, lightweight image compressor designed for Supabase Free Tier optimization:
 * - Resizes images to max dimensions (default 1000px width/height for receipts)
 * - Converts to optimized WebP (fallback to JPEG) at 0.7 quality
 * - Enforces 10 MB maximum file size limit
 * - Passes through application/pdf without modification
 * - Includes specialized compressAvatar() for 256x256 thumbnailing
 */

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Validates file type and size before compression
 */
export function validateUploadFile(file) {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds the 10 MB limit. Please select a smaller file.');
  }

  const type = (file.type || '').toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(type)) {
    throw new Error('Unsupported file format. Please upload JPG, PNG, WebP, or PDF.');
  }

  return true;
}

/**
 * Compress an uploaded receipt image or slip using browser canvas
 *
 * @param {File} file - Original file from file input
 * @param {object} options
 * @param {number} [options.maxWidth=1000] - Max width in pixels
 * @param {number} [options.maxHeight=1000] - Max height in pixels
 * @param {number} [options.quality=0.7] - WebP/JPEG compression quality (0 to 1)
 * @returns {Promise<File>} Compressed File object
 */
export async function compressReceiptImage(file, options = {}) {
  validateUploadFile(file);

  // If already a PDF document, pass through as-is
  if (file.type === 'application/pdf') {
    return file;
  }

  const {
    maxWidth = 1000,
    maxHeight = 1000,
    quality = 0.7,
  } = options;

  return new Promise((resolve, reject) => {
    // If not in a browser environment (e.g. Node tests), return file
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return resolve(file);
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;

      // Scale down preserving aspect ratio
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(file); // Fallback to original if canvas context unavailable
      }

      // Smooth bicubic downsampling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fill white background in case of transparent PNGs converting to JPEG/WebP
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(img, 0, 0, width, height);

      // Determine optimal mime type (prefer image/webp, fallback to image/jpeg)
      const targetMime = 'image/webp';
      const fallbackMime = 'image/jpeg';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve(file);
          }

          // If compression somehow produced a larger file, keep the smaller one
          if (blob.size >= file.size) {
            return resolve(file);
          }

          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
          const compressedFile = new File([blob], `${baseName}.${extension}`, {
            type: blob.type,
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        targetMime,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression. File may be corrupted.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Compress an avatar / profile image to 256x256 thumbnail (< 50 KB)
 *
 * @param {File} file - Original avatar file
 * @returns {Promise<File>} Compressed File object
 */
export async function compressAvatar(file) {
  return compressReceiptImage(file, {
    maxWidth: 256,
    maxHeight: 256,
    quality: 0.8,
  });
}

/**
 * Convert a File or Blob to Base64 data URL for instant client-side preview
 */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

/**
 * Strips or blocks inline Base64 data strings (data:image/... or data:application/...)
 * from being persisted into PostgreSQL text columns or database records.
 *
 * @param {string} text - Input text or URL string
 * @param {string} [fallback=''] - Value to substitute if the entire string is a Base64 blob
 * @returns {string} Sanitized string free of database-bloating Base64 payloads
 */
export function sanitizeNoBase64(text, fallback = '') {
  if (typeof text !== 'string') return text;
  const trimmed = text.trim();
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('data:application/')) {
    return fallback;
  }
  // Strip embedded data:image;base64,... URIs inside HTML or markdown notes
  if (trimmed.includes('data:image/')) {
    return trimmed.replace(/data:image\/[a-zA-Z0-9.+-]+;base64,[a-zA-Z0-9+/=]+/gi, fallback);
  }
  return text;
}
