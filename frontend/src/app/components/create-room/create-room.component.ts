import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Quiz } from '../../interfaces/quiz.interface';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../services/socket.service';
import { Subscription } from 'rxjs';
import { ToastService } from '../../toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-room',
  imports: [FormsModule],
  standalone: true,
  templateUrl: './create-room.component.html',
  styleUrl: './create-room.component.css',
})
export class CreateRoomComponent implements OnInit, OnDestroy {
  @ViewChild('quizzesModal') modalElement!: ElementRef;
  constructor(
    private apiService: ApiService,
    private socketService: SocketService,
    private toastService: ToastService,
    private router: Router
  ) {}
  roomName!: string;
  mode: 'ffa' | 'team' | 'coop' = 'ffa';
  teamsAmount: number | undefined = undefined;
  private: boolean = false;
  quiz!: Quiz;
  quizIdError: string = '';

  showQuizzes: boolean = false;
  quizzes!: Quiz[];

  private subscriptions: Subscription[] = [];
  roomData: any;
  errorMessage: string | null = null;

  ngOnInit() {
    this.subscriptions.push(
      this.socketService.roomCreated.subscribe((data) => {
        if (data) {
          this.roomData = data;
          localStorage.setItem('roomToken', data.token);
          localStorage.setItem('roomId', data.roomId);
          this.router.navigate(['/play']);
          this.toastService.show(data);
        }
      })
    );

    this.subscriptions.push(
      this.socketService.userErrors.subscribe((data) => {
        if (data) {
          this.errorMessage = data.message || 'An error occurred.';
          this.toastService.show(data);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
  async getQuiz(quizId: string) {
    const isValidObjectId = /^[a-f\d]{24}$/i.test(quizId);

    if (isValidObjectId) {
      this.quizIdError = '';

      this.quiz = (await this.apiService.getQuiz(quizId)) as Quiz;
    } else {
      this.quizIdError = 'Invalid Quiz ID.';
    }
  }
  async createRoom() {
    const user = await this.apiService.getUser(
      localStorage.getItem('authToken') || ''
    );
    if (!this.roomName) console.error('Room name is required');
    if (!this.quiz) console.error('Quiz is required');
    if (this.mode == 'team' && !this.teamsAmount)
      console.error('Quiz is required');

    let teams: undefined | number = undefined;
    if (this.mode === 'team') {
      teams = 2;
    }
    if (this.mode == 'team')
      this.socketService.createRoom(
        localStorage.getItem('authToken') || '',
        user.user.username,
        this.roomName,
        this.quiz._id as unknown as string,
        !this.private,
        { type: this.mode, teams: Number(this.teamsAmount) }
      );
    else
      this.socketService.createRoom(
        localStorage.getItem('authToken') || '',
        user.user.username,
        this.roomName,
        this.quiz._id as unknown as string,
        !this.private,
        { type: this.mode }
      );
    return;
  }
}
