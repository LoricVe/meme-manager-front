# 🔧 Configuration Backend pour les Notifications

## État actuel

Le système de notifications est **déjà fonctionnel** pour les notifications manuelles (succès, erreur, etc.).

Le **polling automatique** (pour détecter les likes/commentaires) est **désactivé par défaut** pour éviter les erreurs 400.

## ⚠️ Pourquoi l'erreur 400 ?

L'erreur vient du fait que le WebSocketService essaie d'interroger l'endpoint `/activity` de Directus qui :
- N'existe peut-être pas dans ta version de Directus
- Nécessite une configuration spécifique
- Ou n'est pas accessible avec les permissions actuelles

## 🎯 Options disponibles

### Option 1 : Utiliser uniquement les notifications manuelles (RECOMMANDÉ pour commencer)

**Aucune configuration nécessaire !** Le système fonctionne déjà pour :
- Notifications de succès/erreur lors des actions
- Connexion/inscription
- Upload de mèmes
- Etc.

Les notifications de likes/commentaires peuvent être déclenchées manuellement dans ton code :

```typescript
// Exemple : après qu'un utilisateur like un mème
async onLike(meme: Meme) {
  await this.memeService.likeMeme(meme.id);

  // Notifier le propriétaire du mème (via votre logique backend)
  // Puis côté frontend du propriétaire :
  this.notificationService.notifyLike(
    this.currentUser.name,
    meme.id,
    meme.thumbnail
  );
}
```

### Option 2 : Activer le polling avec l'endpoint Activity de Directus

#### Étape 1 : Vérifier que Directus Activity est activé

L'endpoint `/activity` de Directus nécessite :

1. **Directus 9.x ou supérieur** avec Activity tracking activé
2. **Permissions** configurées pour lire les activités

#### Étape 2 : Configurer les permissions

Dans Directus Admin :
1. Aller dans **Settings > Roles & Permissions**
2. Sélectionner le rôle de tes utilisateurs
3. Activer la lecture sur `directus_activity`
4. Configurer les filtres si nécessaire

#### Étape 3 : Activer le polling dans le frontend

Dans ton `app.component.ts` ou un autre endroit approprié :

```typescript
import { WebSocketService } from './shared/services/websocket.service';

constructor(private websocketService: WebSocketService) {
  // Activer le polling une fois le backend configuré
  this.websocketService.enablePolling();
}
```

### Option 3 : Créer ton propre endpoint de notifications

Si l'endpoint `/activity` ne convient pas, crée un endpoint personnalisé dans Directus.

#### Dans Directus (Backend)

Créer une collection `notifications` avec :
- `id` (UUID)
- `user` (Many-to-One vers directus_users) - Le destinataire
- `type` (String) - 'like', 'comment', etc.
- `meme` (Many-to-One vers memes)
- `from_user` (Many-to-One vers directus_users) - L'émetteur
- `read` (Boolean)
- `date_created` (Timestamp)

#### Créer des Flows Directus (webhooks/automations)

1. **Flow pour les likes** :
   - Trigger: Item Created sur `meme_likes`
   - Action: Create Item dans `notifications`
   - Données:
     ```json
     {
       "user": "{{$trigger.meme.user_created}}",
       "type": "like",
       "meme": "{{$trigger.meme}}",
       "from_user": "{{$trigger.user}}"
     }
     ```

2. **Flow pour les commentaires** :
   - Trigger: Item Created sur `meme_comments`
   - Action: Create Item dans `notifications`

#### Modifier le WebSocketService

```typescript
// Dans websocket.service.ts, modifier checkForNewNotifications()
const response = await this.apiService.requestApi('/items/notifications', 'GET', {
  filter: {
    user: { _eq: currentUser.id },
    date_created: { _gte: lastCheckDate.toISOString() },
    read: { _eq: false }
  },
  sort: '-date_created',
  limit: 10,
  fields: ['*', 'meme.*', 'from_user.first_name', 'from_user.last_name']
});

if (response?.data && Array.isArray(response.data)) {
  response.data.forEach(notification => {
    if (notification.type === 'like') {
      this.notificationService.notifyLike(
        notification.from_user?.first_name || 'Un utilisateur',
        notification.meme?.id,
        this.apiService.getAssetUrl(notification.meme?.image, 'width=100&height=100'),
        notification.from_user?.id
      );
    }
    // Marquer comme lue
    this.apiService.requestApi(`/items/notifications/${notification.id}`, 'PATCH', {
      read: true
    });
  });
}
```

### Option 4 : Utiliser WebSockets réels (Avancé)

Pour du temps réel instantané, utilise Socket.io ou WebSockets natifs :

1. Installer Socket.io côté backend et frontend
2. Émettre des événements lors des likes/commentaires
3. Écouter ces événements côté frontend

## 🚀 Démarrage rapide (pour tester maintenant)

Pour **tester le système immédiatement** sans configuration backend :

```typescript
// Dans n'importe quel composant, pour simuler une notification de like
testLike() {
  this.notificationService.notifyLike(
    'John Doe',
    'meme-123',
    'https://picsum.photos/100/100',
    'user-456'
  );
}
```

```html
<!-- Dans le template -->
<button (click)="testLike()">Tester notification like</button>
```

## 📊 Comparaison des options

| Option | Complexité | Temps réel | Configuration backend |
|--------|------------|------------|----------------------|
| 1. Manuel | ⭐ Facile | ❌ Non | ❌ Aucune |
| 2. Activity | ⭐⭐ Moyen | ⏰ 30s polling | ⚙️ Permissions |
| 3. Custom endpoint | ⭐⭐⭐ Moyen | ⏰ 30s polling | ⚙️ Collection + Flows |
| 4. WebSockets | ⭐⭐⭐⭐ Avancé | ✅ Instantané | ⚙️⚙️ Socket.io |

## ✅ Recommandation

**Pour commencer** : Option 1 (manuel)
**Pour production** : Option 3 (custom endpoint) + Flows Directus
**Pour temps réel** : Option 4 (WebSockets) si critique

## 🔧 Commandes utiles

```typescript
// Activer le polling manuellement (après config backend)
this.websocketService.enablePolling();

// Désactiver le polling
this.websocketService.disablePolling();

// Vérifier l'état
console.log(this.websocketService.isPollingEnabled()); // false par défaut

// Forcer une vérification manuelle
this.websocketService.checkNow();
```

## 📝 Prochaines étapes

1. ✅ Tester les notifications manuelles (déjà fonctionnel)
2. 🔧 Configurer Directus selon l'option choisie
3. 🚀 Activer le polling une fois le backend prêt
4. 🎨 Personnaliser les notifications selon tes besoins

---

**Note** : Le système de notifications fonctionne **parfaitement** sans le polling. Le polling n'est qu'un bonus pour automatiser la détection des likes/commentaires.
