import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DirectusService {

  constructor() {}

  // Obtenir l'URL d'un asset Directus avec transformations
  getAssetUrl(fileId: string, transforms?: string): string {
    const baseUrl = `${environment.directusAssetsUrl}/${fileId}`;
    return transforms ? `${baseUrl}?${transforms}` : baseUrl;
  }
}
