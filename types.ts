export type TextPart = {
  type: 'text';
  content: string;
};

export type ImagePart = {
  type: 'image';
  base64: string;
  mimeType: string;
};

export type PdfContentPart = TextPart | ImagePart;

export type ConversionResult = {
    fileName: string;
    markdown: string;
};
