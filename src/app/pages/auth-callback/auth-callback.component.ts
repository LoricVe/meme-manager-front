import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: false,
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div class="text-center">
        <div class="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
          <svg class="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Connexion en cours...</h2>
        <p class="text-gray-600">Veuillez patienter pendant que nous finalisons votre authentification.</p>
        @if (errorMessage) {
          <div class="mt-4 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg max-w-md mx-auto">
            <p class="font-semibold">Erreur d'authentification</p>
            <p class="text-sm">{{ errorMessage }}</p>
            <button
              (click)="redirectToLogin()"
              class="mt-2 text-sm underline hover:no-underline"
            >
              Retour à la connexion
            </button>
          </div>
        }
      </div>
    </div>
  `
})
export class AuthCallbackComponent implements OnInit {
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    // Directus utilise des cookies de session pour OAuth
    // On vérifie simplement si l'utilisateur est maintenant authentifié
    console.log('🔍 Callback OAuth reçu, vérification de la session...');

    try {
      // Attendre un peu pour laisser le temps aux cookies de se mettre en place
      await new Promise(resolve => setTimeout(resolve, 500));

      // Vérifier si l'utilisateur est authentifié en appelant /users/me
      await this.authService.checkOAuthSession();

      console.log('✅ Authentification OAuth réussie !');
      // Redirection gérée dans checkOAuthSession
    } catch (error: any) {
      console.error('❌ Erreur lors de la vérification de la session OAuth:', error);

      // Vérifier s'il y a un paramètre d'erreur dans l'URL
      this.route.queryParams.subscribe(params => {
        if (params['error']) {
          this.errorMessage = 'Erreur lors de l\'authentification avec GitHub.';
        } else {
          this.errorMessage = 'Impossible de finaliser la connexion. Veuillez réessayer.';
        }
      });

      setTimeout(() => this.redirectToLogin(), 3000);
    }
  }

  redirectToLogin(): void {
    this.router.navigate(['/login']);
  }
}
