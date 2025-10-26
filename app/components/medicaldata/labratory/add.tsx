"use client";

import React, { useState, useMemo } from "react";
import PatientComponent from "@/app/components/patient/PatientComponent";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";

// ================== Reusable Components ==================
const InputField = ({
  label,
  id,
  name,
  value,
  onChange,
  isTextArea = false,
  error = "",
}: {
  label: string;
  id: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  isTextArea?: boolean;
  error?: string;
}) => (
  <div className="mt-6">
    <label htmlFor={id} className="block text-gray-700 font-semibold mb-2">
      {label}
    </label>
    {isTextArea ? (
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`border-2 p-4 rounded-md w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ease-in-out ${
          error ? "border-red-500" : "border-gray-300"
        }`}
        rows={Math.max(3, Math.ceil(value.length / 100))}
      />
    ) : (
      <input
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`border-2 p-4 rounded-md w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ease-in-out ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
    )}
    {error && <p className="text-red-500 mt-1 text-sm">{error}</p>}
  </div>
);

const CheckboxField = ({
  label,
  name,
  checked,
  onChange,
}: {
  label: string;
  name: string;
  checked?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="flex items-center space-x-4 mb-2">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      className="w-5 h-5 border-2 border-gray-300 rounded-md text-indigo-600 focus:ring-indigo-500 focus:ring-2 transition-all duration-200 ease-in-out"
    />
    <label className="text-gray-700 font-medium cursor-pointer select-none hover:text-indigo-600 transition-colors duration-200">
      {label}
    </label>
  </div>
);

// Tooth Chart Component
// Upper Tooth Chart Component
const UpperToothChart = ({
  value,
  onChange,
}: {
  value: string[];
  onChange: (newValue: string[]) => void;
}) => {
  const toothMap: { [key: string]: { label: string; universal: number }[] } = {
    "upper-left": Array.from({ length: 8 }, (_, index) => ({
      label: `U${8 - index}`, // Left side: U8, U7, U6, U5, U4, U3, U2, U1
      universal: 8 - index,
    })),
    "upper-right": Array.from({ length: 8 }, (_, index) => ({
      label: `U${9 + index}`, // Right side: U9, U10, U11, U12, U13, U14, U15, U16
      universal: 9 + index,
    })),
  };

  const initialSelected = new Set<string>(value);
  const [selected, setSelected] = useState<Set<string>>(initialSelected);

  const toggleTooth = (toothNumber: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(toothNumber)) {
      newSelected.delete(toothNumber);
    } else {
      newSelected.add(toothNumber);
    }
    setSelected(newSelected);
    const sorted = Array.from(newSelected).sort((a, b) => 
      parseInt(a.replace('U', '')) - parseInt(b.replace('U', ''))
    );
    onChange(sorted);
  };

  const renderQuadrant = (quadrant: string) => (
    <div className="flex space-x-2">
      {toothMap[quadrant].map(({ label, universal }) => (
        <div
          key={universal}
          onClick={() => toggleTooth(label)}
          className={`w-6 h-6 flex items-center justify-center cursor-pointer text-sm font-bold ${
            selected.has(label)
              ? "bg-blue-200 border-2 border-blue-500 rounded-full"
              : "border border-gray-300 rounded"
          }`}
        >
          {label.replace('U', '')}
        </div>
      ))}
    </div>
  );

  return (
    <div className="mt-6">
      <label className="block text-gray-700 font-semibold mb-2">
        Upper Teeth
      </label>
      
      {/* Selected teeth display box */}
      <div className="mb-4 p-3 bg-gray-100 rounded-md border border-gray-300 min-h-12">
        <span className="text-gray-700 font-medium">Selected Upper Teeth: </span>
        {selected.size > 0 ? (
          <span className="text-blue-600 font-semibold">
            {Array.from(selected)
              .sort((a, b) => parseInt(a.replace('U', '')) - parseInt(b.replace('U', '')))
              .map(t => t.replace('U', ''))
              .join(", ")}
          </span>
        ) : (
          <span className="text-gray-500 italic">No teeth selected</span>
        )}
      </div>
      
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          {renderQuadrant("upper-left")}
          <span className="mx-2">|</span>
          {renderQuadrant("upper-right")}
        </div>
      </div>
    </div>
  );
};

// Lower Tooth Chart Component
const LowerToothChart = ({
  value,
  onChange,
}: {
  value: string[];
  onChange: (newValue: string[]) => void;
}) => {
  const toothMap: { [key: string]: { label: string; universal: number }[] } = {
    "lower-left": Array.from({ length: 8 }, (_, index) => ({
      label: `L${8 - index}`, // Left side: L8, L7, L6, L5, L4, L3, L2, L1
      universal: 8 - index,
    })),
    "lower-right": Array.from({ length: 8 }, (_, index) => ({
      label: `L${9 + index}`, // Right side: L9, L10, L11, L12, L13, L14, L15, L16
      universal: 9 + index,
    })),
  };

  const initialSelected = new Set<string>(value);
  const [selected, setSelected] = useState<Set<string>>(initialSelected);

  const toggleTooth = (toothNumber: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(toothNumber)) {
      newSelected.delete(toothNumber);
    } else {
      newSelected.add(toothNumber);
    }
    setSelected(newSelected);
    const sorted = Array.from(newSelected).sort((a, b) => 
      parseInt(a.replace('L', '')) - parseInt(b.replace('L', ''))
    );
    onChange(sorted);
  };

  const renderQuadrant = (quadrant: string) => (
    <div className="flex space-x-2">
      {toothMap[quadrant].map(({ label, universal }) => (
        <div
          key={universal}
          onClick={() => toggleTooth(label)}
          className={`w-6 h-6 flex items-center justify-center cursor-pointer text-sm font-bold ${
            selected.has(label)
              ? "bg-green-200 border-2 border-green-500 rounded-full"
              : "border border-gray-300 rounded"
          }`}
        >
          {label.replace('L', '')}
        </div>
      ))}
    </div>
  );

  return (
    <div className="mt-6">
      <label className="block text-gray-700 font-semibold mb-2">
        Lower Teeth
      </label>
      
      {/* Selected teeth display box */}
      <div className="mb-4 p-3 bg-gray-100 rounded-md border border-gray-300 min-h-12">
        <span className="text-gray-700 font-medium">Selected Lower Teeth: </span>
        {selected.size > 0 ? (
          <span className="text-green-600 font-semibold">
            {Array.from(selected)
              .sort((a, b) => parseInt(a.replace('L', '')) - parseInt(b.replace('L', '')))
              .map(t => t.replace('L', ''))
              .join(", ")}
          </span>
        ) : (
          <span className="text-gray-500 italic">No teeth selected</span>
        )}
      </div>
      
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          {renderQuadrant("lower-left")}
          <span className="mx-2">|</span>
          {renderQuadrant("lower-right")}
        </div>
      </div>
    </div>
  );
};

// ================== Page ==================
type DentalLabFormProps = {
  params: { id: string };
};

export default function DentalLabFormPage({ params }: DentalLabFormProps) {
  const patientId = params.id;
  const router = useRouter();
  const { data: session } = useSession();

  const role = useMemo(() => session?.user?.role || "", [session]);

  const [formData, setFormData] = useState({
    deliveryDate: "",
    toothNumbers: [] as string[], // Moved to root level
    toothNumberTwo: [] as string[],
    restoration: {
      jointCrown: false,
      separateCrown: false,
      bridge: false,
      other: false,
    },
    enclosedWith: {
      impUpper: false,
      impLower: false,
      vite: false,
      modelUpper: false,
      modelLower: false,
      bite: false,
      other: false,
    },
    material: {
      pfm: false,
      pfmFacing: false,
      fullMetal: false,
      tiliteFacing: false,
      tilite: false,
      tiliteFullMetal: false,
      tiliteInlayOnlay: false,
      ywPFM: false,
      ywFacing: false,
      ywFullMetal: false,
      bruxzirCrown: false,
      bruxzirBridge: false,
      bruxzirInlayOnlay: false,
      ywUltraTCrown: false,
      ywUltraTBridge: false,
      ywZirconCrown: false,
      ywZirconBridge: false,
      lavaPremium: false,
      lavaClassic: false,
      lavaEssential: false,
      ipsEmaxSingleCrown: false,
      ipsEmaxLaminate: false,
      ipsEmaxInlayOnlay: false,
      ipsEmpressSingleCrown: false,
      ipsEmpressLaminate: false,
      ipsEmpressInlayOnlay: false,
      mockup: false,
      provisional: false,
    },
    shade: {
      code: "",
      diagram: "",
    },
    margin: {
      shoulderMargin: false,
      gingivalMargin: false,
      none: false,
    },
    occlusalStaining: {
      none: false,
      light: false,
      medium: false,
      dark: false,
    },
    occlusalClearance: {
      callDoctor: false,
      markOpposing: false,
      metalIsland: false,
    },
    stage: {
      metalTryIn: false,
      copingTryIn: false,
      bisqueTryIn: false,
      finish: false,
    },
    ponticDesign: {
      modifiedRidge: false,
      fullRidge: false,
      hygienic: false,
      ovate: false,
    },
    collarDesign: {
      noCollar: false,
      lingualCollar: false,
      collar360: false,
    },
    specifications: "",
    notes: "",
  });

  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formType, setFormType] = useState<"success" | "error" | null>(null);

const handleInputChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
) => {
  const { name, value } = e.target;
  
  if (name.includes('.')) {
    // Handle nested fields like shade.code, shade.diagram
    const [parent, child] = name.split('.');
    setFormData(prev => {
      const parentValue = prev[parent as keyof typeof prev];
      
      // Ensure the parent value is an object before spreading
      if (typeof parentValue === 'object' && parentValue !== null) {
        return {
          ...prev,
          [parent]: {
            ...parentValue,
            [child]: value
          }
        };
      } else {
        // If parent is not an object, create a new object
        return {
          ...prev,
          [parent]: {
            [child]: value
          }
        };
      }
    });
  } else {
    // Handle flat fields
    setFormData(prev => ({ ...prev, [name]: value }));
  }
};

  // Handle tooth numbers change for upper teeth (now at root level)
  const handleToothNumbersChange = (newValue: string[]) => {
    setFormData(prev => ({
      ...prev,
      toothNumbers: newValue
    }));
  };
  // Handle tooth numbers change for lower teeth (now at root level)
  const handleToothNumbersTwoChange = (newValue: string[]) => {
    setFormData(prev => ({
      ...prev,
      toothNumberTwo: newValue
    }));
  };

  // Handle checkbox changes for nested objects
  const handleNestedCheckboxChange = (path: string[], value: boolean) => {
    setFormData(prev => {
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);
    setFormType(null);

    try {
      const response = await fetch(`/api/labratory/${patientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        setFormMessage("Error creating Dental Lab Form.");
        setFormType("error");
        return;
      }

      setFormMessage("Dental Lab Form created successfully!");
      setFormType("success");

      router.push(`/${role}/labratory/all/${patientId}`);
    } catch (error) {
      console.error("Error:", error);
      setFormMessage("Unexpected error occurred.");
      setFormType("error");
    }
  };

  return (
    <div className="flex m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-4">
        <div className="flex space-x-8">
          {/* Patient Details */}
          <div className="w-1/3 p-4">
            <PatientComponent params={params} />
          </div>

          {/* Dental Lab Form */}
          <div className="w-2/3 bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6">Create Dental Lab Form</h1>
            <form onSubmit={handleSubmit}>
              <div className="mt-6">
                <label htmlFor="deliveryDate" className="block text-gray-700 font-semibold mb-2">
                  Delivery Date
                </label>
                <input
                  type="date"
                  id="deliveryDate"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleInputChange}
                  className="border-2 p-4 rounded-md w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Enclosed With Types */}
              <div className="mt-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  Enclosed With Types
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <CheckboxField
                    label="Imp Upper"
                    name="impUpper"
                    checked={formData.enclosedWith.impUpper}
                    onChange={(e) =>
                      handleNestedCheckboxChange(['enclosedWith', 'impUpper'], e.target.checked)
                    }
                  />
                  <CheckboxField
                    label="Imp Lower"
                    name="impLower"
                    checked={formData.enclosedWith.impLower}
                    onChange={(e) =>
                      handleNestedCheckboxChange(['enclosedWith', 'impLower'], e.target.checked)
                    }
                  />
                  <CheckboxField
                    label="Vite"
                    name="vite"
                    checked={formData.enclosedWith.vite}
                    onChange={(e) =>
                      handleNestedCheckboxChange(['enclosedWith', 'vite'], e.target.checked)
                    }
                  />
                  <CheckboxField
                    label="Model Upper"
                    name="modelUpper"
                    checked={formData.enclosedWith.modelUpper}
                    onChange={(e) =>
                      handleNestedCheckboxChange(['enclosedWith', 'modelUpper'], e.target.checked)
                    }
                  />
                  <CheckboxField
                    label="Model Lower"
                    name="modelLower"
                    checked={formData.enclosedWith.modelLower}
                    onChange={(e) =>
                      handleNestedCheckboxChange(['enclosedWith', 'modelLower'], e.target.checked)
                    }
                  />
                  <CheckboxField
                    label="Bite"
                    name="bite"
                    checked={formData.enclosedWith.bite}
                    onChange={(e) =>
                      handleNestedCheckboxChange(['enclosedWith', 'bite'], e.target.checked)
                    }
                  />
                  <CheckboxField
                    label="Other"
                    name="other"
                    checked={formData.enclosedWith.other}
                    onChange={(e) =>
                      handleNestedCheckboxChange(['enclosedWith', 'other'], e.target.checked)
                    }
                  />
                </div>
              </div>
              {/* Restoration Types */}
              <div className="mt-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  Restoration Types
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <CheckboxField
                    label="Joint Crown"
                    name="jointCrown"
                    checked={formData.restoration.jointCrown}
                    onChange={(e) =>
                      handleNestedCheckboxChange(['restoration', 'jointCrown'], e.target.checked)
                    }
                  />
                  <CheckboxField
                    label="Separate Crown"
                    name="separateCrown"
                    checked={formData.restoration.separateCrown}
                    onChange={(e) =>
                      handleNestedCheckboxChange(['restoration', 'separateCrown'], e.target.checked)
                    }
                  />
                  <CheckboxField
                    label="Bridge"
                    name="bridge"
                    checked={formData.restoration.bridge}
                    onChange={(e) =>
                      handleNestedCheckboxChange(['restoration', 'bridge'], e.target.checked)
                    }
                  />
                  <CheckboxField
                    label="Other"
                    name="other"
                    checked={formData.restoration.other}
                    onChange={(e) =>
                      handleNestedCheckboxChange(['restoration', 'other'], e.target.checked)
                    }
                  />
                </div>
              </div>

              {/* Upper Tooth Numbers */}
     <div className="mt-6">
                <UpperToothChart
                  value={formData.toothNumbers}
                  onChange={handleToothNumbersChange}
                />
              </div>

              {/* Lower Tooth Numbers */}
              <div className="mt-6">
                <LowerToothChart
                  value={formData.toothNumberTwo}
                  onChange={handleToothNumbersTwoChange}
                />
              </div>


              {/* Materials */}
              <div className="mt-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  Materials
                </label>

                {/* Non-Precious */}
                <h4 className="text-sm font-semibold text-blue-600 mt-2">Non-Precious</h4>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <CheckboxField
                    label="PFM"
                    name="pfm"
                    checked={formData.material.pfm}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'pfm'], e.target.checked)}
                  />
                  <CheckboxField
                    label="PFM Facing"
                    name="pfmFacing"
                    checked={formData.material.pfmFacing}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'pfmFacing'], e.target.checked)}
                  />
                  <CheckboxField
                    label="Full Metal"
                    name="fullMetal"
                    checked={formData.material.fullMetal}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'fullMetal'], e.target.checked)}
                  />
                </div>

                {/* Tilite CAD/CAM */}
                <h4 className="text-sm font-semibold text-blue-600 mt-4">Tilite CAD/CAM</h4>
                <div className="grid grid-cols-3 gap-2 mt-2">
                    <CheckboxField
                    label="Tilite Facing"
                    name="tiliteFacing"
                    checked={formData.material.tiliteFacing}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'tiliteFacing'], e.target.checked)}
                  />
                  <CheckboxField
                    label="Tilite"
                    name="tilite"
                    checked={formData.material.tilite}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'tilite'], e.target.checked)}
                  />
                  <CheckboxField
                    label="Tilite Full Metal"
                    name="tiliteFullMetal"
                    checked={formData.material.tiliteFullMetal}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'tiliteFullMetal'], e.target.checked)}
                  />
                  <CheckboxField
                    label="Tilite Inlay/Onlay"
                    name="tiliteInlayOnlay"
                    checked={formData.material.tiliteInlayOnlay}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'tiliteInlayOnlay'], e.target.checked)}
                  />
                </div>

                {/* 5YW PFM CAD/CAM */}
                <h4 className="text-sm font-semibold text-blue-600 mt-4">5YW PFM CAD/CAM</h4>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <CheckboxField
                    label="5YW PFM"
                    name="ywPFM"
                    checked={formData.material.ywPFM}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'ywPFM'], e.target.checked)}
                  />
                  <CheckboxField
                    label="5YW Facing"
                    name="ywFacing"
                    checked={formData.material.ywFacing}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'ywFacing'], e.target.checked)}
                  />
                  <CheckboxField
                    label="5YW Full Metal"
                    name="ywFullMetal"
                    checked={formData.material.ywFullMetal}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'ywFullMetal'], e.target.checked)}
                  />

                  
                </div>

                {/* Bruxzir */}
                <h4 className="text-sm font-semibold text-blue-600 mt-4">Bruxzir</h4>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <CheckboxField
                    label="Bruxzir Crown"
                    name="bruxzirCrown"
                    checked={formData.material.bruxzirCrown}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'bruxzirCrown'], e.target.checked)}
                  />
                  <CheckboxField
                    label="Bruxzir Bridge"
                    name="bruxzirBridge"
                    checked={formData.material.bruxzirBridge}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'bruxzirBridge'], e.target.checked)}
                  />
                  <CheckboxField
                    label="Bruxzir Inlay/Onlay"
                    name="bruxzirInlayOnlay"
                    checked={formData.material.bruxzirInlayOnlay}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'bruxzirInlayOnlay'], e.target.checked)}
                  />
                </div>

                {/* 5YW Ultra T */}
                <h4 className="text-sm font-semibold text-blue-600 mt-4">5YW Ultra T</h4>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <CheckboxField
                    label="5YW Ultra T Crown"
                    name="ywUltraTCrown"
                    checked={formData.material.ywUltraTCrown}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'ywUltraTCrown'], e.target.checked)}
                  />
                  <CheckboxField
                    label="5YW Ultra T Bridge"
                    name="ywUltraTBridge"
                    checked={formData.material.ywUltraTBridge}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'ywUltraTBridge'], e.target.checked)}
                  />
                </div>

                {/* 5YW Zircon */}
                <h4 className="text-sm font-semibold text-blue-600 mt-4">5YW Zircon</h4>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <CheckboxField
                    label="5YW Zircon Crown"
                    name="ywZirconCrown"
                    checked={formData.material.ywZirconCrown}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'ywZirconCrown'], e.target.checked)}
                  />
                  <CheckboxField
                    label="5YW Zircon Bridge"
                    name="ywZirconBridge"
                    checked={formData.material.ywZirconBridge}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'ywZirconBridge'], e.target.checked)}
                  />
                </div>

                {/* Lava */}
                <h4 className="text-sm font-semibold text-blue-600 mt-4">Lava</h4>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <CheckboxField
                    label="Lava Premium"
                    name="lavaPremium"
                    checked={formData.material.lavaPremium}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'lavaPremium'], e.target.checked)}
                  />
                  <CheckboxField
                    label="Lava Classic"
                    name="lavaClassic"
                    checked={formData.material.lavaClassic}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'lavaClassic'], e.target.checked)}
                  />
                  <CheckboxField
                    label="Lava Essential"
                    name="lavaEssential"
                    checked={formData.material.lavaEssential}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'lavaEssential'], e.target.checked)}
                  />
                </div>

                {/* IPS e.max */}
                <h4 className="text-sm font-semibold text-blue-600 mt-4">IPS e.max</h4>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <CheckboxField
                    label="IPS e.max Single Crown"
                    name="ipsEmaxSingleCrown"
                    checked={formData.material.ipsEmaxSingleCrown}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'ipsEmaxSingleCrown'], e.target.checked)}
                  />
                  <CheckboxField
                    label="IPS e.max Laminate"
                    name="ipsEmaxLaminate"
                    checked={formData.material.ipsEmaxLaminate}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'ipsEmaxLaminate'], e.target.checked)}
                  />
                  <CheckboxField
                    label="IPS e.max Inlay/Onlay"
                    name="ipsEmaxInlayOnlay"
                    checked={formData.material.ipsEmaxInlayOnlay}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'ipsEmaxInlayOnlay'], e.target.checked)}
                  />
                </div>

                {/* IPS Empress */}
                <h4 className="text-sm font-semibold text-blue-600 mt-4">IPS Empress</h4>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <CheckboxField
                    label="IPS Empress Single Crown"
                    name="ipsEmpressSingleCrown"
                    checked={formData.material.ipsEmpressSingleCrown}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'ipsEmpressSingleCrown'], e.target.checked)}
                  />
                  <CheckboxField
                    label="IPS Empress Laminate"
                    name="ipsEmpressLaminate"
                    checked={formData.material.ipsEmpressLaminate}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'ipsEmpressLaminate'], e.target.checked)}
                  />
                  <CheckboxField
                    label="IPS Empress Inlay/Onlay"
                    name="ipsEmpressInlayOnlay"
                    checked={formData.material.ipsEmpressInlayOnlay}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'ipsEmpressInlayOnlay'], e.target.checked)}
                  />
                </div>

                {/* Other Materials */}
                <h4 className="text-sm font-semibold text-blue-600 mt-4">Miscellaneous</h4>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <CheckboxField
                    label="Mockup"
                    name="mockup"
                    checked={formData.material.mockup}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'mockup'], e.target.checked)}
                  />
                  <CheckboxField
                    label="Provisional"
                    name="provisional"
                    checked={formData.material.provisional}
                    onChange={(e) => handleNestedCheckboxChange(['material', 'provisional'], e.target.checked)}
                  />
                </div>
              </div>

              {/* Shade */}
              <div className="mt-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  Shade
                </label>
                <div className="flex items-center space-x-4">
                  
                   <Image
                                                                src="/assets/laba.png" // Path to your image
                                                                alt="Example Image"
                                                                width={100}  // Desired width
                                                                height={50} // Desired height
                                                                priority  
                                                              />
                  <InputField
                    label=""
                    id="shadeCode"
                    name="shade.code"
                    value={formData.shade.code}
                    onChange={handleInputChange}
                  />
                  
                </div>
              </div>

              {/* Margin */}
              <div className="mt-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  Margin
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <CheckboxField
                    label="Shoulder Margin"
                    name="shoulderMargin"
                    checked={formData.margin.shoulderMargin}
                    onChange={(e) => handleNestedCheckboxChange(['margin', 'shoulderMargin'], e.target.checked)}
                  />
                  <CheckboxField
                    label="Gingival Margin"
                    name="gingivalMargin"
                    checked={formData.margin.gingivalMargin}
                    onChange={(e) => handleNestedCheckboxChange(['margin', 'gingivalMargin'], e.target.checked)}
                  />
                  <CheckboxField
                    label="None"
                    name="noneMargin"
                    checked={formData.margin.none}
                    onChange={(e) => handleNestedCheckboxChange(['margin', 'none'], e.target.checked)}
                  />
                </div>
              </div>

              {/* Occlusal Staining */}
              <div className="mt-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  Occlusal Staining
                </label>
                <div className="grid grid-cols-4 gap-4">
                  <CheckboxField
                    label="None"
                    name="noneStaining"
                    checked={formData.occlusalStaining.none}
                    onChange={(e) => handleNestedCheckboxChange(['occlusalStaining', 'none'], e.target.checked)}
                  />
                  <CheckboxField
                    label="Light"
                    name="lightStaining"
                    checked={formData.occlusalStaining.light}
                    onChange={(e) => handleNestedCheckboxChange(['occlusalStaining', 'light'], e.target.checked)}
                  />
                  <CheckboxField
                    label="Medium"
                    name="mediumStaining"
                    checked={formData.occlusalStaining.medium}
                    onChange={(e) => handleNestedCheckboxChange(['occlusalStaining', 'medium'], e.target.checked)}
                  />
                  <CheckboxField
                    label="Dark"
                    name="darkStaining"
                    checked={formData.occlusalStaining.dark}
                    onChange={(e) => handleNestedCheckboxChange(['occlusalStaining', 'dark'], e.target.checked)}
                  />
                </div>
              </div>

              {/* Occlusal Clearance */}
              <div className="mt-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  Occlusal Clearance
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <CheckboxField
                    label="Call Doctor"
                    name="callDoctor"
                    checked={formData.occlusalClearance.callDoctor}
                    onChange={(e) => handleNestedCheckboxChange(['occlusalClearance', 'callDoctor'], e.target.checked)}
                  />
                  <CheckboxField
                    label="Mark Opposing"
                    name="markOpposing"
                    checked={formData.occlusalClearance.markOpposing}
                    onChange={(e) => handleNestedCheckboxChange(['occlusalClearance', 'markOpposing'], e.target.checked)}
                  />
                  <CheckboxField
                    label="Metal Island"
                    name="metalIsland"
                    checked={formData.occlusalClearance.metalIsland}
                    onChange={(e) => handleNestedCheckboxChange(['occlusalClearance', 'metalIsland'], e.target.checked)}
                  />
                </div>
              </div>

              {/* Stage */}
              <div className="mt-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  Stage
                </label>
                <div className="grid grid-cols-4 gap-4">
                  <CheckboxField
                    label="Metal Try-In"
                    name="metalTryIn"
                    checked={formData.stage.metalTryIn}
                    onChange={(e) => handleNestedCheckboxChange(['stage', 'metalTryIn'], e.target.checked)}
                  />
                  <CheckboxField
                    label="Coping Try-In"
                    name="copingTryIn"
                    checked={formData.stage.copingTryIn}
                    onChange={(e) => handleNestedCheckboxChange(['stage', 'copingTryIn'], e.target.checked)}
                  />
                  <CheckboxField
                    label="Bisque Try-In"
                    name="bisqueTryIn"
                    checked={formData.stage.bisqueTryIn}
                    onChange={(e) => handleNestedCheckboxChange(['stage', 'bisqueTryIn'], e.target.checked)}
                  />
                  <CheckboxField
                    label="Finish"
                    name="finish"
                    checked={formData.stage.finish}
                    onChange={(e) => handleNestedCheckboxChange(['stage', 'finish'], e.target.checked)}
                  />
                </div>
              </div>

              {/* Pontic Design */}
              <div className="mt-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  Pontic Design
                </label>
                
                   <Image
                                                                src="/assets/labj.png" // Path to your image
                                                                alt="Example Image"
                                                                width={600}  // Desired width
                                                                height={50} // Desired height
                                                                priority  
                                                              />
                <div className="grid grid-cols-4 gap-4">
                  <CheckboxField
                    label="Modified Ridge"
                    name="modifiedRidge"
                    checked={formData.ponticDesign.modifiedRidge}
                    onChange={(e) => handleNestedCheckboxChange(['ponticDesign', 'modifiedRidge'], e.target.checked)}
                  />
                  <CheckboxField
                    label="Full Ridge"
                    name="fullRidge"
                    checked={formData.ponticDesign.fullRidge}
                    onChange={(e) => handleNestedCheckboxChange(['ponticDesign', 'fullRidge'], e.target.checked)}
                  />
                  <CheckboxField
                    label="Hygienic"
                    name="hygienic"
                    checked={formData.ponticDesign.hygienic}
                    onChange={(e) => handleNestedCheckboxChange(['ponticDesign', 'hygienic'], e.target.checked)}
                  />
                  <CheckboxField
                    label="Ovate"
                    name="ovate"
                    checked={formData.ponticDesign.ovate}
                    onChange={(e) => handleNestedCheckboxChange(['ponticDesign', 'ovate'], e.target.checked)}
                  />
                </div>
              </div>

              {/* Collar Design */}
              <div className="mt-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  Collar Design
                </label>
                 <Image
                                                                src="/assets/laby.png" // Path to your image
                                                                alt="Example Image"
                                                                width={600}  // Desired width
                                                                height={50} // Desired height
                                                                priority  
                                                              />
                <div className="grid grid-cols-3 gap-4">
                  <CheckboxField
                    label="No Collar"
                    name="noCollar"
                    checked={formData.collarDesign.noCollar}
                    onChange={(e) => handleNestedCheckboxChange(['collarDesign', 'noCollar'], e.target.checked)}
                  />
                  <CheckboxField
                    label="Lingual Collar"
                    name="lingualCollar"
                    checked={formData.collarDesign.lingualCollar}
                    onChange={(e) => handleNestedCheckboxChange(['collarDesign', 'lingualCollar'], e.target.checked)}
                  />
                  <CheckboxField
                    label="Collar 360°"
                    name="collar360"
                    checked={formData.collarDesign.collar360}
                    onChange={(e) => handleNestedCheckboxChange(['collarDesign', 'collar360'], e.target.checked)}
                  />
                </div>
              </div>

              {/* Specifications */}
              <InputField
                label="Specifications"
                id="specifications"
                name="specifications"
                value={formData.specifications}
                onChange={handleInputChange}
                isTextArea={true}
              />

              {/* Notes */}
              <InputField
                label="Notes"
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                isTextArea={true}
              />

              {/* Submit Button */}
              <div className="mt-8">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Create Dental Lab Form
                </button>
              </div>

              {/* Form Message */}
              {formMessage && (
                <div
                  className={`mt-4 p-3 rounded-md ${
                    formType === "success"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {formMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}