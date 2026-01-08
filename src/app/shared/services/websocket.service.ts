import { Injectable, OnDestroy } from '@angular/core';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private ws?: WebSocket;
  private reconnectInterval = 5000;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;
  private pollingInterval?: any;

  // Désactivé par défaut - à activer quand le backend est configuré
  private pollingEnabled = false;

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private apiService: ApiService
  ) {
    // Note: Le polling est désactivé par défaut
    // Pour l'activer, utilisez: websocketService.enablePolling()
    // après avoir configuré votre backend Directus avec l'endpoint /activity

    // Écouter les changements d'authentification
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth && this.pollingEnabled) {
        this.connect();
      } else {
        this.disconnect();
      }
    });
  }

  /**
   * Connexion WebSocket (si Directus le supporte)
   * Sinon on utilise le polling
   */
  private connect(): void {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    // Pour Directus, on utilise le polling plutôt que WebSocket
    // car Directus ne supporte pas nativement WebSocket pour les notifications
    this.startPolling();
  }

  /**
   * Déconnexion
   */
  private disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
    this.stopPolling();
  }

  /**
   * Polling pour vérifier les nouvelles notifications
   */
  private startPolling(): void {
    if (this.pollingInterval) {
      return;
    }

    // Vérifier les notifications toutes les 30 secondes
    this.pollingInterval = setInterval(() => {
      this.checkForNewNotifications();
    }, 30000);

    // Vérification initiale
    this.checkForNewNotifications();
  }

  /**
   * Arrêt du polling
   */
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }
  }

  /**
   * Vérifie s'il y a de nouvelles notifications
   * Cette méthode interroge votre collection 'notifications' dans Directus
   */
  private async checkForNewNotifications(): Promise<void> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        return;
      }

      // Récupérer les notifications non lues de l'utilisateur
      const response = await this.apiService.requestApi('/items/notifications', 'GET', {
        filter: {
          user: { _eq: currentUser.id },
          read: { _eq: false }
        },
        sort: '-date_created',
        limit: 10
      });

      if (response?.data && Array.isArray(response.data)) {
        // Afficher chaque notification
        response.data.forEach(async (notif: any) => {
          // Afficher la notification
          if (notif.type === 'like') {
            const thumbnail = notif.meme_image
              ? this.apiService.getAssetUrl(notif.meme_image, 'width=100&height=100&fit=cover')
              : undefined;

            this.notificationService.notifyLike(
              notif.from_user_name || 'Un utilisateur',
              notif.meme_id,
              thumbnail,
              notif.from_user_id
            );
          } else if (notif.type === 'comment') {
            const thumbnail = notif.meme_image
              ? this.apiService.getAssetUrl(notif.meme_image, 'width=100&height=100&fit=cover')
              : undefined;

            this.notificationService.notifyComment(
              notif.from_user_name || 'Un utilisateur',
              notif.meme_id,
              thumbnail,
              notif.from_user_id
            );
          }

          // Marquer comme lue
          try {
            await this.apiService.requestApi(`/items/notifications/${notif.id}`, 'PATCH', {
              read: true
            });
          } catch (err) {
            console.error('Erreur lors du marquage de notification comme lue:', err);
          }
        });
      }
    } catch (error: any) {
      // Gérer l'erreur silencieusement si le polling n'est pas configuré
      if (this.pollingEnabled) {
        // Si la collection n'existe pas (404) ou autre erreur
        if (error?.status === 404 || error?.status === 403) {
          console.warn('⚠️ La collection "notifications" n\'existe pas encore dans Directus.');
          console.info('💡 Pour activer les notifications automatiques, créez la collection "notifications" dans Directus.');
          console.info('📖 Voir: BACKEND_SETUP_NOTIFICATIONS.md');
        } else {
          console.error('Erreur lors de la vérification des notifications:', error);
        }
        // Désactiver le polling en cas d'erreur
        this.stopPolling();
        this.pollingEnabled = false;
        console.info('ℹ️ Le polling a été désactivé. Pour le réactiver, appelez enablePolling()');
      }
    }
  }

  /**
   * Traite les activités reçues et crée des notifications
   */
  private processActivities(activities: any[]): void {
    activities.forEach(activity => {
      // Ignorer si déjà traité
      const processedKey = `notification_${activity.id}`;
      if (localStorage.getItem(processedKey)) {
        return;
      }

      // Marquer comme traité
      localStorage.setItem(processedKey, 'true');

      // Créer une notification selon le type d'activité
      if (activity.action === 'create' && activity.collection === 'meme_likes') {
        this.handleLikeNotification(activity);
      } else if (activity.action === 'create' && activity.collection === 'meme_comments') {
        this.handleCommentNotification(activity);
      }
    });
  }

  /**
   * Gère une notification de like
   */
  private async handleLikeNotification(activity: any): Promise<void> {
    try {
      // Récupérer les détails du like
      const likeResponse = await this.apiService.requestApi(
        `/items/meme_likes/${activity.item}`,
        'GET',
        { fields: ['*', 'user.*', 'meme.*'] }
      );

      const like = likeResponse?.data || likeResponse;
      if (!like) return;

      const currentUser = this.authService.getCurrentUser();

      // Vérifier si c'est un like sur un mème de l'utilisateur actuel
      if (like.meme?.user_created === currentUser?.id && like.user?.id !== currentUser?.id) {
        const memeThumbnail = like.meme?.image
          ? this.apiService.getAssetUrl(like.meme.image, 'width=100&height=100&fit=cover')
          : undefined;

        this.notificationService.notifyLike(
          like.user?.first_name || 'Un utilisateur',
          like.meme?.id,
          memeThumbnail,
          like.user?.id
        );
      }
    } catch (error) {
      console.error('Erreur lors du traitement de la notification de like:', error);
    }
  }

  /**
   * Gère une notification de commentaire
   */
  private async handleCommentNotification(activity: any): Promise<void> {
    try {
      // Récupérer les détails du commentaire
      const commentResponse = await this.apiService.requestApi(
        `/items/meme_comments/${activity.item}`,
        'GET',
        { fields: ['*', 'user.*', 'meme.*'] }
      );

      const comment = commentResponse?.data || commentResponse;
      if (!comment) return;

      const currentUser = this.authService.getCurrentUser();

      // Vérifier si c'est un commentaire sur un mème de l'utilisateur actuel
      if (comment.meme?.user_created === currentUser?.id && comment.user?.id !== currentUser?.id) {
        const memeThumbnail = comment.meme?.image
          ? this.apiService.getAssetUrl(comment.meme.image, 'width=100&height=100&fit=cover')
          : undefined;

        this.notificationService.notifyComment(
          comment.user?.first_name || 'Un utilisateur',
          comment.meme?.id,
          memeThumbnail,
          comment.user?.id
        );
      }
    } catch (error) {
      console.error('Erreur lors du traitement de la notification de commentaire:', error);
    }
  }

  /**
   * Méthode publique pour forcer une vérification
   */
  public checkNow(): void {
    this.checkForNewNotifications();
  }

  /**
   * Active le polling des notifications
   * À appeler uniquement quand le backend est configuré
   */
  public enablePolling(): void {
    console.info('✅ Polling des notifications activé');
    this.pollingEnabled = true;
    if (this.authService.isAuthenticated()) {
      this.connect();
    }
  }

  /**
   * Désactive le polling des notifications
   */
  public disablePolling(): void {
    console.info('❌ Polling des notifications désactivé');
    this.pollingEnabled = false;
    this.disconnect();
  }

  /**
   * Vérifie si le polling est activé
   */
  public isPollingEnabled(): boolean {
    return this.pollingEnabled;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
