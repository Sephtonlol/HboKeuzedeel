import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { SimpleRoom } from '../interfaces/rooms.interface';
import { firstValueFrom } from 'rxjs';
import { Quiz } from '../interfaces/quiz.interface';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  async getRooms(): Promise<SimpleRoom[]> {
    try {
      return await firstValueFrom(
        this.http.get<SimpleRoom[]>(`${this.apiUrl}/room`)
      );
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

  async login(email: string, password: string): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/login`, { email, password })
      );
    } catch (error: any) {
      if (error.status >= 400) {
        return error.error;
      }
      console.error('Error during login:', error);
      throw error;
    }
  }

  async register(
    username: string,
    email: string,
    password: string
  ): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/register`, {
          username,
          email,
          password,
        })
      );
    } catch (error: any) {
      if (error.status >= 400) {
        return error.error;
      }
      console.error('Error during signUp:', error);
      throw error;
    }
  }
}
