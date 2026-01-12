import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MemeService } from '../../shared/services/meme.service';
import { Meme } from '../../shared/interfaces/meme';
import { NotificationService } from '../../shared/services/notification.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-my-drafts',
  standalone: false,
  templateUrl: './my-drafts.html',
  styleUrl: './my-drafts.css'
})
export class MyDrafts implements OnInit {
  drafts: Meme[] = [];
  isLoading = true;
  error = '';

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
    this.loadDrafts();
  }

  loadDrafts(reset = false): void {
    if (reset) {
      this.currentPage = 1;
      this.drafts = [];
    }

    this.isLoading = true;
    this.error = '';

    this.memeService.getUserDrafts(this.currentPage, 12)
      .subscribe({
        next: (response) => {
          if (reset) {
            this.drafts = response.data;
          } else {
            this.drafts = [...this.drafts, ...response.data];
          }

          this.totalPages = Math.ceil((response.meta?.filter_count || response.meta?.total_count || 0) / (response.meta?.limit || 12));
          this.hasMore = this.currentPage < this.totalPages;
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors du chargement des brouillons';
          this.isLoading = false;
          console.error('Erreur:', error);
          this.notificationService.error(
            'Erreur de chargement',
            'Impossible de charger vos brouillons'
          );
        }
      });
  }

  onMemeClicked(meme: Meme): void {
    this.router.navigate(['/meme', meme.id]);
  }

  onMemeDeleted(memeId: string): void {
    this.drafts = this.drafts.filter(m => m.id !== memeId);
    this.notificationService.success(
      'Brouillon supprimé',
      'Le brouillon a été supprimé avec succès'
    );
  }

  onMemePublished(memeId: string): void {
    this.drafts = this.drafts.filter(m => m.id !== memeId);
    this.notificationService.success(
      'Brouillon publié',
      'Votre mème est maintenant visible par tous !'
    );
  }

  loadMore(): void {
    if (this.hasMore && !this.isLoading) {
      this.currentPage++;
      this.loadDrafts();
    }
  }

  trackByMemeId(index: number, meme: Meme): string {
    return meme.id;
  }
}
