import { Component } from '@angular/core';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-play',
  imports: [],
  templateUrl: './play.component.html',
  styleUrl: './play.component.css',
})
export class PlayComponent {
  constructor(private socketService: SocketService) {}
  // createRoom() {
  //   this.socketService.createRoom(
  //     'name',
  //     this.roomName,
  //     this.quiz?._id?.toString() || '',
  //     this.public,
  //     { type: this.mode }
  //   );
  //   console.log(this.roomName);
  // }
}
