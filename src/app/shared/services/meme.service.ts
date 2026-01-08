import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Meme, CreateMemeData } from '../interfaces/meme';

@Injectable({
  providedIn: 'root'
})
export class MemeService {

  constructor(private apiService: ApiService) { }

  getMemes(page: number = 1, limit: number = 12, search?: string, tags?: string[]): Observable<{data: Meme[], meta: any}> {
    let params: any = {
      limit,
      offset: (page - 1) * limit,
      fields: ['*', 'user_created.id', 'user_created.first_name', 'user_created.last_name', 'user_created.email', 'user_created.avatar', 'tags.tags_id.name'].join(','),
      sort: '-date_created'
    };

    // Filtre de recherche
    if (search) {
      params['filter[title][_contains]'] = search;
    }

    // Filtre par tags (utilise l'ID du tag)
    if (tags && tags.length > 0) {
      params['filter[tags][tags_id][_in]'] = tags.join(',');
    }

    return new Observable(observer => {
      this.apiService.requestApi('/items/memes', 'GET', params)
        .then(response => {
          observer.next(response);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  async getMemesAsync(page: number = 1, limit: number = 12, search?: string, tags?: string[]): Promise<{data: Meme[], meta: any}> {
    let params: any = {
      limit,
      offset: (page - 1) * limit,
      fields: ['*', 'user_created.id', 'user_created.first_name', 'user_created.last_name', 'user_created.email', 'user_created.avatar', 'tags.tags_id.name'].join(','),
      sort: '-date_created'
    };

    // Filtre de recherche
    if (search) {
      params['filter[title][_contains]'] = search;
    }

    // Filtre par tags (utilise l'ID du tag)
    if (tags && tags.length > 0) {
      params['filter[tags][tags_id][_in]'] = tags.join(',');
    }

    return await this.apiService.requestApi('/items/memes', 'GET', params);
  }

  getMemeObservable(id: string): Observable<Meme> {
    const params = {
      fields: ['*', 'user_created.id', 'user_created.first_name', 'user_created.last_name', 'user_created.avatar', 'tags.tags_id.*'].join(',')
    };

    return new Observable(observer => {
      this.apiService.requestApi(`/items/memes/${id}`, 'GET', params)
        .then(response => {
          observer.next(response.data);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  async getMeme(id: string): Promise<Meme> {
    const params = {
      fields: ['*', 'user_created.id', 'user_created.first_name', 'user_created.last_name', 'user_created.avatar', 'tags.tags_id.*'].join(',')
    };

    const response = await this.apiService.requestApi(`/items/memes/${id}`, 'GET', params);
    return response.data;
  }

  async createMeme(memeData: CreateMemeData): Promise<Meme> {
    try {
      // D'abord uploader l'image
      const formData = new FormData();
      formData.append('file', memeData.image);

      const uploadResponse = await this.apiService.requestApi('/files', 'POST', formData, undefined, {
        headers: {} // Laisser le navigateur définir le Content-Type pour FormData
      });

      // Puis créer le meme avec l'ID de l'image
      const memePayload = {
        title: memeData.title,
        image: uploadResponse.data.id,
        status: memeData.status || 'published',
        tags: memeData.tags?.map(tagId => ({ tags_id: tagId })) || []
      };

      const response = await this.apiService.requestApi('/items/memes', 'POST', memePayload);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du meme:', error);
      throw error;
    }
  }

  async updateMeme(id: string, data: Partial<Meme>): Promise<Meme> {
    const response = await this.apiService.requestApi(`/items/memes/${id}`, 'PATCH', data);
    return response.data;
  }

  deleteMemeObservable(id: string): Observable<void> {
    return new Observable(observer => {
      this.apiService.requestApi(`/items/memes/${id}`, 'DELETE')
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  async deleteMeme(id: string): Promise<void> {
    await this.apiService.requestApi(`/items/memes/${id}`, 'DELETE');
  }

  incrementViewsObservable(memeId: string): Observable<void> {
    return new Observable(observer => {
      // Récupérer d'abord le nombre de vues actuel
      this.apiService.requestApi(`/items/memes/${memeId}`, 'GET')
        .then(memeResponse => {
          const currentViews = memeResponse.data?.views || 0;
          // Incrémenter le compteur de vues
          return this.apiService.requestApi(`/items/memes/${memeId}`, 'PATCH', {
            views: currentViews + 1
          });
        })
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  async incrementViews(memeId: string): Promise<void> {
    // Récupérer d'abord le nombre de vues actuel
    const memeResponse = await this.apiService.requestApi(`/items/memes/${memeId}`, 'GET');
    const currentViews = memeResponse.data?.views || 0;

    // Incrémenter le compteur de vues
    await this.apiService.requestApi(`/items/memes/${memeId}`, 'PATCH', {
      views: currentViews + 1
    });
  }

  async getUserMemes(userId: string): Promise<Meme[]> {
    const params = {
      'filter[user_created][_eq]': userId,
      fields: ['*', 'tags.tags_id.name'].join(','),
      sort: '-date_created'
    };

    const response = await this.apiService.requestApi('/items/memes', 'GET', params);
    return response.data;
  }

  async getPopularMemes(limit: number = 10): Promise<Meme[]> {
    const params = {
      limit,
      fields: ['*', 'user_created.id', 'user_created.first_name', 'user_created.last_name', 'user_created.email', 'user_created.avatar'].join(','),
      sort: '-likes,-views'
    };

    const response = await this.apiService.requestApi('/items/memes', 'GET', params);
    return response.data;
  }

  // Vérifier si l'utilisateur a liké un meme
  // Pour simplifier, on stocke les likes localement dans le localStorage
  async checkIfLiked(memeId: string, userId: string): Promise<boolean> {
    try {
      const likedMemes = JSON.parse(localStorage.getItem('liked_memes') || '[]');
      return likedMemes.includes(memeId);
    } catch (error) {
      console.error('Erreur lors de la vérification du like:', error);
      return false;
    }
  }

  // Liker un meme (simple incrémentation)
  async likeMeme(memeId: string, userId: string): Promise<void> {
    try {
      const token = localStorage.getItem('directus_token');
      console.log('🔍 Tentative de like:', { memeId, userId });
      console.log('🔑 Token présent:', !!token);

      // Vérifier que l'utilisateur est connecté
      if (!token) {
        throw new Error('Token manquant - veuillez vous reconnecter');
      }

      // Récupérer le meme actuel pour obtenir le nombre de likes
      const memeResponse = await this.apiService.requestApi(`/items/memes/${memeId}`, 'GET');
      const currentLikes = memeResponse.data?.likes || 0;

      // Incrémenter le compteur de likes
      const updateResponse = await this.apiService.requestApi(`/items/memes/${memeId}`, 'PATCH', {
        likes: currentLikes + 1
      });
      console.log('✅ Compteur incrémenté:', updateResponse);
    } catch (error) {
      console.error('❌ Erreur lors du like:', error);
      throw error;
    }
  }

  // Unliker un meme (simple décrémentation)
  async unlikeMeme(memeId: string, userId: string): Promise<void> {
    try {
      console.log('🔍 Tentative de unlike:', { memeId, userId });

      // Récupérer le meme actuel pour obtenir le nombre de likes
      const memeResponse = await this.apiService.requestApi(`/items/memes/${memeId}`, 'GET');
      const currentLikes = memeResponse.data?.likes || 0;

      // Décrémenter le compteur de likes (minimum 0)
      const updateResponse = await this.apiService.requestApi(`/items/memes/${memeId}`, 'PATCH', {
        likes: Math.max(0, currentLikes - 1)
      });
      console.log('✅ Compteur décrémenté:', updateResponse);
    } catch (error) {
      console.error('❌ Erreur lors du unlike:', error);
      throw error;
    }
  }

  // Toggle like (like si pas liké, unlike si déjà liké)
  async toggleLike(memeId: string, userId: string): Promise<boolean> {
    // Vérifier si l'utilisateur est connecté
    if (!userId || !localStorage.getItem('directus_token')) {
      throw new Error('Vous devez être connecté pour liker un meme');
    }

    const isLiked = await this.checkIfLiked(memeId, userId);

    if (isLiked) {
      await this.unlikeMeme(memeId, userId);
      // Retirer du localStorage
      const likedMemes = JSON.parse(localStorage.getItem('liked_memes') || '[]');
      const updatedLikes = likedMemes.filter((id: string) => id !== memeId);
      localStorage.setItem('liked_memes', JSON.stringify(updatedLikes));
      return false; // N'est plus liké
    } else {
      await this.likeMeme(memeId, userId);
      // Ajouter au localStorage
      const likedMemes = JSON.parse(localStorage.getItem('liked_memes') || '[]');
      likedMemes.push(memeId);
      localStorage.setItem('liked_memes', JSON.stringify(likedMemes));
      return true; // Est maintenant liké
    }
  }
}