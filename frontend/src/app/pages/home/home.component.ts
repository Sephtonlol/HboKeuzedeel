import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { RoomsComponent } from '../../components/rooms/rooms.component';
import { HeaderComponent } from '../../components/header/header.component';
import { SocketService } from '../../services/socket.service';
import { CreateRoomComponent } from '../../components/create-room/create-room.component';

@Component({
  selector: 'app-home',
  imports: [
    MatButtonModule,
    MatInputModule,
    MatSlideToggleModule,
    FormsModule,
    MatRadioModule,
    HeaderComponent,
    CreateRoomComponent,
    RoomsComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  constructor(private socketService: SocketService) {}

  ngOnInit(): void {
    this.socketService.roomUpdates.subscribe((data) => {
      console.log('Room updated:', data);
    });
    this.socketService.userErrors.subscribe((error) => {
      console.error('Error:', error);
    });
  }
}
