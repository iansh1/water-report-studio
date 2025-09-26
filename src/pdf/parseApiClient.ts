import { ContaminantRecord, PdfExtractionResult } from './types';

// ParseAPI client for serverless PDF processing
export class ParseApiClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.parseapi.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async extractText(buffer: Buffer, fileName: string): Promise<{ text: string; pageCount: number }> {
    try {
      console.log('[parseapi] Starting PDF text extraction...');
      
      const formData = new FormData();
      const uint8Array = new Uint8Array(buffer);
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      formData.append('file', blob, fileName);
      formData.append('output_format', 'text');
      formData.append('extract_images', 'false'); // We only need text

      const response = await fetch(`${this.baseUrl}/extract`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ParseAPI request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      console.log('[parseapi] Successfully extracted text');
      
      return {
        text: result.text || '',
        pageCount: result.pages || 1,
      };
    } catch (error) {
      console.error('[parseapi] Text extraction failed:', error);
      throw error;
    }
  }

  async parseDocument(buffer: Buffer, fileName: string): Promise<any> {
    try {
      console.log('[parseapi] Starting structured document parsing...');
      
      const formData = new FormData();
      const uint8Array = new Uint8Array(buffer);
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      formData.append('file', blob, fileName);
      formData.append('output_format', 'json');
      formData.append('extract_tables', 'true');

      const response = await fetch(`${this.baseUrl}/parse`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ParseAPI request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      console.log('[parseapi] Successfully parsed document structure');
      
      return result;
    } catch (error) {
      console.error('[parseapi] Document parsing failed:', error);
      throw error;
    }
  }
}

// Alternative free/open-source API option
export class AlternativePdfApiClient {
  private baseUrl: string = 'https://api.pdf.co/v1'; // PDF.co has a free tier
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async extractText(buffer: Buffer, fileName: string): Promise<{ text: string; pageCount: number }> {
    try {
      console.log('[pdfco] Starting PDF text extraction...');
      
      // First, upload the file
      const uploadResponse = await fetch(`${this.baseUrl}/file/upload`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/octet-stream',
        },
        body: new Uint8Array(buffer),
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      const uploadResult = await uploadResponse.json();
      const fileUrl = uploadResult.url;

      // Then extract text
      const extractResponse = await fetch(`${this.baseUrl}/pdf/convert/to/text`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: fileUrl,
          pages: '',
          async: false,
        }),
      });

      if (!extractResponse.ok) {
        throw new Error(`Extraction failed: ${extractResponse.status}`);
      }

      const extractResult = await extractResponse.json();
      
      console.log('[pdfco] Successfully extracted text');
      
      return {
        text: extractResult.body || '',
        pageCount: 1, // PDF.co doesn't return page count in text extraction
      };
    } catch (error) {
      console.error('[pdfco] Text extraction failed:', error);
      throw error;
    }
  }
}
