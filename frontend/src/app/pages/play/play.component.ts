import { Component, OnInit } from '@angular/core';
import { SocketService } from '../../services/socket.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ToastService } from '../../toast.service';
import { Room } from '../../interfaces/rooms.interface';

@Component({
  selector: 'app-play',
  imports: [],
  templateUrl: './play.component.html',
  styleUrl: './play.component.css',
})
export class PlayComponent implements OnInit {
  token!: string | null;
  roomId!: string | null;

  private subscriptions: Subscription[] = [];
  room!: Room;
  host: boolean = false;
  errorMessage: string | null = null;
  constructor(
    private socketService: SocketService,
    private router: Router,
    private toastService: ToastService
  ) {}

  kick(user: string) {
    if (!this.token || !this.roomId)
      this.toastService.show({ error: 'User or room ID are empty.' });
    this.socketService.kickUser(this.token!, user, this.roomId!);
  }

  ngOnInit(): void {
    this.token = localStorage.getItem('roomToken');
    this.roomId = localStorage.getItem('roomId');
    if (!this.token || !this.roomId) this.router.navigate(['/home']);

    this.subscriptions.push(
      this.socketService.userErrors.subscribe((data) => {
        if (data) {
          this.errorMessage = data.message || 'An error occurred.';
          this.toastService.show(data);
          if (data.error == 'Invalid token.') {
            localStorage.removeItem('roomToken');
            localStorage.removeItem('roomId');
            this.router.navigate(['/home']);
          }
        }
      })
    );

    this.subscriptions.push(
      this.socketService.roomUpdates.subscribe((data) => {
        if (data) {
          console.log('Room update:', data);
          this.room = data.room;
          console.log(data.room.participants);
          if (data.host) this.host = data.host;
        }
      })
    );

    this.subscriptions.push(
      this.socketService.quizProgress.subscribe((data) => {
        if (data) {
          console.log('Quiz progress:', data);
        }
      })
    );

    this.subscriptions.push(
      this.socketService.questionAnswered.subscribe((data) => {
        if (data) {
          console.log('Question answered:', data);
        }
      })
    );

    this.subscriptions.push(
      this.socketService.userSuccess.subscribe((data) => {
        if (data) {
          console.log('User success:', data);
          this.toastService.show(data);
        }
      })
    );

    this.subscriptions.push(
      this.socketService.userKicked.subscribe((data) => {
        if (data) {
          console.log('User kicked:', data);
          if (data.participant) if (data.u) this.toastService.show(data);
          if (data.participant == this.token) {
            this.toastService.show({
              message: 'You have been kicked from the room.',
            });
            localStorage.removeItem('roomToken');
            localStorage.removeItem('roomId');
            this.router.navigate(['/home']);
          }
        }
      })
    );

    this.subscriptions.push(
      this.socketService.roomLocked.subscribe((data) => {
        if (data) {
          console.log('Room locked event:', data);
        }
      })
    );

    this.subscriptions.push(
      this.socketService.showAnswerEvent.subscribe((data) => {
        if (data) {
          console.log('Show answer event:', data);
        }
      })
    );

    this.subscriptions.push(
      this.socketService.showLeaderboardEvent.subscribe((data) => {
        if (data) {
          console.log('Show leaderboard event:', data);
        }
      })
    );

    this.socketService.reconnectToRoom(this.token || '', this.roomId || '');
  }
}
