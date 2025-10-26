import mongoose from "mongoose";
import userReferenceSchema from "@/app/helpers/userReferenceSchema";

// ================= Announcement Model ================= //
const AnnouncementSchema = new mongoose.Schema(
{
title: { type: String, required: [true, "Please provide an announcement title"] },
description: { type: String },
    criticalExpiry: {
type: Date, // Optional expiry date
},
   main: {
      type: Boolean,
      default: false,
    },
isCritical: { type: Boolean,
default: false, 
},

createdBy: userReferenceSchema,
},
{ timestamps: true }
);

const Announcement =
mongoose.models.Announcement ||
mongoose.model("Announcement", AnnouncementSchema);

// ================= CompanyProfile Model ================= //
const CompanyProfileSchema = new mongoose.Schema(
{
companyName: {
type: String,
required: [true, "Please provide the company name"],
},
address: {
type: String,
required: [true, "Please provide the company address"],
},
phone: {
type: String,
required: [true, "Please provide the company phone number"],
},
title: {
type: String,
},
description: {
type: String,
},
announcements: [
{
type: mongoose.Types.ObjectId,
ref: "Announcement",
},
],
createdBy: userReferenceSchema,
},
{ timestamps: true }
);

const CompanyProfile =
mongoose.models.CompanyProfile ||
mongoose.model("CompanyProfile", CompanyProfileSchema);

export { CompanyProfile, Announcement };
