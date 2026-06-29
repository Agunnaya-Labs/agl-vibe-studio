/**
 * Google Gmail REST API v1 Client Service
 * Fully client-side integration utilizing OAuth Access Token
 */

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  from?: string;
  to?: string;
  subject?: string;
  date?: string;
  snippet?: string;
  body?: string;
  labels?: string[];
}

export interface GmailDraft {
  id: string;
  message: {
    id: string;
    threadId: string;
  };
}

export interface GmailLabel {
  id: string;
  name: string;
  type: "system" | "user";
}

export class GmailService {
  private static BASE_URL = "https://gmail.googleapis.com/gmail/v1/users/me";

  /**
   * Helper to perform fetch requests with Authorization header
   */
  private static async apiRequest(
    accessToken: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${this.BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${accessToken}`);

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      let errMsg = `Gmail API error: ${response.status} ${response.statusText}`;
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
   * List messages in mailbox with query filters
   */
  static async listMessages(
    accessToken: string,
    query = "",
    maxResults = 15
  ): Promise<{ messages: { id: string; threadId: string }[]; nextPageToken?: string }> {
    let endpoint = `/messages?maxResults=${maxResults}`;
    if (query) {
      endpoint += `&q=${encodeURIComponent(query)}`;
    }
    const result = await this.apiRequest(accessToken, endpoint);
    return {
      messages: result.messages || [],
      nextPageToken: result.nextPageToken,
    };
  }

  /**
   * Get complete message payload and parse details
   */
  static async getMessageDetails(
    accessToken: string,
    messageId: string
  ): Promise<GmailMessageSummary> {
    const result = await this.apiRequest(accessToken, `/messages/${messageId}?format=full`);
    
    const headers: { [key: string]: string } = {};
    if (result.payload?.headers) {
      result.payload.headers.forEach((h: { name: string; value: string }) => {
        headers[h.name.toLowerCase()] = h.value;
      });
    }

    // Extract body content
    let body = "";
    if (result.payload) {
      body = this.parseBodyParts(result.payload);
    }

    return {
      id: result.id,
      threadId: result.threadId,
      from: headers["from"] || "Unknown Sender",
      to: headers["to"] || "Unknown Recipient",
      subject: headers["subject"] || "(No Subject)",
      date: headers["date"] || "",
      snippet: result.snippet || "",
      body: body || result.snippet || "",
      labels: result.labelIds || [],
    };
  }

  /**
   * Helper to parse multi-part body from Gmail payload
   */
  private static parseBodyParts(part: any): string {
    if (part.body?.data) {
      try {
        // Decode base64url encoded body
        const base64 = part.body.data.replace(/-/g, "+").replace(/_/g, "/");
        return decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
      } catch (e) {
        console.error("Failed to decode message part body", e);
        return "";
      }
    }

    let parsed = "";
    if (part.parts) {
      // First look for text/html
      const htmlPart = part.parts.find((p: any) => p.mimeType === "text/html");
      if (htmlPart) {
        parsed = this.parseBodyParts(htmlPart);
      } else {
        // Fallback to text/plain
        const plainPart = part.parts.find((p: any) => p.mimeType === "text/plain");
        if (plainPart) {
          parsed = this.parseBodyParts(plainPart);
        } else {
          // Drill down into nested parts
          for (const subPart of part.parts) {
            const subParsed = this.parseBodyParts(subPart);
            if (subParsed) {
              parsed = subParsed;
              break;
            }
          }
        }
      }
    }
    return parsed;
  }

  /**
   * Send an email message using web safe base64 encoding
   */
  static async sendMessage(
    accessToken: string,
    to: string,
    subject: string,
    bodyHtml: string
  ): Promise<any> {
    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    const emailLines = [
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      "Content-Type: text/html; charset=utf-8",
      "MIME-Version: 1.0",
      "",
      bodyHtml,
    ];
    const email = emailLines.join("\r\n");
    const base64SafeEmail = btoa(unescape(encodeURIComponent(email)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    return this.apiRequest(accessToken, "/messages/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: base64SafeEmail,
      }),
    });
  }

  /**
   * Create a draft message
   */
  static async createDraft(
    accessToken: string,
    to: string,
    subject: string,
    bodyHtml: string
  ): Promise<GmailDraft> {
    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    const emailLines = [
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      "Content-Type: text/html; charset=utf-8",
      "MIME-Version: 1.0",
      "",
      bodyHtml,
    ];
    const email = emailLines.join("\r\n");
    const base64SafeEmail = btoa(unescape(encodeURIComponent(email)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    return this.apiRequest(accessToken, "/drafts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          raw: base64SafeEmail,
        },
      }),
    });
  }

  /**
   * Retrieve list of labels
   */
  static async listLabels(accessToken: string): Promise<GmailLabel[]> {
    const result = await this.apiRequest(accessToken, "/labels");
    return result.labels || [];
  }

  /**
   * Modify labels on a message (e.g. mark as read, remove INBOX label)
   */
  static async modifyMessageLabels(
    accessToken: string,
    messageId: string,
    addLabelIds: string[],
    removeLabelIds: string[]
  ): Promise<any> {
    return this.apiRequest(accessToken, `/messages/${messageId}/modify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        addLabelIds,
        removeLabelIds,
      }),
    });
  }

  /**
   * Trash or delete a message
   */
  static async trashMessage(accessToken: string, messageId: string): Promise<any> {
    return this.apiRequest(accessToken, `/messages/${messageId}/trash`, {
      method: "POST",
    });
  }
}
