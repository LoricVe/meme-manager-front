import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TagService } from '../../../shared/services/tag.service';
import { AuthService } from '../../../shared/services/auth.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { Tag } from '../../../shared/interfaces/tag';

@Component({
  selector: 'app-admin-tags',
  standalone: false,
  templateUrl: './admin-tags.html',
  styleUrl: './admin-tags.css'
})
export class AdminTagsComponent implements OnInit {
  tags: Tag[] = [];
  filteredTags: Tag[] = [];
  isLoading = true;
  searchTerm = '';
  newTagName = '';
  isCreating = false;

  constructor(
    private tagService: TagService,
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

    this.loadTags();
  }

  async loadTags(): Promise<void> {
    this.isLoading = true;
    try {
      this.tags = await this.tagService.getTags();
      this.filteredTags = [...this.tags];
    } catch (error) {
      console.error('Erreur chargement tags:', error);
      this.notificationService.error('Erreur', 'Impossible de charger les tags');
    } finally {
      this.isLoading = false;
    }
  }

  onSearch(term: string): void {
    this.searchTerm = term.toLowerCase();
    if (!this.searchTerm) {
      this.filteredTags = [...this.tags];
    } else {
      this.filteredTags = this.tags.filter(tag =>
        tag.name.toLowerCase().includes(this.searchTerm)
      );
    }
  }

  async createTag(): Promise<void> {
    if (!this.newTagName.trim()) {
      this.notificationService.warning('Attention', 'Le nom du tag ne peut pas être vide');
      return;
    }

    this.isCreating = true;
    try {
      const tag = await this.tagService.createTag(this.newTagName);
      this.tags.push(tag);
      this.tags.sort((a, b) => a.name.localeCompare(b.name));
      this.filteredTags = [...this.tags];
      this.newTagName = '';
      this.notificationService.success('Tag créé', `Le tag "#${tag.name}" a été créé`);
    } catch (error) {
      console.error('Erreur création tag:', error);
      this.notificationService.error('Erreur', 'Impossible de créer le tag');
    } finally {
      this.isCreating = false;
    }
  }

  async deleteTag(tag: Tag): Promise<void> {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le tag "#${tag.name}" ?`)) {
      return;
    }

    try {
      await this.tagService.deleteTag(tag.id);
      this.tags = this.tags.filter(t => t.id !== tag.id);
      this.filteredTags = this.filteredTags.filter(t => t.id !== tag.id);
      this.notificationService.success('Tag supprimé', `Le tag "#${tag.name}" a été supprimé`);
    } catch (error) {
      console.error('Erreur suppression tag:', error);
      this.notificationService.error('Erreur', 'Impossible de supprimer le tag');
    }
  }

  trackByTagId(_index: number, tag: Tag): string {
    return tag.id;
  }
}
