import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center p-4 w-full h-full min-h-[inherit]">
      @if (type === 'spinner') {
        <div class="relative w-16 h-16 mb-4">
          <div class="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
          <div class="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div class="absolute inset-2 border-4 border-blue-400/40 border-b-transparent rounded-full animate-spin-slow"></div>
        </div>
        <p *ngIf="message" class="text-gray-400 text-sm animate-pulse tracking-wide">{{ message }}</p>
      } @else if (type === 'skeleton-image') {
        <div class="w-full h-full min-h-[300px] flex flex-col gap-4">
          <div class="grow bg-gray-800 rounded-lg animate-pulse overflow-hidden relative">
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer"></div>
          </div>
          <div class="h-4 bg-gray-800 rounded animate-pulse w-3/4"></div>
          <div class="h-4 bg-gray-800 rounded animate-pulse w-1/2"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-spin-slow { animation: spin 3s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes shimmer { 100% { transform: translateX(100%); } }
    .animate-shimmer { animation: shimmer 2s infinite; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSpinnerComponent {
  @Input() message: string = '';
  @Input() type: 'spinner' | 'skeleton-image' = 'spinner';
}
