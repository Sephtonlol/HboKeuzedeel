import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  isLoggedIn: boolean = false;

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      this.checkLoginStatus();
    });
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }

  ngOnInit(): void {
    this.checkLoginStatus();
  }

  private checkLoginStatus(): void {
    this.isLoggedIn = !!localStorage.getItem('authToken');
  }
}
