/**
 * End-to-End Encryption (E2EE) Utility
 * 
 * Uses the Web Crypto API to generate RSA-OAEP keys for key exchange,
 * and AES-GCM for message encryption.
 */

/**
 * Check if the Web Crypto API is available.
 * It requires a secure context (HTTPS or localhost) and is not available during SSR.
 */
function isCryptoAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof crypto !== "undefined" &&
    typeof crypto.subtle !== "undefined"
  );
}

// Key parameters
const RSA_ALGO = {
  name: "RSA-OAEP",
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
};

const AES_ALGO = {
  name: "AES-GCM",
  length: 256,
};

// Storage Keys
const PRIVATE_KEY_STORAGE = "e2ee_private_key";
const PUBLIC_KEY_STORAGE = "e2ee_public_key";

/**
 * ArrayBuffer to Base64 String
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Base64 String to ArrayBuffer
 */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Get or generate RSA key pair for the current user.
 * Keys are stored as JWK in localStorage to persist across reloads.
 */
export async function getOrGenerateKeyPair(): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey } | null> {
  if (!isCryptoAvailable()) {
    console.warn("Web Crypto API is not available (SSR or non-secure context). E2EE disabled.");
    return null;
  }

  const storedPriv = localStorage.getItem(PRIVATE_KEY_STORAGE);
  const storedPub = localStorage.getItem(PUBLIC_KEY_STORAGE);

  if (storedPriv && storedPub) {
    try {
      const privJwk = JSON.parse(storedPriv);
      const pubJwk = JSON.parse(storedPub);

      const privateKey = await crypto.subtle.importKey(
        "jwk",
        privJwk,
        RSA_ALGO,
        true,
        ["decrypt"]
      );

      const publicKey = await crypto.subtle.importKey(
        "jwk",
        pubJwk,
        RSA_ALGO,
        true,
        ["encrypt"]
      );

      return { publicKey, privateKey };
    } catch (err) {
      console.warn("Failed to load existing E2EE keys, generating new ones...", err);
      // Fallback to generating new keys if corrupted
    }
  }

  // Generate new keys
  const keyPair = await crypto.subtle.generateKey(
    RSA_ALGO,
    true, // Extractable so we can save it to localStorage
    ["encrypt", "decrypt"]
  );

  // Export and save
  const privJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  const pubJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);

  localStorage.setItem(PRIVATE_KEY_STORAGE, JSON.stringify(privJwk));
  localStorage.setItem(PUBLIC_KEY_STORAGE, JSON.stringify(pubJwk));

  return { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey };
}

/**
 * Replace locally stored keys with keys fetched from the server.
 * This is used when a user logs in on a new device.
 */
export async function loadKeysFromServer(pubJwkString: string, privJwkString: string): Promise<void> {
  // Validate they are JSON parsable
  JSON.parse(pubJwkString);
  JSON.parse(privJwkString);

  localStorage.setItem(PUBLIC_KEY_STORAGE, pubJwkString);
  localStorage.setItem(PRIVATE_KEY_STORAGE, privJwkString);
}

/**
 * Export public key to base64-encoded string (JWK)
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const jwk = await crypto.subtle.exportKey("jwk", key);
  return JSON.stringify(jwk);
}

/**
 * Export private key to base64-encoded string (JWK)
 * NOTE: For server-synced seamless E2EE.
 */
export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const jwk = await crypto.subtle.exportKey("jwk", key);
  return JSON.stringify(jwk);
}

/**
 * Import public key from string
 */
export async function importPublicKey(keyString: string): Promise<CryptoKey> {
  const jwk = JSON.parse(keyString);
  return await crypto.subtle.importKey(
    "jwk",
    jwk,
    RSA_ALGO,
    true,
    ["encrypt"]
  );
}

export type EncryptedMessagePayload = {
  content: string; // Base64 AES encrypted message
  key_recipient: string; // Base64 RSA encrypted AES key for recipient
  key_sender: string; // Base64 RSA encrypted AES key for sender
  iv: string; // Base64 IV
};

/**
 * Encrypt a text message for a recipient and the sender.
 */
export async function encryptMessage(
  text: string,
  senderPublicKey: CryptoKey,
  recipientPublicKey: CryptoKey
): Promise<string> {
  // 1. Generate a random AES-GCM key for this message
  const aesKey = await crypto.subtle.generateKey(
    AES_ALGO,
    true,
    ["encrypt", "decrypt"]
  );

  // 2. Encrypt the text with AES-GCM
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedContent = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encoder.encode(text)
  );

  // 3. Export the AES key so we can encrypt it with RSA
  const exportedAesKey = await crypto.subtle.exportKey("raw", aesKey);

  // 4. Encrypt the AES key with Recipient's Public Key
  const encKeyRecipient = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    recipientPublicKey,
    exportedAesKey
  );

  // 5. Encrypt the AES key with Sender's Public Key (for history)
  const encKeySender = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    senderPublicKey,
    exportedAesKey
  );

  // 6. Assemble the payload
  const payload: EncryptedMessagePayload = {
    content: bufferToBase64(encryptedContent),
    key_recipient: bufferToBase64(encKeyRecipient),
    key_sender: bufferToBase64(encKeySender),
    iv: bufferToBase64(iv.buffer as ArrayBuffer),
  };

  return JSON.stringify(payload);
}

/**
 * Decrypt a message payload.
 */
export async function decryptMessage(
  payloadString: string,
  privateKey: CryptoKey
): Promise<string> {
  try {
    const payload: EncryptedMessagePayload = JSON.parse(payloadString);

    if (!payload.content || !payload.iv || !payload.key_recipient || !payload.key_sender) {
      // If it parses as JSON but isn't our payload format, return it as plain text
      return payloadString;
    }

    // 1. Try to decrypt the AES key
    let rawAesKey: ArrayBuffer;
    try {
      rawAesKey = await crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        base64ToBuffer(payload.key_recipient)
      );
    } catch (e) {
      rawAesKey = await crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        base64ToBuffer(payload.key_sender)
      );
    }

    // 2. Import the decrypted AES key
    const aesKey = await crypto.subtle.importKey(
      "raw",
      rawAesKey,
      AES_ALGO,
      false,
      ["decrypt"]
    );

    // 3. Decrypt the content
    const iv = base64ToBuffer(payload.iv);
    const content = base64ToBuffer(payload.content);

    const decryptedContent = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      content
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedContent);
  } catch (err) {
    // If it fails to parse as JSON or fails to decrypt, assume it's a legacy plaintext message
    // or return a decryption error placeholder.
    if (err instanceof SyntaxError) {
      return payloadString;
    }
    console.error("Message decryption failed:", err);
    return "🔒 [Message decryption failed or you do not have the required key]";
  }
}
