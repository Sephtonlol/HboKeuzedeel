import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Room, SimpleRoom } from '../interfaces/rooms.interface';
import { firstValueFrom } from 'rxjs';
import { Quiz } from '../interfaces/quiz.interface';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  async getRooms(roomId?: string): Promise<SimpleRoom[] | Room | void> {
    try {
      const params = roomId ? { roomId: roomId } : undefined;

      const result = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/room`, { params })
      );
      return result;
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return;
    }
  }

  async getQuizzes(
    page?: string
  ): Promise<{ maxPage: number; quizzes: Quiz[] } | void> {
    try {
      const params = page ? { page: page } : undefined;

      return await firstValueFrom(
        this.http.get<{ maxPage: number; quizzes: Quiz[] }>(
          `${this.apiUrl}/quiz`,
          { params }
        )
      );
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  }

  async createQuiz(quiz: Quiz, token: string): Promise<any> {
    try {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });

      return await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/quiz`, quiz, { headers })
      );
    } catch (error: any) {
      if (error.status >= 400) {
        return error.error;
      }
      console.error('Error creating quiz:', error);
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
    }
  }

  async getUser(token: string): Promise<any> {
    try {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });

      return await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/user`, { headers })
      );
    } catch (error: any) {
      if (error.status >= 400) {
        return error.error;
      }
      console.error('Error getting user:', error);
    }
  }
}
