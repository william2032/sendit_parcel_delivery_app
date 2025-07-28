export  interface UserI {
  id: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
  role: string;
  isActive:boolean;
  deletedAt?: string | null;
  profilePicture?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}
