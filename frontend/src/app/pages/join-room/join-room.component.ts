import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../toast.service';
import { SocketService } from '../../services/socket.service';
import { Participant, Room } from '../../interfaces/rooms.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-join-room',
  imports: [FormsModule],
  templateUrl: './join-room.component.html',
  styleUrl: './join-room.component.css',
})
export class JoinRoomComponent implements OnInit {
  room!: Room;
  username: string = '';
  selectedTeam: number | undefined = undefined;
  teams: number[] = [];
  teamsArray!: Participant[][];

  private subscriptions: Subscription[] = [];
  roomData: any;
  errorMessage: string | null = null;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private toastService: ToastService,
    private socketService: SocketService
  ) {}
  async ngOnInit(): Promise<void> {
    const roomId = this.route.snapshot.paramMap.get('roomId');
    this.room = (await this.apiService.getRooms(roomId as string)) as Room;
    console.log(this.room);
    if (!this.room) {
      this.toastService.show({ error: 'Something went wrong.' });
      this.router.navigate(['/home']);
    }

    this.teams = Array.from(
      { length: this.room.mode?.teams || 0 },
      (_, i) => i
    );
    if (
      this.room?.mode?.type === 'team' &&
      Array.isArray(this.room.participants)
    ) {
      const numberOfTeams = this.room.mode.teams ?? 0;

      const teamsArray: Array<typeof this.room.participants> = Array.from(
        { length: numberOfTeams },
        () => []
      );

      this.room.participants.forEach((participant) => {
        if (typeof participant.team === 'number') {
          teamsArray[participant.team].push(participant);
        }
      });

      this.teamsArray = teamsArray;
    }

    this.subscriptions.push(
      this.socketService.roomJoined.subscribe((data) => {
        if (data) {
          this.roomData = data;
          localStorage.setItem('roomToken', data.token);
          localStorage.setItem('roomId', data.roomId);
          this.router.navigate(['/play']);
          this.toastService.show(data);
        }
      })
    );

    this.subscriptions.push(
      this.socketService.userErrors.subscribe((data) => {
        if (data) {
          console.error('User error:', data);
          this.errorMessage = data.message || 'An error occurred.';
          this.toastService.show(data);
        }
      })
    );
  }
  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
  async joinRoom() {
    if (this.room.mode?.type == 'team') {
      this.socketService.joinRoom(
        this.username,
        this.room.roomId,
        Number(this.selectedTeam)
      );
    } else {
      this.socketService.joinRoom(this.username, this.room.roomId);
    }
  }
}
