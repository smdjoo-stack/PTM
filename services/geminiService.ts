
import { GoogleGenAI } from "@google/genai";
import type { PdfContentPart } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

const PROMPT = `You are an expert PDF to Markdown converter. The following is a mix of text and image data extracted sequentially from a PDF file. Convert it into a single, cohesive, and well-formatted Markdown document. Infer headings, lists, code blocks, and other structural elements from the text. For each image, provide a brief, descriptive alt text within the Markdown image syntax (e.g., ![a black cat sitting on a windowsill]). Your output must be only the final Markdown content and nothing else.`;

export const convertContentToMarkdown = async (parts: PdfContentPart[]): Promise<string> => {
  const model = 'gemini-2.5-pro';
  
  const contents = parts.map(part => {
    if (part.type === 'text') {
      return { text: part.content };
    } else {
      return {
        inlineData: {
          mimeType: part.mimeType,
          data: part.base64
        }
      };
    }
  });

  const fullContents = [{ text: PROMPT }, ...contents];

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: fullContents },
    });
    
    return response.text.trim();
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to generate Markdown from Gemini API.');
  }
};
