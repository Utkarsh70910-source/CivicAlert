/**
 * CivicAlert - Azure Blob Storage Service
 *
 * Handles secure, modular interactions with Azure Blob Storage:
 * - Base64 image decoding, MIME type validation, and payload size enforcement
 * - Collision-proof unique blob naming
 * - Uploads to private container with appropriate Content-Type headers
 * - Rollback/cleanup on partial upload failures
 * - Dynamic generation of short-lived read-only SAS URLs for authorized access
 *
 * Security:
 * - Azure credentials remain strictly backend-only via environment variables.
 * - Connection strings are never exposed to clients, logs, or API responses.
 * - Container access remains Private; blobs are accessed only via time-limited SAS tokens.
 */

const crypto = require('crypto');
const {
  BlobServiceClient,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} = require('@azure/storage-blob');

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB per image
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const DEFAULT_CONTAINER = 'civicalert-complaint-images';
const DEFAULT_SAS_HOURS = 24;

let cachedServiceClient = null;
let cachedCredentials = null;
let cachedConnStr = null;

/**
 * Checks whether Azure Storage credentials are configured.
 */
function isAzureConfigured() {
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
  return Boolean(connStr && connStr.trim().length > 0);
}

/**
 * Returns the configured container name.
 */
function getContainerName() {
  return process.env.AZURE_STORAGE_CONTAINER_NAME || DEFAULT_CONTAINER;
}

/**
 * Parses AccountName, AccountKey, and Endpoint from the connection string.
 */
function getStorageCredentials() {
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connStr) return null;

  if (cachedCredentials && cachedConnStr === connStr) {
    return cachedCredentials;
  }

  try {
    const matchName = connStr.match(/AccountName=([^;]+)/i);
    const matchKey = connStr.match(/AccountKey=([^;]+)/i);
    const matchSuffix = connStr.match(/EndpointSuffix=([^;]+)/i);

    if (!matchName || !matchKey) {
      return null;
    }

    const accountName = matchName[1].trim();
    const accountKey = matchKey[1].trim();
    const endpointSuffix = matchSuffix ? matchSuffix[1].trim() : 'core.windows.net';
    const credential = new StorageSharedKeyCredential(accountName, accountKey);

    cachedCredentials = {
      accountName,
      accountKey,
      endpointSuffix,
      credential,
    };
    cachedConnStr = connStr;

    return cachedCredentials;
  } catch (err) {
    console.error('[Azure Blob Storage] Error parsing connection string:', err.message);
    return null;
  }
}

/**
 * Gets or initializes the singleton BlobServiceClient.
 */
function getBlobServiceClient() {
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connStr) {
    throw new Error('Azure Storage connection string is not configured.');
  }

  if (cachedServiceClient && cachedConnStr === connStr) {
    return cachedServiceClient;
  }

  cachedServiceClient = BlobServiceClient.fromConnectionString(connStr);
  return cachedServiceClient;
}

/**
 * Parses a Base64 data URL string into a binary Buffer with MIME validation.
 */
function parseAndValidateBase64(dataUrl, index = 0) {
  if (typeof dataUrl !== 'string' || !dataUrl.trim()) {
    throw new Error(`Photo #${index + 1}: Invalid or empty image data.`);
  }

  const matches = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-+.]+);base64,(.+)$/);
  if (!matches) {
    throw new Error(`Photo #${index + 1}: Image must be a valid Base64 data URL.`);
  }

  const mimeType = matches[1].toLowerCase();
  const base64Data = matches[2];

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(
      `Photo #${index + 1}: Unsupported format (${mimeType}). Only JPEG, PNG, and WebP are accepted.`
    );
  }

  const buffer = Buffer.from(base64Data, 'base64');

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (buffer.length / (1024 * 1024)).toFixed(2);
    throw new Error(
      `Photo #${index + 1}: Image size (${sizeMb} MB) exceeds maximum allowed limit of 5 MB.`
    );
  }

  let ext = 'jpg';
  if (mimeType === 'image/png') ext = 'png';
  else if (mimeType === 'image/webp') ext = 'webp';

  return { buffer, mimeType, ext };
}

/**
 * Uploads an array of base64 image strings to Azure Blob Storage for a given complaint.
 * 
 * Guarantees:
 * - Content-Type metadata is preserved
 * - Collision-proof blob naming
 * - Rollback: if any upload in the batch fails, any successfully uploaded blobs are cleaned up.
 * 
 * Returns: { blobNames: string[], blobUrls: string[] }
 */
