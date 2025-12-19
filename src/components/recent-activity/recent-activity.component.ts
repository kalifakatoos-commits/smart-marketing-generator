
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoryService, HistoryItem } from '../../services/history.service';

@Component({
    selector: 'app-recent-activity',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="mt-12">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-white flex items-center gap-2">
          <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          النشاط الأخير
        </h2>
        <button *ngIf="history().length > 0" (click)="clearHistory()" class="text-xs text-gray-400 hover:text-red-400 transition-colors">
          مسح السجل
        </button>
      </div>

      <div *ngIf="history().length === 0" class="bg-gray-800/50 border border-gray-700/50 rounded-xl p-8 text-center text-gray-500">
        <p>لا يوجد نشاط مؤخراً. ابدأ بإنشاء شيء مذهل!</p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        @for (item of history(); track item.id) {
          <div class="group relative bg-gray-800 border border-gray-700 rounded-lg overflow-hidden transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10">
            <!-- Image/Video Preview -->
            <div class="aspect-square bg-gray-900 flex items-center justify-center overflow-hidden">
              <ng-container [ngSwitch]="item.type">
                <img *ngSwitchCase="'image'" [src]="item.url" class="w-full h-full object-cover transition-transform group-hover:scale-110">
                <div *ngSwitchCase="'video'" class="relative w-full h-full">
                  <video [src]="item.url" class="w-full h-full object-cover"></video>
                  <div class="absolute inset-0 flex items-center justify-center bg-black/20">
                    <svg class="w-8 h-8 text-white/80" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
                  </div>
                </div>
              </ng-container>
            </div>

            <!-- Overlay Actions -->
            <div class="absolute inset-0 bg-gray-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
              <p class="text-[10px] text-gray-300 line-clamp-3 mb-3">{{ item.prompt }}</p>
              <div class="flex gap-2">
                <button (click)="download(item)" class="p-1.5 bg-blue-600 rounded-full text-white hover:bg-blue-500 transition-colors" title="تحميل">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                </button>
                <button (click)="deleteItem(item.id)" class="p-1.5 bg-gray-700 rounded-full text-gray-300 hover:bg-red-600 hover:text-white transition-colors" title="حذف">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>
            
            <!-- Type Badge -->
            <div class="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded text-[8px] font-bold text-white uppercase tracking-wider">
              {{ item.type === 'image' ? 'صورة' : 'فيديو' }}
            </div>
          </div>
        }
      </div>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentActivityComponent {
    private historyService = inject(HistoryService);

    history = this.historyService.items;

    deleteItem(id: string) {
        this.historyService.deleteItem(id);
    }

    clearHistory() {
        if (confirm('هل أنت متأكد من مسح السجل بالكامل؟')) {
            this.historyService.clearHistory();
        }
    }

    download(item: HistoryItem) {
        if (!item.url) return;
        const link = document.createElement('a');
        link.href = item.url;
        link.download = `${item.type}-${item.id}.${item.type === 'image' ? 'jpg' : 'mp4'}`;
        link.click();
    }
}
