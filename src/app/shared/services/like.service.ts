import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class LikeService {
  private likedMemes: Set<string> = new Set();

  constructor(private apiService: ApiService) {
    this.loadLikedMemes();
  }

  private loadLikedMemes(): void {
    const stored = localStorage.getItem('liked_memes');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.likedMemes = new Set(parsed);
        console.log('📋 Likes chargés depuis localStorage:', [...this.likedMemes]);
      } catch (e) {
        console.error('Erreur parsing localStorage liked_memes:', e);
        this.likedMemes = new Set();
      }
    }
  }

  private saveLikedMemes(): void {
    const likesArray = [...this.likedMemes];
    localStorage.setItem('liked_memes', JSON.stringify(likesArray));
    console.log('💾 Likes sauvegardés dans localStorage:', likesArray);
  }

  isLiked(memeId: string): boolean {
    const liked = this.likedMemes.has(memeId);
    console.log(`❤️ isLiked(${memeId}):`, liked, 'Total likes:', this.likedMemes.size);
    return liked;
  }

  toggleLike(memeId: string): Observable<{isLiked: boolean, newLikesCount: number}> {
    const isCurrentlyLiked = this.isLiked(memeId);

    // Convertir la promesse en Observable
    return new Observable(observer => {
      // Récupérer d'abord le meme actuel
      this.apiService.requestApi(`/items/memes/${memeId}`, 'GET')
        .then(memeResponse => {
          const currentLikes = memeResponse.data?.likes || 0;

          // Incrémenter ou décrémenter selon l'état actuel
          const newLikes = isCurrentlyLiked
            ? Math.max(0, currentLikes - 1)
            : currentLikes + 1;

          // Mettre à jour le compteur dans Directus
          return this.apiService.requestApi(`/items/memes/${memeId}`, 'PATCH', {
            likes: newLikes
          });
        })
        .then((updateResponse) => {
          // Mettre à jour l'état local
          if (isCurrentlyLiked) {
            this.likedMemes.delete(memeId);
          } else {
            this.likedMemes.add(memeId);
          }
          this.saveLikedMemes();

          // Retourner l'état ET le nouveau compteur
          const newLikesCount = updateResponse.data?.likes || 0;
          observer.next({
            isLiked: !isCurrentlyLiked,
            newLikesCount: newLikesCount
          });
          observer.complete();
        })
        .catch(error => {
          console.error('Erreur lors du like/unlike:', error);
          observer.error(error);
        });
    });
  }

  getUserLikes(): Observable<string[]> {
    // Récupérer depuis le localStorage uniquement
    return of([...this.likedMemes]);
  }
}
