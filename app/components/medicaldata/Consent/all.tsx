import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import PatientComponent from "../../patient/PatientComponent";
import { DeleteOutlined, DownloadOutlined, EditOutlined } from "@ant-design/icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { jsPDF } from "jspdf";
export type branch = {
  name: string;
}

type FormData = {
  _id: string;
  createdAt?: string;
  updatedAt?:string;
  createdBy?: { username: string };
  allergies?: boolean;
  anemia?: boolean;
  epilepsy?: boolean;
  asthma?: boolean;
  DiabetesMellitus?: boolean;
  Hypertension?: boolean;
  HeartDisease?: boolean;
  immuneDeficiency?: boolean;
  coagulopathy?: boolean;
  organopathy?: boolean;
  pregnancy?: boolean;
  MedicationsTaken?: boolean;
  BleadingDisorder?:boolean;
  other?: string;
  Treatmenttype?: string;
  OverbitePercentage?: string;
  branch?:branch;
  changeHistory?: { updatedBy: { username: string }; updateTime: string }[];
  ConcernsAndLimitations?: string;
  Others?: string;
};

type OrthoFindingFormProps = {
  params: {
    id: string;
  };
};

type Patient = {
  id: string;
  firstname: string;
  age: number;
  phoneNumber: string;
  sex: string;
  cardno: string;
  Town: string;
  KK: string;
  updatedAt: string;
};

const normalizeData = (data: FormData[]) =>
  data.map((item) => ({
    ...item,
    ...Object.fromEntries(
      Object.entries(item).map(([key, value]) => [
        key,
        typeof value === "string" && (value === "true" || value === "false")
          ? value === "true" // Convert "true" or "false" strings to boolean
          : value, // Leave other fields as they are
      ])
    ),
  }));

