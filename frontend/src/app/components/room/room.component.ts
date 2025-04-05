import { Component, Input, OnInit } from '@angular/core';
import { SimpleRoom } from '../../interfaces/rooms.interface';

@Component({
  selector: 'app-room',
  imports: [],
  templateUrl: './room.component.html',
  styleUrl: './room.component.css',
})
export class RoomComponent implements OnInit {
  @Input() room!: SimpleRoom;
  randomColor1!: string;
  randomColor2!: string;
  randomColor3!: string;
  backgroundStyle!: string;
  colors1 = [
    '#f1b213',
    '#722b8a',
    '#d8191f',
    '#f17a27',
    '#5ba840',
    '#008bcc',
    '#e599bb',
  ];
  colors2 = [
    '#f5da00',
    '#5d2d88',
    '#ca181d',
    '#e75b20',
    '#3f993f',
    '#0196d4',
    '#de88b1',
  ];
  ngOnInit(): void {
    const random1 = Math.floor(Math.random() * this.colors1.length);
    this.randomColor1 = this.colors1[random1];
    this.randomColor2 = this.colors2[random1];
    this.backgroundStyle = `repeating-conic-gradient(${this.randomColor1} 0 4deg, ${this.randomColor2} 4deg 8deg)`;
  }
}
