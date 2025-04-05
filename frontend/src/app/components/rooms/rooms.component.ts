import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { SimpleRoom } from '../../interfaces/rooms.interface';
import { RoomComponent } from '../room/room.component';

@Component({
  selector: 'app-rooms',
  imports: [RoomComponent],
  templateUrl: './rooms.component.html',
  styleUrl: './rooms.component.css',
})
export class RoomsComponent implements OnInit {
  constructor(private apiService: ApiService) {}
  rooms!: SimpleRoom[];

  async ngOnInit(): Promise<void> {
    this.rooms = await this.apiService.getRooms();
  }
}
