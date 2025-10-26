import mongoose, { Document, Schema } from 'mongoose';
import userReferenceSchema from "@/app/helpers/userReferenceSchema";

// Define the CreditItem interface
interface CreditItem extends Document {
  service: {
    id: mongoose.Types.ObjectId; // ObjectId for the service reference
    service: string; // Name of the service
  };
  description: string;
  quantity: number;
  price: number;
  totalPrice: number; // This can be calculated dynamically
}

// Define the Credit interface
interface Credit extends Document {
  items: CreditItem[];
  creditDate: Date;
  customerName: {
    id: mongoose.Types.ObjectId; // ObjectId for the customer (patient)
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
  createdBy: typeof userReferenceSchema;
  branch:mongoose.Types.ObjectId; // ObjectId for the customer (patient)

}

// Define the schema for each item in the invoice
const CreditItemSchema = new Schema<CreditItem>({
  service: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrgService',
      required: [true, 'Please provide Service ID'],
    },
    service: {
      type: String,
      required: [true, 'Please provide Service name'],
    },
  },
  description: {
    type: String,
    required: false,
    default: '',
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

// Define the main Credit schema
const CreditSchema = new Schema<Credit>({
  items: [CreditItemSchema],
  creditDate: {
    type: Date,
    default: Date.now,
  },
  customerName: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Please provide Patient ID'],
    },
    
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  totalPaid: {
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
  currentPayment: {
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
      default: true,
    },
  },
  status: {
    type: String,
    required: [true, 'Please provide a status'],
    enum: ['Paid', 'Pending', 'Cancel', 'Credit'],
  },
    branch: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Branch", // Make sure this matches your Branch model name exactly
         required: false,
         default: null,
       },
  createdBy: userReferenceSchema,
}, { timestamps: true });

// Pre-save hook to calculate the totalAmount, balance, and totalPaid before saving
CreditSchema.pre<Credit>('save', function (next) {
  // Calculate the total amount by summing the totalPrice of all items
  this.totalAmount = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  // Update the balance (totalAmount - totalPaid)
  this.balance = this.totalAmount - this.totalPaid;

  next();
});

// Create and export the Credit model
const Credit = mongoose.models.Credit || mongoose.model<Credit>('Credit', CreditSchema);
export default Credit;
