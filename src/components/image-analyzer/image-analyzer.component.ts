import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AnalysisResult, GeminiService } from '../../services/gemini.service';
import { WebhookService } from '../../services/webhook.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

interface TemplateSettings {
  fontFamily: string;
  productName: { color: string; bold: boolean; };
  marketingPost: { color: string; italic: boolean; };
  features: { color: string; };
  hashtags: { textColor: string; bgColor: string; };
}

const DEFAULT_TEMPLATE_SETTINGS: TemplateSettings = {
  fontFamily: 'sans-serif',
  productName: { color: '#e5e7eb', bold: false },
  marketingPost: { color: '#d1d5db', italic: true },
  features: { color: '#d1d5db' },
  hashtags: { textColor: '#93c5fd', bgColor: '#374151' },
};

@Component({
  selector: 'app-image-analyzer',
  templateUrl: './image-analyzer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LoadingSpinnerComponent],
})
export class ImageAnalyzerComponent implements OnInit {
  private geminiService = inject(GeminiService);
  private webhookService = inject(WebhookService);
  private httpClient = inject(HttpClient);

  imagePreview = signal<string | null>(null);
  webhookUrl = signal<string>(this.webhookService.getWebhookUrl());
  analysisResult = signal<AnalysisResult | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  isCustomizing = signal(false);
  templateSettings = signal<TemplateSettings>(DEFAULT_TEMPLATE_SETTINGS);
  showSaveConfirmation = signal(false);

  private imageFile: File | null = null;

  fonts = ['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'Arial', 'Verdana', 'Georgia'];

  ngOnInit(): void {
    this.loadSettings();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.imageFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.imagePreview.set(reader.result as string);
      reader.readAsDataURL(this.imageFile);
      this.analysisResult.set(null);
      this.error.set(null);
    }
  }

  onWebhookUrlChange(event: Event) {
    this.webhookUrl.set((event.target as HTMLInputElement).value);
  }

  async analyzeImage(): Promise<void> {
    if (!this.imageFile) {
      this.error.set('الرجاء تحديد صورة أولاً.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.analysisResult.set(null);

    try {
      const { base64, mimeType } = await this.geminiService.fileToBase64(this.imageFile);
      const result = await this.geminiService.analyzeProductImage(base64, mimeType);
      this.analysisResult.set(result);

      if (this.webhookUrl()) {
        this.sendWebhook(result, base64, mimeType);
      }
    } catch (e) {
      console.error(e);
      this.error.set('فشل تحليل الصورة. يرجى مراجعة وحدة التحكم للحصول على التفاصيل.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private sendWebhook(data: AnalysisResult, imageBase64: string, mimeType: string): void {
    const payload = {
      ...data,
      image: {
        base64: imageBase64,
        mimeType: mimeType
      }
    };

    this.webhookService.send('analysis', payload).catch(err => {
      console.error('Failed to send webhook:', err);
      this.error.set(`اكتمل التحليل، ولكن فشل إرسال webhook. الخطأ: ${err.message}`);
    });
  }

  toggleCustomizing(): void {
    this.isCustomizing.update(v => !v);
  }

  loadSettings(): void {
    const savedSettings = localStorage.getItem('productPostTemplate');
    if (savedSettings) {
      this.templateSettings.set(JSON.parse(savedSettings));
    }
  }

  saveSettings(): void {
    localStorage.setItem('productPostTemplate', JSON.stringify(this.templateSettings()));
    this.showSaveConfirmation.set(true);
    setTimeout(() => this.showSaveConfirmation.set(false), 2000);
  }

  resetSettings(): void {
    this.templateSettings.set(DEFAULT_TEMPLATE_SETTINGS);
    localStorage.removeItem('productPostTemplate');
  }

  updateTemplate(field: keyof TemplateSettings, value: any, subField?: string) {
    this.templateSettings.update(current => {
      const newSettings = { ...current };
      if (subField) {
        (newSettings[field] as any)[subField] = value;
      } else {
        (newSettings[field] as any) = value;
      }
      return newSettings;
    });
  }
}