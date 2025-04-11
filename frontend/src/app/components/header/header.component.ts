import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  loggedIn: boolean = false;

  constructor(private router: Router, private apiService: ApiService) {
    this.router.events.subscribe(() => {
      this.checkLoginStatus();
    });
  }

  logout() {
    localStorage.removeItem('authToken');
    this.loggedIn = false;
    this.router.navigate(['/login']);
  }

  async ngOnInit(): Promise<void> {
    await this.checkLoginStatus();
  }

  private async checkLoginStatus(): Promise<void> {
    if (!localStorage.getItem('authToken')) {
      this.loggedIn = false;
      return;
    }
    const result = await this.apiService.getUser(
      localStorage.getItem('authToken') || ''
    );
    this.loggedIn = result.error ? false : true;
    if (!this.loggedIn) {
      localStorage.removeItem('authToken');
    }
  }
}
