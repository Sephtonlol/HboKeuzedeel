import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  constructor(private apiService: ApiService, private router: Router) {}
  email: string = '';
  password: string = '';
  error!: string;
  success!: string;

  async login() {
    const result = await this.apiService.login(this.email, this.password);
    this.error = result.error || '';
    this.success = result.message || '';
    if (!result.error) {
      console.log('Login successful', result);
      localStorage.setItem('authToken', result.token);
      this.router.navigate(['/home']);
    }
  }
  async ngOnInit() {
    if (localStorage.getItem('authToken')) {
      this.router.navigate(['/home']);
    }
  }
}
