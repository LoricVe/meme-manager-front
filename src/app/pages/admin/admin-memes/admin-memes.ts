import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MemeService } from '../../../shared/services/meme.service';
import { AuthService } from '../../../shared/services/auth.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Meme } from '../../../shared/interfaces/meme';

@Component({
  selector: 'app-admin-memes',
  standalone: false,
  templateUrl: './admin-memes.html',
  styleUrl: './admin-memes.css'
})
export class AdminMemesComponent implements OnInit {
  memes: Meme[] = [];
  isLoading = true;
  searchTerm = '';
  currentPage = 1;
  totalPages = 1;
  hasMore = true;

  constructor(
    private memeService: MemeService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Vérifier les droits admin
    if (!this.authService.isAdmin()) {
      this.notificationService.error('Accès refusé', 'Vous devez être administrateur');
      this.router.navigate(['/gallery']);
      return;
    }

    this.loadMemes();
  }

  loadMemes(reset = false): void {
    if (reset) {
      this.currentPage = 1;
      this.memes = [];
    }

    this.isLoading = true;

    this.memeService.getMemes(this.currentPage, 20, this.searchTerm, [])
      .subscribe({
        next: (response) => {
          if (reset) {
            this.memes = response.data;
          } else {
            this.memes = [...this.memes, ...response.data];
          }

          this.totalPages = Math.ceil((response.meta?.filter_count || response.meta?.total_count || 0) / 20);
          this.hasMore = this.currentPage < this.totalPages;
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Erreur:', error);
          this.notificationService.error('Erreur', 'Impossible de charger les mèmes');
        }
      });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.loadMemes(true);
  }

  async deleteMeme(meme: Meme): Promise<void> {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le mème "${meme.title}" ?`)) {
      return;
    }

    try {
      await this.memeService.deleteMeme(meme.id);
      this.memes = this.memes.filter(m => m.id !== meme.id);
      this.notificationService.success('Mème supprimé', `Le mème "${meme.title}" a été supprimé`);
    } catch (error) {
      console.error('Erreur suppression:', error);
      this.notificationService.error('Erreur', 'Impossible de supprimer le mème');
    }
  }

  viewMeme(meme: Meme): void {
    this.router.navigate(['/meme', meme.id]);
  }

  loadMore(): void {
    if (this.hasMore && !this.isLoading) {
      this.currentPage++;
      this.loadMemes();
    }
  }

  getAuthorName(user: any): string {
    if (typeof user === 'string') return 'Utilisateur inconnu';
    return `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email || 'Utilisateur inconnu';
  }

  trackByMemeId(index: number, meme: Meme): string {
    return meme.id;
  }
}
