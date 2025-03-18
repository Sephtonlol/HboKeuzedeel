import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-host',
  imports: [],
  templateUrl: './host.component.html',
  styleUrl: './host.component.css'
})
export class HostComponent implements OnInit {
  quizId!: string;
  
  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<{ quizId: string }>('http://localhost:3000/quiz')
      .subscribe(response => {
        this.quizId = response.quizId;
        console.log('Quiz ID:', this.quizId);
      });
  }
}