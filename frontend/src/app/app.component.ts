import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  isMenuPage: boolean = true;

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      this.isMenuPage = this.router.url == '/menu';
    });
  }

  title = 'frontend';
}
