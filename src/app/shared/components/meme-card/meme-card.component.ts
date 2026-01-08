import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Meme } from '../../interfaces/meme';
import { User } from '../../interfaces/user';
import { DirectusService } from '../../services/directus.service';
import { AuthService } from '../../services/auth.service';
import { MemeService } from '../../services/meme.service';

@Component({
  selector: 'app-meme-card',
  standalone: false,
  templateUrl: './meme-card.component.html',
  styleUrl: './meme-card.component.scss'
})
export class MemeCardComponent {
  @Input() meme!: Meme;
  @Input() showActions = true;
  @Output() memeClicked = new EventEmitter<Meme>();
  @Output() memeDeleted = new EventEmitter<string>();

  currentUser: User | null = null;

  constructor(
    private directusService: DirectusService,
    private authService: AuthService,
    private memeService: MemeService,
    private router: Router
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  getImageUrl(fileId: string): string {
    return this.directusService.getAssetUrl(fileId, 'fit=cover&width=400&height=400&quality=80');
  }

  onMemeClick(): void {
    this.memeClicked.emit(this.meme);
  }

  getUserName(): string {
    const user = this.meme.user_created;
    if (typeof user === 'object' && user) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Utilisateur anonyme';
    }
    return 'Utilisateur anonyme';
  }

  getUserInitials(): string {
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

  getUserAvatarUrl(): string | null {
    const user = this.meme.user_created;
    if (typeof user === 'object' && user && user.avatar) {
      return `${window.location.origin}/api/assets/${user.avatar}`;
    }
    return null;
  }

  getRelativeTime(date: string): string {
    const now = new Date();
    const memeDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - memeDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}j`;

    return memeDate.toLocaleDateString('fr-FR');
  }

  canEditMeme(): boolean {
    if (!this.meme || !this.currentUser) return false;

    const creatorId = typeof this.meme.user_created === 'string'
      ? this.meme.user_created
      : this.meme.user_created.id;

    return creatorId === this.currentUser.id;
  }

  onEdit(event: Event): void {
    event.stopPropagation(); // Empêcher le clic sur la carte
    this.router.navigate(['/edit-meme', this.meme.id]);
  }

  onDelete(event: Event): void {
    event.stopPropagation(); // Empêcher le clic sur la carte

    if (confirm('Êtes-vous sûr de vouloir supprimer ce meme ?')) {
      this.memeService.deleteMemeObservable(this.meme.id).subscribe({
        next: () => {
          this.memeDeleted.emit(this.meme.id);
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          alert('Erreur lors de la suppression du meme');
        }
      });
    }
  }
}