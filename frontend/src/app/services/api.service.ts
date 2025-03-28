import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Room } from '../interfaces/rooms.interface';
import { firstValueFrom } from 'rxjs';
import { Quiz } from '../interfaces/quiz.interface';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  async getRooms(): Promise<Room[]> {
    try {
      return await firstValueFrom(this.http.get<Room[]>(`${this.apiUrl}/room`));
    } catch (error) {
      console.error('Error fetching rooms:', error);
      throw error;
    }
  }

  async getQuizzes(): Promise<Quiz[]> {
    try {
      return await firstValueFrom(this.http.get<Quiz[]>(`${this.apiUrl}/quiz`));
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      throw error;
    }
  }
}
