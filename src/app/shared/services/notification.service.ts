import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Notification, NotificationType } from '../interfaces/notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$: Observable<Notification[]> = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$: Observable<number> = this.unreadCountSubject.asObservable();

  constructor() {
    this.loadNotificationsFromStorage();
  }

  /**
   * Affiche une notification toast
   */
  show(
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      duration?: number;
      action?: () => void;
      memeId?: string;
      memeThumbnail?: string;
      userId?: string;
      userName?: string;
    }
  ): void {
    const notification: Notification = {
      id: this.generateId(),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
      duration: options?.duration || 5000,
      action: options?.action,
      memeId: options?.memeId,
      memeThumbnail: options?.memeThumbnail,
      userId: options?.userId,
      userName: options?.userName
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...currentNotifications]);
    this.updateUnreadCount();
    this.saveNotificationsToStorage();

    // Auto-suppression après la durée spécifiée
    if (notification.duration) {
      setTimeout(() => {
        this.remove(notification.id);
      }, notification.duration);
    }
  }

  /**
   * Méthodes raccourcies pour différents types
   */
  success(title: string, message: string, duration?: number): void {
    this.show('success', title, message, { duration });
  }

  error(title: string, message: string, duration?: number): void {
    this.show('error', title, message, { duration });
  }

  info(title: string, message: string, duration?: number): void {
    this.show('info', title, message, { duration });
  }

  warning(title: string, message: string, duration?: number): void {
    this.show('warning', title, message, { duration });
  }

  /**
   * Notification spécifique pour les likes
   */
  notifyLike(userName: string, memeId: string, memeThumbnail?: string, userId?: string): void {
    this.show(
      'like',
      'Nouveau like',
      `${userName} a aimé votre mème`,
      {
        duration: 7000,
        memeId,
        memeThumbnail,
        userId,
        userName,
        action: () => {
          // Navigation vers le mème
          window.location.href = `/gallery?meme=${memeId}`;
        }
      }
    );
  }

  /**
   * Notification pour les commentaires
   */
  notifyComment(userName: string, memeId: string, memeThumbnail?: string, userId?: string): void {
    this.show(
      'comment',
      'Nouveau commentaire',
      `${userName} a commenté votre mème`,
      {
        duration: 7000,
        memeId,
        memeThumbnail,
        userId,
        userName,
        action: () => {
          window.location.href = `/gallery?meme=${memeId}`;
        }
      }
    );
  }

  /**
   * Supprime une notification
   */
  remove(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount();
    this.saveNotificationsToStorage();
  }

  /**
   * Marque une notification comme lue
   */
  markAsRead(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount();
    this.saveNotificationsToStorage();
  }

  /**
   * Marque toutes les notifications comme lues
   */
  markAllAsRead(): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount();
    this.saveNotificationsToStorage();
  }

  /**
   * Efface toutes les notifications
   */
  clearAll(): void {
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
    this.saveNotificationsToStorage();
  }

  /**
   * Récupère toutes les notifications
   */
  getAll(): Notification[] {
    return this.notificationsSubject.value;
  }

  /**
   * Récupère le nombre de notifications non lues
   */
  getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  /**
   * Met à jour le compteur de notifications non lues
   */
  private updateUnreadCount(): void {
    const unreadCount = this.notificationsSubject.value.filter(n => !n.read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  /**
   * Génère un ID unique pour une notification
   */
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sauvegarde les notifications dans le localStorage
   */
  private saveNotificationsToStorage(): void {
    try {
      const notifications = this.notificationsSubject.value.map(n => ({
        ...n,
        // On ne sauvegarde pas les fonctions
        action: undefined,
        timestamp: n.timestamp.toISOString()
      }));
      localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des notifications:', error);
    }
  }

  /**
   * Charge les notifications depuis le localStorage
   */
  private loadNotificationsFromStorage(): void {
    try {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        const notifications = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        // Garder seulement les notifications des dernières 24h
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentNotifications = notifications.filter(
          (n: Notification) => n.timestamp > oneDayAgo
        );
        this.notificationsSubject.next(recentNotifications);
        this.updateUnreadCount();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  }
}
