import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MemeService } from '../../shared/services/meme.service';
import { ApiService } from '../../shared/services/api.service';
import { TagService } from '../../shared/services/tag.service';
import { NotificationService } from '../../shared/services/notification.service';
import { Tag } from '../../shared/interfaces/tag';

@Component({
  selector: 'app-create-meme',
  standalone: false,
  templateUrl: './create-meme.html',
  styleUrl: './create-meme.css'
})
export class CreateMeme implements OnInit {
  memeForm!: FormGroup;
  isLoading = false;
  error = '';
  selectedFile: File | null = null;
  availableTags: Tag[] = [];
  selectedTags: Tag[] = [];
  isEditMode = false;
  memeId: string | null = null;

  // Nouveaux champs pour la création de tags
  newTagName = '';
  isCreatingTag = false;
  showTagInput = false;

  constructor(
    private fb: FormBuilder,
    private memeService: MemeService,
    private apiService: ApiService,
    private tagService: TagService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadTags();

    // Vérifier si mode édition
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.isEditMode = true;
        this.memeId = id;
        this.loadMemeForEdit(id);
      }
    });
  }

  private initForm(): void {
    this.memeForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      status: ['published', Validators.required]
    });
  }

  private async loadTags(): Promise<void> {
    try {
      this.availableTags = await this.tagService.getTags();
    } catch (error) {
      console.error('Erreur chargement tags:', error);
      this.notificationService.error('Erreur', 'Impossible de charger les tags');
    }
  }

  private async loadMemeForEdit(id: string): Promise<void> {
    try {
      const meme = await this.memeService.getMeme(id);
      this.memeForm.patchValue({
        title: meme.title,
        status: meme.status
      });

      // Charger les tags sélectionnés
      if (meme.tags) {
        this.selectedTags = meme.tags
          .map((t: any) => typeof t.tags_id === 'object' ? t.tags_id : null)
          .filter((t: any) => t !== null) as Tag[];
      }
    } catch (error) {
      this.error = 'Meme introuvable';
      console.error('Erreur:', error);
    }
  }

  onFileSelected(file: File): void {
    this.selectedFile = file;
  }

  onFileError(error: string): void {
    this.error = error;
  }

  onTagToggle(tag: Tag): void {
    const index = this.selectedTags.findIndex(t => t.id === tag.id);
    if (index > -1) {
      this.selectedTags.splice(index, 1);
    } else {
      this.selectedTags.push(tag);
    }
  }

  isTagSelected(tag: Tag): boolean {
    return this.selectedTags.some(t => t.id === tag.id);
  }

  onSubmit(): void {
    if (!this.memeForm.valid) return;

    if (!this.isEditMode && !this.selectedFile) {
      this.error = 'Veuillez sélectionner une image';
      return;
    }

    this.isLoading = true;
    this.error = '';

    const formData = {
      title: this.memeForm.value.title,
      status: this.memeForm.value.status,
      tags: this.selectedTags.map(t => t.id)
    };

    if (this.isEditMode && this.memeId) {
      // Mode édition
      this.updateMeme(this.memeId, formData);
    } else {
      // Mode création
      const createData = {
        ...formData,
        image: this.selectedFile!
      };
      this.createMeme(createData);
    }
  }

  private async createMeme(data: any): Promise<void> {
    try {
      const meme = await this.memeService.createMeme(data);
      this.router.navigate(['/meme', meme.id]);
    } catch (error) {
      this.error = 'Erreur lors de la création du meme';
      this.isLoading = false;
      console.error('Erreur:', error);
    }
  }

  private async updateMeme(id: string, data: any): Promise<void> {
    try {
      // Mettre à jour avec titre + tags (SANS le status qui pose problème)
      const updateData: any = {
        title: data.title
      };

      // Ajouter les tags au bon format si présents
      if (data.tags && data.tags.length > 0) {
        updateData.tags = data.tags.map((tagId: string) => ({ tags_id: tagId }));
      }

      console.log('🔍 Données envoyées pour la mise à jour:', updateData);

      const meme = await this.memeService.updateMeme(id, updateData);
      this.router.navigate(['/meme', meme.id]);
    } catch (error) {
      this.error = 'Erreur lors de la mise à jour du meme';
      this.isLoading = false;
      console.error('Erreur:', error);
    }
  }

  cancel(): void {
    this.router.navigate(['/gallery']);
  }

  /**
   * Afficher/masquer le champ de création de tag
   */
  toggleTagInput(): void {
    this.showTagInput = !this.showTagInput;
    if (!this.showTagInput) {
      this.newTagName = '';
    }
  }

  /**
   * Créer un nouveau tag
   */
  async createNewTag(): Promise<void> {
    if (!this.newTagName.trim()) {
      this.notificationService.warning('Attention', 'Le nom du tag ne peut pas être vide');
      return;
    }

    this.isCreatingTag = true;

    try {
      const newTag = await this.tagService.createTag(this.newTagName);

      // Vérifier si le tag existe déjà dans la liste
      const exists = this.availableTags.find(t => t.id === newTag.id);
      if (!exists) {
        this.availableTags.push(newTag);
        this.availableTags.sort((a, b) => a.name.localeCompare(b.name));
      }

      // Sélectionner automatiquement le nouveau tag
      if (!this.isTagSelected(newTag)) {
        this.selectedTags.push(newTag);
      }

      // Réinitialiser
      this.newTagName = '';
      this.showTagInput = false;

      this.notificationService.success('Tag créé', `Le tag "#${newTag.name}" a été créé avec succès`);
    } catch (error: any) {
      console.error('Erreur création tag:', error);
      this.notificationService.error('Erreur', 'Impossible de créer le tag');
    } finally {
      this.isCreatingTag = false;
    }
  }

  /**
   * Recherche de tags en temps réel
   */
  async onTagSearch(query: string): Promise<void> {
    if (!query || query.trim().length === 0) {
      await this.loadTags();
      return;
    }

    try {
      this.availableTags = await this.tagService.searchTags(query);
    } catch (error) {
      console.error('Erreur recherche tags:', error);
    }
  }
}
