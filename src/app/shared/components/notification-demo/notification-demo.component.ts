import { Component } from '@angular/core';
import { NotificationService } from '../../services/notification.service';

/**
 * Composant de démonstration pour tester le système de notifications
 * À utiliser uniquement en développement
 *
 * Pour l'utiliser, ajoutez <app-notification-demo></app-notification-demo> dans n'importe quelle page
 */
@Component({
  selector: 'app-notification-demo',
  standalone: false,
  template: `
    <div class="fixed bottom-20 left-4 z-40 bg-white rounded-lg shadow-xl p-4 border border-gray-200">
      <h3 class="font-bold text-sm mb-3 text-gray-700">🧪 Test Notifications</h3>
      <div class="flex flex-col gap-2">
        <button (click)="testSuccess()" class="btn btn-success btn-xs">
          ✓ Succès
        </button>
        <button (click)="testError()" class="btn btn-error btn-xs">
          ✕ Erreur
        </button>
        <button (click)="testInfo()" class="btn btn-info btn-xs">
          ℹ Info
        </button>
        <button (click)="testWarning()" class="btn btn-warning btn-xs">
          ⚠ Warning
        </button>
        <button (click)="testLike()" class="btn btn-xs bg-pink-500 text-white hover:bg-pink-600">
          ❤️ Like
        </button>
        <button (click)="testComment()" class="btn btn-xs bg-blue-500 text-white hover:bg-blue-600">
          💬 Comment
        </button>
        <button (click)="testMultiple()" class="btn btn-xs btn-neutral">
          🔥 Multiple
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class NotificationDemoComponent {
  constructor(private notificationService: NotificationService) {}

  testSuccess(): void {
    this.notificationService.success(
      'Opération réussie',
      'Votre mème a été publié avec succès'
    );
  }

  testError(): void {
    this.notificationService.error(
      'Erreur',
      'Impossible de charger les données'
    );
  }

  testInfo(): void {
    this.notificationService.info(
      'Information',
      'Une nouvelle fonctionnalité est disponible'
    );
  }

  testWarning(): void {
    this.notificationService.warning(
      'Attention',
      'Votre session expire dans 5 minutes'
    );
  }

  testLike(): void {
    this.notificationService.notifyLike(
      'John Doe',
      'meme-123',
      'https://picsum.photos/100/100',
      'user-456'
    );
  }

  testComment(): void {
    this.notificationService.notifyComment(
      'Jane Smith',
      'meme-789',
      'https://picsum.photos/100/100',
      'user-012'
    );
  }

  testMultiple(): void {
    this.notificationService.success('1/5', 'Première notification');
    setTimeout(() => {
      this.notificationService.info('2/5', 'Deuxième notification');
    }, 500);
    setTimeout(() => {
      this.notificationService.warning('3/5', 'Troisième notification');
    }, 1000);
    setTimeout(() => {
      this.notificationService.notifyLike('Sarah', 'meme-abc', 'https://picsum.photos/100/100');
    }, 1500);
    setTimeout(() => {
      this.notificationService.error('5/5', 'Dernière notification');
    }, 2000);
  }
}
