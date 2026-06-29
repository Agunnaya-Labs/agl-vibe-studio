/**
 * Google Drive REST API v3 Client Service
 * Fully client-side integration utilizing OAuth Access Token
 */

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  size?: string;
}

export class GoogleDriveService {
  private static BASE_URL = "https://www.googleapis.com/drive/v3";
  private static UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3";

  /**
   * Helper to perform fetch requests with Authorization header
   */
  private static async apiRequest(
    accessToken: string,
    endpoint: string,
    options: RequestInit = {},
    isUploadUrl = false
  ): Promise<any> {
    const baseUrl = isUploadUrl ? this.UPLOAD_URL : this.BASE_URL;
    const url = `${baseUrl}${endpoint}`;

    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${accessToken}`);

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      let errMsg = `Drive API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData?.error?.message) {
          errMsg += ` - ${errorData.error.message}`;
        }
      } catch (_) {}
      throw new Error(errMsg);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  /**
   * List files matching query
   */
  static async listFiles(
    accessToken: string,
    query = "trashed = false",
    fields = "files(id, name, mimeType, createdTime, size)"
  ): Promise<GoogleDriveFile[]> {
    const encodedQuery = encodeURIComponent(query);
    const encodedFields = encodeURIComponent(fields);
    const endpoint = `/files?q=${encodedQuery}&fields=${encodedFields}&orderBy=createdTime desc`;

    const result = await this.apiRequest(accessToken, endpoint);
    return result.files || [];
  }

  /**
   * Search specifically for Agunnaya Labs backup JSON files
   */
  static async listBackups(accessToken: string): Promise<GoogleDriveFile[]> {
    const query = "name contains 'agunnaya_backup' and mimeType = 'application/json' and trashed = false";
    return this.listFiles(accessToken, query);
  }

  /**
   * Create a file metadata then upload content in a two-step process
   */
  static async createJsonFile(
    accessToken: string,
    filename: string,
    content: any
  ): Promise<GoogleDriveFile> {
    // Step 1: Create Metadata
    const metadataEndpoint = "/files";
    const fileMetadata = {
      name: filename,
      mimeType: "application/json",
    };

    const metadataResult = await this.apiRequest(accessToken, metadataEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fileMetadata),
    });

    const fileId = metadataResult.id;
    if (!fileId) {
      throw new Error("Failed to create file metadata in Google Drive.");
    }

    // Step 2: Upload Content (Media)
    const mediaEndpoint = `/files/${fileId}?uploadType=media`;
    await this.apiRequest(
      accessToken,
      mediaEndpoint,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: typeof content === "string" ? content : JSON.stringify(content, null, 2),
      },
      true // uses UPLOAD_URL
    );

    return metadataResult;
  }

  /**
   * Read raw content of a specific file
   */
  static async getFileContent(accessToken: string, fileId: string): Promise<any> {
    const url = `${this.BASE_URL}/files/${fileId}?alt=media`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download file content: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }
    return response.text();
  }

  /**
   * Delete a file
   */
  static async deleteFile(accessToken: string, fileId: string): Promise<void> {
    const endpoint = `/files/${fileId}`;
    await this.apiRequest(accessToken, endpoint, {
      method: "DELETE",
    });
  }

  /**
   * Create/upload generic text or file
   */
  static async uploadGenericFile(
    accessToken: string,
    name: string,
    mimeType: string,
    content: string | Blob
  ): Promise<GoogleDriveFile> {
    // 1. Create Metadata
    const metadataEndpoint = "/files";
    const fileMetadata = { name, mimeType };

    const metadataResult = await this.apiRequest(accessToken, metadataEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fileMetadata),
    });

    const fileId = metadataResult.id;
    if (!fileId) {
      throw new Error("Failed to create file metadata in Google Drive.");
    }

    // 2. Upload Content
    const mediaEndpoint = `/files/${fileId}?uploadType=media`;
    await this.apiRequest(
      accessToken,
      mediaEndpoint,
      {
        method: "PATCH",
        headers: { "Content-Type": mimeType },
        body: content,
      },
      true
    );

    return metadataResult;
  }
}
