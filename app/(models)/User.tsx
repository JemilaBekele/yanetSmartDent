import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please provide a username"],
    minlength: 3,
    maxlength: 50,
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
  },
  role: {
    type: String,
    enum: ['admin', 'doctor', 'reception','User', 'Locked','nurse','labratory'],
    required: [true, "Please provide a role"],
  },
  phone: {
    type: String,
    required: [true, "Please provide a phone number"],
  },
  image: {
    type: String,
    required: false,
    default: null,
  },
  deadlinetime: {
    type: Date,
    required: false,
    default: null,
  },
  lock: {
    type: Boolean,
    default: false,
  },
  experience: {
    type: Number,
    required: false,
    default: null,
  },
  position: {
    type: String,
    required: false,
    default: null,
  },
  lead: {
    type: Boolean,
    default: false,
  },
  senior: {
    type: Boolean,
    default: false,
  },
  junior: {
    type: Boolean,
    default: false,
  },
  head: {
    type: Boolean,
    default: false,
  },
  labassistant: {
    type: Boolean,
    default: false,
  },
   labhead: {
    type: Boolean,
    default: false,
  },
  labtechnician: { // FIXED: Changed from 'labtechnicial' to 'labtechnician'
    type: Boolean,
    default: false,
  },
  receptionist: { // FIXED: Changed from 'Receptionost' to 'receptionist'
    type: Boolean,
    default: false,
  },
  customservice: {
    type: Boolean,
    default: false,
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch", // Make sure this matches your Branch model name exactly
    required: false,
    default: null,
  },
}, {
  timestamps: true, // Add this to automatically handle createdAt and updatedAt
  strictPopulate: false // Add this to fix the populate error
});

// Middleware to ensure only one 'Locked' role user exists
userSchema.pre("save", async function (next) {
  if (this.role === 'Locked') {
    const existingLockedUser = await mongoose.models.User.findOne({ role: 'Locked' });
    if (existingLockedUser && existingLockedUser._id.toString() !== this._id.toString()) {
      const error = new Error("Only one user with role 'Locked' is allowed.");
      error.name = "ValidationError";
      return next(error);
    }
  }
  next();
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;