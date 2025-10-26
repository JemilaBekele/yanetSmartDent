import React, { useState, useEffect } from "react";

type TreatmentPlan = {
    Exrtaction?: boolean;
    Scaling?: boolean;
    Rootcanal?: boolean;
    Filling?: boolean;
    Bridge?: boolean;
    Crown?: boolean;
    Apecectomy?: boolean;
    Fixedorthodonticappliance?: boolean;
    Removableorthodonticappliance?: boolean;
    Removabledenture?: boolean;
    other?: string;
};

type Vitalsign = {
    Core_Temperature?: string;
    Respiratory_Rate?: string;
    Blood_Oxygen?: string;
    Blood_Pressure?: string;
    heart_Rate?: string;
};

type MedicalRecordData = {
    _id: string;
    ChiefCompliance: string;
    Historypresent: string;
    Vitalsign: Vitalsign | null;
    Pastmedicalhistory: string;
    Pastdentalhistory: string;
    IntraoralExamination: string;
    ExtraoralExamination: string;
    Investigation: string;
    Assessment: string;
    TreatmentPlan: TreatmentPlan | null;
    TreatmentDone: TreatmentPlan | null;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: { username: string };
};

interface EditMedicalRecordModalProps {
    isOpen: boolean;
    formData: MedicalRecordData | null;  
    onClose: () => void;
    onUpdate: (data: MedicalRecordData) => void;  
}

const TextArea: React.FC<{ id: string; label: string; value: string; onChange: (value: string) => void; placeholder: string; rows?: number }> = ({ id, label, value, onChange, placeholder, rows = 3 }) => (
    <div className="mb-4">
        <label className="block font-bold mb-2" htmlFor={id}>{label}</label>
        <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="border p-2 rounded-md w-full"
            placeholder={placeholder}
            rows={rows}
        />
    </div>
);

