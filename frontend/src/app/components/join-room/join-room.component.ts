import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-join-room',
  imports: [FormsModule],
  templateUrl: './join-room.component.html',
  styleUrl: './join-room.component.css',
})
export class JoinRoomComponent {
  roomId: string = '';
  username: string = '';

  joinRoom() {
    if (this.roomId && this.username) {
      console.log('Joining room:', this.roomId, 'as', this.username);
    } else {
      console.error('Please enter a room code and username.');
    }
  }
}
