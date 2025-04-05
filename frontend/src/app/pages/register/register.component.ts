import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-register',
  imports: [RouterLink, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  constructor(private apiService: ApiService, private router: Router) {}
  username: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  error: string = '';
  success: string = '';

  async register() {
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
    }
    const result = await this.apiService.register(
      this.username,
      this.email,
      this.password
    );
    if (!result.error) {
      console.log('Login successful', result);
    }
    this.error = result.error || '';
    this.success = result.message || '';
  }

  async ngOnInit() {
    if (localStorage.getItem('authToken')) {
      this.router.navigate(['/home']);
    }
  }
}
