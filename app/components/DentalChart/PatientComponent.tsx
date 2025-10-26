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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';

type Organization = { _id: string; organization: string; };

export interface IUserinfoItem {
  BloodPressure: boolean; Hypotension: boolean; Diabetics: boolean; BleedingTendency: boolean;
  Tuberculosis: boolean; Epilepsy: boolean; Hepatitis: boolean; Allergies: boolean;
  Asthma: boolean; IfAnydrugstaking: boolean; Pregnancy: boolean; IfanyotherDiseases?: string;
}

type Healthinfo = {
  _id: string; bloodgroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | '';
  weight?: string; height?: string; allergies?: string; habits?: string; Medication?: string;
  Core_Temperature: string; Respiratory_Rate: string; Blood_Oxygen: string; Blood_Pressure: string;
  heart_Rate: string; Hypotension: string; Hypertension: string; Tuberculosis: string;
  Astema: string; description: string; Hepatitis: string; Diabetics: string;
  BleedingTendency: string; Epilepsy: string; userinfo: IUserinfoItem[];
};

export type Patient = {
  _id: string; cardno?: string; firstname?: string; finish?: boolean; age?: string;
  sex?: string; phoneNumber?: string; Town?: string; KK?: string; HNo?: string;
  description?: string; Region: string; Woreda: string; disablity: boolean;
  credit?: boolean; Locked?: boolean; createdAt?: string;
  Orgnazation: Organization[]; Healthinfo: Healthinfo[];
};

type PatientDetailsProps = { params: { id: string; }; };

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
        const response = await axios.get(`/api/patient/registerdata/${patientId}`);
        setPatient(prev => ({ ...response.data, finish: response.data.finish ?? false }));
        if (response.data?.Healthinfo) {
          const initialExpandedState: Record<string, boolean> = {};
          response.data.Healthinfo.forEach(info => {
            if (info.allergies) initialExpandedState[info._id] = false;
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
      const response = await axios.patch(`/api/patient/${patient._id}`, { finish: !patient.finish });
      setPatient(response.data.data);
    } catch (error) {
      console.error("Failed to update finish status", error);
    } finally {
      setUpdatingFinish(false);
    }
  };

  const renderDetail = (label: string, value?: string | null) => {
    if (value) return (
      <div className="flex justify-between items-center py-2 border-b">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <span className="text-sm text-gray-800">{value}</span>
      </div>
    );
    return null;
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!patient) return <div>Patient not found</div>;



 return (
  <div className="container mx-auto p-4 space-y-6">
    {/* Main Content - Three Columns */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader><CardTitle>Patient Details</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-1">
                            {renderDetail('Name', patient.firstname)}
              {renderDetail('Age', patient.age)}
              {renderDetail('Card No', patient.cardno)}
              {renderDetail('Sex', patient.sex)}
              {renderDetail('Town', patient.Town)}
              {renderDetail('K/K', patient.KK)}
              {renderDetail('House No', patient.HNo)}
              {renderDetail('Region', patient.Region)}
              {renderDetail('Woreda', patient.Woreda)}
              {renderDetail('Description', patient.description)}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader><CardTitle>Health Information</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            {patient.Healthinfo?.length > 0 ? (
              <div className="space-y-4">
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
                    <div key={info._id} className="border rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-2">
                        {primaryFields.map((field) => (
                          <div key={field.key}>
                            <p className="text-xs font-medium text-gray-500">{field.label}</p>
                            <p className="text-sm">{field.value}</p>
                          </div>
                        ))}
                      </div>
                      {isExpanded && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {additionalFields.map((field) => (
                            <div key={field.key}>
                              <p className="text-xs font-medium text-gray-500">{field.label}</p>
                              <p className="text-sm">{field.value}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {hasAdditionalFields && (
                        <Button variant="ghost" size="sm" className="mt-2 h-6 text-xs" onClick={() => setExpandedAllergies(prev => ({ ...prev, [info._id]: !prev[info._id] }))}>
                          {isExpanded ? "Show Less" : "Show More"}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No health information available</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

    
    </div>
  </div>
);
};

export default PatientComponent;