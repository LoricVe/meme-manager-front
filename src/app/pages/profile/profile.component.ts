import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../shared/services/auth.service';
import { User } from '../../shared/interfaces/user';
import { ApiService } from '../../shared/services/api.service';

interface UserStats {
  totalMemes: number;
  totalLikes: number;
  totalViews: number;
  memberSince: string;
}

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  stats: UserStats = {
    totalMemes: 0,
    totalLikes: 0,
    totalViews: 0,
    memberSince: ''
  };
  isLoading = true;
  userInitials = '';
  avatarUrl = '';
  isUploadingAvatar = false;
  showAvatarModal = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.loadUserProfile();
    await this.loadUserStats();
  }

  async loadUserProfile() {
    // Récupérer d'abord l'utilisateur du localStorage
    let localUser = this.authService.getCurrentUser();
    console.log('📋 Données utilisateur depuis localStorage:', localUser);

    if (!localUser) {
      console.error('Aucun utilisateur trouvé');
      return;
    }

    try {
      // Récupérer les données complètes depuis l'API Directus
      const userResponse = await this.apiService.requestApi('/users/me', 'GET');
      const userData = userResponse.data || userResponse;
      console.log('�� Données utilisateur depuis API:', userData);

      // Créer l'objet User complet
      this.user = {
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        avatar: userData.avatar,
        date_created: userData.date_created,
        date_updated: userData.date_updated,
        last_access: userData.last_access
      };

      // Mettre à jour le localStorage avec les données complètes
      localStorage.setItem('directus_user', JSON.stringify(this.user));

      this.userInitials = this.getInitials(this.user.first_name || this.user.email);
      if (this.user.avatar) {
        this.avatarUrl = `${window.location.origin}/api/assets/${this.user.avatar}`;
      }

      // Formatter la date d'inscription
      // Utiliser date_created si disponible, sinon last_access
      const dateString = this.user.date_created || this.user.last_access;

      if (dateString) {
        const date = new Date(dateString);
        // Vérifier si la date est valide
        if (!isNaN(date.getTime())) {
          this.stats.memberSince = date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } else {
          console.warn('Date invalide:', dateString);
          this.stats.memberSince = 'Date inconnue';
        }
      } else {
        console.warn('Aucune date trouvée pour l\'utilisateur');
        this.stats.memberSince = 'Date inconnue';
      }

      // Forcer la détection de changement
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      // Fallback sur les données locales
      this.user = localUser;
      this.userInitials = this.getInitials(localUser.first_name || localUser.email);
      this.stats.memberSince = 'Date inconnue';
      this.cdr.detectChanges();
    }
  }

  async loadUserStats() {
    if (!this.user) return;

    try {
      // Récupérer les memes de l'utilisateur
      const memesResponse = await this.apiService.requestApi(
        `/items/memes?filter[user_created][_eq]=${this.user.id}`,
        'GET'
      );
      const userMemes = memesResponse.data || [];
      this.stats.totalMemes = userMemes.length;

      // Calculer le total de likes et vues directement depuis les memes
      let totalLikes = 0;
      let totalViews = 0;

      for (const meme of userMemes) {
        // Les likes sont stockés directement dans le champ 'likes' du meme
        totalLikes += meme.likes || 0;
        // Ajouter les vues (si vous avez ce champ dans vos memes)
        totalViews += meme.views || 0;
      }

      this.stats.totalLikes = totalLikes;
      this.stats.totalViews = totalViews;

    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      this.isLoading = false;
      // Forcer la détection de changement après le chargement
      this.cdr.detectChanges();
    }
  }

  getInitials(name?: string): string {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getFullName(): string {
    if (!this.user) return 'Utilisateur';
    if (this.user.first_name && this.user.last_name) {
      return `${this.user.first_name} ${this.user.last_name}`;
    }
    return this.user.first_name || this.user.email || 'Utilisateur';
  }

  // Ouvrir la modal de changement d'avatar
  openAvatarModal() {
    this.showAvatarModal = true;
  }

  // Fermer la modal
  closeAvatarModal() {
    this.showAvatarModal = false;
    this.selectedFile = null;
    this.previewUrl = null;
  }

  // Gérer la sélection de fichier
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image valide');
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image ne doit pas dépasser 5MB');
        return;
      }

      this.selectedFile = file;

      // Créer une prévisualisation
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  // Upload de l'avatar
  async uploadAvatar() {
    if (!this.selectedFile) return;

    this.isUploadingAvatar = true;

    try {
      // 1. Upload du fichier vers Directus
      const uploadResponse = await this.apiService.uploadFile(this.selectedFile);
      const fileId = uploadResponse.data?.id || uploadResponse.id;

      if (!fileId) {
        throw new Error('Aucun ID de fichier reçu');
      }

      // 2. Mettre à jour l'avatar de l'utilisateur
      await this.authService.updateAvatar(fileId);

      // 3. Recharger le profil pour afficher le nouvel avatar
      await this.loadUserProfile();

      // 4. Fermer la modal
      this.closeAvatarModal();

      alert('Photo de profil mise à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'avatar:', error);
      alert('Erreur lors de la mise à jour de la photo de profil');
    } finally {
      this.isUploadingAvatar = false;
      this.cdr.detectChanges();
    }
  }

  // Supprimer l'avatar
  async removeAvatar() {
    if (!confirm('Voulez-vous vraiment supprimer votre photo de profil ?')) {
      return;
    }

    this.isUploadingAvatar = true;

    try {
      await this.authService.deleteAvatar();
      await this.loadUserProfile();
      this.closeAvatarModal();
      alert('Photo de profil supprimée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'avatar:', error);
      alert('Erreur lors de la suppression de la photo de profil');
    } finally {
      this.isUploadingAvatar = false;
      this.cdr.detectChanges();
    }
  }
}
