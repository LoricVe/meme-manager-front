import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { Tag } from '../../interfaces/tag';

@Component({
  selector: 'app-search-bar',
  standalone: false,
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.css'
})
export class SearchBar implements OnInit {
  @Output() searchChanged = new EventEmitter<string>();
  @Output() tagsChanged = new EventEmitter<string[]>();

  searchControl = new FormControl('');
  availableTags: Tag[] = [];
  selectedTags: Tag[] = [];
  showTagDropdown = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    // Debounce pour la recherche
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.searchChanged.emit(value || '');
    });

    this.loadTags();
  }

  private async loadTags(): Promise<void> {
    try {
      const response = await this.apiService.requestApi('/items/tags', 'GET', {
        limit: -1,
        sort: 'name'
      });
      this.availableTags = response.data;
    } catch (error) {
      console.error('Erreur chargement tags:', error);
    }
  }

  toggleTagDropdown(): void {
    this.showTagDropdown = !this.showTagDropdown;
  }

  onTagSelect(tag: Tag): void {
    const index = this.selectedTags.findIndex(t => t.id === tag.id);
    if (index === -1) {
      this.selectedTags.push(tag);
      this.emitSelectedTags();
    }
  }

  onTagRemove(tag: Tag): void {
    const index = this.selectedTags.findIndex(t => t.id === tag.id);
    if (index > -1) {
      this.selectedTags.splice(index, 1);
      this.emitSelectedTags();
    }
  }

  isTagSelected(tag: Tag): boolean {
    return this.selectedTags.some(t => t.id === tag.id);
  }

  private emitSelectedTags(): void {
    this.tagsChanged.emit(this.selectedTags.map(t => t.id));
  }

  clearAll(): void {
    this.searchControl.setValue('');
    this.selectedTags = [];
    this.searchChanged.emit('');
    this.tagsChanged.emit([]);
  }
}
