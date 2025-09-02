import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

export async function compressImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({ width: 1920, height: 1080, fit: "inside" })
    .webp({ quality: 80 })
    .toBuffer();
}

export async function compressPDF(buffer: Buffer): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(buffer);
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
