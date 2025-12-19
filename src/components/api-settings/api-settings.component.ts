
import { ChangeDetectionStrategy, Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../services/gemini.service';
import { WebhookService } from '../../services/webhook.service';

@Component({
  selector: 'app-api-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" (click)="close.emit()">
      <div class="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-auto max-w-md overflow-hidden" (click)="$event.stopPropagation()">
        <div class="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 class="text-xl font-bold text-white flex items-center">
            <span class="material-icons-outlined mr-2">settings</span>
            إعدادات API
          </h2>
          <button (click)="close.emit()" class="text-gray-400 hover:text-white transition-colors">
             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">Gemini API Key</label>
            <div class="relative">
              <input 
                [type]="showKey() ? 'text' : 'password'" 
                [value]="apiKey()" 
                (input)="onKeyChange($event)"
                placeholder="أدخل مفتاح الـ API هنا..."
                class="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              >
              <button (click)="toggleShowKey()" class="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300">
                <svg *ngIf="!showKey()" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                <svg *ngIf="showKey()" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
              </button>
            </div>
            <p class="mt-2 text-xs text-gray-500">
              يتم حفظ المفتاح محلياً في متصفحك فقط. يمكنك الحصول عليه من 
              <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-blue-500 hover:underline">Google AI Studio</a>.
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">رابط Webhook (اختياري)</label>
            <input 
              type="url" 
              [value]="webhookUrl()" 
              (input)="onWebhookChange($event)"
              placeholder="https://your-webhook-url.com"
              class="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">موديل النصوص (Text Model)</label>
            <select 
              [value]="selectedTextModel()" 
              (change)="onTextModelChange($event)"
              class="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="gemini-3.0-alpha">Gemini 3.0 Pro (Alpha)</option>
              <option value="gemini-3.0-flash">Gemini 3.0 Flash</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              <option value="gemini-1.5-flash-8b">Gemini Nano (Banana)</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">موديل الصور (Image Model)</label>
            <select 
              [value]="selectedImageModel()" 
              (change)="onImageModelChange($event)"
              class="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="imagen-4.0-generate-001">Imagen 4.0 (Default)</option>
              <option value="gemini-3.0-pro-image-preview">Gemini 3 Pro Image (Nano Banana Pro)</option>
              <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image (Nano Banana)</option>
            </select>
          </div>
          
          <div class="flex space-x-3 space-x-reverse pt-2">
            <button 
              (click)="saveKey()" 
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-lg shadow-blue-900/20"
            >
              حفظ المفتاح
            </button>
            <button 
              (click)="clearKey()" 
              class="px-4 py-2 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
            >
              مسح
            </button>
          </div>

          <div *ngIf="saved()" class="flex items-center justify-center text-green-400 text-sm animate-pulse">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            تم الحفظ بنجاح
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiSettingsComponent {
  private geminiService = inject(GeminiService);
  private webhookService = inject(WebhookService);

  @Output() close = new EventEmitter<void>();

  apiKey = signal(this.geminiService.getApiKey());
  webhookUrl = signal(this.webhookService.getWebhookUrl());
  selectedTextModel = signal(this.geminiService.textModel());
  selectedImageModel = signal(this.geminiService.imageModel());
  showKey = signal(false);
  saved = signal(false);

  onKeyChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.apiKey.set(input.value);
  }

  onWebhookChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.webhookUrl.set(input.value);
  }

  onTextModelChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedTextModel.set(select.value);
  }

  onImageModelChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedImageModel.set(select.value);
  }

  toggleShowKey() {
    this.showKey.update((v: boolean) => !v);
  }

  saveKey() {
    this.geminiService.setApiKey(this.apiKey());
    this.webhookService.setWebhookUrl(this.webhookUrl());
    this.geminiService.setTextModel(this.selectedTextModel());
    this.geminiService.setImageModel(this.selectedImageModel());
    this.saved.set(true);
    setTimeout(() => {
      this.saved.set(false);
      this.close.emit();
    }, 1500);
  }

  clearKey() {
    this.apiKey.set('');
    this.geminiService.setApiKey('');
  }
}
