import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-register',
  imports: [RouterLink, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  constructor(
    private apiService: ApiService,
    private router: Router,
    private toastService: ToastService
  ) {}
  username: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  result: any = {};

  async register() {
    if (this.password !== this.confirmPassword) {
      this.result.error = 'Passwords do not match';
    } else {
      this.result = await this.apiService.register(
        this.username,
        this.email,
        this.password
      );
    }
    this.toastService.show(this.result);
  }

  async ngOnInit() {
    if (localStorage.getItem('authToken')) {
      this.router.navigate(['/home']);
    }
  }
}
