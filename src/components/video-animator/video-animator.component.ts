
import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../services/gemini.service';
import { HistoryService } from '../../services/history.service';
import { WebhookService } from '../../services/webhook.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-video-animator',
  templateUrl: './video-animator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LoadingSpinnerComponent],
})
export class VideoAnimatorComponent implements OnDestroy {
  private geminiService = inject(GeminiService);
  private historyService = inject(HistoryService);
  private webhookService = inject(WebhookService);

  imagePreview = signal<string | null>(null);
  prompt = signal<string>('تقوم الكاميرا بالتقريب ببطء، وتطفو جزيئات الغبار الدقيقة في الهواء.');
  aspectRatio = signal<string>('16:9');
  generatedVideoUrl = signal<string | null>(null);
  isLoading = signal(false);
  sendToWebhook = signal(false);
  loadingMessage = signal('...جاري إنشاء السحر');
  error = signal<string | null>(null);

  private imageFile: File | null = null;
  private pollingInterval: any;

  private loadingMessages = [
    "إيقاظ المخرج الرقمي...",
    "تصميم أداء البكسلات...",
    "عرض الإطارات القليلة الأولى...",
    "قد يستغرق هذا بضع دقائق، يرجى الانتظار!",
    "إضافة لمسة سينمائية...",
    "العرض الأول على وشك البدء...",
  ];

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.imageFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.imagePreview.set(reader.result as string);
      reader.readAsDataURL(this.imageFile);
      this.generatedVideoUrl.set(null);
      this.error.set(null);
    }
  }

  onPromptChange(event: Event) {
    this.prompt.set((event.target as HTMLTextAreaElement).value);
  }

  onAspectRatioChange(value: string) {
    this.aspectRatio.set(value);
  }

  async animateImage(): Promise<void> {
    if (!this.imageFile) {
      this.error.set('Please select an image to animate.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.generatedVideoUrl.set(null);
    this.loadingMessage.set(this.loadingMessages[0]);

    try {
      const { base64, mimeType } = await this.geminiService.fileToBase64(this.imageFile);
      let operation = await this.geminiService.animateImage(base64, mimeType, this.prompt(), this.aspectRatio());
      this.startPolling(operation);
    } catch (e) {
      console.error(e);
      this.error.set('Failed to start the animation process. Please check the console.');
      this.isLoading.set(false);
    }
  }

  private startPolling(operation: any) {
    let messageIndex = 1;
    this.pollingInterval = setInterval(async () => {
      try {
        this.loadingMessage.set(this.loadingMessages[messageIndex % this.loadingMessages.length]);
        messageIndex++;

        operation = await this.geminiService.checkVideoStatus(operation);

        if (operation.done) {
          clearInterval(this.pollingInterval);
          this.isLoading.set(false);
          const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
          if (videoUri) {
            // The API key must be appended for access, assuming it's available.
            const apiKey = (window as any).process?.env?.API_KEY || '';
            const fullUrl = `${videoUri}&key=${apiKey}`;
            this.generatedVideoUrl.set(fullUrl);

            this.historyService.addItem({
              type: 'video',
              url: fullUrl,
              prompt: this.prompt()
            });

            if (this.sendToWebhook()) {
              this.webhookService.send('video', {
                url: fullUrl,
                prompt: this.prompt(),
                aspectRatio: this.aspectRatio()
              });
            }
          } else {
            this.error.set('Animation finished, but no video was returned.');
          }
        }
      } catch (e) {
        console.error('Polling error:', e);
        this.error.set('An error occurred while checking video status.');
        this.isLoading.set(false);
        clearInterval(this.pollingInterval);
      }
    }, 10000); // Poll every 10 seconds
  }

  downloadVideo() {
    const url = this.generatedVideoUrl();
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `animated-video-${Date.now()}.mp4`;
      link.click();
    }
  }
}
