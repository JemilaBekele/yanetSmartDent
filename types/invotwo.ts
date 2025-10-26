// types.ts
export interface Service {
    _id: string;
    service: string;
    price?: number;
  }
  
  export interface InvoiceItem {
    service: Service; // Change this to use the Service interface directly
    description: string;
    quantity: number;
    price: number;
    totalPrice: number;
    
  }
  
  export interface Invoice {
    items: InvoiceItem[];
    invoiceDate: string;
    customerName: {
      id: string;
      username: string;
      cardno:  string
    };
    totalAmount: number;
  totalpaid: number;
  balance: number;
  currentpayment: {
    amount: number;
    date: Date;
    confirm: boolean;
    receipt: boolean;
  };
  branch:{
    name :string
  },
  status: string; 
    createdBy: {
      id: string;
      username: string;
    };
    createdAt: string;
    updatedAt: string;
    _id: string;
  }
  