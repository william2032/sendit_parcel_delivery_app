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
      name: 'Joy  Mwende',
      company: 'Mama Mboga Supplies',
      avatar: 'https://vectorwiz.com/wp-content/uploads/2023/06/Advertising.webp',
      quote: 'SendIT has made it so easy for me to deliver fresh produce to my customers across Nairobi. Their service is reliable and the pricing is perfect for small businesses like mine.',
      rating: 5
    },
    {
      id: 2,
      name: 'Kathleen Njeri',
      company: 'Kenya Printworks',
      avatar: 'https://vectorwiz.com/wp-content/uploads/2023/06/Professional-Photoshop-Image-Masking-Services-in-24-Hrs.webp',
      quote: 'We use SendIT daily to send printed materials to clients across Kenya. Their real-time tracking and fast deliveries have transformed our operations.',
      rating: 5
    },
    {
      id: 3,
      name: 'Max Matei',
      company: 'Ecom Express Kenya',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      quote: 'From Mombasa to Kisumu, SendIT has never let us down. We’ve tried other couriers, but none match their speed, communication, and pricing.',
      rating: 5
    }
  ];


  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }}
