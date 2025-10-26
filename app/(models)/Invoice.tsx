import mongoose, { Document, Schema } from 'mongoose';
import userReferenceSchema from "@/app/helpers/userReferenceSchema";

// Define the InvoiceItem interface
interface InvoiceItem extends Document {
  service: {
    id: mongoose.Types.ObjectId; // ObjectId for the service reference
    service: string; // Name of the service
  };
  description: string;
  quantity: number;
  price: number;
  totalPrice: number; // This can be calculated dynamically
}

// Define the Invoice interface
interface Invoice extends Document {
  items: InvoiceItem[];
  invoiceDate: Date;
  customerName: {
    id: mongoose.Types.ObjectId; // ObjectId for the customer (patient)
    username: string;
    cardno: string; // Patient's card number
  };
  totalAmount: number;
  totalpaid: number;
  balance: number;
  currentpayment: {
    amount: number;
    date: Date;
    confirm: boolean;
    receipt: true;
  };
  status: string;  
  createdBy: typeof userReferenceSchema;
  branch: mongoose.Types.ObjectId; 
}

// Define the schema for each item in the invoice
const InvoiceItemSchema = new Schema<InvoiceItem>({
  service: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service', // Reference to Service model
      required: [true, 'Please provide Service ID'],
    },
    service: {
      type: String,
      required: [true, 'Please provide Service name'],
    },
  },
  description: {
    type: String,
    required: false ,
    default: '' 
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
    default: function () {
      return this.quantity * this.price;
    },
  },
}, { _id: false });

// Define the main Invoice schema
const InvoiceSchema = new Schema<Invoice>({
  items: [InvoiceItemSchema], // Array of invoice items
  invoiceDate: {
    type: Date,
    default: Date.now,
  },
  customerName: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient', // Reference to Patient model
      required: [true, 'Please provide Patient ID'],
    },
    username: {
      type: String,
      required: [true, 'Please provide Patient name'],
    },
    cardno: {
      type: String,
      required: [true, 'Please provide Patient card number'],
    },
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  totalpaid: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  currentpayment: {
    amount: {
      type: Number,
      required: true,
      
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    confirm: {
      type: Boolean,
      default: false,
    },
    receipt: {
      type: Boolean,
      default: false,
    },
  },
  status: {
    type: String,
    required: [true, 'Please provide a status'],
    enum: ['Paid', 'Pending', 'Cancel', 'order'],
  },
    branch: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "Branch", // Make sure this matches your Branch model name exactly
       required: false,
       default: null,
     },
  createdBy: userReferenceSchema,
}, { timestamps: true });

// Pre-save hook to calculate the totalAmount, balance, and totalpaid before saving
InvoiceSchema.pre<Invoice>('save', function (next) {
  // Calculate the total amount by summing the totalPrice of all items
  this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Update the balance (totalAmount - totalpaid)
  this.balance = this.totalAmount - this.totalpaid;

  next();
});

// Create and export the Invoice model
const Invoice = mongoose.models.Invoice || mongoose.model<Invoice>('Invoice', InvoiceSchema);
export default Invoice;
