# 🔔 Système de Notifications - Meme Manager

## Vue d'ensemble

Système de notifications toast moderne et UX-friendly pour afficher des notifications en temps réel dans l'application Meme Manager.

### ✨ Fonctionnalités

- **Notifications toast** - Apparaissent en bas à droite avec animations fluides
- **6 types de notifications** - Success, Error, Warning, Info, Like, Comment
- **Auto-dismiss** - Disparaissent automatiquement après quelques secondes
- **Cliquables** - Peuvent déclencher des actions (navigation, etc.)
- **Images** - Affichent des miniatures pour les likes/commentaires
- **Temps réel** - Polling automatique toutes les 30s pour les nouvelles activités
- **Persistance** - Sauvegardées dans localStorage (24h)
- **Responsive** - S'adapte aux petits écrans

## 🎨 Aperçu

```
┌─────────────────────────────────────┐
│ ❤️  Nouveau like                    │
│ John Doe a aimé votre mème          │
│ [Image miniature du mème]           │
│ Il y a 2min                    [×]  │
└─────────────────────────────────────┘
```

## 📁 Architecture

### Fichiers créés

```
src/app/shared/
├── interfaces/
│   └── notification.ts                 # Interface TypeScript
├── services/
│   ├── notification.service.ts         # Service de gestion
│   └── websocket.service.ts            # Polling temps réel
└── components/
    └── toast-notification/
        ├── toast-notification.ts       # Composant
        ├── toast-notification.html     # Template
        └── toast-notification.css      # Styles
```

### Intégration

- `app.component.html` - Affiche le composant toast globalement
- `app.component.ts` - Initialise le WebSocketService
- `app-module.ts` - Ajoute provideAnimationsAsync()

## 🚀 Utilisation rapide

### 1. Notification simple

```typescript
import { NotificationService } from './shared/services/notification.service';

constructor(private notificationService: NotificationService) {}

// Succès
this.notificationService.success('Publié', 'Votre mème est en ligne');

// Erreur
this.notificationService.error('Erreur', 'Upload échoué');

// Info
this.notificationService.info('Astuce', 'Utilisez des tags pour organiser');

// Warning
this.notificationService.warning('Attention', 'Session expire bientôt');
```

### 2. Notification avec action

```typescript
this.notificationService.show(
  'info',
  'Nouveau message',
  'Vous avez un nouveau message',
  {
    duration: 10000,
    action: () => {
      this.router.navigate(['/messages']);
    }
  }
);
```

### 3. Notification de like (automatique)

Le système détecte automatiquement les nouveaux likes via le WebSocketService et affiche :

```typescript
// Appelé automatiquement par WebSocketService
this.notificationService.notifyLike(
  'Sarah',                    // Nom de l'utilisateur
  'meme-id',                  // ID du mème
  'thumbnail-url',            // URL miniature
  'user-id'                   // ID utilisateur
);
```

## 🔧 Configuration

### Changer l'intervalle de polling

```typescript
// websocket.service.ts, ligne 72
this.pollingInterval = setInterval(() => {
  this.checkForNewNotifications();
}, 30000); // 30 secondes → modifier ici
```

### Modifier la durée d'affichage

```typescript
// Par défaut : 5000ms
this.notificationService.success('Titre', 'Message', 3000); // 3 secondes
```

### Limiter le nombre de toasts affichés

```typescript
// toast-notification.component.ts
maxToasts = 3; // Par défaut, modifier selon besoin
```

## 📱 Types de notifications

| Type | Icône | Couleur | Usage |
|------|-------|---------|-------|
| `success` | ✓ | Vert | Opération réussie |
| `error` | ✕ | Rouge | Erreur |
| `warning` | ⚠ | Jaune | Avertissement |
| `info` | ℹ | Bleu | Information |
| `like` | ❤️ | Rose | Nouveau like |
| `comment` | 💬 | Bleu clair | Nouveau commentaire |

## 🧪 Test du système

### Composant de démo (développement uniquement)

Pour tester les notifications, ajoutez temporairement dans une page :

```typescript
// Dans app-module.ts
import { NotificationDemoComponent } from './shared/components/notification-demo/notification-demo.component';

@NgModule({
  declarations: [
    // ...
    NotificationDemoComponent
  ]
})
```

```html
<!-- Dans n'importe quelle page -->
<app-notification-demo></app-notification-demo>
```

Cela affichera un panneau de test en bas à gauche avec des boutons pour tester chaque type.

### Test manuel dans la console

```javascript
// Ouvrir la console du navigateur
// Injecter le service depuis un composant
component.notificationService.success('Test', 'Ceci fonctionne !');
```

## 🎯 Exemples d'implémentation

### Dans un composant de galerie

```typescript
// Après suppression d'un mème
onMemeDeleted(memeId: string): void {
  this.memes = this.memes.filter(m => m.id !== memeId);
  this.notificationService.success(
    'Mème supprimé',
    'Le mème a été supprimé avec succès'
  );
}
```

### Dans un formulaire de connexion

