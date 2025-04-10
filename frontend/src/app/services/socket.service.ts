import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Mode } from '../interfaces/rooms.interface';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket!: Socket;

  public roomUpdates = new BehaviorSubject<any>(null);
  public userErrors = new BehaviorSubject<any>(null);
  public quizProgress = new BehaviorSubject<any>(null);
  public questionAnswered = new BehaviorSubject<any>(null);

  constructor() {
    this.connect();
  }

  private connect() {
    this.socket = io(environment.webSocketBaseUrl, {
      transports: ['websocket'],
    });

    // Handle events
    this.socket.on('room:update', (data) => console.log('Room update:', data));
    this.socket.on('user:error', (data) => console.log('Error:', data));
    this.socket.on('user:success', (data) => console.log('Success:', data));
    this.socket.on('room:create', (data) => console.log('Room Created:', data));
    this.socket.on('room:join', (data) => console.log('Joined Room:', data));
    this.socket.on('room:kick', (data) => console.log('Kicked:', data));
    this.socket.on('room:lock', (data) => console.log('Room Locked:', data));
    this.socket.on('show:answer', (data) => console.log('Show answer:', data));
    this.socket.on('show:leaderboard', (data) =>
      console.log('Show leaderboard:', data)
    );
    this.socket.on('quiz:progressed', (data) =>
      console.log('Quiz progressed:', data)
    );
    this.socket.on('question:answered', (data) =>
      console.log('Question answered:', data)
    );
  }

  createRoom(
    token: string,
    name: string,
    roomName: string,
    quizId: string,
    isPublic: boolean,
    mode: Mode
  ) {
    this.socket.emit('room:create', {
      token,
      name,
      roomName,
      quizId,
      public: isPublic,
      mode,
    });
  }

  joinRoom(name: string, roomId: string, team?: number) {
    this.socket.emit('room:join', { name, roomId, team });
  }

  kickUser(token: string, kick: string, roomId: string) {
    this.socket.emit('room:kick', { token, kick, roomId });
  }

  leaveRoom(token: string, roomId: string) {
    this.socket.emit('room:leave', { token, roomId });
  }

  reconnectToRoom(token: string, roomId: string) {
    this.socket.emit('room:reconnect', { token, roomId });
  }

  lockRoom(token: string, roomId: string) {
    this.socket.emit('room:lock', { token, roomId });
  }

  showLeaderboard(token: string, roomId: string) {
    this.socket.emit('show:leaderboard', { token, roomId });
  }

  showAnswer(token: string, roomId: string) {
    this.socket.emit('show:answer', { token, roomId });
  }

  progressGame(token: string, roomId: string) {
    this.socket.emit('game:progress', { token, roomId });
  }

  answerQuestion(token: string, roomId: string, answer: string) {
    this.socket.emit('game:answer', { token, roomId, answer });
  }

  disconnect() {
    this.socket.disconnect();
  }
}
