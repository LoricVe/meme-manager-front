import { Component, OnInit, OnDestroy } from '@angular/core';
import { Notification } from '../../interfaces/notification';
import { NotificationService } from '../../services/notification.service';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-toast-notification',
  standalone: false,
  templateUrl: './toast-notification.html',
  styleUrl: './toast-notification.css',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(400px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(400px)', opacity: 0 }))
      ])
    ])
  ]
})
export class ToastNotification implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private subscription?: Subscription;

  // Limiter le nombre de toasts affichés simultanément
  maxToasts = 3;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.subscription = this.notificationService.notifications$.subscribe(
      notifications => {
        // Afficher seulement les X dernières notifications
        this.notifications = notifications.slice(0, this.maxToasts);
      }
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /**
   * Gère le clic sur une notification
   */
  onNotificationClick(notification: Notification): void {
    if (notification.action) {
      notification.action();
    }
    this.notificationService.markAsRead(notification.id);
    this.notificationService.remove(notification.id);
  }

  /**
   * Ferme une notification
   */
  closeNotification(notification: Notification, event?: Event): void {
    event?.stopPropagation();
    this.notificationService.remove(notification.id);
  }

  /**
   * Retourne la classe CSS selon le type de notification
   */
  getNotificationClass(type: string): string {
    const baseClasses = 'alert shadow-lg cursor-pointer transition-all hover:scale-105';
    switch (type) {
      case 'success':
        return `${baseClasses} alert-success`;
      case 'error':
        return `${baseClasses} alert-error`;
      case 'warning':
        return `${baseClasses} alert-warning`;
      case 'info':
        return `${baseClasses} alert-info`;
      case 'like':
        return `${baseClasses} bg-pink-50 border-pink-200 text-pink-900`;
      case 'comment':
        return `${baseClasses} bg-blue-50 border-blue-200 text-blue-900`;
      default:
        return `${baseClasses} alert-info`;
    }
  }

  /**
   * Retourne l'icône selon le type de notification
   */
  getIcon(type: string): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      default:
        return 'ℹ';
    }
  }

  /**
   * Formate le temps écoulé depuis la notification
   */
  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) {
      return 'À l\'instant';
    } else if (minutes < 60) {
      return `Il y a ${minutes}min`;
    } else if (hours < 24) {
      return `Il y a ${hours}h`;
    } else {
      return new Date(timestamp).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
      });
    }
  }
}
