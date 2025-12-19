
import { Injectable, signal } from '@angular/core';

export interface HistoryItem {
    id: string;
    type: 'image' | 'video' | 'analysis';
    url?: string;
    data?: any;
    prompt?: string;
    timestamp: number;
}

@Injectable({
    providedIn: 'root',
})
export class HistoryService {
    private readonly STORAGE_KEY = 'gemini_media_history';
    private historyItems = signal<HistoryItem[]>(this.loadHistory());

    items = this.historyItems.asReadonly();

    constructor() { }

    private loadHistory(): HistoryItem[] {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse history:', e);
                return [];
            }
        }
        return [];
    }

    addItem(item: Omit<HistoryItem, 'id' | 'timestamp'>) {
        const newItem: HistoryItem = {
            ...item,
            id: Math.random().toString(36).substring(2, 11),
            timestamp: Date.now(),
        };

        this.historyItems.update(current => {
            const updated = [newItem, ...current].slice(0, 20); // Keep last 20 items
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    }

    deleteItem(id: string) {
        this.historyItems.update(current => {
            const updated = current.filter(item => item.id !== id);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    }

    clearHistory() {
        this.historyItems.set([]);
        localStorage.removeItem(this.STORAGE_KEY);
    }
}
