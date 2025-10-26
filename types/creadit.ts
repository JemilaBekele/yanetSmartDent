import { branch } from "@/app/components/medicaldata/Consent/all";

// types.ts
export interface Service {
    categoryId?: string | number | readonly string[] | undefined;
    id?: string; // For internal use
    _id?: string; 
   
    service: string;
    price?: number;
  }
  
  export interface CreaditItem {
    service: Service; // Change this to use the Service interface directly
    description: string;
    quantity: number;
    price: number;
    totalPrice: number;
    
  }
  
  export interface Creadit {
    items: CreaditItem[];
    branch?:branch;
    creditDate:string
    customerName: {
      id: string;
      username: string;
      cardno:  string
    };
    totalAmount: number;
    totalPaid: number;
  balance: number;
  currentPayment: {
    amount: number;
    date: Date;
    confirm: boolean;
    receipt: boolean;
  };
  status: string; 
    createdBy: {
      id: string;
      username: string;
    };
    createdAt: string;
    updatedAt: string;
    _id: string;
  }
  