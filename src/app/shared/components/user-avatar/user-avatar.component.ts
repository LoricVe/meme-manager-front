import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule, ClickOutsideDirective],
  templateUrl: './user-avatar.component.html',
  styleUrls: ['./user-avatar.component.css']
})
export class UserAvatarComponent implements OnInit {
  isDropdownOpen = false;
  userInitials = '';
  userName = '';
  userEmail = '';
  avatarUrl = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserInfo();
  }

  loadUserInfo() {
    // Récupérer les infos utilisateur depuis le service auth
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.first_name || user.email || 'User';
      this.userEmail = user.email || '';
      this.userInitials = this.getInitials(this.userName);

      // Charger l'avatar si disponible
      if (user.avatar) {
        this.avatarUrl = `${window.location.origin}/api/assets/${user.avatar}`;
      }
    }
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  goToProfile() {
    this.closeDropdown();
    this.router.navigate(['/profile']);
  }

  logout() {
    this.closeDropdown();
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
