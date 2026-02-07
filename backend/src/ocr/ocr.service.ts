import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as Tesseract from 'tesseract.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fromPath } from 'pdf2pic';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Process a document with OCR
   */
  async processDocument(documentId: string, tenantId?: string) {
    try {
      this.logger.log(`Starting OCR processing for document: ${documentId}`);

      // Update status to PROCESSING
      await this.prisma.document.update({
        where: { id: documentId },
        data: { ocrStatus: 'PROCESSING' },
      });

      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new NotFoundException('Document not found');
      }

      let extractedText = '';

      // Check if file exists
      try {
        await fs.access(document.filePath);
      } catch {
        throw new Error(`File not found: ${document.filePath}`);
      }

      if (document.mimeType === 'application/pdf') {
        // Always use image-based OCR for PDFs to ensure correct Arabic text
        // pdf-parse often produces reversed/corrupted Arabic text
        this.logger.log('Converting PDF to images for OCR (ensures correct Arabic text)...');
        extractedText = await this.ocrScannedPDF(document.filePath);
      } else if (document.mimeType.startsWith('image/')) {
        // For images, directly use OCR
        extractedText = await this.performOCR(document.filePath);
      } else {
        // For other file types, mark as not applicable
        await this.prisma.document.update({
          where: { id: documentId },
          data: {
            ocrStatus: 'NOT_APPLICABLE',
            ocrError: 'File type not supported for OCR',
          },
        });
        return { success: true, message: 'File type not supported for OCR' };
      }

      // Update document with extracted text
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          ocrText: extractedText,
          ocrStatus: 'COMPLETED',
          ocrError: null,
        },
      });

      this.logger.log(`OCR completed for document: ${documentId}, extracted ${extractedText.length} characters`);
      return { success: true, textLength: extractedText.length };
    } catch (error) {
      this.logger.error(`OCR failed for document ${documentId}:`, error);

      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          ocrStatus: 'FAILED',
          ocrError: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Extract text from native PDF (text-based PDF)
   */
  private async extractFromNativePDF(filePath: string): Promise<string> {
    try {
      // Use pdf-parse for native PDF text extraction
      const pdfParse = require('pdf-parse');
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text || '';
    } catch (error) {
      this.logger.warn('Native PDF extraction failed:', error.message);
      return '';
    }
  }

  /**
   * Check if extracted Arabic text is valid (not reversed/corrupted)
   * Corrupted Arabic text often has disconnected letters or reversed words
   */
  private isValidArabicText(text: string): boolean {
    if (!text || text.trim().length < 20) return false;
    
    // Check for common Arabic words that should appear correctly
    const commonArabicWords = [
      'من', 'في', 'إلى', 'على', 'أن', 'هذا', 'التي', 'الذي', 'مع', 'عن',
      'كان', 'وقد', 'ما', 'هو', 'هي', 'لم', 'أو', 'بين', 'كل', 'بعد',
      'قبل', 'حتى', 'عند', 'ذلك', 'هذه', 'تلك', 'ثم', 'أي', 'نحو', 'خلال'
    ];
    
    // Count how many common words appear
    let foundWords = 0;
    for (const word of commonArabicWords) {
      if (text.includes(word)) {
        foundWords++;
      }
    }
    
    // If at least 3 common Arabic words found, text is likely valid
    if (foundWords >= 3) return true;
    
    // Check for character patterns that indicate corrupted text
    // Corrupted Arabic often has many isolated letters (letters that should be connected)
    const isolatedArabicPattern = /[\u0621-\u063A\u0641-\u064A](?:\s|$)/g;
    const matches = text.match(isolatedArabicPattern) || [];
    const isolatedRatio = matches.length / (text.length / 10);
    
    // If too many isolated letters, text is corrupted
    if (isolatedRatio > 0.5) {
      this.logger.warn('Arabic text appears corrupted (high isolated letter ratio)');
      return false;
    }
    
    return true;
  }

  /**
   * Convert scanned PDF to images and perform OCR on each page
   */
  private async ocrScannedPDF(filePath: string): Promise<string> {
    const tempDir = path.join(path.dirname(filePath), 'ocr_temp_' + Date.now());
    
    try {
      // Create temp directory
      await fs.mkdir(tempDir, { recursive: true });
      
      this.logger.log(`Converting PDF to images: ${filePath}`);
      
      // Configure pdf2pic options
      const options = {
        density: 200,           // DPI for rendering
        saveFilename: 'page',
        savePath: tempDir,
        format: 'png',
        width: 1600,
        height: 2200,
      };

      const convert = fromPath(filePath, options);
      
      // Get number of pages
      let pageCount = 1;
      try {
        // Convert first page to test and get page info
        const firstPage = await convert(1, { responseType: 'image' });
        if (firstPage && firstPage.page) {
          // Try to get all pages - we'll try up to 50 pages
          pageCount = 50; // Max pages to try
        }
      } catch (error) {
        this.logger.warn('Could not determine page count, trying page by page');
      }

      // Convert each page and perform OCR
      const allTexts: string[] = [];
      let actualPageCount = 0;
      
      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        try {
          const result = await convert(pageNum, { responseType: 'image' });
          
          if (result && result.path) {
            actualPageCount++;
            this.logger.log(`OCR processing page ${pageNum}...`);
            
            // Perform OCR on the image
            const pageText = await this.performOCR(result.path);
            if (pageText.trim()) {
              allTexts.push(`--- Page ${pageNum} ---\n${pageText}`);
            }
            
            // Delete the temp image
            try {
              await fs.unlink(result.path);
            } catch (e) {
              // Ignore cleanup errors
            }
          }
        } catch (error) {
          // If we get an error, we've likely gone past the last page
          if (pageNum === 1) {
            throw error; // If first page fails, something is wrong
          }
          break; // Stop on first failure after page 1
        }
      }

      this.logger.log(`OCR completed for ${actualPageCount} pages`);
      
      // Cleanup temp directory
      try {
        await fs.rmdir(tempDir);
      } catch (e) {
        // Ignore cleanup errors
      }

      return allTexts.join('\n\n');
    } catch (error) {
      this.logger.error('Scanned PDF OCR failed:', error);
      
      // Cleanup on error
      try {
        const files = await fs.readdir(tempDir);
        for (const file of files) {
          await fs.unlink(path.join(tempDir, file));
        }
        await fs.rmdir(tempDir);
      } catch (e) {
        // Ignore cleanup errors
      }
      
      throw new Error(`Failed to OCR scanned PDF: ${error.message}`);
    }
  }

  /**
   * Perform OCR using Tesseract
   */
  private async performOCR(filePath: string): Promise<string> {
    try {
      this.logger.log(`Performing OCR on: ${filePath}`);
      
      const { data: { text } } = await Tesseract.recognize(filePath, 'ara+eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            this.logger.debug(`OCR Progress: ${(m.progress * 100).toFixed(2)}%`);
          }
        },
      });

      return text;
    } catch (error) {
      this.logger.error('Tesseract OCR failed:', error);
      throw error;
    }
  }

  /**
   * Batch process multiple documents
   */
  async batchProcess(documentIds: string[], tenantId: string) {
    const results = [];

    for (const id of documentIds) {
      try {
        const result = await this.processDocument(id, tenantId);
        results.push({ id, success: true, result });
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Re-process failed documents
   */
  async retryFailed(tenantId: string) {
    const failedDocs = await this.prisma.document.findMany({
      where: {
        tenantId,
        ocrStatus: 'FAILED',
      },
      select: { id: true },
    });

    if (failedDocs.length === 0) {
      return { message: 'No failed documents to retry', processed: 0 };
    }

    return this.batchProcess(
      failedDocs.map((d) => d.id),
      tenantId,
    );
  }

  /**
   * Get OCR stats for a tenant
   */
  async getStats(tenantId: string) {
    const [total, pending, processing, completed, failed, notApplicable] = await Promise.all([
      this.prisma.document.count({ where: { tenantId, isLatest: true } }),
      this.prisma.document.count({ where: { tenantId, isLatest: true, ocrStatus: 'PENDING' } }),
      this.prisma.document.count({ where: { tenantId, isLatest: true, ocrStatus: 'PROCESSING' } }),
      this.prisma.document.count({ where: { tenantId, isLatest: true, ocrStatus: 'COMPLETED' } }),
      this.prisma.document.count({ where: { tenantId, isLatest: true, ocrStatus: 'FAILED' } }),
      this.prisma.document.count({ where: { tenantId, isLatest: true, ocrStatus: 'NOT_APPLICABLE' } }),
    ]);

    return {
      total,
      pending,
      processing,
      completed,
      failed,
      notApplicable,
    };
  }

  /**
   * Search in OCR text
   */
  async searchInOcrText(query: string, tenantId: string, limit = 20) {
    const documents = await this.prisma.document.findMany({
      where: {
        tenantId,
        isLatest: true,
        ocrStatus: 'COMPLETED',
        ocrText: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        title: true,
        fileName: true,
        ocrText: true,
        case: {
          select: { id: true, title: true, caseNumber: true },
        },
      },
      take: limit,
    });

    // Highlight matches
    return documents.map((doc) => {
      const ocrText = doc.ocrText || '';
      const matchIndex = ocrText.toLowerCase().indexOf(query.toLowerCase());
      const start = Math.max(0, matchIndex - 50);
      const end = Math.min(ocrText.length, matchIndex + query.length + 50);
      const snippet = (start > 0 ? '...' : '') + ocrText.slice(start, end) + (end < ocrText.length ? '...' : '');

      return {
        ...doc,
        ocrText: undefined, // Don't return full text
        snippet,
      };
    });
  }
}
