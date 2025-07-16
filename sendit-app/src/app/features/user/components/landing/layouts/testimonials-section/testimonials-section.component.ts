import { Component } from '@angular/core';
import {CommonModule} from '@angular/common';

interface Testimonial {
  id: number;
  name: string;
  company: string;
  avatar: string;
  quote: string;
  rating: number;
}

@Component({
  selector: 'app-testimonials-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonials-section.component.html',
  styleUrl: './testimonials-section.component.scss'
})

export class TestimonialsSectionComponent {
  testimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Jane Martin',
      company: 'Acceleration Company',
      avatar: 'https://vectorwiz.com/wp-content/uploads/2023/06/Advertising.webp',
      quote: 'Leverage agile frameworks to provide a robust synopsis for strategy foster collaborative thinking to further the overall value proposition. Organically grow the holistic world view of disruptive innovation via workplace diversity and empowerment.',
      rating: 5
    },
    {
      id: 2,
      name: 'Kathleen Smith',
      company: 'Fuel Company',
      avatar: 'https://vectorwiz.com/wp-content/uploads/2023/06/Professional-Photoshop-Image-Masking-Services-in-24-Hrs.webp',
      quote: 'Leverage agile frameworks to provide a robust synopsis for strategy foster collaborative thinking to further the overall value proposition. Organically grow the holistic world view of disruptive innovation via workplace diversity and empowerment.',
      rating: 5
    },
    {
      id: 3,
      name: 'John Martin',
      company: 'Acceleration Company',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      quote: 'Leverage agile frameworks to provide a robust synopsis for strategy foster collaborative thinking to further the overall value proposition. Organically grow the holistic world view of disruptive innovation via workplace diversity and empowerment.',
      rating: 5
    }
  ];

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }}
