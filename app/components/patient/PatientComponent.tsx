"use client";

import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { DownOutlined } from '@ant-design/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


type Organization = {
  _id: string;
  organization: string;
};
type branch = {
    _id: string;

  name : string
}
export interface IUserinfoItem {
  BloodPressure: boolean;
  Hypotension: boolean;
  Diabetics: boolean;
  BleedingTendency: boolean;
  Tuberculosis: boolean;
  Epilepsy: boolean;
  Hepatitis: boolean;
  Allergies: boolean;
  Asthma: boolean;
  IfAnydrugstaking: boolean;
  Pregnancy: boolean;
  IfanyotherDiseases?: string;
}

type Healthinfo = {
  _id: string;
  bloodgroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | '';
  weight?: string | null;
  height?: string | null;
  allergies?: string | null;
  habits?: string | null;
  Medication?: string | null;
  Core_Temperature: string;
  Respiratory_Rate: string;
  Blood_Oxygen: string;
  Blood_Pressure: string;
  heart_Rate: string;
  Hypotension: string;
  Hypertension:string;
  Tuberculosis: string;
  Astema: string;
  description: string;
  Hepatitis: string;
  Diabetics: string;
  BleedingTendency: string;
  Epilepsy: string;
  userinfo: IUserinfoItem[];
};

export type Patient = {
  _id: string;
  cardno?: string;
  firstname?: string;
    Address?: string;
  DOB?: number;
    price?: number;
  Advance?: number;
  finish?: boolean;
  age?: string;
  sex?: string;
  phoneNumber?: string;
  Town?: string;
  KK?: string;
  HNo?: string;
  description?: string;
  Region: string;
  Woreda: string;
  disablity: boolean;
  credit?: boolean;
  Locked?: boolean;
  createdAt?: string;
  branch: branch;
  Orgnazation: Organization[]; 
  Healthinfo: Healthinfo[];
};

type PatientDetailsProps = {
  params: {
    id: string;
  };
};

