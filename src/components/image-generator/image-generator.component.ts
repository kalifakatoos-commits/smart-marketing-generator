
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../services/gemini.service';
import { HistoryService } from '../../services/history.service';
import { WebhookService } from '../../services/webhook.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-image-generator',
  templateUrl: './image-generator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LoadingSpinnerComponent],
})
export class ImageGeneratorComponent {
  private geminiService = inject(GeminiService);
  private historyService = inject(HistoryService);
  private webhookService = inject(WebhookService);

  prompt = signal<string>('صورة واقعية لجرو جولدن ريتريفر يلعب في حقل من الزهور أثناء غروب الشمس الذهبي.');
  aspectRatio = signal<string>('1:1');
  selectedStyle = signal<string>('none');
  generatedImage = signal<string | null>(null);
  isLoading = signal(false);
  isEnhancing = signal(false);
  sendToWebhook = signal(false);
  error = signal<string | null>(null);

  styles = [
    { id: 'none', name: 'بدون نمط', prompt: '' },
    { id: 'cinematic', name: 'سينمائي', prompt: ', cinematic lighting, 8k resolution, highly detailed, masterwork, dramatic composition' },
    { id: 'photorealistic', name: 'واقعي جداً', prompt: ', photorealistic, hyper-detailed, 8k, raw photo, f/1.8' },
    { id: '3d-render', name: 'رسم 3D', prompt: ', 3d render, unreal engine 5, octane render, stylized' },
    { id: 'anime', name: 'أنمي', prompt: ', anime style, vibrant colors, expressive, high quality illustration' },
    { id: 'oil-painting', name: 'لوحة زيتية', prompt: ', oil painting style, visible brushstrokes, textured canvas, classical art' },
    { id: 'minimalist', name: 'بسيط', prompt: ', minimalist style, clean lines, simple background, elegant' },
  ];

  aspectRatios = [
    { value: '1:1', label: 'مربع (1:1)' },
    { value: '16:9', label: 'أفقي (16:9)' },
    { value: '9:16', label: 'عمودي (9:16)' },
    { value: '4:3', label: 'قياسي (4:3)' },
    { value: '3:4', label: 'طويل (3:4)' },
  ];

  onPromptChange(event: Event) {
    this.prompt.set((event.target as HTMLTextAreaElement).value);
  }

  onAspectRatioChange(value: string) {
    this.aspectRatio.set(value);
  }

  onStyleChange(value: string) {
    this.selectedStyle.set(value);
  }

  async enhancePrompt(): Promise<void> {
    if (!this.prompt()) return;

    this.isEnhancing.set(true);
    try {
      const enhanced = await this.geminiService.enhancePrompt(this.prompt());
      this.prompt.set(enhanced);
    } catch (e) {
      console.error('Failed to enhance prompt:', e);
    } finally {
      this.isEnhancing.set(false);
    }
  }

  async generateImage(): Promise<void> {
    if (!this.prompt()) {
      this.error.set('Please enter a prompt.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.generatedImage.set(null);

    try {
      const styleSuffix = this.styles.find(s => s.id === this.selectedStyle())?.prompt || '';
      const finalPrompt = this.prompt() + styleSuffix;
      const imageBytes = await this.geminiService.generateImage(finalPrompt, this.aspectRatio());
      const imageUrl = `data:image/jpeg;base64,${imageBytes}`;
      this.generatedImage.set(imageUrl);

      this.historyService.addItem({
        type: 'image',
        url: imageUrl,
        prompt: finalPrompt
      });

      if (this.sendToWebhook()) {
        this.webhookService.send('image', {
          url: imageUrl,
          prompt: finalPrompt,
          aspectRatio: this.aspectRatio()
        });
      }
    } catch (e) {
      console.error(e);
      this.error.set('Failed to generate the image. Please try a different prompt.');
    } finally {
      this.isLoading.set(false);
    }
  }

  downloadImage() {
    const url = this.generatedImage();
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `generated-image-${Date.now()}.jpg`;
      link.click();
    }
  }
}
