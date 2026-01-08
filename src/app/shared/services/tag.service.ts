import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Tag } from '../interfaces/tag';

@Injectable({
  providedIn: 'root'
})
export class TagService {
  constructor(private apiService: ApiService) {}

  /**
   * Récupère tous les tags
   */
  async getTags(): Promise<Tag[]> {
    try {
      const response = await this.apiService.requestApi('/items/tags', 'GET', {
        limit: -1,
        sort: 'name'
      });
      return response.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des tags:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau tag
   */
  async createTag(name: string): Promise<Tag> {
    try {
      // Nettoyer le nom (enlever espaces, mettre en minuscule)
      const cleanName = name.trim().toLowerCase();

      if (!cleanName) {
        throw new Error('Le nom du tag ne peut pas être vide');
      }

      // Vérifier si le tag existe déjà
      const existingTags = await this.getTags();
      const existingTag = existingTags.find(t => t.name.toLowerCase() === cleanName);

      if (existingTag) {
        // Retourner le tag existant au lieu d'en créer un nouveau
        return existingTag;
      }

      // Créer le nouveau tag
      const response = await this.apiService.requestApi('/items/tags', 'POST', {
        name: cleanName
      });

      return response.data || response;
    } catch (error) {
      console.error('Erreur lors de la création du tag:', error);
      throw error;
    }
  }

  /**
   * Recherche des tags par nom
   */
  async searchTags(query: string): Promise<Tag[]> {
    try {
      if (!query || query.trim().length === 0) {
        return this.getTags();
      }

      const response = await this.apiService.requestApi('/items/tags', 'GET', {
        filter: {
          name: {
            _contains: query.toLowerCase()
          }
        },
        limit: 20,
        sort: 'name'
      });

      return response.data || [];
    } catch (error) {
      console.error('Erreur lors de la recherche de tags:', error);
      return [];
    }
  }

  /**
   * Supprime un tag
   */
  async deleteTag(id: string): Promise<void> {
    try {
      await this.apiService.requestApi(`/items/tags/${id}`, 'DELETE');
    } catch (error) {
      console.error('Erreur lors de la suppression du tag:', error);
      throw error;
    }
  }
}
