import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-home',
  imports: [MatButtonModule, MatInputModule, MatSlideToggleModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  createRoom: boolean | null = null;
  name: string = '';
  roomId: string = '';
  isPublic: boolean = false;

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
}
