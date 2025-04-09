import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Quiz } from '../../interfaces/quiz.interface';
import { QuizComponent } from '../../components/quiz/quiz.component';

@Component({
  selector: 'app-quizzes',
  imports: [FormsModule, QuizComponent],
  templateUrl: './quizzes.component.html',
  styleUrl: './quizzes.component.css',
})
export class QuizzesComponent implements OnInit {
  constructor(private apiService: ApiService) {}
  quizzes: Quiz[] = [];
  selectedQuery: string = 'all';
  searchInput: string = '';

  changeQuery(query: string) {
    this.selectedQuery = query;
  }
  search() {
    console.log(this.searchInput);
  }

  async ngOnInit(): Promise<void> {
    this.quizzes = await this.apiService.getQuizzes();
  }
}
