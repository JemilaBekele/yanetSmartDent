import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { DeleteOutlined, DownloadOutlined, EditOutlined } from "@ant-design/icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PatientComponent from "@/app/components/patient/PatientComponent";


type FormData = {
  _id: string;
  createdAt?: string;
  updatedAt?:string;
  createdBy?: { username: string };
  Treatmenttype?: string;
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

const Consentall = ({ params }: OrthoFindingFormProps) => {
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
  




const generatePDF = async (item: FormData[], patientData: Patient) => {
  try {
    if (typeof window === "undefined") return;

    const formattedDate = item[0]?.createdAt
      ? new Date(item[0].createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";
    
    const name = item[0]?.createdBy?.username || "Unknown";
    const treatmentType = item[0]?.Treatmenttype || "Not specified";

    // Create HTML content with Amharic text - optimized for one page
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;500;600;700&display=swap');
            
            body {
              font-family: 'Noto Sans Ethiopic', Arial, sans-serif;
              padding: 15px 30px;
              line-height: 1.4;
              color: #333;
              margin: 0;
              font-size: 12px;
            }
            .header {
              text-align: center;
              color: #3b72b6;
              margin-bottom: 15px;
              border-bottom: 2px solid #3b72b6;
              padding-bottom: 10px;
            }
            .clinic-name {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .document-title {
              font-size: 16px;
              font-weight: bold;
              margin: 5px 0;
            }
            .amharic-text {
              font-family: 'Noto Sans Ethiopic', sans-serif;
              font-size: 12px;
              margin: 8px 0;
              text-align: justify;
            }
            .section {
              margin: 15px 0;
              padding: 32px;
              border: 1px solid #ddd;
              border-radius: 5px;
              background: #f9f9f9;
            }
            .patient-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin: 15px 0;
              padding: 10px;
              background: #f0f8ff;
              border-radius: 4px;
              font-size: 11px;
            }
            .info-item {
              margin: 3px 0;
            }
            .treatment-type {
              background: #e8f4ff;
              padding: 8px 12px;
              border-left: 3px solid #3b72b6;
              margin: 10px 0;
              border-radius: 3px;
              font-size: 11px;
            }
            .risks-list {
              margin: 10px 0;
              padding-left: 15px;
              font-size: 10px;
            }
            .risks-list li {
              margin: 4px 0;
              line-height: 1.3;
            }
            .signature-section {
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px solid #ccc;
            }
            .signature-line {
              display: flex;
              justify-content: space-between;
              margin: 10px 0;
            }
            .signature-box {
              width: 48%;
              font-size: 11px;
            }
           .footer {
              margin-top: auto;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ccc;
              padding-top: 4px;
              padding-bottom: 5px;
            }
                      .bold {
              font-weight: bold;
            }
            
            .underline {
              text-decoration: underline;
            }
            
            .compact {
              margin: 12px 0;
            }

            /* Ensure it fits on one page */
            @media print {
              body {
                padding: 10px 20px;
                font-size: 11px;
              }
              .amharic-text {
                font-size: 12px;
                margin: 14px 0;
              }
            }
          </style>
        </head>
        <body>
          <!-- Header Section -->
          <div class="header">
            <div class="clinic-name">Delina Speciality Dental Clinic</div>
            <div class="document-title">የጥርስ ህክምና ፍቃድ ወረቀት</div>
            <div>CONSENT FORM</div>
          </div>

          <!-- Patient Information -->
          <div class="patient-info">
            <div>
              <div class="info-item"><span class="bold">Patient Name:</span> ${patientData.firstname || 'N/A'}</div>
              <div class="info-item"><span class="bold">Sex:</span> ${patientData.sex || 'N/A'}</div>
              <div class="info-item"><span class="bold">Card No:</span> ${patientData.cardno || 'N/A'}</div>
            </div>
            <div>
              <div class="info-item"><span class="bold">Phone Number:</span> ${patientData.phoneNumber || 'N/A'}</div>
              <div class="info-item"><span class="bold">Age:</span> ${patientData.age || 'N/A'} yrs</div>
              <div class="info-item"><span class="bold">Date:</span> ${formattedDate}</div>
            </div>
          </div>

          <!-- Amharic Consent Text - Compact Version -->
          <div class="section">
            <p class="amharic-text compact">
              <span class="bold">እኔ ${patientData.firstname || '____________'} </span> 
              በሚመለከተው አስፈላጊ ሆኖ በተገኘው የቀዶ ጥገና ህክምና አይነት ለመታከም ፈቃደኛ መሆኔን አረጋግጣለው።
            </p>
            
            <p class="amharic-text compact">
              የሚከተለው የቀዶ ጥገና ህክምና አይነት 
              <span class="bold"> "${treatmentType}" </span>
              ዜዴ ተግባራዊ መደረግ እንደሚችል በግልጽ ተነግሮኝ ተረድቻለሁ።
            </p>

            <div class="treatment-type">
              <p class="amharic-text bold compact">የህክምናው ዓይነት: ${treatmentType}</p>
            </div>

            <p class="amharic-text compact">
              ከዚህ በላይ የተገለፀው የቀዶ ጥገና ህክምና ተግባራዊ የሚሆነው
              በዶ/ር _________________ አማካኝነት እንደሆነ ተገልፆልኝ ተረድቻለሁ። 
              ይህ የቀዶ ጥገና ህክምና የሚደረገው በቦታዊ በማደንዘዛ (Local) አማካኝነት በመሆኑ ተረድቻለው። 
              የቀዶ ጥገና ህክምና ከተደረገ በሃላ ከዚህ ቀጥሎ የተዘረዘሩትን የጎንዮሽ ችግሮች ሊከሰቱ እንደሚችሉ ተገንዝብያለው።
            </p>

            <ol class="risks-list amharic-text">
              <li>ከቀዶ ጥገናው ህክምና በሃላ የሚከሰት የደም መፍሰስ</li>
              <li>ከቀዶ ጥገናው ህክምና በሃላ የሚከሰት ማመርቀዝ ወይም የአጥንት መጉረብረብ፣ መቆጣት (inflammation)</li>
              <li>ሊከሰት የሚችል የሳይነስ መክፈት ከላይኝው መንጋጋ ላይ ጥርስ በሚነቀልበት ጊዜ በዚህ ምክንያት ችግሮቹን ለማስተካከል በሌላ ጊዜ ተጨማሪ የቀዶ ጥገና ህክምና ያስፈልግ እንደሚችል</li>
              <li>ሊከሰት የሚችል የነርቭ ጉዳት በተለይ በታችኛው መንጋጋው ላይ የመጨረሻ ጥርስ በሚነቀልበት ሰዓት ከዚህ ጋር ተያይዞ ለጊዛዊ ወይም በቋሚነት የሚከሰት ድንዛዜ በከንፈር ጫፍና ምላስ ላይ</li>
              <li>ሊከሰት የሚችል የመንጋጋ ስብራት</li>
              <li>ሊከሰት የሚችል የጥርስ ስር ጫፍ ስብራት ሲከሰት ለማውጣት ውይም ለመተው የዶ/ር ውሳኔ ላይ የተመሰረተ ይሆናል።</li>
            </ol>

            <p class="amharic-text compact">
              እኔ ታካሚው/ዋ የቀዶ ጥገና ህክምና ተግባራዊ እንዲሆን ሙሉ በሙሉ ፈቃደኛ መሆኔን እና ከዚህም ሌላ አስፈላጊ የሆኑ ጥያቄዎችን በሙሉ በሚገባ ማብራሪያ ተሰጥቶባቸው በቂ መልስ አግኝቻለሁ።
            </p>

            <p class="amharic-text compact">
              በሌላ በኩል ደግሞ ይህ ከአንገት በላይ በመንጋጋ እና በአፍ ውስጥ የሚደረግ ቀዶ ጥገና ህክምና ሙሉ በሙሉ ሳይንሳዊ አለመሆኑ እና ለዚህ ለሚደረገው የቀዶ ጥገና ህክምና ሙሉ በሙሉ ሳይንሳዊ አለመሆኑ እና ለዚህ ለሚደረገው የቀዶ ጥጋና ህክምና ምንም ውጤቱ ዋስተና ባይኖረውም እኔ ይህ የቀዶ ጥገና ህክምና እንዲደረግልኝ ፈቅጃለው።
            </p>
          </div>

          <!-- Signature Section -->
          <div class="signature-section">
            <div class="signature-line">
              <div class="signature-box">
                <p class="amharic-text compact"><span class="bold">የታካሚ ፊርማ:</span></p>
                <p>_________________________</p>
                <p class="compact"><span class="bold">ቀን:</span> ${formattedDate}</p>
              </div>
              <div class="signature-box">
                <p class="amharic-text compact"><span class="bold">የዶክተር ፊርማ:</span></p>
                <p>_________________________</p>
                <p class="compact"><span class="bold">የዶክተር ስም:</span> ${name}</p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p class="compact"><span class="bold">Delina Speciality Dental Clinic</span></p>
            <p class="compact">Contact: 0931508851 | 0931572958</p>
            <p class="compact">Address: Bole bulbula Maryam mazorya tsehay building 2nd floor Addis Ababa, Ethiopia</p>
          </div>
        </body>
      </html>
    `;

    // Open HTML in new window and print as PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for fonts to load
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    }

  } catch (error) {
    console.error("Error generating PDF:", error);
    toast.error("Failed to generate PDF");
  }
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
    router.push(`/${rolePath}/ConsentDisplay/edit?findingId=${findingId}&patientId=${patientId}`);
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
                  href={`/${role}/ConsentDisplay/add/${patientId}`}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  New Record +
                </Link>
              )}
            </div>
          {data.length === 0 ? (
  <div className="text-center py-12">
    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <p className="text-gray-500 text-lg font-medium">No consent findings available.</p>
    <p className="text-gray-400 text-sm mt-2">Create your first consent form to get started</p>
  </div>
) : (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    {/* Table Header */}
    <div className="grid grid-cols-12 bg-gray-50 px-6 py-4 border-b border-gray-200">
      <div className="col-span-4">
        <span className="text-gray-700 font-semibold text-sm uppercase tracking-wide">Created By & Date</span>
      </div>
      <div className="col-span-6">
        <span className="text-gray-700 font-semibold text-sm uppercase tracking-wide">Treatment Type</span>
      </div>
      <div className="col-span-2">
        <span className="text-gray-700 font-semibold text-sm uppercase tracking-wide">Actions</span>
      </div>
    </div>

    {/* Table Rows */}
    <div className="divide-y divide-gray-100">
      {data.map((item) => (
        <div
          key={item._id}
          className="grid grid-cols-12 px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
        >
          {/* Column 1: Creator Info */}
          <div className="col-span-4">
            <div className="flex items-center space-x-3">
             
              <div className="min-w-0 flex-1">
                <div className="text-gray-800 font-medium truncate">
                  {item.createdBy?.username || "Unknown User"}
                </div>
                <div className="text-gray-500 text-sm flex items-center space-x-1 mt-1">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="truncate">{new Date(item.createdAt || "").toLocaleString()}</span>
                </div>
              {/* Change History Preview */}
              {item.changeHistory && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500 max-w-full">
                    <div className="">
                      {renderUpdates(item.changeHistory)}
                    </div>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Column 2: Treatment Type */}
          <div className="col-span-6">
            <div className="flex flex-col h-full justify-center">
              {item.Treatmenttype ? (
                <div className="group relative">
                  <p className="text-gray-700 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                    {item.Treatmenttype}
                  </p>
                  {item.Treatmenttype.length > 150 && (
                    <div className="mt-1">
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {item.Treatmenttype.length} characters
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-sm">Not specified</span>
                </div>
              )}
              
           
            </div>
          </div>

          {/* Column 3: Actions */}
          <div className="col-span-2">
            <div className="flex items-center justify-end space-x-2 h-full">
              {/* Download Button */}
          <button
  className="flex items-center justify-center w-10 h-10 bg-blue-400 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
  onClick={() => patient && generatePDF([item], patient)}
  title="Download PDF"
>
  <DownloadOutlined className="text-lg" />
</button>

{/* Edit & Delete Buttons */}
{(role === 'doctor' || role === 'admin') && (
  <>
    <button
      className="flex items-center justify-center w-10 h-10 bg-yellow-100 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
      onClick={() => handleEdit(patientId, item._id)}
      title="Edit Consent"
    >
      <EditOutlined className="text-lg" />
    </button>
    <button
      className="flex items-center justify-center w-10 h-10 bg-red-100 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
      onClick={() => handleDelete(item._id)}
      title="Delete Consent"
    >
      <DeleteOutlined className="text-lg" />
    </button>
  </>
)}

            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Footer with total count */}
    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
      <div className="flex justify-between items-center">
        <div className="text-gray-500 text-sm">
          Showing {data.length} consent form{data.length !== 1 ? 's' : ''}
        </div>
       
      </div>
    </div>
  </div>
)}
          </div>
        </div>
        <ToastContainer />
      </div>
    </div>
  );
};

export default Consentall;
