export default function TreatmentPlanEditPage({ params }: { params: { patientId: string; treatmentPlanId: string } }) {
  const { patientId, treatmentPlanId } = params;

  return (
    <div>
      <h1>Edit Treatment Plan</h1>
      <p>Patient ID: {patientId}</p>
      <p>Treatment Plan ID: {treatmentPlanId}</p>
    </div>
  );
}
