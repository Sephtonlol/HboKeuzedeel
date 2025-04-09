import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Quiz } from '../../interfaces/quiz.interface';

@Component({
  selector: 'app-quiz',
  imports: [],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.css',
})
export class QuizComponent {
  @Input() quiz!: Quiz;

  showQuestions: boolean = false;
  copied: boolean = false;

  @Output() selected = new EventEmitter<void>();
  toggleQuestions() {
    this.showQuestions = !this.showQuestions;
  }
  copy() {
    navigator.clipboard
      .writeText(this.quiz._id?.toString() || 'null')
      .then(() => {
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 1000);
      });
  }
  selectQuiz() {
    this.selected.emit();
  }
}
