import { Component } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-register',
  imports: [HeaderComponent, RouterLink, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  constructor(private apiService: ApiService) {}
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
}
