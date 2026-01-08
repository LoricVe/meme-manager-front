# 📋 Référence Rapide - Champs Directus

## Collection `notifications`

Copie-colle ce tableau pour créer rapidement les champs :

| Nom | Type | Interface | Requis | Default | Notes |
|-----|------|-----------|--------|---------|-------|
| `id` | UUID | - | Auto | Auto | Créé automatiquement |
| `user` | Many-to-One | User | ✅ Oui | - | → directus_users (destinataire) |
| `type` | String | Dropdown | ✅ Oui | - | Valeurs: like, comment |
| `meme_id` | UUID | Input | ✅ Oui | - | ID du mème concerné |
| `meme_title` | String | Input | Non | - | Titre du mème (optionnel) |
| `meme_image` | UUID | Input | Non | - | ID de l'image du mème |
| `from_user_id` | UUID | Input | ✅ Oui | - | ID de l'utilisateur émetteur |
| `from_user_name` | String | Input | ✅ Oui | - | Nom de l'émetteur |
| `read` | Boolean | Toggle | ✅ Oui | `false` | Notification lue ou non |
| `date_created` | Timestamp | Datetime | Auto | Auto | Créé automatiquement |
| `date_updated` | Timestamp | Datetime | Auto | Auto | Créé automatiquement |

## SQL pour création rapide (optionnel)

Si tu préfères créer la table directement en SQL :

```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user uuid NOT NULL REFERENCES directus_users(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL CHECK (type IN ('like', 'comment')),
  meme_id uuid NOT NULL,
  meme_title varchar(255),
  meme_image uuid,
  from_user_id uuid NOT NULL,
  from_user_name varchar(255) NOT NULL,
  read boolean DEFAULT false,
  date_created timestamp DEFAULT CURRENT_TIMESTAMP,
  date_updated timestamp DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performances
CREATE INDEX idx_notifications_user ON notifications(user);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_date ON notifications(date_created DESC);
```

## Payload Flow - Copier/Coller

### Pour les Likes

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

### Pour les Commentaires

```json
{
  "user": "{{$trigger.payload.meme.user_created}}",
  "type": "comment",
  "meme_id": "{{$trigger.payload.meme.id}}",
  "meme_title": "{{$trigger.payload.meme.title}}",
  "meme_image": "{{$trigger.payload.meme.image}}",
  "from_user_id": "{{$trigger.payload.user_created}}",
  "from_user_name": "{{$accountability.user.first_name}}",
  "read": false
}
```

## Permissions rapides

### Pour le rôle "User"

**Collection: notifications**

#### Read (Lecture)
- ✅ Activé
- **Filter** :
```json
{
  "user": {
    "_eq": "$CURRENT_USER"
  }
}
```

#### Update (Modification)
- ✅ Activé
- **Filter** :
```json
{
  "user": {
    "_eq": "$CURRENT_USER"
  }
}
```
- **Fields** : Seulement `read` (pour marquer comme lu)

#### Create / Delete
- ❌ Désactivé (seuls les Flows peuvent créer)

## Vérification rapide

### Test manuel dans Directus

1. Va dans **Content** → **notifications**
2. Clique sur **Create Item** (+)
3. Remplis :
   - User : Sélectionne un utilisateur
   - Type : like
   - Meme ID : Un UUID de mème existant
   - From User ID : Un UUID d'utilisateur
   - From User Name : Un nom
   - Read : false

4. Sauvegarde

5. Connecte-toi en tant que l'utilisateur sélectionné
6. La notification devrait apparaître dans les 30 secondes ! 🎉

## Variables disponibles dans les Flows

Quand tu crées un Flow, tu as accès à :

```
$trigger.payload          → Les données de l'item créé/modifié
$accountability.user      → L'utilisateur qui effectue l'action
$trigger.payload.meme     → Si relation avec memes
```

### Exemples

```
{{$trigger.payload.id}}                    → ID de l'item déclenché
{{$trigger.payload.user_created}}          → ID de l'utilisateur créateur
{{$accountability.user.first_name}}        → Prénom de l'utilisateur actuel
{{$accountability.user.email}}             → Email de l'utilisateur actuel
{{$trigger.payload.meme.title}}            → Titre du mème (si relation)
{{$trigger.payload.meme.user_created}}     → Créateur du mème
```

## Debugging

### Voir les logs du Flow

1. Va dans **Settings** → **Flows**
2. Clique sur ton Flow
3. Clique sur **Logs** (en haut à droite)
4. Tu verras toutes les exécutions et les erreurs

### Tester le Flow manuellement

1. Dans l'édition du Flow
2. Clique sur **Run** (bouton play en haut)
3. Entre des données de test
4. Vérifie que la notification est créée

## Structure minimale recommandée

Si tu pars de zéro, voici la structure minimale :

```
Collections nécessaires:
├── directus_users (déjà présent)
├── memes
│   ├── id (UUID)
│   ├── title (String)
│   ├── image (Image)
│   └── user_created (Auto)
├── meme_likes
│   ├── id (UUID)
│   ├── user (M2O → directus_users)
│   ├── meme (M2O → memes)
│   └── date_created (Auto)
└── notifications (celle qu'on crée)
```

---

**💡 Astuce** : Teste d'abord avec une notification créée manuellement avant d'activer les Flows !
