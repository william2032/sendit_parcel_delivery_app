export  interface UserI {
  id: string;
  name: string;
  phone: string;
  email: string;
  joinedDate: string;
  status: 'Active' | 'Inactive';
  profileImage?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}
