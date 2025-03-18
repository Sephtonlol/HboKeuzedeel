import { Routes } from '@angular/router';
import { QuizComponent } from './pages/quiz/quiz.component';
import { HomeComponent } from './pages/menu/home/home.component';
import { HostComponent } from './pages/menu/host/host.component';
import { JoinComponent } from './pages/menu/join/join.component';
import { SoloComponent } from './pages/menu/solo/solo.component';

export const routes: Routes = [
    { path: 'quiz', component: QuizComponent },
    { path: 'menu', component: HomeComponent },
    { path: 'host', component: HostComponent },
    { path: 'join', component: JoinComponent },
    { path: 'solo', component: SoloComponent },
    { path: '', redirectTo: '/menu', pathMatch: 'full' }
];