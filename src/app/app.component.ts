import { Component } from '@angular/core';
import { Loading } from './shared/services/loading';
import { WebSocketService } from './shared/services/websocket.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'meme-manager-front';

  constructor(
    public loadingService: Loading,
    private websocketService: WebSocketService
  ) {
    // Le service WebSocket s'initialise automatiquement
  }
}
