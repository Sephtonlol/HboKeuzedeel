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
import { ToastService } from '../../services/toast.service';
import { Participant, Room } from '../../interfaces/rooms.interface';

import QRCode from 'qrcode';
import { environment } from '../../../environments/environment';
import { Question } from '../../interfaces/quiz.interface';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-play',
  imports: [NgClass],
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
  showParticipantsValue: boolean = false;

  question!: Question;
  quizLength: number = 0;

  options!: string[][];

  participantsAnswered: number = 0;

  yourAnswer: string = '';
  correctAnswer: string = '';
  correct: boolean = false;

  statistics!: any;
  questionType: 'yes_no' | 'multiple_choice' | 'open' = 'open';

  leaderboard!: Participant[];

  teamsArray!: Participant[][];

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

  next() {
    if (!this.token || !this.roomId) {
      this.toastService.show({ error: 'User or room ID are empty.' });
      return;
    }

    console.log('next..');
    if (this.room.state == 'question')
      this.socketService.showAnswer(this.token, this.roomId);
    else if (this.room.state == 'answer')
      this.socketService.showStatistics(this.token, this.roomId);
    else if (this.room.state == 'statistics')
      this.socketService.showLeaderboard(this.token, this.roomId);
    else this.socketService.progressGame(this.token, this.roomId);
  }
  answer(answer: string | boolean) {
    if (!this.token || !this.roomId) {
      this.toastService.show({ error: 'User or room ID are empty.' });
      return;
    }
    this.socketService.answerQuestion(
      this.token,
      this.roomId,
      answer.toString()
    );
    localStorage.setItem('answer', answer.toString());
    this.yourAnswer = answer.toString();
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

  splitIntoPairs<T>(arr: T[]): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += 2) {
      result.push(arr.slice(i, i + 2));
    }
    return result;
  }

  checkAnswer(data: any) {
    this.correctAnswer = data.correctAnswer
      .toString()
      .toLowerCase()
      .replace(/[\s.,]+/g, '');
    this.yourAnswer = (localStorage.getItem('answer') || '')
      .toString()
      .toLowerCase()
      .replace(/[\s.,]+/g, '');
    this.correct = this.correctAnswer == this.yourAnswer;
  }

  sanitizeString(value: any): string {
    return (
      value
        ?.toString()
        .toLowerCase()
        .replace(/[\s.,]+/g, '') || ''
    );
  }

  isCorrectAnswer(answer: any, correct: any): boolean {
    return this.sanitizeString(answer) === this.sanitizeString(correct);
  }

  getStatisticPercentages() {
    const maxCount = Math.max(...this.statistics.map((s: any) => s.count));

    this.statistics = this.statistics.map((s: any) => ({
      ...s,
      percentage: Math.round((s.count / maxCount) * 100),
    }));
  }

  getTeamScore(team: Participant[]): number {
    return team.reduce((acc, participant) => acc + participant.score, 0);
  }

  getTotalScore(): number {
    return this.leaderboard.reduce((acc, p) => acc + p.score, 0);
  }

  showParticipants() {
    this.showParticipantsValue = !this.showParticipantsValue;
  }

  ngAfterViewInit(): void {
    if (this.roomId && this.qrCanvas) this.generateQRCode();
  }

  ngOnInit(): void {
    if (!sessionStorage.getItem('reloaded')) {
      sessionStorage.setItem('reloaded', 'true');
      window.location.reload();
      return;
    } else {
      sessionStorage.removeItem('reloaded');
    }
    this.token = localStorage.getItem('roomToken');
    this.roomId = localStorage.getItem('roomId');
    if (!this.token || !this.roomId) this.router.navigate(['/home']);

    this.subscriptions.push(
      this.socketService.userErrors.subscribe((data) => {
        if (data) {
          console.log(data);
          this.toastService.show(data);
          if (
            data.error === 'Invalid token.' ||
            data.error == 'Room not found.'
          ) {
            localStorage.removeItem('roomToken');
            localStorage.removeItem('roomId');
            this.router.navigate(['/home']);
          }
        }
      })
    );
    this.yourAnswer = localStorage.getItem('answer') || '';

    this.subscriptions.push(
      this.socketService.roomUpdates.subscribe((data) => {
        if (data) {
          this.quizLength = data.quizLength;
          console.log(data);
          this.room = data.room;
          if (data.host) this.host = data.host;
          this.locked = this.room.locked;
          if (data.question && data.quizLength) {
            this.question = data.question;
            this.quizLength = data.quizLength;
            if (data.question.type == 'multiple_choice')
              this.options = this.splitIntoPairs(data.question.answers.options);
            this.yourAnswer = localStorage.getItem('answer') || '';
          }
          if (data.room.state == 'question') {
            this.participantsAnswered = data.room.participants.filter(
              (p: any) => p.totalAnswers === data.room.quizProgression
            ).length;
          }
          if (data.room.state == 'answer') {
            this.checkAnswer(data);
          }
          if (data.room.state == 'statistics') {
            this.statistics = data.stats;
            this.getStatisticPercentages();
            this.correctAnswer = data.correctAnswer;
            this.questionType = data.questionType;
            console.log(this.statistics);
          }
          if (data.room.state == 'leaderboard') {
            this.leaderboard = data.room.participants.sort(
              (a: any, b: any) => b.score - a.score
            );
            console.log(this.leaderboard);
          }
          if (this.room.mode?.type == 'team') {
            const numberOfTeams = this.room.mode.teams ?? 0;

            const teamsArray: Participant[][] = Array.from(
              { length: numberOfTeams },
              () => []
            );

            this.room.participants?.forEach((participant) => {
              if (typeof participant.team === 'number') {
                teamsArray[participant.team]?.push(participant);
              }
            });

            this.teamsArray = teamsArray;
          }
        }
      })
    );

    this.subscriptions.push(
      this.socketService.userSuccess.subscribe((data) => {
        if (data) {
          console.log('User success:', data);
          this.toastService.show(data);

          if (data.message == 'Successfully left the room.') {
            this.socketService.removeAllListeners();
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
          if (data.participant == this.token || data.participant == 'all') {
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
            this.socketService.removeAllListeners();
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
      this.socketService.quizProgress.subscribe((data) => {
        if (data) {
          console.log('Quiz progress:', data);
          this.room.quizProgression = data.quizProgression;
          this.question = data.question;
          this.participantsAnswered = 0;
          this.room.state = 'question';
          localStorage.removeItem('answer');
          this.yourAnswer = '';

          if (data.question.type == 'multiple_choice')
            this.options = this.splitIntoPairs(data.question.answers.options);
          this.showParticipantsValue = false;
        }
      })
    );

    this.subscriptions.push(
      this.socketService.questionAnswered.subscribe((data) => {
        if (data) {
          console.log('Question answered:', data);
          this.participantsAnswered += 1;
          const participant = this.room.participants?.find(
            (p) => p.name === data.name
          );
          if (participant) {
            participant.totalAnswers += 1;
          }
        }
      })
    );

    this.subscriptions.push(
      this.socketService.quizAnswer.subscribe((data) => {
        if (data) {
          console.log('Show answer event:', data);
          this.checkAnswer(data);
          this.room.state = 'answer';
          this.showParticipantsValue = false;
        }
      })
    );

    this.subscriptions.push(
      this.socketService.quizStatistics.subscribe((data) => {
        if (data) {
          console.log('Show statistics event:', data);
          this.statistics = data.stats;
          this.getStatisticPercentages();
          this.questionType = data.questionType;
          this.correctAnswer = data.correctAnswer;
          this.room.state = 'statistics';
          this.showParticipantsValue = false;
        }
      })
    );

    this.subscriptions.push(
      this.socketService.quizLeaderboard.subscribe((data) => {
        if (data) {
          console.log('Show leaderboard event:', data);
          this.leaderboard = data.participants.sort(
            (a: any, b: any) => b.score - a.score
          );
          this.room.state = 'leaderboard';
          this.showParticipantsValue = false;
        }
      })
    );

    this.socketService.reconnectToRoom(this.token || '', this.roomId || '');
  }
}
