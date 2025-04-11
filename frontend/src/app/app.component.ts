import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  toastMessage: string | null = null;
  toastType!: '-primary' | '-danger' | '';
  toastShow: boolean = false;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.toastService.toastState$.subscribe(({ message, type }) => {
      this.toastMessage = message;
      this.toastType = type || '';
      this.toastShow = true;
      setTimeout(() => (this.toastShow = false), 3000);
    });
  }
}
