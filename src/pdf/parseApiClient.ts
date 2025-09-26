import { ContaminantRecord, PdfExtractionResult } from './types';

// PDF.co client for serverless PDF processing (Real working API)
export class PdfCoApiClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.pdf.co/v1';

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
        const errorText = await uploadResponse.text();
        throw new Error(`PDF.co upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
      }

      const uploadResult = await uploadResponse.json();
      
      if (!uploadResult.url) {
        throw new Error('PDF.co upload did not return a file URL');
      }

      const fileUrl = uploadResult.url;
      console.log('[pdfco] File uploaded successfully, extracting text...');

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
        const errorText = await extractResponse.text();
        throw new Error(`PDF.co extraction failed: ${extractResponse.status} ${extractResponse.statusText} - ${errorText}`);
      }

      const extractResult = await extractResponse.json();
      
      if (!extractResult.body && extractResult.error) {
        throw new Error(`PDF.co extraction error: ${extractResult.error}`);
      }
      
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

// AWS Textract client for high-accuracy PDF processing
export class AwsTextractClient {
  private accessKeyId: string;
  private secretAccessKey: string;
  private region: string = 'us-east-1';

  constructor(accessKeyId: string, secretAccessKey: string, region: string = 'us-east-1') {
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.region = region;
  }

  async extractText(buffer: Buffer, fileName: string): Promise<{ text: string; pageCount: number }> {
    try {
      console.log('[textract] Starting PDF text extraction...');
      
      // Note: This would require AWS SDK implementation
      // For now, return a placeholder that falls back to other methods
      throw new Error('AWS Textract integration requires AWS SDK setup');
    } catch (error) {
      console.error('[textract] Text extraction failed:', error);
      throw error;
    }
  }
}
