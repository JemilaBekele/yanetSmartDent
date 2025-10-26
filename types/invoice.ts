// Define InvoiceItem interface
export type InvoiceItem= {
    service: string; // Assuming it's the ObjectId of the service in string form
    description: string;
    quantity: number;
    price: number; // Price of the service
    
  }
  
  // Define CustomerName interface
  export type CustomerName ={
    id: string; // ObjectId of the Patient in string form
    username: string; // Patient Name
  }
  