const Input: React.FC<{ id: string; label: string; value: string; onChange: (value: string) => void; placeholder: string }> = ({ id, label, value, onChange, placeholder }) => (
    <div className="mb-4">
        <label className="block mb-2" htmlFor={id}>{label}</label>
        <input
            id={id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="border p-2 rounded-md w-full"
            placeholder={placeholder}
        />
    </div>
);

const EditMedicalRecordModal: React.FC<EditMedicalRecordModalProps> = ({
    isOpen,
    formData,
    onClose,
    onUpdate,
}) => {
    const [localData, setLocalData] = useState<MedicalRecordData | null>(formData);

    useEffect(() => {
        setLocalData(formData);
    }, [formData]);

    if (!isOpen || !localData) return null;

    const handleChange = (field: keyof MedicalRecordData, value: string) => {
        setLocalData({ ...localData, [field]: value });
    };

    const handleTreatmentChange = (field: keyof TreatmentPlan, value: boolean | string, isDone: boolean = false) => {
        setLocalData((prevData) => ({
            ...prevData!,
            [isDone ? 'TreatmentDone' : 'TreatmentPlan']: {
                ...(prevData?.[isDone ? 'TreatmentDone' : 'TreatmentPlan'] || {}),
                [field]: value,
            },
        }));
    };

    const handleOtherTreatmentChange = (isDone: boolean = false) => (value: string) => {
        setLocalData((prevData) => ({
            ...prevData!,
            [isDone ? 'TreatmentDone' : 'TreatmentPlan']: {
                ...(prevData?.[isDone ? 'TreatmentDone' : 'TreatmentPlan'] || {}),
                other: value,
            },
        }));
    };

    const handleVitalChange = (field: keyof Vitalsign, value: string) => {
        setLocalData((prevData) => ({
            ...prevData!,
            Vitalsign: {
                ...(prevData?.Vitalsign || {}),
                [field]: value,
            },
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (localData) {
            onUpdate(localData); 
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-200 bg-opacity-50">
            <div className="bg-white p-8 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Edit Medical Record</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Chief Complaint */}
                    <TextArea 
                        id="chief-complaint"
                        label="Chief Complaint"
                        value={localData.ChiefCompliance}
                        onChange={(value) => handleChange("ChiefCompliance", value)}
                        placeholder="Enter chief complaint"
                    />
                    
                    {/* History of Present Illness */}
                    <TextArea 
                        id="history-present-illness"
                        label="History of Present Illness"
                        value={localData.Historypresent}
                        onChange={(value) => handleChange("Historypresent", value)}
                        placeholder="Enter history of present illness"
                    />

                    {/* Vital Signs */}
                    <div className="mb-4">
                        <label className="block font-bold mb-2" htmlFor="vital-sign">Vital Sign</label>
                        <div className="flex flex-col space-y-2">
                            {["Core_Temperature", "Respiratory_Rate", "Blood_Oxygen", "Blood_Pressure", "heart_Rate"].map((vital) => (
                                <Input
                                    key={vital}
                                    id={vital}
                                    label={vital.replace(/_/g, ' ')}
                                    value={localData.Vitalsign?.[vital as keyof Vitalsign] || ""}
                                    onChange={(value) => handleVitalChange(vital as keyof Vitalsign, value)}
                                    placeholder={`Enter ${vital.replace(/_/g, ' ')}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Past Medical History */}
                    <TextArea 
                        id="past-medical-history"
                        label="Past Medical History"
                        value={localData.Pastmedicalhistory}
                        onChange={(value) => handleChange("Pastmedicalhistory", value)}
                        placeholder="Enter past medical history"
                    />
                    
                    {/* Past Dental History */}
                    <TextArea 
                        id="past-dental-history"
                        label="Past Dental History"
                        value={localData.Pastdentalhistory}
                        onChange={(value) => handleChange("Pastdentalhistory", value)}
                        placeholder="Enter past dental history"
                    />
                    
                    {/* Intra Oral Examination */}
                    <TextArea 
                        id="intraoral-examination"
                        label="Intra Oral Examination"
                        value={localData.IntraoralExamination}
                        onChange={(value) => handleChange("IntraoralExamination", value)}
                        placeholder="Enter intraoral examination"
                    />

                    {/* Extra Oral Examination */}
                    <TextArea 
                        id="extraoral-examination"
                        label="Extra Oral Examination"
                        value={localData.ExtraoralExamination}
                        onChange={(value) => handleChange("ExtraoralExamination", value)}
                        placeholder="Enter extraoral examination"
                    />
                    
                    {/* Investigation */}
                    <TextArea 
                        id="investigation"
                        label="Investigation"
                        value={localData.Investigation}
                        onChange={(value) => handleChange("Investigation", value)}
                        placeholder="Enter investigation"
                    />

                    {/* Assessment */}
                    <TextArea 
                        id="assessment"
                        label="Assessment"
                        value={localData.Assessment}
                        onChange={(value) => handleChange("Assessment", value)}
                        placeholder="Enter assessment"
                    />
                    
                    {/* Treatment Section */}
                    <div className="mb-4 col-span-2">
    <label className="block font-bold mb-2">Treatment Plan</label>
    <div className="flex flex-col space-y-2">
        {[
            { key: "Exrtaction", label: "Extraction" },
            { key: "Scaling", label: "Scaling" },
            { key: "Rootcanal", label: "Root Canal" },
            { key: "Filling", label: "Filling" },
            { key: "Bridge", label: "Bridge" },
            { key: "Crown", label: "Crown" },
            { key: "Apecectomy", label: "Apecectomy" },
            { key: "Fixedorthodonticappliance", label: "Fixed Orthodontic Appliance" },
            { key: "Removableorthodonticappliance", label: "Removable Orthodontic Appliance" },
            { key: "Removabledenture", label: "Removable Denture" }
        ].map(({ key, label }) => (
            <div key={key} className="flex items-center">
                <input
                    type="checkbox"
                    checked={!!localData.TreatmentPlan?.[key as keyof TreatmentPlan]}
                    onChange={(e) => handleTreatmentChange(key as keyof TreatmentPlan, e.target.checked)}
                    className="mr-2"
                />
                <label className="font-bold">{label}</label>
            </div>
        ))}
        {/* Other treatment input */}
        <TextArea
            id="treatment-plan-other"
            label="Other Treatment"
            value={localData.TreatmentPlan?.other || ""}
            onChange={handleOtherTreatmentChange()}
            placeholder="Enter other treatments"
        />
    </div>
</div>

<div className="mb-4 col-span-2">
    <label className="block font-bold mb-2">Treatment Done</label>
    <div className="flex flex-col space-y-2">
        {[
            { key: "Exrtaction", label: "Extraction" },
            { key: "Scaling", label: "Scaling" },
            { key: "Rootcanal", label: "Root Canal" },
            { key: "Filling", label: "Filling" },
            { key: "Bridge", label: "Bridge" },
            { key: "Crown", label: "Crown" },
            { key: "Apecectomy", label: "Apecectomy" },
            { key: "Fixedorthodonticappliance", label: "Fixed Orthodontic Appliance" },
            { key: "Removableorthodonticappliance", label: "Removable Orthodontic Appliance" },
            { key: "Removabledenture", label: "Removable Denture" }
        ].map(({ key, label }) => (
            <div key={key} className="flex items-center">
                <input
                    type="checkbox"
                    checked={!!localData.TreatmentDone?.[key as keyof TreatmentPlan]}
                    onChange={(e) => handleTreatmentChange(key as keyof TreatmentPlan, e.target.checked, true)}
                    className="mr-2"
                />
                <label className="font-bold">{label}</label>
            </div>
        ))}
        {/* Other treatment input for Treatment Done */}
        <TextArea
            id="treatment-done-other"
            label="Other Treatment Done"
            value={localData.TreatmentDone?.other || ""}
            onChange={handleOtherTreatmentChange(true)}
            placeholder="Enter other treatments done"
        />
    </div>
</div>


                    <div className="flex justify-end mt-4 col-span-2">
                        <button type="button" onClick={onClose} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2 hover:bg-gray-600">Cancel</button>
                        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">Update</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditMedicalRecordModal;
