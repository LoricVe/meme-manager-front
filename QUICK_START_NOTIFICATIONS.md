# 🚀 Quick Start - Notifications

## ✅ C'est déjà installé !

Le système de notifications est **déjà intégré** dans ton application. Tu n'as rien à installer.

## 💡 Utilisation en 3 lignes

```typescript
// 1. Importer le service
import { NotificationService } from './shared/services/notification.service';

// 2. L'injecter dans ton composant
constructor(private notificationService: NotificationService) {}

// 3. Afficher une notification
this.notificationService.success('Bravo', 'Ton mème est en ligne !');
```

## 🎯 Exemples rapides

### Succès
```typescript
this.notificationService.success('Publié', 'Mème ajouté avec succès');
```

### Erreur
```typescript
this.notificationService.error('Erreur', 'Impossible de charger les images');
```

### Info
```typescript
this.notificationService.info('Info', 'Nouvelle fonctionnalité disponible');
```

### Warning
```typescript
this.notificationService.warning('Attention', 'Session expire dans 5min');
```

### Like (avec image)
```typescript
this.notificationService.notifyLike(
  'John Doe',           // Nom de l'utilisateur
  'meme-123',           // ID du mème
  'https://...',        // URL de la miniature
  'user-456'            // ID de l'utilisateur
);
```

### Avec action personnalisée
```typescript
this.notificationService.show('info', 'Nouveau message', 'Cliquez pour voir', {
  duration: 10000,
  action: () => this.router.navigate(['/messages'])
});
```

## 🧪 Tester rapidement

Ajoute ce code dans n'importe quel composant pour tester :

```typescript
testNotifications(): void {
  this.notificationService.success('Test 1', 'Ceci est un test');

  setTimeout(() => {
    this.notificationService.error('Test 2', 'Erreur de test');
  }, 1000);

  setTimeout(() => {
    this.notificationService.notifyLike('John', 'meme-123', 'https://picsum.photos/100');
  }, 2000);
}
```

Puis dans ton HTML :
```html
<button (click)="testNotifications()">Tester les notifications</button>
```

## ⚡ Notifications automatiques

Les notifications de **likes** et **commentaires** sont **automatiques** !

Quand quelqu'un like ou commente ton mème, une notification apparaît automatiquement grâce au système de polling en arrière-plan (toutes les 30 secondes).

## 🎨 Position et style

Les notifications apparaissent en **bas à droite** avec :
- Animations fluides (slide-in)
- Auto-dismiss après 5 secondes (configurable)
- Cliquables pour naviguer
- Maximum 3 notifications affichées simultanément

## 📖 Documentation complète

- **Guide complet** : [README_NOTIFICATIONS.md](./README_NOTIFICATIONS.md)
- **Exemples détaillés** : [NOTIFICATIONS_USAGE.md](./NOTIFICATIONS_USAGE.md)

---

C'est tout ! Tu es prêt à utiliser le système de notifications 🎉
