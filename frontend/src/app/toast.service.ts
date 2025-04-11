import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastSubject = new Subject<{
    message: string;
    type?: '-primary' | '-danger' | '';
  }>();
  toastState$ = this.toastSubject.asObservable();

  show(result: any) {
    const message = result?.message || result?.error || 'Something went wrong.';

    const type = result?.error ? '-danger' : result?.message ? '-primary' : '';
    this.toastSubject.next({ message, type });
  }
}
