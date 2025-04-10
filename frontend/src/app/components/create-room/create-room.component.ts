import { Component, ElementRef, ViewChild } from '@angular/core';
import { Quiz } from '../../interfaces/quiz.interface';
import { ApiService } from '../../services/api.service';
import { QuizComponent } from '../quiz/quiz.component';
import { FormsModule } from '@angular/forms';
import { Modal } from 'bootstrap';
import { SocketService } from '../../services/socket.service';
import { ObjectId } from 'mongodb';

@Component({
  selector: 'app-create-room',
  imports: [QuizComponent, FormsModule],
  standalone: true,
  templateUrl: './create-room.component.html',
  styleUrl: './create-room.component.css',
})
export class CreateRoomComponent {
  @ViewChild('quizzesModal') modalElement!: ElementRef;
  constructor(
    private apiService: ApiService,
    private socketService: SocketService
  ) {}
  roomName!: string;
  mode: 'ffa' | 'team' | 'coop' = 'ffa';
  private: boolean = false;
  quiz!: Quiz;

  quizzesModal!: Modal;
  showQuizzes: boolean = false;
  quizzes!: Quiz[];

  ngAfterViewInit(): void {
    this.quizzesModal = new Modal(this.modalElement.nativeElement);
  }

  async openModal(): Promise<void> {
    if (!this.quizzes) this.quizzes = await this.apiService.getQuizzes();
    this.quizzesModal.show();
  }
  closeModal(): void {
    this.quizzesModal.hide();
  }

  selectQuiz(quiz: Quiz) {
    this.quiz = quiz;
    this.showQuizzes = false;
    console.log(this.quiz);
    this.closeModal();
  }
  createRoom() {
    if (!this.roomName) console.error('Room name is required');
    if (!this.quiz) console.error('Quiz is required');

    let teams: undefined | number = undefined;
    if (this.mode === 'team') {
      teams = 2;
    }
    this.socketService.createRoom(
      localStorage.getItem('authToken') || '',
      localStorage.getItem('username') || '',
      this.roomName,
      this.quiz._id as unknown as string,
      !this.private,
      { type: this.mode, teams: teams }
    );
  }
}
