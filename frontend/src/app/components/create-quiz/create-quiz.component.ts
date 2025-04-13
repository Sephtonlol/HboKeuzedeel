import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Answer, Question } from '../../interfaces/quiz.interface';
import { Modal } from 'bootstrap';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../toast.service';

@Component({
  selector: 'app-create-quiz',
  imports: [FormsModule],
  templateUrl: './create-quiz.component.html',
  styleUrl: './create-quiz.component.css',
})
export class CreateQuizComponent {
  constructor(
    private apiService: ApiService,
    private toastService: ToastService
  ) {}
  @ViewChild('questionTypeModal') modalElement!: ElementRef;
  name: string = '';
  description: string = '';
  questions: Question[] = [
    {
      name: '',
      type: 'yes_no',
      answers: { options: [''], correctAnswer: false },
    },
  ];
  questionType: 'yes_no' | 'multiple_choice' | 'open' = 'yes_no';

  result!: any;

  questionTypeModal!: Modal;

  ngAfterViewInit(): void {
    this.questionTypeModal = new Modal(this.modalElement.nativeElement);
  }

  openModal(): void {
    this.questionTypeModal.show();
  }
  closeModal(): void {
    this.questionTypeModal.hide();
  }
  getAnswersByQuestionType(
    type: 'yes_no' | 'multiple_choice' | 'open' = 'yes_no'
  ) {
    let answers: Answer;
    switch (type) {
      case 'yes_no':
        answers = { options: [''], correctAnswer: false };
        break;
      case 'multiple_choice':
        answers = { options: ['example1', 'example2'], correctAnswer: '' };
        break;
      case 'open':
        answers = { options: [''], correctAnswer: '' };
        break;
      default:
        throw new Error('Invalid question type');
    }
    return answers;
  }

  addQuestion() {
    const answers = this.getAnswersByQuestionType(this.questionType);

    this.questions.push({
      name: '',
      type: this.questionType,
      answers: answers,
    });
    console.log(this.questions);
    this.closeModal();
  }
  deleteQuestion(index: number) {
    this.questions.splice(index, 1);
  }

  addMultipleChoiceField(index: number) {
    const question = this.questions[index].answers;
    if (question.options.length >= 8) {
      return;
    }
    question.options.push('example' + (question.options.length + 1));
  }

  removeMultipleChoiceField(index: number) {
    const question = this.questions[index].answers;
    if (question.options.length <= 1) {
      return;
    }
    question.options.pop();
  }

  getMultipleChoiceOptions(index: number): string[] {
    const answer = this.questions[index].answers;
    return this.questions[index].type === 'multiple_choice'
      ? answer.options || []
      : [];
  }

  async createQuiz() {
    console.log('Creating a quiz...');

    const user = await this.apiService.getUser(
      localStorage.getItem('authToken') || ''
    );

    this.result = await this.apiService.createQuiz(
      {
        name: this.name,
        description: this.description,
        createdAt: new Date(),
        createdBy: user.user.username,
        questions: this.questions,
      },
      localStorage.getItem('authToken') || ''
    );
    if (this.result.message) {
      console.log('Quiz created successfully!');
      this.name = '';
      this.description = '';
      this.questions = [
        {
          name: '',
          type: 'yes_no',
          answers: { options: [''], correctAnswer: false },
        },
      ];
    }
    this.toastService.show(this.result);
  }
}