```typescript
async onLogin(): Promise<void> {
  try {
    await this.authService.login(this.loginForm.value);
    this.notificationService.success('Connecté', 'Bienvenue !');
    this.router.navigate(['/gallery']);
  } catch (error) {
    this.notificationService.error(
      'Échec',
      'Email ou mot de passe incorrect'
    );
  }
}
```

### Dans un service d'upload

```typescript
async uploadMeme(file: File, data: any): Promise<void> {
  try {
    const result = await this.apiService.uploadFile(file);
    this.notificationService.success(
      'Upload terminé',
      'Votre mème a été uploadé'
    );
    return result;
  } catch (error) {
    this.notificationService.error(
      'Upload échoué',
      'Vérifiez la taille du fichier'
    );
    throw error;
  }
}
```

## 🔄 Système temps réel

### ⚠️ Important : Polling désactivé par défaut

Le **polling automatique est désactivé par défaut** pour éviter les erreurs si votre backend n'est pas encore configuré.

Les notifications **manuelles fonctionnent parfaitement** sans configuration supplémentaire :
- Succès/Erreur/Info/Warning
- Notifications déclenchées par votre code

Pour activer le polling automatique (détection likes/commentaires), voir [BACKEND_SETUP_NOTIFICATIONS.md](./BACKEND_SETUP_NOTIFICATIONS.md)

### Comment ça fonctionne (quand activé)

1. **WebSocketService** s'initialise au démarrage de l'app
2. Vérifie toutes les **30 secondes** les nouvelles activités (quand `enablePolling()` est appelé)
3. Interroge l'API Directus `/activity` pour les nouveaux likes/commentaires
4. Crée automatiquement des notifications pour l'utilisateur
5. Évite les doublons via localStorage

### Activer le polling

```typescript
// Dans app.component.ts ou après configuration du backend
constructor(private websocketService: WebSocketService) {
  // Une fois le backend configuré
  this.websocketService.enablePolling();
}
```

### Personnaliser les notifications temps réel

```typescript
// websocket.service.ts - Méthode processActivities()
private processActivities(activities: any[]): void {
  activities.forEach(activity => {
    // Ajouter vos propres types d'activités ici
    if (activity.action === 'create' && activity.collection === 'follows') {
      this.handleFollowNotification(activity);
    }
  });
}
```

## 🎨 Personnalisation visuelle

### Changer la position

```css
/* toast-notification.css */
.fixed.bottom-4.right-4 {
  /* En haut à droite */
  top: 1rem;
  bottom: auto;
}
```

### Modifier les couleurs

```css
/* toast-notification.css */
:host ::ng-deep .bg-pink-50 {
  background-color: #your-color;
  border-color: #your-border-color;
}
```

## 📊 API du NotificationService

### Méthodes principales

```typescript
// Afficher une notification
show(type, title, message, options?)

// Raccourcis
success(title, message, duration?)
error(title, message, duration?)
info(title, message, duration?)
warning(title, message, duration?)

// Spécifiques
notifyLike(userName, memeId, thumbnail?, userId?)
notifyComment(userName, memeId, thumbnail?, userId?)

// Gestion
remove(id: string)
markAsRead(id: string)
markAllAsRead()
clearAll()
getAll(): Notification[]
getUnreadCount(): number
```

### Observables

```typescript
// Observer les notifications
notifications$: Observable<Notification[]>
unreadCount$: Observable<number>

// Exemple
this.notificationService.unreadCount$.subscribe(count => {
  console.log(`${count} non lues`);
});
```

## 🐛 Dépannage

### Les notifications n'apparaissent pas

1. Vérifier que `<app-toast-notification>` est dans app.component.html
2. Vérifier que `provideAnimationsAsync()` est dans les providers
3. Vérifier la console pour les erreurs

### Les notifications temps réel ne fonctionnent pas

1. Vérifier que WebSocketService est injecté dans AppComponent
2. Vérifier que l'utilisateur est connecté
3. Vérifier les logs de la console (🔍 Vérification...)
4. Adapter le schéma Directus à votre API

### Les animations ne fonctionnent pas

Vérifier que Angular Animations est bien configuré :

```typescript
// app-module.ts
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

providers: [
  provideAnimationsAsync()
]
```

## 📝 Best Practices

1. **Messages clairs** - Titre court, message explicite
2. **Durée appropriée** - 3-5s pour info, 7-10s pour actions
3. **Pas d'abus** - Limiter les notifications non essentielles
4. **Actions utiles** - Rediriger vers le contenu concerné
5. **Grouper** - Combiner les notifications similaires

## 🔮 Améliorations futures possibles

- [ ] WebSocket natif (si Directus l'ajoute)
- [ ] Sons de notification (optionnel)
- [ ] Centre de notifications (historique complet)
- [ ] Notifications push (PWA)
- [ ] Préférences utilisateur (désactiver certains types)
- [ ] Regroupement intelligent des notifications
- [ ] Badge sur l'icône de notifications dans la navbar

## 📚 Documentation complète

Voir [NOTIFICATIONS_USAGE.md](./NOTIFICATIONS_USAGE.md) pour plus d'exemples détaillés.

---

Développé pour Meme Manager avec ❤️
