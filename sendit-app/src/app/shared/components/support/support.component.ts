import { Component } from '@angular/core';
import {HeaderComponent} from '../../../features/user/components/shared/header/header.component';
import {FooterComponent} from '../../../features/user/components/shared/footer/footer.component';

@Component({
  selector: 'app-support',
  imports: [
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './support.component.html',
  styleUrl: './support.component.scss'
})
export class SupportComponent {

}
