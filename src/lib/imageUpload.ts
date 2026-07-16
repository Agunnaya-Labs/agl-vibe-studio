/**
 * imageUpload.ts — client-side image-to-data-URI converter.
 * Works offline with no external API. Call readFileAsDataUri() from
 * a <input type="file" accept="image/*"> onChange handler.
 *
 * Optional: if a server-side IPFS upload endpoint exists, swap the
 * returned data-URI for an ipfs:// URL by calling uploadToIPFS().
 */

/** Convert a File object to a base64 data URI string. */
export function readFileAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an image File to the server and receive a permanent URL.
 * Falls back to a data URI if the endpoint is unavailable.
 */
export async function uploadImage(file: File): Promise<string> {
  try {
    const dataUri = await readFileAsDataUri(file);
    // Try server-side store (returns { url } or falls back)
    const res = await fetch("/api/upload/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUri, filename: file.name, mimeType: file.type }),
    });
    if (res.ok) {
      const { url } = await res.json();
      return url;
    }
  } catch {
    // Network error — fall through to data URI
  }
  // Fallback: use the data URI directly (works everywhere, stored in localStorage)
  return readFileAsDataUri(file);
}
