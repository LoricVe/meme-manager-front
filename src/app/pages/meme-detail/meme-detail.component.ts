import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MemeService } from '../../shared/services/meme.service';
import { LikeService } from '../../shared/services/like.service';
import { AuthService } from '../../shared/services/auth.service';
import { DirectusService } from '../../shared/services/directus.service';
import { Meme } from '../../shared/interfaces/meme';
import { User } from '../../shared/interfaces/user';

@Component({
  selector: 'app-meme-detail',
  standalone: false,
  templateUrl: './meme-detail.component.html',
  styleUrl: './meme-detail.component.scss'
})
export class MemeDetailComponent implements OnInit {
  meme: Meme | null = null;
  isLoading = true;
  error = '';
  currentUser: User | null = null;
  isLiked = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private memeService: MemeService,
    private likeService: LikeService,
    private authService: AuthService,
    private directusService: DirectusService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    this.route.params.subscribe(params => {
      const memeId = params['id'];
      if (memeId) {
        this.loadMeme(memeId);
        this.incrementViews(memeId);
        if (this.currentUser) {
          this.checkIfLiked(memeId);
        }
      }
    });
  }

  private loadMeme(id: string): void {
    this.isLoading = true;
    this.error = '';

    this.memeService.getMemeObservable(id).subscribe({
      next: (meme) => {
        this.meme = meme;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Meme introuvable';
        this.isLoading = false;
        console.error('Erreur:', error);
      }
    });
  }

  private incrementViews(memeId: string): void {
    this.memeService.incrementViewsObservable(memeId).subscribe({
      next: () => {
        if (this.meme) {
          this.meme.views++;
        }
      },
      error: (error) => console.error('Erreur vues:', error)
    });
  }

  private checkIfLiked(memeId: string): void {
    this.isLiked = this.likeService.isLiked(memeId);
  }

  getImageUrl(fileId: string): string {
    return this.directusService.getAssetUrl(fileId, 'fit=contain&width=800&quality=90');
  }

  getUserName(): string {
    if (!this.meme) return '';
    const user = this.meme.user_created;
    if (typeof user === 'object' && user) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Utilisateur anonyme';
    }
    return 'Utilisateur anonyme';
  }

  getUserAvatar(): string | null {
    if (!this.meme) return null;
    const user = this.meme.user_created;
    if (typeof user === 'object' && user && user.avatar) {
      return `${window.location.origin}/api/assets/${user.avatar}?fit=cover&width=80&height=80`;
    }
    return null;
  }

  getUserInitials(): string {
    if (!this.meme) return '?';
    const user = this.meme.user_created;
    if (typeof user === 'object' && user) {
      const firstName = user.first_name || '';
      const lastName = user.last_name || '';

      if (firstName && lastName) {
        return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
      } else if (firstName) {
        return firstName.charAt(0).toUpperCase();
      } else if (user.email) {
        return user.email.charAt(0).toUpperCase();
      }
    }
    return '?';
  }

  onLike(): void {
    if (!this.meme || !this.currentUser) return;

    this.likeService.toggleLike(this.meme.id).subscribe({
      next: (result) => {
        this.isLiked = result.isLiked;
        // Mettre à jour le compteur de likes avec la vraie valeur depuis Directus
        if (this.meme) {
          this.meme.likes = result.newLikesCount;
        }
      },
      error: (error) => {
        console.error('Erreur lors du like:', error);
      }
    });
  }

  canEditMeme(): boolean {
    if (!this.meme || !this.currentUser) return false;

    const creatorId = typeof this.meme.user_created === 'string'
      ? this.meme.user_created
      : this.meme.user_created.id;

    return creatorId === this.currentUser.id;
  }

  onEdit(): void {
    if (this.meme) {
      this.router.navigate(['/edit-meme', this.meme.id]);
    }
  }

  onDelete(): void {
    if (!this.meme) return;

    if (confirm('Êtes-vous sûr de vouloir supprimer ce meme ?')) {
      this.memeService.deleteMemeObservable(this.meme.id).subscribe({
        next: () => {
          this.router.navigate(['/gallery']);
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          alert('Erreur lors de la suppression du meme');
        }
      });
    }
  }

  shareUrl(): void {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: this.meme?.title,
        url: url
      }).catch(err => console.log('Erreur de partage:', err));
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert('Lien copié dans le presse-papier !');
      });
    }
  }

  getRelativeTime(date: string): string {
    const now = new Date();
    const memeDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - memeDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minute(s)`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} heure(s)`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} jour(s)`;

    return memeDate.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  goBack(): void {
    this.router.navigate(['/gallery']);
  }
}
