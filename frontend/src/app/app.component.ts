import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { ToastService } from './toast.service';
import { filter } from 'rxjs/operators';

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
  showHeader = true;

  constructor(private toastService: ToastService, private router: Router) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.showHeader = !event.urlAfterRedirects.startsWith('/play');
      });
  }

  ngOnInit() {
    this.toastService.toastState$.subscribe(({ message, type }) => {
      this.toastMessage = message;
      this.toastType = type || '';
      this.toastShow = true;
      setTimeout(() => (this.toastShow = false), 3000);
    });
  }
}
