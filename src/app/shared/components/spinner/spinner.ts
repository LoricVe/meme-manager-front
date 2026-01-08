import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: false,
  templateUrl: './spinner.html',
  styleUrl: './spinner.css'
})
export class Spinner {
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() color: string = 'text-primary-600';

  getSizeClass(): string {
    switch (this.size) {
      case 'small':
        return 'h-4 w-4';
      case 'large':
        return 'h-8 w-8';
      default:
        return 'h-5 w-5';
    }
  }
}
