import mongoose from 'mongoose';
import userReferenceSchema from "@/app/helpers/userReferenceSchema";

const OrthodonticsSchema = new mongoose.Schema({
  Overjet: {
    type: String,
  },
  OverjetNegativeValue: {
    type: String,
  },
  OverbitePercentage: {
    type: String,
  },
  ConcernsAndLimitations: {
    type: String,
  },
  Others: {
    type: String,
  },
  ChiefComplaint: 
    {   None:  { type: Boolean ,  default: false},
      ImproveMySmile:  { type: Boolean,  default: false },
      CrookedTeeth:  { type: Boolean, default: false },
      Crowding :  { type: Boolean, default: false },
      Spacing:  { type: Boolean, default: false },
      Crown:  { type: Boolean, default: false },
      Overbite:  { type: Boolean, default: false},
      Underbite:  { type: Boolean, default: false},
      Deepbite:  { type: Boolean, default: false },
      Crossbite:  { type: Boolean, default: false },
      ImpactedTeeth:  { type: Boolean, default: false},
      other:  { type: String, required: false },
      
    },
 
  OralHabites:
    {   
    None:  { type: Boolean ,  default: false},
    ThumbSucking:  { type: Boolean,  default: false },
    Clenching:  { type: Boolean, default: false },
    Bruxism :  { type: Boolean, default: false },
   other:  { type: String, required: false },
    },
 
  MedicalHistory: 
    {   
    None:  { type: Boolean ,  default: false},
    NKDA:  { type: Boolean,  default: false },
    AllergiestoPenicillin:  { type: Boolean, default: false },
   other:  { type: String, required: false },
    },
  
  DentalHistory: 
    {   
    None:  { type: Boolean ,  default: false},
    PreviousOrthodonticTreatment:  { type: Boolean,  default: false },
    MissingTooth:  { type: Boolean, default: false },
    UnderSizedTooth:  { type: Boolean, default: false },
    Attrition:  { type: Boolean,  default: false },
    ImpactedTooth:  { type: Boolean, default: false },
   other:  { type: String, required: false },
    },


  AngleClassification: 
    {   
    I:  { type: Boolean ,  default: false},
    IIdiv1:  { type: Boolean,  default: false },
    IIdiv2:  { type: Boolean, default: false },
    III:  { type: Boolean, default: false },
    
    },

  AnteriorCrossbite: 
    {   
    yes:  { type: Boolean ,  default: false},
    No:  { type: Boolean,  default: false }
    },


  PosteriorCrossbite:
    {   
    yes:  { type: Boolean ,  default: false},
    No:  { type: Boolean,  default: false }
    },

  Mandible:
    {   
    Crowding:  { type: Boolean ,  default: false},
    Spacing:  { type: Boolean,  default: false }
    },

  Maxilla:
    {   
      Crowding:  { type: Boolean ,  default: false},
      Spacing:  { type: Boolean,  default: false }
    },

  Openbite:
    {   
    yes:  { type: Boolean ,  default: false},
    No:  { type: Boolean,  default: false }
    },
 
  TreatmentType:
    {   
    Full:  { type: Boolean ,  default: false},
    UpperOnly:  { type: Boolean,  default: false },
    LowerOnly:  { type: Boolean, default: false },
    MonthRecall:  { type: Boolean, default: false },

    other:  { type: String, required: false },
    },
 

  TreatmentPlan: [
    {   
    Nonextraction:  { type: Boolean ,  default: false},
    TrialNonExtraction:  { type: Boolean,  default: false },
    Extraction:  { type: Boolean, default: false },
    TeethNumber:  { type: String, default: false },
    },
  ],
  AdditionalOrthodonicAppliance:
    {   
    Elastics:  { type: Boolean ,  default: false},
    RapidPalatalExpander:  { type: Boolean,  default: false },
    InterProximalReduction:  { type: Boolean, default: false },
    SurgicalExposureofTeeth:  { type: Boolean, default: false },
    },
 

  EstimatedTreatmentTime:
    {   
    zeropointfive:  { type: Boolean ,  default: false},
    onetoonepointfive:  { type: Boolean,  default: false },
    onepointfivetotwo:  { type: Boolean, default: false },
    twototwopointfive:  { type: Boolean, default: false },
    twopointfivetothree:  { type: Boolean, default: false },
    },


  OrthodonticAppliance:
    {   
    Traditional:  { type: Boolean ,  default: false},
    Invisalign:  { type: Boolean,  default: false },
    Damon:  { type: Boolean, default: false },
    DamonClear:  { type: Boolean, default: false }
    },
 
  Retainer:
    {   
    Essix:  { type: Boolean ,  default: false},
    Fixed:  { type: Boolean,  default: false },
    Hawley:  { type: Boolean, default: false }
    },
 branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch", // Make sure this matches your Branch model name exactly
      required: false,
      default: null,
    },
    
  patientId: {
    
      type: mongoose.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Please provide Patient ID'],
    
    
  },
    changeHistory: [
    {
      updatedBy: userReferenceSchema, // Reusing your existing userReferenceSchema
      updateTime: { type: Date, default: Date.now }, // Automatically captures the update time
    },
  ],

  createdBy: userReferenceSchema,
}, { timestamps: true });

const Orthodontics = mongoose.models.Orthodontics || mongoose.model('Orthodontics', OrthodonticsSchema);

export default Orthodontics;