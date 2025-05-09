import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Quiz } from '../../interfaces/quiz.interface';
import { QuizComponent } from '../../components/quiz/quiz.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-quizzes',
  imports: [FormsModule, QuizComponent, RouterLink],
  templateUrl: './quizzes.component.html',
  styleUrl: './quizzes.component.css',
})
export class QuizzesComponent implements OnInit {
  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private router: Router
  ) {}
  quizzes: Quiz[] = [];
  maxPage!: number;
  page!: string | null;
  searchInput: string = '';
  paginationArray: number[] = [];
  searched: boolean = false;

  async search() {
    this.quizzes = (await this.apiService.searchQuizzes(
      this.searchInput
    )) as Quiz[];
    this.searched = true;
    if (this.quizzes == undefined)
      this.toastService.show({ error: 'No quizzes found.' });
  }
  async getQuizzes() {
    this.searchInput == '';
    this.page = this.route.snapshot.paramMap.get('page');
    if (!this.page || Number(this.page) < 0) {
      this.router.navigate(['/quizzes', 1]);
      return;
    }
    const result = await this.apiService.getQuizzes(this.page);
    if (!result) {
      this.toastService.show({ error: 'No Quizzes found.' });
      return;
    }
    this.quizzes = result.quizzes;
    this.maxPage = result.maxPage;
    this.paginationArray = Array.from(
      { length: this.maxPage || 0 },
      (_, i) => i + 1
    );
    this.searched = false;
  }
  async ngOnInit(): Promise<void> {
    this.route.paramMap.subscribe(async () => {
      await this.getQuizzes();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}
