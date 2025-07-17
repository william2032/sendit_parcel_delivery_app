import { Component } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgIf} from '@angular/common';
import {HeaderComponent} from '../../../features/user/components/shared/header/header.component';

@Component({
  selector: 'app-account',
  standalone: true,
  templateUrl: './account.component.html',
  imports: [
    ReactiveFormsModule,
    NgIf,
    HeaderComponent
  ],
  styleUrls: ['./account.component.scss']
})
export class AccountComponent {
  accountForm: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(private fb: FormBuilder) {
    this.accountForm = this.fb.group({
      name: ['John Doe', [Validators.required]],
      email: ['johnDoe@gmail.com', [Validators.required, Validators.email]],
      deliveryAddress: ['123 Chuka road', [Validators.required]],
      phoneNumber: ['+254 798 344 214', [Validators.required]],
      city: ['Chuka', [Validators.required]],
      password: ['', [Validators.minLength(6)]]
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onUploadClick() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput.click();
  }

  onEditDetails() {
    // Enable form fields for editing
    this.accountForm.enable();
  }

  onSave() {
    if (this.accountForm.valid) {
      const formData = {
        ...this.accountForm.value,
        profileImage: this.selectedFile
      };
      console.log('Account data to save:', formData);
      // Here you would typically send the data to your backend service
      // this.accountService.updateAccount(formData).subscribe(...)
    }
  }
}
