import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { SocketService } from '../../services/socket.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ToastService } from '../../toast.service';
import { Room } from '../../interfaces/rooms.interface';

import QRCode from 'qrcode';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-play',
  imports: [],
  templateUrl: './play.component.html',
  styleUrl: './play.component.css',
})
export class PlayComponent implements OnInit, AfterViewInit {
  token!: string | null;
  roomId!: string | null;

  @ViewChild('qrCanvas', { static: false })
  qrCanvas!: ElementRef<HTMLCanvasElement>;

  private subscriptions: Subscription[] = [];

  room!: Room;
  host: boolean = false;
  errorMessage: string | null = null;

  locked: boolean = false;

  constructor(
    private socketService: SocketService,
    private router: Router,
    private toastService: ToastService
  ) {}

  kick(user: string) {
    if (!this.token || !this.roomId) {
      this.toastService.show({ error: 'User or room ID are empty.' });
      return;
    }
    this.socketService.kickUser(this.token, user, this.roomId);
  }
  leave() {
    if (!this.token || !this.roomId) {
      this.toastService.show({ error: 'User or room ID are empty.' });
      return;
    }
    this.socketService.leaveRoom(this.token, this.roomId);
  }
  lock() {
    if (!this.token || !this.roomId) {
      this.toastService.show({ error: 'User or room ID are empty.' });
      return;
    }
    this.socketService.lockRoom(this.token, this.roomId);
  }

  progress() {
    if (!this.token || !this.roomId) {
      this.toastService.show({ error: 'User or room ID are empty.' });
      return;
    }
  }

  private generateQRCode(): void {
    if (!this.roomId) return;

    QRCode.toCanvas(
      this.qrCanvas.nativeElement,
      `${environment.baseUrl}/join/${this.roomId}`,
      {
        errorCorrectionLevel: 'H',
        scale: 10,
      },
      (err) => {
        if (err) console.error(err);
      }
    );
  }

  ngAfterViewInit(): void {
    this.generateQRCode();
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
          if (data.error == 'Invalid token.' || 'Room not found.') {
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
          this.room = data.room;
          if (data.host) this.host = data.host;
          this.locked = this.room.locked;
        }
      })
    );

    this.subscriptions.push(
      this.socketService.userSuccess.subscribe((data) => {
        if (data) {
          console.log('User success:', data);
          this.toastService.show(data);

          if (data.message == 'Successfully left the room.') {
            this.socketService.disconnect();
            this.subscriptions.forEach((sub) => sub.unsubscribe());
            this.router.navigate(['/home']);
          }
        }
      })
    );

    this.subscriptions.push(
      this.socketService.userKicked.subscribe((data) => {
        if (data) {
          if (data.participant) if (data.u) this.toastService.show(data);
          if (data.participant == this.token || 'all') {
            if (data.participant == 'all')
              this.toastService.show({
                message: 'Room has been destroyed',
              });
            else
              this.toastService.show({
                message: 'You have been kicked from the room.',
              });
            localStorage.removeItem('roomToken');
            localStorage.removeItem('roomId');
            this.socketService.disconnect();
            this.subscriptions.forEach((sub) => sub.unsubscribe());
            this.router.navigate(['/home']);
          }
        }
      })
    );

    this.subscriptions.push(
      this.socketService.roomLocked.subscribe((data) => {
        if (data) {
          this.locked = data.lock;
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
      this.socketService.showLeaderboardEvent.subscribe((data) => {
        if (data) {
          console.log('Show leaderboard event:', data);
        }
      })
    );

    this.socketService.reconnectToRoom(this.token || '', this.roomId || '');
  }
}
