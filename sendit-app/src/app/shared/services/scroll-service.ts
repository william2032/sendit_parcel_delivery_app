import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ScrollService {
  private scrollToServicesSource = new Subject<void>();
  scrollToServices$ = this.scrollToServicesSource.asObservable();

  private _pendingScrollToServices = false;

  get pendingScrollToServices() {
    return this._pendingScrollToServices;
  }

  requestScrollToServices() {
    this._pendingScrollToServices = true;
    this.scrollToServicesSource.next(); // still emit for same-page calls
  }

  consumeScrollIntent() {
    this._pendingScrollToServices = false;
  }
}
