
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class WebhookService {
    private httpClient = inject(HttpClient);
    private webhookUrlSignal = signal<string>(localStorage.getItem('GLOBAL_WEBHOOK_URL') || '');

    getWebhookUrl() {
        return this.webhookUrlSignal();
    }

    setWebhookUrl(url: string) {
        localStorage.setItem('GLOBAL_WEBHOOK_URL', url);
        this.webhookUrlSignal.set(url);
    }

    async send(type: 'analysis' | 'image' | 'video', data: any): Promise<void> {
        const url = this.getWebhookUrl();
        if (!url) {
            console.warn('Webhook URL is not configured. Skipping send.');
            return;
        }

        const payload = {
            type,
            timestamp: new Date().toISOString(),
            ...data
        };

        try {
            await firstValueFrom(this.httpClient.post(url, payload));
            console.log(`Webhook sent successfully for type: ${type}`);
        } catch (error) {
            console.error(`Failed to send webhook for type: ${type}`, error);
            throw error;
        }
    }
}
