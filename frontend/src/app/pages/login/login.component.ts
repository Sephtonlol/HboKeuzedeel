import { Component } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [HeaderComponent, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  constructor(private apiService: ApiService) {}
  email: string = '';
  password: string = '';
  error!: string;
  success!: string;

  async login() {
    const result = await this.apiService.login(this.email, this.password);
    if (!result.error) {
      console.log('Login successful', result);
      localStorage.setItem('authToken', result.token);
    }
    this.error = result.error || '';
    this.success = result.message || '';
  }
}
