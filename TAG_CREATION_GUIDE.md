# 🏷️ Guide - Création de Tags

## ✨ Nouvelle fonctionnalité

Les utilisateurs peuvent maintenant **créer leurs propres tags** directement depuis la page de création/édition de mème !

## 🎯 Comment ça marche

### 1. Créer un tag

Quand tu crées ou édites un mème :

1. Clique sur le bouton **"+ Créer un tag"** (en haut à droite de la section Tags)
2. Un formulaire s'affiche avec un champ de saisie
3. Entre le nom du tag (ex: "humour", "drôle", "meme")
4. Appuie sur **Entrée** ou clique sur le bouton **✓**
5. Le tag est créé et automatiquement ajouté à ton mème !

### 2. Fonctionnalités intelligentes

- ✅ **Pas de doublons** : Si le tag existe déjà, il est réutilisé
- ✅ **Auto-ajout** : Le nouveau tag est automatiquement sélectionné
- ✅ **Nettoyage** : Les espaces sont enlevés et le texte est en minuscules
- ✅ **Notifications** : Tu reçois une confirmation quand le tag est créé
- ✅ **Validation** : Impossible de créer un tag vide

## 🎨 Interface

### Bouton de création
```
┌──────────────────────────────────┐
│ Tags              [+ Créer un tag]│
└──────────────────────────────────┘
```

### Formulaire de création
```
┌────────────────────────────────────────┐
│ Nouveau tag                            │
│ ┌────────────────────┬───┬───┐        │
│ │ Ex: humour...      │ ✓ │ ✕ │        │
│ └────────────────────┴───┴───┘        │
│ 💡 Le tag sera créé et automatiquement│
│    ajouté à votre mème                │
└────────────────────────────────────────┘
```

## 💡 Exemples d'utilisation

### Créer un tag "viral"

1. Clique sur "Créer un tag"
2. Tape "viral"
3. Appuie sur Entrée
4. ✅ Tag créé et ajouté !

### Créer plusieurs tags

1. Crée "humour" → OK
2. Crée "drôle" → OK
3. Crée "meme" → OK
4. Tous sont ajoutés à ton mème

### Tag déjà existant

1. Tape "humour"
2. Le tag existe déjà
3. ✅ Il est simplement ajouté (pas de doublon créé)

## 🔧 Backend (Directus)

### Permissions requises

Pour que les utilisateurs puissent créer des tags, configure les permissions dans Directus :

1. **Settings** → **Roles & Permissions**
2. Sélectionne le rôle "User"
3. Collection **tags** :
   - ✅ **Create** (Activé)
   - ✅ **Read** (Activé)

### Structure de la collection tags

```
Collection: tags
├── id (UUID, auto)
├── name (String, unique)
├── date_created (Timestamp, auto)
└── date_updated (Timestamp, auto)
```

### Validation Directus (optionnel)

Pour éviter les doublons au niveau base de données :

1. Va dans **Settings** → **Data Model** → **tags**
2. Clique sur le champ **name**
3. Active **Unique** ✅

## 🎯 Service TagService

Le nouveau service `TagService` gère :

- `getTags()` - Récupère tous les tags
- `createTag(name)` - Crée un nouveau tag (ou retourne l'existant)
- `searchTags(query)` - Recherche de tags
- `deleteTag(id)` - Supprime un tag

### Exemple d'utilisation

```typescript
import { TagService } from './shared/services/tag.service';

constructor(private tagService: TagService) {}

async createMyTag() {
  const tag = await this.tagService.createTag('nouveau-tag');
  console.log('Tag créé:', tag);
}
```

## 📱 UX/UI

### États du bouton

- **Normal** : Bouton bleu "Créer un tag"
- **Ouvert** : Formulaire affiché
- **Création** : Spinner pendant la création
- **Succès** : Notification verte + tag ajouté

### Raccourcis clavier

- **Entrée** : Créer le tag
- **Échap** : Fermer le formulaire (si implémenté)

## 🚀 Améliorations futures possibles

- [ ] Recherche en temps réel des tags existants
- [ ] Suggestions de tags populaires
- [ ] Couleurs personnalisées pour les tags
- [ ] Catégories de tags
- [ ] Limite du nombre de tags par mème
- [ ] Analytics : tags les plus utilisés

## 🐛 Gestion des erreurs

### Tag vide
```
⚠️ Warning: Le nom du tag ne peut pas être vide
```

### Erreur serveur
```
❌ Error: Impossible de créer le tag
```

### Succès
```
✅ Success: Le tag "#humour" a été créé avec succès
```

## 📊 Workflow complet

```
User clique "Créer un tag"
    ↓
Formulaire s'affiche
    ↓
User tape "viral" + Entrée
    ↓
TagService.createTag("viral")
    ↓
Vérifie si existe déjà
    ↓
Crée dans Directus ou retourne existant
    ↓
Ajoute à availableTags
    ↓
Sélectionne automatiquement
    ↓
Notification de succès
    ↓
Formulaire se ferme
```

## ✅ Checklist de configuration

- [x] TagService créé
- [x] Composant create-meme modifié
- [x] UI de création ajoutée
- [x] Notifications intégrées
- [x] FormsModule importé
- [ ] Permissions Directus configurées (à faire par toi)

---

**C'est prêt à utiliser !** Les utilisateurs peuvent maintenant créer leurs propres tags en temps réel 🎉
