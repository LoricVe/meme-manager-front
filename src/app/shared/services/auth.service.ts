import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { User, AuthResponse, LoginData, RegisterData } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    this.checkAuthState();
  }

  private checkAuthState(): void {
    const token = this.getToken();
    const user = this.getCurrentUser();

    if (token && user) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  async login(credentials: LoginData): Promise<AuthResponse> {
    try {
      const response = await this.apiService.requestApi('/auth/login', 'POST', credentials);

      // Directus renvoie les données dans response.data
      const authData = response.data || response;

      // Sauvegarder d'abord les tokens
      localStorage.setItem('directus_token', authData.access_token);
      localStorage.setItem('directus_refresh_token', authData.refresh_token);

      // Récupérer les infos de l'utilisateur connecté
      const userResponse = await this.apiService.requestApi('/users/me', 'GET');
      const user = userResponse.data || userResponse;

      // Créer l'objet AuthResponse complet avec l'utilisateur
      const completeAuthData = {
        ...authData,
        user: user
      };

      this.handleAuthSuccess(completeAuthData);
      return completeAuthData;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      // Utilise l'endpoint d'inscription publique de Directus
      const response = await this.apiService.requestApi('/users/register', 'POST', userData);

      // L'inscription renvoie juste les données utilisateur sans token
      // Il faut se connecter ensuite avec les credentials
      if (response?.data) {
        // Se connecter automatiquement avec les mêmes credentials
        const loginResponse = await this.login({
          email: userData.email,
          password: userData.password
        });
        return loginResponse;
      }

      return response;
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem('directus_token');
    localStorage.removeItem('directus_refresh_token');
    localStorage.removeItem('directus_user');

    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);

    this.router.navigate(['/login']);
  }

  async refreshToken(): Promise<AuthResponse | null> {
    const refreshToken = localStorage.getItem('directus_refresh_token');

    if (!refreshToken) {
      this.logout();
      return null;
    }

    try {
      const response = await this.apiService.requestApi('/auth/refresh', 'POST', {
        refresh_token: refreshToken
      });
      this.handleAuthSuccess(response);
      return response;
    } catch (error) {
      console.error('Erreur de rafraîchissement:', error);
      this.logout();
      throw error;
    }
  }

  private handleAuthSuccess(response: AuthResponse): void {
    localStorage.setItem('directus_token', response.access_token);
    localStorage.setItem('directus_refresh_token', response.refresh_token);

    if (response.user) {
      localStorage.setItem('directus_user', JSON.stringify(response.user));
      this.currentUserSubject.next(response.user);
    }

    this.isAuthenticatedSubject.next(true);
  }

  getToken(): string | null {
    return localStorage.getItem('directus_token');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('directus_user');
    if (!userStr || userStr === 'undefined' || userStr === 'null') {
      return null;
    }
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Erreur lors du parsing des données utilisateur:', error);
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Vérifie si l'utilisateur actuel est administrateur
   */
  isAdmin(): boolean {
    const user = this.getCurrentUser();

    // Directus utilise un UUID pour le rôle admin
    return user?.role === '76127248-7569-4267-ac8c-15137e91a998' || // UUID du rôle admin de cette instance Directus
           user?.role === 'admin' ||
           user?.role === 'administrator';
  }

  /**
   * Met à jour l'avatar de l'utilisateur
   */
  async updateAvatar(fileId: string): Promise<User> {
    try {
      const response = await this.apiService.requestApi('/users/me', 'PATCH', {
        avatar: fileId
      });

      const updatedUser = response.data || response;

      // Mettre à jour le localStorage et le subject
      localStorage.setItem('directus_user', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);

      return updatedUser;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'avatar:', error);
      throw error;
    }
  }

  /**
   * Supprime l'avatar de l'utilisateur
   */
  async deleteAvatar(): Promise<User> {
    try {
      const response = await this.apiService.requestApi('/users/me', 'PATCH', {
        avatar: null
      });

      const updatedUser = response.data || response;

      // Mettre à jour le localStorage et le subject
      localStorage.setItem('directus_user', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);

      return updatedUser;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'avatar:', error);
      throw error;
    }
  }

  // Connexion OAuth GitHub
  loginWithGitHub(): void {
    // URL de callback vers notre frontend
    const callbackUrl = `${window.location.origin}/auth/callback`;
    // Rediriger vers l'endpoint OAuth de Directus avec le redirect
    const githubAuthUrl = `${window.location.origin}/api/auth/login/github?redirect=${encodeURIComponent(callbackUrl)}`;
    window.location.href = githubAuthUrl;
  }

  // Vérifier la session OAuth après callback (Directus utilise des cookies)
  async checkOAuthSession(): Promise<void> {
    try {
      console.log('🔍 Vérification de la session OAuth...');

      // Appeler /users/me pour vérifier si la session est active
      // Directus devrait avoir défini un cookie de session après l'OAuth
      const userResponse = await this.apiService.requestApi('/users/me', 'GET');
      const userData = userResponse.data || userResponse;

      console.log('✅ Utilisateur récupéré:', userData);

      if (userData && userData.id) {
        // Créer un objet User propre
        const user: User = {
          id: userData.id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          avatar: userData.avatar,
          date_created: userData.date_created,
          date_updated: userData.date_updated
        };

        // Sauvegarder l'utilisateur
        localStorage.setItem('directus_user', JSON.stringify(user));
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);

        // Note: Les tokens sont gérés par les cookies de Directus
        // Pas besoin de les stocker manuellement

        console.log('✅ Session OAuth validée, redirection vers /gallery');
        this.router.navigate(['/gallery']);
      } else {
        throw new Error('Données utilisateur invalides');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de la session OAuth:', error);
      throw error;
    }
  }

  // Gérer le callback OAuth (appelé après redirection depuis GitHub)
  async handleOAuthCallback(accessToken: string, refreshToken: string): Promise<void> {
    try {
      // Sauvegarder les tokens
      localStorage.setItem('directus_token', accessToken);
      localStorage.setItem('directus_refresh_token', refreshToken);

      // Récupérer les infos utilisateur
      const userResponse = await this.apiService.requestApi('/users/me', 'GET');
      const user = userResponse.data || userResponse;

      // Sauvegarder l'utilisateur et mettre à jour l'état
      localStorage.setItem('directus_user', JSON.stringify(user));
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);

      // Rediriger vers la galerie
      this.router.navigate(['/gallery']);
    } catch (error) {
      console.error('Erreur lors du traitement du callback OAuth:', error);
      this.logout();
      throw error;
    }
  }
}