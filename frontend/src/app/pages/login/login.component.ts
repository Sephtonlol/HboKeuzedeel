import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Router, RouterLink } from '@angular/router';
import { Toast } from 'bootstrap';
import { ToastService } from '../../toast.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  constructor(
    private apiService: ApiService,
    private router: Router,
    private toastService: ToastService
  ) {}
  email: string = '';
  password: string = '';
  result!: any;

  async login() {
    this.result = await this.apiService.login(this.email, this.password);
    if (!this.result.error) {
      localStorage.setItem('authToken', this.result.token);
      this.router.navigate(['/home']);
    }
    this.toastService.show(this.result);
  }
  async ngOnInit() {
    if (localStorage.getItem('authToken')) {
      this.router.navigate(['/home']);
      return;
    }
    const result = await this.apiService.getUser(
      localStorage.getItem('authToken') || ''
    );
    if (result.user) {
      this.router.navigate(['/home']);
    }
  }
}
