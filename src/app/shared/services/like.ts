import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class Like {

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) { }

  toggleLike(memeId: string): Observable<boolean> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    return new Observable(observer => {
      // Vérifier si déjà liké
      this.isLiked(memeId).subscribe({
        next: (isLiked) => {
          if (isLiked) {
            // Supprimer le like
            this.removeLike(memeId).subscribe({
              next: () => {
                observer.next(false);
                observer.complete();
              },
              error: (error) => observer.error(error)
            });
          } else {
            // Ajouter le like
            this.addLike(memeId).subscribe({
              next: () => {
                observer.next(true);
                observer.complete();
              },
              error: (error) => observer.error(error)
            });
          }
        },
        error: (error) => observer.error(error)
      });
    });
  }

  private addLike(memeId: string): Observable<any> {
    return new Observable(observer => {
      this.apiService.requestApi('/items/memes_likes', 'POST', {
        meme_id: memeId,
        user_id: this.authService.getCurrentUser()?.id
      })
        .then(response => {
          observer.next(response);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  private removeLike(memeId: string): Observable<any> {
    const userId = this.authService.getCurrentUser()?.id;
    const params = {
      'filter[meme_id][_eq]': memeId,
      'filter[user_id][_eq]': userId
    };

    return new Observable(observer => {
      this.apiService.requestApi('/items/memes_likes', 'GET', params)
        .then((response: any) => {
          if (response.data && response.data.length > 0) {
            const likeId = response.data[0].id;
            this.apiService.requestApi(`/items/memes_likes/${likeId}`, 'DELETE')
              .then(() => {
                observer.next(true);
                observer.complete();
              })
              .catch(error => observer.error(error));
          } else {
            observer.next(false);
            observer.complete();
          }
        })
        .catch(error => observer.error(error));
    });
  }

  isLiked(memeId: string): Observable<boolean> {
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) {
      return new Observable(observer => {
        observer.next(false);
        observer.complete();
      });
    }

    const params = {
      'filter[meme_id][_eq]': memeId,
      'filter[user_id][_eq]': userId
    };

    return new Observable(observer => {
      this.apiService.requestApi('/items/memes_likes', 'GET', params)
        .then((response: any) => {
          observer.next(response.data && response.data.length > 0);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  getLikesCount(memeId: string): Observable<number> {
    const params = {
      'filter[meme_id][_eq]': memeId,
      'aggregate[count]': '*'
    };

    return new Observable(observer => {
      this.apiService.requestApi('/items/memes_likes', 'GET', params)
        .then((response: any) => {
          observer.next(response.data?.length || 0);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }
}
