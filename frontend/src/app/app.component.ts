import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { ToastService } from './services/toast.service';
import { Toast } from 'bootstrap';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  constructor(private toastService: ToastService) {}

  toastMessage = '';

  ngOnInit() {
    this.toastService.toast$.subscribe((message) => {
      this.toastMessage = message;
      this.showToast();
    });
  }

  showToast() {
    const toastEl = document.getElementById('toast');
    if (toastEl) {
      const toast = new Toast(toastEl);
      toast.show();
    }
  }
}