async function uploadComplaintImages(photos, referenceId) {
  if (!Array.isArray(photos) || photos.length === 0) {
    return { blobNames: [], blobUrls: [] };
  }

  if (photos.length > MAX_PHOTOS) {
    throw new Error(`Cannot upload more than ${MAX_PHOTOS} photos per complaint.`);
  }

  // 1. Validate all photos before beginning uploads
  const parsedItems = photos.map((photo, idx) => parseAndValidateBase64(photo, idx));

  const client = getBlobServiceClient();
  const containerName = getContainerName();
  const containerClient = client.getContainerClient(containerName);

  const uploadedBlobNames = [];
  const uploadedBlobUrls = [];

  try {
    const safeRef = (referenceId || 'complaint').replace(/[^a-zA-Z0-9_-]/g, '');

    for (let i = 0; i < parsedItems.length; i++) {
      const { buffer, mimeType, ext } = parsedItems[i];
      const randomId = crypto.randomBytes(6).toString('hex');
      const blobName = `complaints/${safeRef}/${Date.now()}-${randomId}-${i + 1}.${ext}`;

      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: {
          blobContentType: mimeType,
          blobCacheControl: 'public, max-age=86400',
        },
      });

      uploadedBlobNames.push(blobName);
      uploadedBlobUrls.push(blockBlobClient.url);
    }

    return {
      blobNames: uploadedBlobNames,
      blobUrls: uploadedBlobUrls,
    };
  } catch (err) {
    // Rollback: clean up any blobs uploaded so far to avoid orphan files
    console.error('[Azure Blob Storage] Upload error, rolling back batch:', err.message);
    for (const blobName of uploadedBlobNames) {
      try {
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.deleteIfExists();
      } catch (cleanupErr) {
        console.warn(`[Azure Blob Storage] Failed to delete blob ${blobName} during cleanup:`, cleanupErr.message);
      }
    }
    throw new Error(`Failed to upload complaint images to storage: ${err.message}`);
  }
}

/**
 * Generates a short-lived read-only SAS URL for a specific blob.
 * This allows authorized clients to view the image without exposing the container publicly.
 */
function generateReadSasUrl(blobName, durationHours = DEFAULT_SAS_HOURS) {
  if (!blobName) return null;

  const creds = getStorageCredentials();
  if (!creds) {
    // If credentials are not parseable, return null or permanent URL without SAS
    return null;
  }

  const containerName = getContainerName();
  const startsOn = new Date(Date.now() - 5 * 60 * 1000); // 5 min clock skew allowance
  const expiresOn = new Date(Date.now() + durationHours * 60 * 60 * 1000);

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse('r'),
      startsOn,
      expiresOn,
    },
    creds.credential
  ).toString();

  return `https://${creds.accountName}.blob.${creds.endpointSuffix}/${containerName}/${blobName}?${sasToken}`;
}

/**
 * Dynamically enriches a complaint object with short-lived read-only SAS URLs
 * for its stored blobNames.
 *
 * Populates `photos` and `photoPreview` so existing frontend components
 * continue working seamlessly with direct <img src={url} /> tags.
 */
function populateSasUrls(complaint, durationHours = DEFAULT_SAS_HOURS) {
  if (!complaint) return complaint;

  const blobNames = Array.isArray(complaint.blobNames) ? complaint.blobNames : [];

  if (blobNames.length > 0 && isAzureConfigured()) {
    const sasUrls = blobNames
      .map((name) => generateReadSasUrl(name, durationHours))
      .filter(Boolean);

    if (sasUrls.length > 0) {
      complaint.photos = sasUrls;
      complaint.photoPreview = sasUrls[0] || null;
      return complaint;
    }
  }

  // Fallback: if no blobNames or Azure is not configured, preserve existing photos
  if (!Array.isArray(complaint.photos) || complaint.photos.length === 0) {
    if (complaint.photoPreview) {
      complaint.photos = [complaint.photoPreview];
    } else {
      complaint.photos = [];
    }
  }
  complaint.photoPreview = complaint.photos[0] || null;

  return complaint;
}

module.exports = {
  isAzureConfigured,
  getContainerName,
  parseAndValidateBase64,
  uploadComplaintImages,
  generateReadSasUrl,
  populateSasUrls,
  MAX_PHOTOS,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
};

