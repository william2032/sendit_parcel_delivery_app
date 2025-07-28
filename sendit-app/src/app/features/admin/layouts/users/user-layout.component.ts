import { Component, OnInit } from '@angular/core';
import { CommonModule, NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserI } from '../../../../shared/models/users.interface';
import { AdminService } from '../../../../shared/services/admin.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-layout.component.html',
  styleUrl: './user-layout.component.scss'
})
export class UserLayoutComponent implements OnInit {
  activeTab: 'all' | 'admin' | 'driver' | 'customer' | 'active' | 'inactive' = 'all';
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  totalEntries = 0;
  loading = false;
  error: string | null = null;
  editingRoleUserId: string | null = null;
  isModalOpen = false;
  modalTitle = '';
  modalMessage = '';

  users: UserI[] = [];
  selectedUsers: Set<string> = new Set();
  selectAll = false;

  filteredUsers: UserI[] = [];

  get allUsersCount(): number {
    return this.users.length;
  }

  get activeUsersCount(): number {
    return this.users.filter(user => user.isActive).length;
  }

  get inactiveUsersCount(): number {
    return this.users.filter(user => !user.isActive).length;
  }

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    this.loading = true;
    this.error = null;

    try {
      const response = await firstValueFrom(this.adminService.getAllUsers());
      if (Array.isArray(response)) {
        this.users = response;
      } else {
        this.users = response?.data || [];
      }
      this.filterUsers();
    } catch (error: any) {
      this.error = error.message || 'Failed to load users';
      console.error('Error loading users:', error);
    } finally {
      this.loading = false;
    }
  }

  filterUsers() {
    switch (this.activeTab) {
      case 'admin':
        this.filteredUsers = this.users.filter(user => user.role === 'ADMIN');
        break;
      case 'driver':
        this.filteredUsers = this.users.filter(user => user.role === 'DRIVER');
        break;
      case 'customer':
        this.filteredUsers = this.users.filter(user => user.role === 'CUSTOMER');
        break;
      case 'active':
        this.filteredUsers = this.users.filter(user => user.isActive);
        break;
      case 'inactive':
        this.filteredUsers = this.users.filter(user => !user.isActive);
        break;
      default:
        this.filteredUsers = [...this.users];
    }

    this.totalEntries = this.filteredUsers.length;
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    this.currentPage = 1;
    this.selectedUsers.clear();
    this.selectAll = false;
  }

  onTabChange(tab: 'all' | 'admin' | 'driver' | 'customer' | 'active' | 'inactive') {
    this.activeTab = tab;
    this.filterUsers();
  }

  getPaginatedUsers(): UserI[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredUsers.slice(startIndex, endIndex);
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

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  toggleSelectAll() {
    this.selectAll = !this.selectAll;
    const currentPageUsers = this.getPaginatedUsers();

    if (this.selectAll) {
      currentPageUsers.forEach(user => this.selectedUsers.add(user.id));
    } else {
      currentPageUsers.forEach(user => this.selectedUsers.delete(user.id));
    }
  }

  toggleUserSelection(userId: string) {
    if (this.selectedUsers.has(userId)) {
      this.selectedUsers.delete(userId);
    } else {
      this.selectedUsers.add(userId);
    }

    const currentPageUsers = this.getPaginatedUsers();
    this.selectAll = currentPageUsers.every(user => this.selectedUsers.has(user.id));
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUsers.has(userId);
  }

  toggleEditRole(userId: string) {
    this.editingRoleUserId = this.editingRoleUserId === userId ? null : userId;
  }

  async updateUserRole(userId: string, role: string) {
    try {
      this.loading = true;
      await firstValueFrom(this.adminService.updateUserRole(userId, role));

      const userIndex = this.users.findIndex(user => user.id === userId);
      if (userIndex !== -1) {
        this.users[userIndex].role = role; // Removed 'as any' assuming User interface supports role
        this.filterUsers();
      } else {
        console.warn(`User with ID ${userId} not found in local users array`);
      }
      this.editingRoleUserId = null;
      this.showModal('Success', `User ${userId} role updated to ${role}`);
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred while updating the user role';
      this.error = errorMessage;
      this.showModal('Error', errorMessage);
    } finally {
      this.loading = false;
    }
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    try {
      this.loading = true;
      await firstValueFrom(this.adminService.updateUserStatus(userId, isActive));

      const userIndex = this.users.findIndex(user => user.id === userId);
      if (userIndex !== -1) {
        this.users[userIndex].isActive = isActive;
        this.filterUsers();
      }

      console.log(`User ${userId} status updated to ${isActive ? 'Active' : 'Inactive'}`);
    } catch (error: any) {
      this.error = error.message || 'Failed to update user status';
      console.error('Error updating user status:', error);
    } finally {
      this.loading = false;
    }
  }

  async deleteUser(userId: string) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      this.loading = true;
      await firstValueFrom(this.adminService.deleteUser(userId));

      this.users = this.users.filter(user => user.id !== userId);
      this.selectedUsers.delete(userId);
      this.filterUsers();

      console.log(`User ${userId} deleted successfully`);
    } catch (error: any) {
      this.error = error.message || 'Failed to delete user';
      console.error('Error deleting user:', error);
    } finally {
      this.loading = false;
    }
  }


  async bulkDeleteSelected() {
    if (this.selectedUsers.size === 0) {
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${this.selectedUsers.size} selected user(s)? This action cannot be undone.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      this.loading = true;
      const deletePromises = Array.from(this.selectedUsers).map(userId =>
        firstValueFrom(this.adminService.deleteUser(userId))
      );

      await Promise.all(deletePromises);

      this.users = this.users.filter(user => !this.selectedUsers.has(user.id));
      this.selectedUsers.clear();
      this.selectAll = false;
      this.filterUsers();

      console.log('Selected users deleted successfully');
    } catch (error: any) {
      this.error = error.message || 'Failed to delete selected users';
      console.error('Error deleting selected users:', error);
    } finally {
      this.loading = false;
    }
  }

  onImageError(event: Event, fallbackInitial: string) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = `https://plus.unsplash.com/premium_photo-1671656349218-5218444643d8?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YXZhdGFyfGVufDB8fDB8fHww`;
  }

  onRoleChange(event: Event, userId: string) {
    const selectElement = event.target as HTMLSelectElement;
    const newRole = selectElement.value;
    this.updateUserRole(userId, newRole).then(() => {
      // Role updated successfully
    }).catch(error => {
      console.error('Failed to update role:', error);
    });
  }

  onStatusChange(event: Event, userId: string) {
    const selectElement = event.target as HTMLSelectElement;
    const isActive = selectElement.value === 'Active';
    this.updateUserStatus(userId, isActive);
  }

  getDisplayRange(): { start: number; end: number } {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(start + this.itemsPerPage - 1, this.totalEntries);
    return { start, end };
  }

  refreshUsers() {
    this.loadUsers();
  }

  clearError() {
    this.error = null;
  }

  showModal(title: string, message: string) {
    this.modalTitle = title;
    this.modalMessage = message;
    this.isModalOpen = true;
    setTimeout(() => this.closeModal(), 3000);
  }

  closeModal() {
    this.isModalOpen = false;
  }

  onModalClick(event: MouseEvent) {
    if ((event.target as HTMLElement).className === 'modal') {
      this.closeModal();
    }
  }
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  protected readonly Math = Math;
}
