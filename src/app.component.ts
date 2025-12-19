
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ImageAnalyzerComponent } from './components/image-analyzer/image-analyzer.component';
import { ImageGeneratorComponent } from './components/image-generator/image-generator.component';
import { ImageEditorComponent } from './components/image-editor/image-editor.component';
import { VideoAnimatorComponent } from './components/video-animator/video-animator.component';
import { RecentActivityComponent } from './components/recent-activity/recent-activity.component';
import { ApiSettingsComponent } from './components/api-settings/api-settings.component';

type Feature = 'analyze' | 'generate' | 'edit' | 'animate';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ImageAnalyzerComponent,
    ImageGeneratorComponent,
    ImageEditorComponent,
    VideoAnimatorComponent,
    RecentActivityComponent,
    ApiSettingsComponent,
  ],
})
export class AppComponent {
  activeFeature = signal<Feature>('analyze');
  showSettings = signal(false);

  features: { id: Feature; name: string; icon: string }[] = [
    { id: 'analyze', name: 'تحليل ونشر', icon: 'document_scanner' },
    { id: 'generate', name: 'إنشاء صورة', icon: 'image' },
    { id: 'edit', name: 'تعديل صورة', icon: 'image_edit_auto' },
    { id: 'animate', name: 'تحريك صورة', icon: 'movie' },
  ];

  selectFeature(feature: Feature) {
    this.activeFeature.set(feature);
  }

  toggleSettings() {
    this.showSettings.update((v: boolean) => !v);
  }
}
