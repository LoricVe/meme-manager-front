# Guide d'utilisation du système de notifications

## Vue d'ensemble

Le système de notifications comprend :
- **NotificationService** : Gestion des notifications
- **ToastNotification** : Affichage visuel des notifications (toasts)
- **WebSocketService** : Réception des notifications en temps réel via polling

## Installation

Le système est déjà intégré dans l'application. Le composant toast est affiché globalement dans `app.component.html`.

## Utilisation basique

### 1. Injecter le service

```typescript
import { NotificationService } from './shared/services/notification.service';

export class MonComponent {
  constructor(private notificationService: NotificationService) {}
}
```

### 2. Afficher des notifications simples

```typescript
// Notification de succès
this.notificationService.success('Succès', 'Le mème a été publié avec succès');

// Notification d'erreur
this.notificationService.error('Erreur', 'Impossible de charger les mèmes');

// Notification d'information
this.notificationService.info('Info', 'Nouvelle fonctionnalité disponible');

// Notification d'avertissement
this.notificationService.warning('Attention', 'Votre session expire bientôt');
```

### 3. Notifications de likes (automatique)

Le système détecte automatiquement les nouveaux likes via le WebSocketService :

```typescript
// Appelé automatiquement quand quelqu'un like votre mème
this.notificationService.notifyLike(
  'John Doe',           // Nom de l'utilisateur qui a liké
  'meme-id-123',        // ID du mème
  'thumbnail-url',      // URL de la miniature
  'user-id-456'         // ID de l'utilisateur
);
```

### 4. Notifications de commentaires (automatique)

```typescript
// Appelé automatiquement quand quelqu'un commente votre mème
this.notificationService.notifyComment(
  'Jane Smith',         // Nom de l'utilisateur
  'meme-id-123',        // ID du mème
  'thumbnail-url',      // URL de la miniature
  'user-id-789'         // ID de l'utilisateur
);
```

### 5. Notifications personnalisées avec action

```typescript
this.notificationService.show(
  'info',
  'Nouveau message',
  'Vous avez reçu un message privé',
  {
    duration: 10000,     // 10 secondes
    action: () => {
      // Action au clic sur la notification
      this.router.navigate(['/messages']);
    }
  }
);
```

## Exemples d'intégration

### Dans un composant de galerie (après un like)

```typescript
// src/app/pages/meme-gallery/meme-gallery.component.ts
async onLikeMeme(meme: Meme): Promise<void> {
  try {
    await this.memeService.likeMeme(meme.id);

    // Notification de confirmation
    this.notificationService.success(
      'Mème liké',
      'Vous avez aimé ce mème'
    );
  } catch (error) {
    this.notificationService.error(
      'Erreur',
      'Impossible de liker ce mème'
    );
  }
}
```

### Dans un composant d'upload

```typescript
// src/app/pages/create-meme/create-meme.component.ts
async onUploadComplete(meme: Meme): Promise<void> {
  this.notificationService.success(
    'Publié',
    'Votre mème a été publié avec succès',
    5000
  );

  // Redirection après 1 seconde
  setTimeout(() => {
    this.router.navigate(['/gallery']);
  }, 1000);
}
```

### Lors d'une erreur de connexion

```typescript
// src/app/shared/services/auth.service.ts
async login(credentials: LoginData): Promise<void> {
  try {
    await this.apiService.requestApi('/auth/login', 'POST', credentials);
  } catch (error) {
    this.notificationService.error(
      'Connexion échouée',
      'Email ou mot de passe incorrect'
    );
  }
}
```

### Notification avec image de mème

```typescript
// Notification personnalisée avec preview du mème
this.notificationService.show(
  'like',
  'Nouveau like',
  'Sarah a aimé votre mème',
  {
    duration: 7000,
    memeId: meme.id,
    memeThumbnail: this.apiService.getAssetUrl(meme.image, 'width=100&height=100'),
    userName: 'Sarah',
    userId: 'user-123',
    action: () => {
      // Navigation vers le mème
      this.router.navigate(['/gallery'], { queryParams: { meme: meme.id } });
    }
  }
);
```

## Configuration

### Changer la durée d'affichage par défaut

```typescript
// Par défaut : 5000ms (5 secondes)
this.notificationService.success('Titre', 'Message', 3000); // 3 secondes
```

### Limiter le nombre de toasts affichés

```typescript
// Dans toast-notification.component.ts
maxToasts = 3; // Modifier cette valeur (par défaut : 3)
```

### Changer l'intervalle de polling

```typescript
// Dans websocket.service.ts, ligne ~72
this.pollingInterval = setInterval(() => {
  this.checkForNewNotifications();
}, 30000); // 30 secondes (modifier cette valeur)
```

## Personnalisation des styles

Les notifications utilisent Tailwind CSS et DaisyUI. Pour personnaliser :

```css
/* src/app/shared/components/toast-notification/toast-notification.css */

/* Changer la position */
.fixed.bottom-4.right-4 {
  /* Déplacer en haut à droite */
  top: 1rem;
  bottom: auto;
}

/* Changer la largeur maximale */
:host ::ng-deep .alert {
  max-width: 500px; /* Par défaut : 400px */
}
```

## Gestion des notifications stockées

Les notifications sont sauvegardées dans le localStorage et conservées pendant 24h.

```typescript
// Récupérer toutes les notifications
const all = this.notificationService.getAll();

// Marquer toutes comme lues
this.notificationService.markAllAsRead();

// Effacer toutes les notifications
this.notificationService.clearAll();

// Compter les non lues
const unreadCount = this.notificationService.getUnreadCount();

// Observer le compteur
this.notificationService.unreadCount$.subscribe(count => {
  console.log(`${count} notifications non lues`);
});
```

## Types de notifications

- `success` : Opération réussie (vert)
- `error` : Erreur (rouge)
- `warning` : Avertissement (jaune)
- `info` : Information (bleu)
- `like` : Notification de like (rose)
- `comment` : Notification de commentaire (bleu clair)

## Best Practices

1. **Durée appropriée** :
   - Messages courts : 3-5 secondes
   - Messages importants : 7-10 secondes

2. **Messages clairs** :
   - Titre court et descriptif
   - Message explicite

3. **Actions utiles** :
   - Rediriger vers le contenu concerné
   - Fournir une action rapide

4. **Ne pas abuser** :
   - Éviter trop de notifications simultanées
   - Grouper les notifications similaires

## Démo / Test

Pour tester les notifications, vous pouvez utiliser la console :

```typescript
// Dans la console du navigateur
// Injecter le service (depuis un composant)
this.notificationService.success('Test', 'Ceci est un test');

// Ou créer une fonction de test dans un composant
testNotifications(): void {
  this.notificationService.success('Succès', 'Opération réussie');
  setTimeout(() => {
    this.notificationService.error('Erreur', 'Une erreur est survenue');
  }, 1000);
  setTimeout(() => {
    this.notificationService.notifyLike('John Doe', 'meme-123');
  }, 2000);
}
```
