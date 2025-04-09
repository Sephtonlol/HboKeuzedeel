import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Toast } from 'bootstrap';

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
  result: any = {};

  async register() {
    if (this.password !== this.confirmPassword) {
      this.result.error = 'Passwords do not match';
      this.showToast();
      console.log('yea');
      return;
    }
    this.result = await this.apiService.register(
      this.username,
      this.email,
      this.password
    );
    this.showToast();
  }

  async ngOnInit() {
    if (localStorage.getItem('authToken')) {
      this.router.navigate(['/home']);
    }
  }

  showToast() {
    const toast = document.getElementById('toast');
    if (toast) {
      const _toast = new Toast(toast);
      _toast.show();
    }
  }
}
