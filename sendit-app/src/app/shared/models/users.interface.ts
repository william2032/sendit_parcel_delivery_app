export  interface User {
  id: number;
  name: string;
  email: string;
  joinedDate: string;
  status: 'Active' | 'Inactive';
  avatar?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}
