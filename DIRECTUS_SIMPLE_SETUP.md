# 🎯 Configuration Directus - Guide Simple (Sans Code)

## Ce dont tu as besoin

**Seulement 2 choses à faire dans Directus** (pas de code API !) :

1. ✅ Créer une collection "notifications"
2. ✅ Créer un Flow automatique

## 📝 Étape 1 : Créer la collection "notifications"

### Dans Directus Admin Panel

1. Va dans **Settings** (⚙️) → **Data Model**
2. Clique sur **Create Collection** (+)
3. Entre le nom : `notifications`
4. Clique **Continue**

### Ajouter les champs

Clique sur **Create Field** (+) pour chaque champ :

#### Champ 1 : user (Qui reçoit la notification)
- **Type** : Many to One Relationship
- **Related Collection** : directus_users
- **Field Name** : `user`
- Sauvegarder

#### Champ 2 : type (Type de notification)
- **Type** : String (Input)
- **Field Name** : `type`
- **Interface** : Dropdown
- **Choices** :
  - `like`
  - `comment`
- Sauvegarder

#### Champ 3 : meme_id
- **Type** : UUID
- **Field Name** : `meme_id`
- Sauvegarder

#### Champ 4 : meme_title
- **Type** : String
- **Field Name** : `meme_title`
- Sauvegarder

#### Champ 5 : meme_image
- **Type** : UUID
- **Field Name** : `meme_image`
- Sauvegarder

#### Champ 6 : from_user_id (Qui a envoyé)
- **Type** : UUID
- **Field Name** : `from_user_id`
- Sauvegarder

#### Champ 7 : from_user_name
- **Type** : String
- **Field Name** : `from_user_name`
- Sauvegarder

#### Champ 8 : read (Lu ou non)
- **Type** : Boolean
- **Field Name** : `read`
- **Default Value** : `false`
- Sauvegarder

**Note** : Les champs `id`, `date_created`, `date_updated` sont créés automatiquement.

## ⚡ Étape 2 : Créer un Flow (Automation)

### 2.1 Flow pour les Likes

1. Va dans **Settings** → **Flows**
2. Clique sur **Create Flow** (+)

#### Configuration du Flow

**Nom** : `Notification - Nouveau Like`

**Description** : Crée une notification quand quelqu'un like un mème

**Status** : Active ✅

#### Trigger (Déclencheur)

1. Sélectionne **Event Hook**
2. **Type** : Action (Non-Blocking)
3. **Scope** : `items.create`
4. **Collections** : Sélectionne `meme_likes` (ou le nom de ta collection de likes)

#### Operation (Action)

1. Clique sur le **+** après le trigger
2. Sélectionne **Create Data**
3. **Collection** : `notifications`
4. **Permissions** : Full Access

5. **Payload** (copie-colle ce JSON) :

```json
{
  "user": "{{$trigger.payload.meme.user_created}}",
  "type": "like",
  "meme_id": "{{$trigger.payload.meme.id}}",
  "meme_title": "{{$trigger.payload.meme.title}}",
  "meme_image": "{{$trigger.payload.meme.image}}",
  "from_user_id": "{{$trigger.payload.user_created}}",
  "from_user_name": "{{$accountability.user.first_name}}",
  "read": false
}
```

**Note** : Adapte les chemins selon ta structure (ex: si ton champ s'appelle `meme_id` au lieu de `meme`, change `$trigger.payload.meme` en `$trigger.payload.meme_id`)

6. **Sauvegarder** le Flow

### 2.2 Flow pour les Commentaires (optionnel)

Répète la même chose mais :
- **Nom** : `Notification - Nouveau Commentaire`
- **Collections** : `meme_comments` (ou ton nom)
- **Payload** : Change `"type": "comment"`

## 🔐 Étape 3 : Configurer les Permissions

1. Va dans **Settings** → **Roles & Permissions**
2. Sélectionne le rôle de tes utilisateurs (ex: "User")
3. Trouve la collection `notifications`
4. Active :
   - ✅ **Read** (avec filtre: `user` = `$CURRENT_USER`)
   - ✅ **Update** (avec filtre: `user` = `$CURRENT_USER` et champs: `read` uniquement)

## ✅ Étape 4 : Activer dans le Frontend

Dans ton `app.component.ts` :

```typescript
import { WebSocketService } from './shared/services/websocket.service';

constructor(
  public loadingService: Loading,
  private websocketService: WebSocketService
) {
  // Activer le polling maintenant que Directus est configuré
  this.websocketService.enablePolling();
}
```

## 🧪 Tester

1. Connecte-toi avec un utilisateur
2. Like un mème d'un autre utilisateur
3. Connecte-toi avec l'autre utilisateur
4. Une notification devrait apparaître en bas à droite ! 🎉

## 🔍 Vérifier que ça fonctionne

Dans Directus Admin :
1. Va dans **Content** → **notifications**
2. Tu devrais voir les notifications créées automatiquement quand quelqu'un like un mème

## ❓ Problèmes courants

### Le Flow ne se déclenche pas

- Vérifie que le Flow est **Active** (statut vert)
- Vérifie le nom de ta collection de likes (peut être différent de `meme_likes`)
- Regarde les logs Directus pour voir les erreurs

### Erreur 403 (Forbidden)

- Les permissions ne sont pas configurées
- Va dans Roles & Permissions et active **Read** pour `notifications`

### Les champs sont vides dans le payload

- Adapte les chemins dans le JSON selon ta structure
- Exemple : Si tu n'as pas de champ `title` sur tes mèmes, enlève cette ligne

## 📖 Structure alternative simple

Si tu n'as pas encore de système de likes/commentaires, voici une structure minimale :

### Collection `meme_likes`
- `id` (UUID, auto)
- `user` (Many-to-One → directus_users)
- `meme` (Many-to-One → memes)
- `date_created` (Timestamp, auto)

### Collection `memes`
- `id` (UUID, auto)
- `title` (String)
- `image` (Image)
- `user_created` (User Created, auto)
- `date_created` (Date Created, auto)

## 🎉 C'est tout !

Aucun code API à écrire, tout se fait dans l'interface Directus ! Les Flows font tout le travail automatiquement.

---

**Besoin d'aide ?** Les Flows Directus sont puissants et visuels, pas besoin de coder ! 🚀
