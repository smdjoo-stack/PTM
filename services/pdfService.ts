
import type { PDFDocumentProxy, PDFPageProxy, TextContent, OperatorList } from 'pdfjs-dist/types/src/display/api';
import type { PdfContentPart } from '../types';

// pdfjsLib is a global variable from the script tag in index.html
const pdfjsLib = (window as any).pdfjsLib;

// Set worker path for pdf.js
if (pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;
}

async function convertImageToBas64(page: PDFPageProxy, op: any): Promise<string | null> {
    try {
        const imgData = await page.objs.get(op.args[0]);
        if (!imgData || !imgData.data) return null;
        
        const { width, height, data, kind } = imgData;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const imageData = ctx.createImageData(width, height);
        
        if (kind === 1) { // Grayscale
            for (let i = 0, j = 0; i < data.length; i++, j += 4) {
                const gray = data[i];
                imageData.data[j] = gray;
                imageData.data[j + 1] = gray;
                imageData.data[j + 2] = gray;
                imageData.data[j + 3] = 255;
            }
        } else if (kind === 3) { // RGB
            for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
                imageData.data[j] = data[i];
                imageData.data[j + 1] = data[i + 1];
                imageData.data[j + 2] = data[i + 2];
                imageData.data[j + 3] = 255;
            }
        } else {
             console.warn('Unsupported image kind:', kind);
             return null;
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL('image/png');

    } catch (e) {
        console.error('Error converting image:', e);
        return null;
    }
}


export const extractContentFromPdf = async (file: File): Promise<PdfContentPart[]> => {
    if (!pdfjsLib) {
        throw new Error('pdf.js library is not loaded.');
    }
    const fileReader = new FileReader();
    
    return new Promise((resolve, reject) => {
        fileReader.onload = async (event) => {
            if (!event.target?.result) {
                return reject(new Error('Failed to read file.'));
            }

            const typedarray = new Uint8Array(event.target.result as ArrayBuffer);
            const loadingTask = pdfjsLib.getDocument({ data: typedarray });

            try {
                const pdf: PDFDocumentProxy = await loadingTask.promise;
                const numPages = pdf.numPages;
                const allParts: PdfContentPart[] = [];

                for (let i = 1; i <= numPages; i++) {
                    const page = await pdf.getPage(i);
                    
                    // Extract text
                    const textContent: TextContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(' ');
                    if (pageText.trim().length > 0) {
                        allParts.push({ type: 'text', content: pageText });
                    }

                    // Extract images
                    const operatorList: OperatorList = await page.getOperatorList();
                    const OPS = pdfjsLib.OPS;

                    for (let j = 0; j < operatorList.fnArray.length; j++) {
                        const op = operatorList.fnArray[j];
                        if (op === OPS.paintImageXObject) {
                            const base64Image = await convertImageToBas64(page, { fn: op, args: operatorList.argsArray[j] });
                            if (base64Image) {
                                allParts.push({ 
                                    type: 'image', 
                                    base64: base64Image.split(',')[1], // remove data:image/png;base64,
                                    mimeType: 'image/png' 
                                });
                            }
                        }
                    }
                }
                resolve(allParts);
            } catch (error) {
                reject(error);
            }
        };

        fileReader.onerror = (error) => {
            reject(error);
        };

        fileReader.readAsArrayBuffer(file);
    });
};
