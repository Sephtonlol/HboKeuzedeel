import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../toast.service';

@Component({
  selector: 'app-join-room',
  imports: [FormsModule],
  templateUrl: './join-room.component.html',
  styleUrl: './join-room.component.css',
})
export class JoinRoomComponent {
  roomId: string = '';
  constructor(
    private router: Router,
    private apiService: ApiService,
    private toastService: ToastService
  ) {}

  async joinRoom() {
    if (!this.roomId) {
      console.error('Please enter a room code and username.');
    }
    try {
      const result = await this.apiService.getRooms(this.roomId);
      if (!(result as any).error) this.router.navigate(['/join', this.roomId]);
    } catch {
      this.toastService.show({ error: 'Room not found.' });
    }
  }
}
