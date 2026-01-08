import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MemeService } from '../../shared/services/meme.service';
import { Meme } from '../../shared/interfaces/meme';
import { NotificationService } from '../../shared/services/notification.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-meme-gallery',
  standalone: false,
  templateUrl: './meme-gallery.component.html',
  styleUrl: './meme-gallery.component.scss'
})
export class MemeGalleryComponent implements OnInit {
  memes: Meme[] = [];
  isLoading = true;
  error = '';
  searchTerm = '';
  selectedTags: string[] = [];
  isAuthenticated = false;

  // Pagination
  currentPage = 1;
  totalPages = 1;
  hasMore = true;

  constructor(
    private memeService: MemeService,
    private router: Router,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
    });
    this.loadMemes();
  }

  loadMemes(reset = false): void {
    if (reset) {
      this.currentPage = 1;
      this.memes = [];
    }

    this.isLoading = true;
    this.error = '';

    this.memeService.getMemes(this.currentPage, 12, this.searchTerm, this.selectedTags)
      .subscribe({
        next: (response) => {
          if (reset) {
            this.memes = response.data;
          } else {
            this.memes = [...this.memes, ...response.data];
          }

          this.totalPages = Math.ceil((response.meta?.filter_count || response.meta?.total_count || 0) / (response.meta?.limit || 12));
          this.hasMore = this.currentPage < this.totalPages;
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors du chargement des memes';
          this.isLoading = false;
          console.error('Erreur:', error);
          this.notificationService.error(
            'Erreur de chargement',
            'Impossible de charger les mèmes'
          );
        }
      });
  }

  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.loadMemes(true);
  }

  onTagsChanged(tags: string[]): void {
    this.selectedTags = tags;
    this.loadMemes(true);
  }

  onMemeClicked(meme: Meme): void {
    this.router.navigate(['/meme', meme.id]);
  }

  onMemeDeleted(memeId: string): void {
    // Retirer le mème de la liste
    this.memes = this.memes.filter(m => m.id !== memeId);
    this.notificationService.success(
      'Mème supprimé',
      'Le mème a été supprimé avec succès'
    );
  }

  loadMore(): void {
    if (this.hasMore && !this.isLoading) {
      this.currentPage++;
      this.loadMemes();
    }
  }

  trackByMemeId(index: number, meme: Meme): string {
    return meme.id;
  }
}
