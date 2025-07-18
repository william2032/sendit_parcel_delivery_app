export  interface User {
  id: number;
  name: string;
  email: string;
  joinedDate: string;
  status: 'Active' | 'Inactive';
  avatar?: string;
}
