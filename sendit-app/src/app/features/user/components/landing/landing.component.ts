import {Component, ElementRef, ViewChild} from '@angular/core';
import {HeaderComponent} from '../shared/header/header.component';
import {HeroSectionComponent} from './layouts/hero-section/hero-section.component';
import {ServicesSectionComponent} from './layouts/services-section/services-section.component';
import {MapSectionComponent} from './layouts/map-section/map-section.component';
import {AchievementsSectionComponent} from './layouts/achievements-section/achievements-section.component';
import {TestimonialsSectionComponent} from './layouts/testimonials-section/testimonials-section.component';
import {CtaSectionComponent} from './layouts/cta-section/cta-section.component';
import {FooterComponent} from '../shared/footer/footer.component';
import {ScrollService} from '../../../../shared/services/scroll-service';

@Component({
  selector: 'app-landing',
  standalone: true,
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
  constructor(private scrollService: ScrollService) {
    this.scrollService.scrollToServices$.subscribe(() => this.scrollToServices());
  }
  @ViewChild('servicesSection', { static: false, read: ElementRef })
  servicesSectionRef!: ElementRef;

  ngAfterViewInit(): void {
    if (this.scrollService.pendingScrollToServices) {
      // wait for view to stabilize
      setTimeout(() => {
        this.scrollToServices();
        this.scrollService.consumeScrollIntent();
      }, 100); // short delay to let DOM render fully
    }

    // Also listen for same-page scroll events
    this.scrollService.scrollToServices$.subscribe(() => {
      this.scrollToServices();
    });
  }

  scrollToServices() {
    this.servicesSectionRef?.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
}
