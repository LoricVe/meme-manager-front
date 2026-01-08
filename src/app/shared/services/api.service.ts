import { Injectable } from '@angular/core';
import { FormGroup } from "@angular/forms";
import { Observable } from "rxjs";
import { HttpClient, HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(
    private http: HttpClient,
  ) { }

  public async requestApi(action: string, method: string = 'GET', datas: any = {}, form?: FormGroup, httpOptions: any = {}): Promise<any> {
    const methodWanted = method.toLowerCase();
    let route = environment.directusUrl + action;

    // Définition de la variable de requête
    var req: Observable<any>;

    // Ajout du header si il n'existe pas, on demande du json
    if (httpOptions.headers === undefined) {
      const token = localStorage.getItem('directus_token');
      console.log('🔐 Token récupéré:', token?.substring(0, 20) + '...');

      const headers: any = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('✅ Header Authorization ajouté');
      } else {
        console.log('❌ Pas de token disponible');
      }

      httpOptions.headers = new HttpHeaders(headers);
    }

    // IMPORTANT: Toujours inclure les credentials (cookies) pour OAuth
    if (httpOptions.withCredentials === undefined) {
      httpOptions.withCredentials = true;
    }

    // Création de la requête en fonction de la méthode
    switch (methodWanted) {
      case 'post':
        req = this.http.post(route, datas, httpOptions);
        break;
      case 'patch':
        req = this.http.patch(route, datas, httpOptions);
        break;
      case 'put':
        req = this.http.put(route, datas, httpOptions);
        break;
      case 'delete':
        route = this.applyQueryParams(route, datas);
        req = this.http.delete(route, httpOptions);
        break;
      default:
        route = this.applyQueryParams(route, datas);
        req = this.http.get(route, httpOptions);
        break;
    }

    // Si le formulaire est passé en paramètre on le met en pending
    if(form) {
      form.markAsPending();
    }

    // On retourne une promesse
    return new Promise((resolve, reject) => {
      req.subscribe({
        // Si la requête est un succès
        next: (data) => {
          if (form) {
            form.enable();
            if(data.message) {
              this.setFormAlert(form, data.message, 'success');
            }
          }
          resolve(data);
          return data;
        },
        // Si la requête est un échec
        error : (error: HttpErrorResponse) => {
          console.log('Http Error : ', error);
          if(form) {
            form.enable();
            if (error.error.message) {
              this.setFormAlert(form, error.error.message, 'error');
              if(error.error.errors) {
                // On parcourt les erreurs pour les affecter aux champs du formulaire concernés
                Object.entries(error.error.errors).forEach((entry: [string, any]) => {
                  const [key, value] = entry;
                  const keys = key.split('.');
                  let control: any = form;
                  for (let j = 0; j < keys.length; j++) {
                    control = control.controls[keys[j]];
                  }
                  if(control) {
                    if(typeof value === 'string') {
                      control.setErrors({serverError: value});
                    } else {
                      for (let i = 0; i < value.length; i++) {
                        control.setErrors({serverError: value[i]});
                      }
                    }
                  }
                });
              }
            } else {
              this.setFormAlert(form, 'Une erreur est survenue', 'error');
            }
          }
          reject(error);
        }
      });
    });
  }

  // Upload de fichiers pour Directus
  public async uploadFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('directus_token');
    const httpOptions = {
      headers: new HttpHeaders({
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };

    return this.requestApi('/files', 'POST', formData, undefined, httpOptions);
  }

  // Obtenir l'URL d'un asset Directus
  public getAssetUrl(fileId: string, transforms?: string): string {
    const baseUrl = `${environment.directusAssetsUrl}/${fileId}`;
    return transforms ? `${baseUrl}?${transforms}` : baseUrl;
  }

  // Fonction utilitaire pour appliquer les paramètres de query
  private applyQueryParams(url: string, params: any): string {
    if (!params || Object.keys(params).length === 0) {
      return url;
    }

    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        queryParams.set(key, params[key].toString());
      }
    });

    return `${url}?${queryParams.toString()}`;
  }

  // Fonction utilitaire pour gérer les alertes de formulaire
  private setFormAlert(form: FormGroup, message: string, type: 'success' | 'error'): void {
    // Cette fonction peut être adaptée selon votre système d'alertes
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}