const ConsentDisplay = ({ params }: OrthoFindingFormProps) => {
  const patientId = params.id;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [data, setData] = useState<FormData[] | null>(null);
  const { data: session } = useSession();
  const role = useMemo(() => session?.user?.role || "", [session]);

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/Consent/${patientId}`);
        const { patient, Consent } = response.data.data;
        setPatient(patient);
        setData(normalizeData(Consent || []));
        console.log(normalizeData(Consent || []))
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch consent records.");
      }
    };
    fetchData();
  }, [patientId]);
  




  const generatePDF = (item: FormData[], patientData: Patient) => {
    const doc = new jsPDF();
  
    const formattedDate = item[0]?.createdAt
      ? new Date(item[0].createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";
      const name = item[0]?.createdBy?.username || "Unknown";
    // Header Section with Image and Title
    const logoPath = "/assets/file.png";
  
    const imgWidth = 40, imgHeight = 30;
  
    doc.addImage(logoPath, "JPEG", 10, 7, imgWidth, imgHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
  
    // Set the light red color for the main title text
    doc.setTextColor(6, 21, 97); // Light Red
    doc.text("Yanet Special Dental Clinic", 109, 24, { align: "center" });
    doc.setFontSize(18);
    
    
    // Set the font for the subheading
    doc.setTextColor(0, 0, 0); // Black for subheading for contrast

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("CONSENT PAPER", 105, 35, { align: "center" });
  
    // Styled Line Below Header
    doc.setDrawColor(6, 21, 97);
    doc.setLineWidth(1.5);
    doc.line(10, 40, 200, 40);
  
    doc.setDrawColor(39, 235, 245); // Yellow
    doc.line(10, 42, 200, 42);
  
    // Patient Information Section
    const startY = 57;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
  
    doc.setFont("helvetica", "bold");
  
    doc.text("Dental Treatment Consent", 105, 50, { align: "center" });
  
    // Left Side
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Patient Name: ${patientData.firstname}`, 10, startY);
    doc.text(`Sex: ${patientData.sex || ""}`, 10, startY + 7);
    doc.text(`Card No: ${patientData.cardno}`, 10, startY + 14);
  
    // Right Side
    doc.text(`Phone Number: ${patientData.phoneNumber || ""}`, 140, startY);
    doc.text(`Age: ${patientData.age} yrs`, 140, startY + 7);
    doc.text(`Date: ${formattedDate}`, 140, startY + 14);
  
    // Consent Title
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
  
    doc.setFont("helvetica", "bold");
    doc.text("Patient's Medical History", 105, startY + 24, { align: "center" });
  
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
  
    doc.setFont("helvetica", "normal");
    doc.text("Past Medical History and Any Illness Known", 105, startY + 35, { align: "center" });
  
    // Add the image of Dr Tedla Tessema's background if the doctor is Dr Tedla Tessema
   
  
    // Continue with the rest of your existing content
    const historyStartY = startY + 40;
    const filteredFields = [
      { label: "Diabetes Mellitus", value: !!item[0]?.DiabetesMellitus },
      { label: "Hypertension", value: !!item[0]?.Hypertension },
      { label: "Heart Disease", value: !!item[0]?.HeartDisease },
      { label: "Immune Deficiency", value: !!item[0]?.immuneDeficiency },
      { label: "Coagulopathy", value: !!item[0]?.coagulopathy },
      { label: "Medications Taken", value: !!item[0]?.MedicationsTaken },
      { label: "Allergy", value: !!item[0]?.allergies },
      { label: "Asthma", value: !!item[0]?.asthma },
      { label: "Epilepsy", value: !!item[0]?.epilepsy },
      { label: "Organopathy", value: !!item[0]?.organopathy },
      { label: "Pregnancy", value: !!item[0]?.pregnancy },
      { label: "Bleeding Disorder", value: !!item[0]?.BleadingDisorder },
    ].filter(field => field.value); // Only keep fields where value is true
    
    const checkboxYStart = historyStartY + 15;
    
    filteredFields.forEach((field, index) => {
      const xPos = index % 2 === 0 ? 10 : 105;
      const yPos = checkboxYStart + Math.floor(index / 2) * 12;
      doc.setFontSize(10);
      doc.text(field.label, xPos , yPos );
  
    });
    
  
 
  
    // Additional Data Section (Before Signature Section)
    const additionalDataStartY = checkboxYStart + Math.ceil(filteredFields.length / 2) * 12 - 4;
  
    const hasAdditionalInfo = item[0]?.other || item[0]?.Treatmenttype;
  
    if (hasAdditionalInfo) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Additional Information", 10, additionalDataStartY);
  
      let currentY = additionalDataStartY + 7;
  
      doc.setFont("helvetica", "normal");
      if (item[0]?.other) {
        const otherText = `Other: ${item[0].other}`;
        const wrappedOtherText = doc.splitTextToSize(otherText, 170);
        wrappedOtherText.forEach((line, index) => {
          doc.text(line, 40, currentY + index * 4);
        });
        currentY += wrappedOtherText.length * 4 + 2;
      }
  
      if (item[0]?.Treatmenttype) {
        const treatmentTypeText = `Treatment Type: ${item[0].Treatmenttype}`;
        const wrappedTreatmentTypeText = doc.splitTextToSize(treatmentTypeText, 170);
        wrappedTreatmentTypeText.forEach((line, index) => {
          doc.text(line, 40, currentY + index * 4);
        });
        currentY += wrappedTreatmentTypeText.length * 4 + 5;
      }
    }
  
    
    doc.text("I give my full testmony for above information in signing: __________", 10, 250);
  
    doc.setFont("helvetica", "bold");
    doc.text("Patient’s Treatment Agreement/Consent", 10, 255);
    doc.setFont("helvetica", "normal");
    doc.text("The undersigned has been informed about the need for the stated treatment", 10, 260);
    doc.text("as follows and fully agrees to and gives consent by signing.", 10, 265);
    doc.text("Sign: ___________________________", 10, 270);
    doc.text(`Date: ${formattedDate}`, 10, 275);
    const namesign = name === "Dr jrmila Tessema";
    if (namesign) {
      const doctorImagePath = "/assets/sign.png"; // Image path for Dr Tedla Tessema's background image
  // Y position for image
      const imageWidth = 40; // Width of the image
      const imageHeight = 20; // Height of the image
      doc.addImage(doctorImagePath, "JPEG", 145, 255, imageWidth, imageHeight);
    }
    doc.text(`Doctor’s Name:  ${item[0]?.createdBy?.username || "N/A"}`, 135, 255);
    doc.text("Sign: ___________________________", 135, 260);
  
    // Footer Section
    const footerY = doc.internal.pageSize.height - 20;
    doc.setDrawColor(6, 21, 97);
    doc.setLineWidth(0.7);
    doc.line(10, footerY, 200, footerY);
  
    doc.setFontSize(10);
  
    doc.setFont("helvetica", "bold");
    doc.text("Thank you for choosing Yanet Special Dental Clinic Addis Ababa,Ethiopia", 105, footerY + 5, {
      align: "center",
    });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Contact: 091 199 7804 | 0904455555", 105, footerY + 10, {
      align: "center",
    });
  
    doc.text("Address: Bole medanealem Addis Ababa, Ethiopia", 105, footerY + 15, {
      align: "center",
    });
    doc.text("", 105, footerY + 19, {
      align: "center",
    });
  
    // Save PDF
    doc.save(`Consent_${patientData.firstname}.pdf`);
  };
  
  

  
  
  


  

  const handleDelete = async (recordId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this Consent? This action cannot be undone."
    );

    if (!confirmDelete) return;

    const toastId = toast.loading("Deleting record...");
    try {
      const response = await axios.delete(`/api/Consent/detail/${recordId}`);
      if (response.data.success) {
        setData((prevData) =>
          prevData ? prevData.filter((item) => item._id !== recordId) : []
        );
        toast.update(toastId, {
          render: "Record deleted successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        throw new Error(response.data.error || "Failed to delete");
      }
    } catch (err) {
      toast.update(toastId, {
        render: "Error deleting record.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleEdit = (patientId: string, findingId: string) => {
    const rolePath = role === "doctor" ? "doctor" : "admin";
    router.push(`/${rolePath}/Consent/edit?findingId=${findingId}&patientId=${patientId}`);
  };
  const renderUpdates = (updates: { updatedBy: { username: string }; updateTime: string }[] | undefined) => {
    if (!updates || updates.length === 0) return <div></div>;
  
    return (
      <div>
        <h3>Update:</h3>
        <ul>
          {updates.map((update, index) => (
           <li key={index}>
            <div>
          <strong> {update.updatedBy.username}</strong><br />
           
           {new Date(update.updateTime).toLocaleString()}</div><br />
         </li>
         
          ))}
        </ul>
      </div>
    );
  };
  
  const renderBooleans = (item: FormData) => {
    const booleanFields = Object.entries(item)
      .filter(
        ([key, value]) =>
          typeof value === "boolean" && !["_id", "False", "__v"].includes(key) // Exclude specific keys
      );
  
    return (
      <Card className="w-full">
        <CardHeader>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {booleanFields.map(([key, value], index) => (
              <div key={index} className="flex justify-between items-center p-2 border-b">
                <Label className="font-medium pr-1">
                  {key.replace(/([A-Z])/g, " $1").replace(/^\w/, (c) => c.toUpperCase())}
                </Label>
                <div className={`text-sm ${value ? "text-green-500" : "text-red-500"}`}>
                  {value ? "True" : "False"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  
  
  

  if (!data) return <div>Loading...</div>;

  return (
    <div className="flex m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-4">
        <div className="flex space-x-8">
          <div className="w-1/3 p-4">
            <PatientComponent params={params} />
          </div>
          <div className="w-2/3 bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Consent </h1>
              {["doctor", "admin"].includes(role) && (
                <Link
                  href={`/${role}/Consent/add/${patientId}`}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  New Record +
                </Link>
              )}
            </div>
            {data.length === 0 ? (
              <p className="text-gray-500">No Consent findings available.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4"> 
              {data.map((item) => (
                <div
                  key={item._id}
                  className="border p-4 rounded-lg shadow-md flex items-start justify-between"
                >
                  <div className="flex flex-col space-y-1">
                         <div className="text-green-600 text-normal font-bold">
                      {item.branch?.name || ""}
                    </div>
                    <div className="text-gray-600 text-sm font-bold">
                      {item.createdBy?.username || "Unknown"}
                    </div>


                    <div className="text-gray-600 text-sm">
                      {new Date(item.createdAt || "").toLocaleString()}
                    </div>
                      <div className="text-gray-600 text-sm "> {renderUpdates(item.changeHistory)}</div>
                  </div>
            
                  <div className="text-gray-600 text-sm p-2">
                    {/* Render booleans excluding certain keys */}
                    {renderBooleans(item)}
            
                    <div className="flex flex-col mt-5 space-y-4">
                      {/* Other Info */}
                      <div className="bg-gray-100 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <span className="text-gray-800 font-semibold">Other:</span>
                        <p className="text-gray-600 text-sm">
                          {item.other || "No additional information provided."}
                        </p>
                      </div>
            
                      {/* Treatment Type Info */}
                      <div className="bg-gray-100 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <span className="text-gray-800 font-semibold">Treatment Type:</span>
                        <p className="text-gray-600 text-sm">
                          {item.Treatmenttype || "Not specified."}
                        </p>
                      </div>
                    </div>
                  </div>
            
                  <div className="flex flex-col space-y-2">
                  <button
                       className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                       onClick={() => patient && generatePDF([item], patient)}
                     >
                       <DownloadOutlined /> 
                     </button>
                    {/* Edit Button */}
                     {(role === 'doctor' || role === 'admin') && (
                      <div>
                    <button
                      className="hover:bg-blue-300 p-2 rounded-full"
                      onClick={() => handleEdit(patientId, item._id)} // Updated to use item._id directly
                    >
                      <EditOutlined className="text-xl text-blue-500" />
                    </button>
            
                    {/* Delete Button */}
                    <button
                      className="hover:bg-red-300 p-2 rounded-full"
                      onClick={() => handleDelete(item._id)} // Updated to use item._id directly
                    >
                      <DeleteOutlined className="text-xl text-red-500" />
                    </button></div>)}
                  </div>
                </div>
              ))}
            </div>
            
            )}
          </div>
        </div>
        <ToastContainer />
      </div>
    </div>
  );
};

export default ConsentDisplay;
