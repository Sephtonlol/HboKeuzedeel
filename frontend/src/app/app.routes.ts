import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { RoomComponent } from './pages/room/room.component';
import { PlayComponent } from './pages/play/play.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { QuizzesComponent } from './pages/quizzes/quizzes.component';
import { JoinRoomComponent } from './pages/join-room/join-room.component';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'join/:roomId', component: JoinRoomComponent },
  { path: 'quizzes/:page', component: QuizzesComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'room', component: RoomComponent },
  { path: 'play', component: PlayComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
];
