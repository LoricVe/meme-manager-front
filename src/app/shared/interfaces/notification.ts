export type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'like' | 'comment';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read?: boolean;
  // Données spécifiques pour les notifications de likes
  memeId?: string;
  memeThumbnail?: string;
  userId?: string;
  userName?: string;
  // Durée d'affichage (en ms), par défaut 5000
  duration?: number;
  // Action à effectuer lors du clic
  action?: () => void;
}
