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


export interface SenderSearchResult {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  totalParcels: number;
  recentParcels: {
    id: string;
    trackingNumber: string;
    status: string;
    createdAt: string;
    destination: string;
  }[];
  isActive: boolean;
}
