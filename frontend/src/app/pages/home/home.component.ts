import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { ApiService } from '../../services/api.service';
import { Room } from '../../interfaces/rooms.interface';
import { Quiz } from '../../interfaces/quiz.interface';

@Component({
  selector: 'app-home',
  imports: [
    MatButtonModule,
    MatInputModule,
    MatSlideToggleModule,
    FormsModule,
    MatRadioModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  createRoom: boolean | null = null;
  name: string = '';
  roomId: string = '';
  isPublic: boolean = false;
  mode: string = 'ffa';
  rooms: Room[] = [];
  quizzes: Quiz[] = [];

  constructor(private apiService: ApiService) {}

  handleRoomAction() {
    if (this.createRoom) {
      const body = {
        name: this.name,
        quizId: 'oops',
        public: this.isPublic,
      };
      console.log(body);
    } else {
      const body = {
        name: this.name,
        roomId: Number(this.roomId),
      };
      console.log(body);
    }
  }
  async setCreateJoin(value: boolean | null) {
    this.createRoom = value;
  }
  async ngOnInit(): Promise<void> {
    try {
      this.rooms = await this.apiService.getRooms();
      this.quizzes = await this.apiService.getQuizzes();
    } catch (error) {
      console.error(error);
    }
  }
}
