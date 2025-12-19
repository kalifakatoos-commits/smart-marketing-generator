
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../services/gemini.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-image-editor',
  templateUrl: './image-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LoadingSpinnerComponent],
})
export class ImageEditorComponent {
  private geminiService = inject(GeminiService);

  originalImagePreview = signal<string | null>(null);
  editPrompt = signal<string>('أضف فلترًا قديمًا كلاسيكيًا.');
  editedImage = signal<string | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  private imageFile: File | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.imageFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.originalImagePreview.set(reader.result as string);
      reader.readAsDataURL(this.imageFile);
      this.editedImage.set(null);
      this.error.set(null);
    }
  }

  onPromptChange(event: Event) {
    this.editPrompt.set((event.target as HTMLInputElement).value);
  }

  async applyEdit(): Promise<void> {
    if (!this.imageFile) {
      this.error.set('Please select an image to edit.');
      return;
    }
    if (!this.editPrompt()) {
      this.error.set('Please enter an edit instruction.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.editedImage.set(null);

    try {
      const { base64, mimeType } = await this.geminiService.fileToBase64(this.imageFile);
      const imageBytes = await this.geminiService.generateEditedImage(base64, mimeType, this.editPrompt());
      this.editedImage.set(`data:image/jpeg;base64,${imageBytes}`);
    } catch (e) {
      console.error(e);
      this.error.set('Failed to apply edit. Please try a different instruction.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
