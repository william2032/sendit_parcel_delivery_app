import { Component, OnInit } from '@angular/core';
import {CommonModule, NgForOf} from '@angular/common';
import { FormsModule } from '@angular/forms';
import {UserI} from '../../../../shared/models/users.interface';

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

  users: UserI[] = [
    {
      id: '1',
      name: 'Robert Fox',
      phone: '+254712345678',
      email: 'debbie.baker@example.com',
      joinedDate: '23 Jul 2025',
      status: 'Active',
      profileImage: 'https://cdn.prod.website-files.com/67009da69b1f97d92249b0ba/6700ba3eb83ab0f4750b6169_Testimonail%20Image%201.png'
    },
    {
      id: '2',
      name: 'Robert Fox',
      phone: '+254723456789',
      email: 'debbie.baker@example.com',
      joinedDate: '23 Jul 2025',
      status: 'Active',
      profileImage: 'https://cdn.prod.website-files.com/67009da69b1f97d92249b0ba/6700ba3eb83ab0f4750b6169_Testimonail%20Image%201.png'
    },
    {
      id: '3',
      name: 'Robert Fox',
      phone: '+254734567890',
      email: 'debbie.baker@example.com',
      joinedDate: '23 Jul 2025',
      status: 'Active',
      profileImage: 'https://cdn.prod.website-files.com/67009da69b1f97d92249b0ba/6700ba3eb83ab0f4750b6169_Testimonail%20Image%201.png'
    },
    {
      id: '4',
      name: 'Talobi Manna',
      phone: '+254745678901',
      email: 'debbie.baker@example.com',
      joinedDate: '23 Jul 2025',
      status: 'Active',
      profileImage: 'https://cdn.prod.website-files.com/67009da69b1f97d92249b0ba/6700ba3eb83ab0f4750b6169_Testimonail%20Image%201.png'
    },
    {
      id: '5',
      name: 'Brooklyn Simmons',
      phone: '+254756789012',
      email: 'debbie.baker@example.com',
      joinedDate: '23 Jul 2025',
      status: 'Active',
      profileImage: 'https://cdn.prod.website-files.com/67009da69b1f97d92249b0ba/6700ba3eb83ab0f4750b6169_Testimonail%20Image%201.png'
    },
    {
      id: '6',
      name: 'Devon Lane',
      phone: '+254767890123',
      email: 'debbie.baker@example.com',
      joinedDate: '23 Jul 2025',
      status: 'Active',
      profileImage: 'https://cdn.prod.website-files.com/67009da69b1f97d92249b0ba/6700ba3eb83ab0f4750b6169_Testimonail%20Image%201.png'
    },
    {
      id: '7',
      name: 'Devon Lane',
      phone: '+254778901234',
      email: 'debbie.baker@example.com',
      joinedDate: '23 Jul 2025',
      status: 'Active',
      profileImage: 'https://cdn.prod.website-files.com/67009da69b1f97d92249b0ba/6700ba3eb83ab0f4750b6169_Testimonail%20Image%201.png'
    },
    {
      id: '8',
      name: 'Devon Lane',
      phone: '+254789012345',
      email: 'debbie.baker@example.com',
      joinedDate: '23 Jul 2025',
      status: 'Inactive',
      profileImage: 'https://cdn.prod.website-files.com/67009da69b1f97d92249b0ba/6700ba3eb83ab0f4750b6169_Testimonail%20Image%201.png'
    }
  ];

  filteredUsers: UserI[] = [];

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
