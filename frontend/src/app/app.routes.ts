import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { RoomComponent } from './pages/room/room.component';
import { QuizComponent } from './pages/quiz/quiz.component';
import { PlayQuizComponent } from './pages/play-quiz/play-quiz.component';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'room', component: RoomComponent },
  { path: 'quiz', component: QuizComponent },
  { path: 'play', component: PlayQuizComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
];
