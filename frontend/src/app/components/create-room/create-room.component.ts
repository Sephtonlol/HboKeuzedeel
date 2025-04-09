import { Component, ElementRef, ViewChild } from '@angular/core';
import { Quiz } from '../../interfaces/quiz.interface';
import { ApiService } from '../../services/api.service';
import { QuizComponent } from '../quiz/quiz.component';
import { FormsModule } from '@angular/forms';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-create-room',
  imports: [QuizComponent, FormsModule],
  standalone: true,
  templateUrl: './create-room.component.html',
  styleUrl: './create-room.component.css',
})
export class CreateRoomComponent {
  @ViewChild('quizzesModal') modalElement!: ElementRef;
  constructor(private apiService: ApiService) {}
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
    console.log(this.mode);
  }
}
