declare module 'pdf-parse' {
  export interface PDFInfo {
    Pages?: number;
    Producer?: string;
    Creator?: string;
    CreationDate?: string;
    ModDate?: string;
  }

  export interface PDFParseResult {
    text: string;
    info?: PDFInfo;
  }

  export default function pdfParse(buffer: Buffer): Promise<PDFParseResult>;
}
