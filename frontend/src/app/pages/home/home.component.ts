import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { RoomsComponent } from '../../components/rooms/rooms.component';
import { CreateRoomComponent } from '../../components/create-room/create-room.component';
import { CreateQuizComponent } from '../../components/create-quiz/create-quiz.component';
import { JoinRoomComponent } from '../../components/join-room/join-room.component';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [
    MatButtonModule,
    MatInputModule,
    MatSlideToggleModule,
    FormsModule,
    MatRadioModule,
    CreateRoomComponent,
    CreateQuizComponent,
    JoinRoomComponent,
    RoomsComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  loggedIn: boolean = false;
  constructor(private apiService: ApiService) {}
  selectedTab: string = 'joinRoom';

  switchTabs(tab: string) {
    this.selectedTab = tab;
  }

  async ngOnInit(): Promise<void> {
    if (!sessionStorage.getItem('reloaded')) {
      sessionStorage.setItem('reloaded', 'true');
      window.location.reload();
      return;
    } else {
      sessionStorage.removeItem('reloaded');
    }
    const result = await this.apiService.getUser(
      localStorage.getItem('authToken') || ''
    );
    this.loggedIn = result.error ? false : true;
  }
}
