// utils/fetchPatientData.ts
export async function fetchPatientData() {
    try {
      const response = await fetch("/api/statics", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch patient data");
      }
  
      const data = await response.json();
      return data.data; // { ageDistribution, genderDistribution }
    } catch (error) {
      console.error("Error fetching patient data:", error);
      return null;
    }
  }