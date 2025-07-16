import { Component } from '@angular/core';
import {HeaderComponent} from '../shared/header/header.component';
import {HeroSectionComponent} from './layouts/hero-section/hero-section.component';
import {ServicesSectionComponent} from './layouts/services-section/services-section.component';
import {MapSectionComponent} from './layouts/map-section/map-section.component';
import {AchievementsSectionComponent} from './layouts/achievements-section/achievements-section.component';
import {TestimonialsSectionComponent} from './layouts/testimonials-section/testimonials-section.component';
import {CtaSectionComponent} from './layouts/cta-section/cta-section.component';
import {FooterComponent} from '../shared/footer/footer.component';

@Component({
  selector: 'app-landing',
  imports: [
    HeaderComponent,
    HeroSectionComponent,
    ServicesSectionComponent,
    MapSectionComponent,
    AchievementsSectionComponent,
    TestimonialsSectionComponent,
    CtaSectionComponent,
    FooterComponent
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {

}
