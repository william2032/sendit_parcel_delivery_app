import { Component, OnInit } from '@angular/core';
import {CommonModule, NgForOf} from '@angular/common';
import { FormsModule } from '@angular/forms';
import {User} from '../../../../shared/models/users.interface';

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-layout.component.html',
  styleUrl: './user-layout.component.scss'
})
export class UserLayoutComponent implements OnInit {
  activeTab: 'all' | 'active' | 'inactive' = 'all';
  currentPage = 1;
  totalPages = 1;
  totalEntries = 0;

  users: User[] = [
    {
      id: 1,
      name: 'Robert Fox',
      email: 'debbie.baker@example.com',
      joinedDate: '23 Jul 2025',
      status: 'Active',
      avatar: 'https://via.placeholder.com/40x40?text=RF'
    },
    {
      id: 2,
      name: 'Robert Fox',
      email: 'debbie.baker@example.com',
      joinedDate: '23 Jul 2025',
      status: 'Active',
      avatar: 'https://via.placeholder.com/40x40?text=RF'
    },
    {
      id: 3,
      name: 'Robert Fox',
      email: 'debbie.baker@example.com',
      joinedDate: '23 Jul 2025',
      status: 'Active',
      avatar: 'https://via.placeholder.com/40x40?text=RF'
    },
    {
      id: 4,
      name: 'Talobi Manna',
      email: 'debbie.baker@example.com',
      joinedDate: '23 Jul 2025',
      status: 'Active',
      avatar: 'https://via.placeholder.com/40x40?text=TM'
    },
    {
      id: 5,
      name: 'Brooklyn Simmons',
      email: 'debbie.baker@example.com',
      joinedDate: '23 Jul 2025',
      status: 'Active',
      avatar: 'https://via.placeholder.com/40x40?text=BS'
    },
    {
      id: 6,
      name: 'Devon Lane',
      email: 'debbie.baker@example.com',
      joinedDate: '23 Jul 2025',
      status: 'Active',
      avatar: 'https://via.placeholder.com/40x40?text=DL'
    },
    {
      id: 7,
      name: 'Devon Lane',
      email: 'debbie.baker@example.com',
      joinedDate: '23 Jul 2025',
      status: 'Active',
      avatar: 'https://via.placeholder.com/40x40?text=DL'
    },
    {
      id: 8,
      name: 'Devon Lane',
      email: 'debbie.baker@example.com',
      joinedDate: '23 Jul 2025',
      status: 'Inactive',
      avatar: 'https://via.placeholder.com/40x40?text=DL'
    }
  ];

  filteredUsers: User[] = [];

  ngOnInit() {
    this.filterUsers();
  }

  filterUsers() {
    switch (this.activeTab) {
      case 'active':
        this.filteredUsers = this.users.filter(user => user.status === 'Active');
        break;
      case 'inactive':
        this.filteredUsers = this.users.filter(user => user.status === 'Inactive');
        break;
      default:
        this.filteredUsers = this.users;
    }

    this.totalEntries = this.filteredUsers.length;
    this.totalPages = Math.ceil(this.filteredUsers.length / 10);
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  // Backend integration methods
  async loadUsers() {
    // TODO: Replace with actual API call
    // this.users = await this.userService.getUsers();
    // this.filterUsers();
  }

  async updateUserStatus(userId: number, status: 'Active' | 'Inactive') {
    // TODO: Replace with actual API call
    // await this.userService.updateUserStatus(userId, status);
    // this.loadUsers();
  }

  async deleteUser(userId: number) {
    // TODO: Replace with actual API call
    // await this.userService.deleteUser(userId);
    // this.loadUsers();
  }
}