const PatientComponent: React.FC<PatientDetailsProps> = ({ params }) => {
  const patientId = params.id;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAllergies, setExpandedAllergies] = useState<Record<string, boolean>>({});
    const { data: session } = useSession();

  const role = useMemo(() => session?.user?.role || '', [session]);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`/api/patient/registerdata/${patientId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        setPatient(prev => ({
          ...response.data,
          finish: response.data.finish ?? false, // Ensure default value
        }));
    console.log(response.data)
        
        // Initialize expanded state for allergies
        if (response.data?.Healthinfo) {
          const initialExpandedState: Record<string, boolean> = {};
          response.data.Healthinfo.forEach(info => {
            if (info.allergies) {
              initialExpandedState[info._id] = false;
            }
          });
          setExpandedAllergies(initialExpandedState);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Error fetching user details.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [patientId]);


  const [updatingFinish, setUpdatingFinish] = useState(false);

  const toggleFinish = async () => {
    if (!patient) return;
    setUpdatingFinish(true);
    try {
      const response = await axios.patch(`/api/patient/${patient._id}`, {
        finish: !patient.finish,
      });
      setPatient(response.data.data);
    } catch (error) {
      console.error("Failed to update finish status", error);
    } finally {
      setUpdatingFinish(false);
    }
  };
  

  const renderDetail = (label: string, value?: string | number | null) => {
    if (value) {
      return (
        <div className="flex flex-col mb-4">
          <h2 className="font-semibold text-gray-600">{label}</h2>
          <p className="text-gray-800">{value}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!patient) return <div>Patient not found</div>;
 


  return (
    <div className="bg-white h-auto p-3 rounded-lg shadow-md">
      <div className="flex bg-white flex-col items-center space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold capitalize">{patient.firstname}</h1>
          <p className="text-gray-600">{patient.phoneNumber}</p>
          <p className="text-gray-600">{patient.age} yrs</p>
                        <p className="text-gray-600">Branch: {patient?.branch?.name}</p>

          {(patient.credit || patient.disablity) && (
            <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-md inline-block">
              {patient.credit && <span>Credit</span>}
            </div>
          )}

          <p className="text-gray-600">
            {new Date(patient.createdAt || "").toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
          
          {patient.Orgnazation && patient.Orgnazation.length > 0 && (
            <div className="mt-2 p-2 bg-blue-100 text-blue-800 border border-blue-300 rounded-md inline-block">
              <span>Organization: {patient.Orgnazation[0].organization}</span>
            </div>
          )}
            
          
          {/* Enhanced Allergies Section */}
         {/* Display User Info (IUserinfoItem) */}
         {patient.Healthinfo &&
  patient.Healthinfo.length > 0 &&
  patient.Healthinfo.some(info => info.allergies) && (
    <div className="mt-2 p-2 bg-red-100 text-red-800 border border-red-300 rounded-md inline-flex flex-wrap gap-2 max-w-full">
      <span className="font-semibold">Allergies:</span>
      {patient.Healthinfo
        .filter(info => info.allergies)
        .map((info, ) => (
          <span
            key={info._id.toString()}
            className="underline decoration-red-500 px-2 whitespace-nowrap"
          >
            {info.allergies}
          </span>
        ))}
    </div>
)}



    {patient.Healthinfo && patient.Healthinfo.length > 0 && (
  <div className="mt-6 w-full ">
    <h3 className="font-bold text-lg mb-2"> Health Info</h3>
    <div className="grid grid-cols-1 ">
      {patient.Healthinfo.map((info) => {
        const fields = [
          { key: "bloodgroup", label: "Blood Group", value: info.bloodgroup },
          { key: "height", label: "Height", value: info.height },
          { key: "weight", label: "Weight", value: info.weight },
          { key: "Hypertension", label: "Hypertension", value: info.Hypertension },
          { key: "Hypotension", label: "Hypotension", value: info.Hypotension },
          { key: "Tuberculosis", label: "Tuberculosis", value: info.Tuberculosis },
          { key: "Diabetics", label: "Diabetics", value: info.Diabetics },
          { key: "Hepatitis", label: "Hepatitis", value: info.Hepatitis },
          { key: "Epilepsy", label: "Epilepsy", value: info.Epilepsy },
          { key: "BleedingTendency", label: "Bleeding Tendency", value: info.BleedingTendency },
          { key: "Medication", label: "Medication", value: info.Medication },
          { key: "habits", label: "Habits", value: info.habits },
          
          { key: "description", label: "Description", value: info.description },
        ].filter(field => field.value);

        const primaryFields = fields.slice(0, 4);
        const additionalFields = fields.slice(4);
        const hasAdditionalFields = additionalFields.length > 0;
        const isExpanded = expandedAllergies[info._id];

        return (
          <div key={info._id} className="bg-white p-0">
            {/* Primary Fields - Compact 4-column layout */}
            <div className="grid grid-cols-4 gap-0">
              {primaryFields.map((field) => (
                <div key={field.key} className="col-span-1 p-0 bg-green-100">
                  <p className="text-xs font-medium text-gray-500">{field.label}</p>
                  <p className="text-sm">{field.value}</p>
                </div>
              ))}
            </div>

            {/* Additional Fields - Only shown when expanded */}
            {isExpanded && (
              <div className="grid grid-cols-4 gap-0 mt-2">
                {additionalFields.map((field) => (
                  <div key={field.key} className="col-span-1 p-0 bg-green-100">
                    <p className="text-xs font-medium text-gray-500">{field.label}</p>
                    <p className="text-sm">{field.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Show More/Less button */}
            {hasAdditionalFields && (
              <button
                className="mt-1 text-blue-500 text-xs hover:underline p-0"
                onClick={() => setExpandedAllergies(prev => ({
                  ...prev,
                  [info._id]: !prev[info._id]
                }))}
              >
                {isExpanded ? "Show Less" : "Show More"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  </div>
)}

        </div>

        <div className="p-4 rounded-lg shadow-md w-full max-h-64 overflow-y-auto">
          {renderDetail('Card No', patient.cardno)}
          {renderDetail('Sex', patient.sex)}
          {renderDetail('Town', patient.Town)}
          {renderDetail('K/K', patient.KK)}

           {renderDetail('Address', patient.Address)}
          {renderDetail('DOB', patient.DOB)}

           {renderDetail('Total Price', patient.price)}
          {renderDetail('Advance', patient.Advance)}
{renderDetail(
  'Remaining Amount',
  typeof patient.price === 'number' && typeof patient.Advance === 'number'
    ? (patient.price - patient.Advance).toFixed(2)
    : patient.price
      ? patient.price.toFixed(2)
      : '0.00'
)}

          {renderDetail('House No', patient.HNo)}
          {renderDetail('Description', patient.description)}
          {renderDetail('Region', patient.Region)}
          {renderDetail('Woreda', patient.Woreda)}
        </div>
        <div className="flex items-center gap-4 mt-2">
  <span className="text-sm text-gray-600 font-semibold">Finished:</span>
  <button
    onClick={toggleFinish}
    disabled={updatingFinish}
    className={`px-4 py-1 rounded-full text-white text-sm ${
      patient.finish ? 'bg-green-600' : 'bg-red-500'
    }`}
  >
    {updatingFinish ? 'Updating...' : patient.finish ? 'On' : 'Off'}
  </button>
 <p>{ patient.Locked ? 'Locked' : ''}</p>
</div>
  
        {/* Links Based on Role */}
        {role === "admin" && (
        <>
         
          <DropdownMenu>
            <DropdownMenuTrigger className="bg-gray-500 text-white px-4 py-2 rounded-md">
              <span> Dental records</span>
              <DownOutlined />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 max-h-96 overflow-y-auto bg-white shadow-lg rounded-md p-2">
             
              <DropdownMenuSeparator />
              {[
                { label: "Dental Records", href: `/admin/medicaldata/medicalhistory/all/${patientId}` },
                { label: "Health Information", href: `/admin/medicaldata/healthinfo/all/${patientId}` },
                { label: "Consent", href: `/admin/Consent/all/${patientId}` },
                { label: "Orthodontics", href: `/admin/Orthodontics/all/${patientId}` },
                { label: "Prescriptions", href: `/admin/prescriptions/all/${patientId}` },
                { label: "Medical Certificate", href: `/admin/medicalcertificate/all/${patientId}` },
                { label: "Referral", href: `/admin/referral/all/${patientId}` },
                { label: "FNA or Biosy Request ", href: `/admin/FNA/all/${patientId}` },
                                                { label: "DentalChart ", href: `/admin/DentalChart/${patientId}` },

              ].map(({ label, href }) => (
                <DropdownMenuItem asChild key={label}>
                  <Link
                    href={href}
                    className="w-full flex items-center justify-between p-2 hover:bg-gray-200 text-gray-600 rounded-lg shadow-md transition"
                  >
                    <span className="text-lg p-2 ">{label}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu> 
          <div >
            {[
              { label: "All Invoices", href: `/admin/finace/Invoice/all/${patientId}` },
              { label: "Proforma", href: `/admin/Performa/all/${patientId}` },
              { label: "Note", href:` /admin/Note/all/${patientId}` },
              { label: "Labratory", href: `/admin/labratory/all/${patientId}` },
              { label: "Card", href: `/admin/card/all/${patientId}` },
              { label: "Appointments", href: `/admin/medicaldata/appointment/all/${patientId}` },
              { label: "Images", href: `/admin/medicaldata/image/all/${patientId}` },
              { label: "Credit", href: `/admin/creadit/all/${patientId}` },
              { label: "Organization", href: `/admin/organization/all/${patientId}` },
    
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="w-full flex items-center justify-between mb-3 bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
              >
                <span >{label}</span>
              </Link>
            ))}
          </div>
        </>
      )}



        {role === 'reception' && (
          <>
            <Link
              href={`/reception/card/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Card</span>
            </Link>
            <Link
              href={`/reception/medicaldata/medicalhistory/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Dental Record</span>
            </Link>
            <Link
              href={`/reception/Consent/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Consent</span>
            </Link>
            <Link
              href={`/reception/appointment/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Appointments</span>
            </Link>
            <Link
              href={`/reception/Note/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Note</span>
            </Link>
            <Link
              href={`/reception/allinvoice/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Invoice</span>
            </Link>
            <Link
              href={`/reception/image/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Images</span>
            </Link>
            <Link
              href={`/reception/organization/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Add Credit Organization</span>
            </Link>
            <Link
              href={`/reception/creadit/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Credit</span>
            </Link>
            <Link
            href={`/reception/prescriptions/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Prescriptions

              </span>
            </Link>
            <Link
            href={`/reception/Performa/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Proforma

              </span>
            </Link>
            <Link
              href={`/reception/medicalcertificate/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Medical Certificate</span>
            </Link>
            <Link
              href={`/reception/Orthodontics/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Orthodontic Record</span>
            </Link>
            <Link
              href={`/reception/referral/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Referral</span>
            </Link>
            <Link
              href={`/reception/FNA/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>FNA</span>
            </Link>
          </>
        )}
         {role === 'nurse' && (
          <>
            <Link
              href={`/nurse/medicaldata/healthinfo/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Health Information</span>
            </Link>
            <Link
              href={`/nurse/card/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Card</span>
            </Link>
            <Link
              href={`/nurse/medicaldata/medicalhistory/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Dental Record</span>
            </Link>
            <Link
              href={`/nurse/Consent/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Consent</span>
            </Link>
            <Link
              href={`/nurse/appointment/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Appointments</span>
            </Link>
            <Link
              href={`/nurse/Note/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Note</span>
            </Link>
            <Link
              href={`/nurse/allinvoice/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Invoice</span>
            </Link>
            <Link
              href={`/nurse/image/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Images</span>
            </Link>
            <Link
              href={`/nurse/organization/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Add Credit Organization</span>
            </Link>
            <Link
              href={`/nurse/creadit/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Credit</span>
            </Link>
            <Link
            href={`/nurse/prescriptions/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Prescriptions

              </span>
            </Link>
            <Link
            href={`/nurse/Performa/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Proforma

              </span>
            </Link>
            <Link
              href={`/nurse/medicalcertificate/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Medical Certificate</span>
            </Link>
            <Link
              href={`/nurse/Orthodontics/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Orthodontic Record</span>
            </Link>
            <Link
              href={`/nurse/referral/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Referral</span>
            </Link>
            <Link
              href={`/nurse/FNA/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>FNA</span>
            </Link>
          </>
        )}
         {role === 'labratory' && (
          <>
            <Link
              href={`/labratory/labratory/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>labratory</span>
            </Link>
              <Link
              href={`/labratory/medicaldata/healthinfo/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Health Information</span>
            </Link>
            <Link
              href={`/labratory/card/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Card</span>
            </Link>
            <Link
              href={`/labratory/medicaldata/medicalhistory/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Dental Record</span>
            </Link>
            <Link
              href={`/labratory/Consent/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Consent</span>
            </Link>
            <Link
              href={`/labratory/appointment/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Appointments</span>
            </Link>
            <Link
              href={`/labratory/Note/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Note</span>
            </Link>
            <Link
              href={`/labratory/allinvoice/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Invoice</span>
            </Link>
            <Link
              href={`/labratory/image/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Images</span>
            </Link>
            <Link
              href={`/labratory/organization/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Add Credit Organization</span>
            </Link>
            <Link
              href={`/labratory/creadit/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Credit</span>
            </Link>
            <Link
            href={`/labratory/prescriptions/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Prescriptions

              </span>
            </Link>
            <Link
            href={`/labratory/Performa/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Proforma

              </span>
            </Link>
            <Link
              href={`/labratory/medicalcertificate/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Medical Certificate</span>
            </Link>
            <Link
              href={`/labratory/Orthodontics/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Orthodontic Record</span>
            </Link>
            <Link
              href={`/labratory/referral/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>Referral</span>
            </Link>
            <Link
              href={`/labratory/FNA/all/${patientId}`}
              className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-4 rounded-lg shadow-md transition"
            >
              <span>FNA</span>
            </Link>
          </>
        )}

{role === "doctor" && (<>
        <DropdownMenu>
          <DropdownMenuTrigger className="bg-gray-500 text-white px-4 py-2 rounded-md">
         Dental records <DownOutlined/>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 max-h-96 overflow-y-auto bg-white shadow-lg rounded-md p-2">
         
            <DropdownMenuSeparator />
            {[
              { label: "Dental Records", href: `/doctor/medicaldata/medicalhistory/all/${patientId}` },
              { label: "Orthodontics", href: `/doctor/Orthodontics/all/${patientId}` },
              { label: "Prescriptions", href: `/doctor/prescriptions/all/${patientId}` },
              { label: "Consent", href: `/doctor/Consent/all/${patientId}` },
              { label: "Medical Certificate", href: `/doctor/medicalcertificate/all/${patientId}` },
              { label: "Health Information", href: `/doctor/medicaldata/healthinfo/all/${patientId}` },
              { label: "Referral", href: `/doctor/referral/all/${patientId}` },
              { label: "FNA or Biosy Request ", href: `/doctor/FNA/all/${patientId}` },
            ].map(({ label, href }) => (
              <DropdownMenuItem asChild key={label}>
           <Link
                    href={href}
                    className="w-full flex items-center justify-between p-2 hover:bg-gray-200 text-gray-600 rounded-lg shadow-md transition"
                  >
                    <span className="text-lg p-2 ">{label}</span>
                  </Link>

         
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="mb-4 space-y-2">
        {[
          { label: "Appointments", href: `/doctor/medicaldata/appointment/all/${patientId}` },
                        { label: "Labratory", href: `/doctor/labratory/all/${patientId}` },
          { label: "Proforma", href: `/doctor/Performa/all/${patientId}` },
          { label: "Note", href:` /doctor/Note/all/${patientId}` },
          { label: "Invoice", href: `/doctor/Invoice/all/${patientId}` },
          { label: "Images", href: `/doctor/medicaldata/image/all/${patientId}` },
          { label: "Credit", href: `/doctor/creadit/all/${patientId}` },

        ].map(({ label, href }) => (
          <Link
            key={label}
            href={href}
           className="w-full flex items-center justify-between bg-gray-100 hover:bg-gray-200 text-gray-600 p-6 rounded-lg shadow-md transition"
          >
            <span>{label}</span>
          </Link>
        ))}
      </div>
      </>
      )}
      </div>
    </div>
  );
};

export default PatientComponent;
