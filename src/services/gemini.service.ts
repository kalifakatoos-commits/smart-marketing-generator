
import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, Type, GenerateContentResponse } from '@google/genai';

// Define interfaces for structured data
export interface AnalysisResult {
  productName: string;
  marketingPost: string;
  features: string[];
  hashtags: string[];
  newPrompt: string;
}

export interface ImageGenerationResponse {
  generatedImages: {
    image: {
      imageBytes: string;
    };
  }[];
}

export interface VideoGenerationResponse {
  done: boolean;
  response?: {
    generatedVideos?: {
      video: {
        uri: string;
      };
    }[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI;

  textModel = signal<string>(localStorage.getItem('GEMINI_TEXT_MODEL') || 'gemini-3.0-alpha');
  imageModel = signal<string>(localStorage.getItem('GEMINI_IMAGE_MODEL') || 'imagen-4.0-generate-001');

  constructor() {
    this.ai = this.initGenAI();
  }

  private initGenAI(): GoogleGenAI {
    const apiKey = localStorage.getItem('GEMINI_API_KEY') || (window as any).process?.env?.API_KEY || '';
    if (!apiKey) {
      console.warn("API_KEY is not set. Please set it in settings or as an environment variable.");
    }
    return new GoogleGenAI({ apiKey });
  }

  setApiKey(key: string): void {
    localStorage.setItem('GEMINI_API_KEY', key);
    this.ai = this.initGenAI();
  }

  getApiKey(): string {
    return localStorage.getItem('GEMINI_API_KEY') || '';
  }

  setTextModel(model: string): void {
    localStorage.setItem('GEMINI_TEXT_MODEL', model);
    this.textModel.set(model);
  }

  setImageModel(model: string): void {
    localStorage.setItem('GEMINI_IMAGE_MODEL', model);
    this.imageModel.set(model);
  }

  async fileToBase64(file: File): Promise<{ base64: string, mimeType: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve({ base64, mimeType: file.type });
      };
      reader.onerror = error => reject(error);
    });
  }

  async analyzeProductImage(imageBase64: string, mimeType: string): Promise<AnalysisResult> {
    const response = await this.ai.models.generateContent({
      model: this.textModel(),
      contents: {
        parts: [{
          inlineData: {
            data: imageBase64,
            mimeType: mimeType
          }
        }, {
          text: "حلل صورة المنتج هذه وأنشئ محتوى باللغة العربية. المنتج هو الموضوع الرئيسي. يجب أن يتضمن الإخراج ما يلي: اسم المنتج، منشور تسويقي، قائمة من 5 مميزات بالضبط، قائمة من 5 هاشتاقات بالضبط، وموجه جديد مفصل لتوليد صورة لهذا المنتج من زاوية مختلفة أو في بيئة مختلفة."
        }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING, description: "اسم المنتج." },
            marketingPost: { type: Type.STRING, description: "منشور تسويقي جذاب لوسائل التواصل الاجتماعي، حوالي 3-4 جمل." },
            features: { type: Type.ARRAY, items: { type: Type.STRING }, description: "قائمة من 5 مميزات رئيسية للمنتج بالضبط." },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "قائمة من 5 هاشتاقات ذات صلة بوسائل التواصل الاجتماعي بالضبط." },
            newPrompt: { type: Type.STRING, description: "موجه جديد ومفصل لتوليد صورة لهذا المنتج من زاوية مختلفة أو في بيئة مختلفة." }
          },
        }
      }
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) {
      throw new Error('AI analysis returned an empty response.');
    }
    return JSON.parse(jsonStr) as AnalysisResult;
  }

  async generateImage(prompt: string, aspectRatio: string): Promise<string> {
    const response = await this.ai.models.generateImages({
      model: this.imageModel(),
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
      },
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBytes) {
      throw new Error('Failed to generate image bytes.');
    }
    return imageBytes;
  }

  async generateEditedImage(imageBase64: string, mimeType: string, editPrompt: string): Promise<string> {
    // Step 1: Create a new prompt based on the image and the edit request
    const promptCreationResponse = await this.ai.models.generateContent({
      model: this.textModel(),
      contents: {
        parts: [{
          inlineData: {
            data: imageBase64,
            mimeType: mimeType
          }
        }, {
          text: `Describe the following image in photorealistic detail. Then, using that description, create a new, single, cohesive prompt for an image generation model. This new prompt must incorporate the following user edit: "${editPrompt}". The final prompt should describe the entire new scene from scratch as if it were a brand new request.`
        }]
      }
    });

    const newPrompt = promptCreationResponse.text;
    if (!newPrompt) {
      throw new Error('Failed to create an enhanced prompt for editing.');
    }

    // Step 2: Generate the new image using the created prompt
    return this.generateImage(newPrompt, '1:1');
  }

  async animateImage(imageBase64: string, mimeType: string, prompt: string, aspectRatio: string): Promise<any> {
    return this.ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: prompt,
      image: {
        imageBytes: imageBase64,
        mimeType: mimeType,
      },
      config: {
        numberOfVideos: 1,
        aspectRatio: aspectRatio as "16:9" | "9:16",
      }
    });
  }

  async checkVideoStatus(operation: any): Promise<any> {
    return this.ai.operations.getVideosOperation({ operation: operation });
  }

  async enhancePrompt(prompt: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: this.textModel(),
      contents: {
        parts: [{
          text: `Rewrite the following image generation prompt to be much more detailed, descriptive, and optimized for an AI image generator (like Imagen). Focus on lighting, composition, texture, and artistic style. Keep it in the same language as the input if possible, but make it professional. Input prompt: "${prompt}"`
        }]
      }
    });

    const enhanced = response.text?.trim();
    if (!enhanced) {
      throw new Error('AI prompt enhancement returned an empty response.');
    }

    return enhanced;
  }
}
