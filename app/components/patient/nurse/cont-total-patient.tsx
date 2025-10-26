import TodayAppointments from "../dateappointment/TodayAppointments";
import TomorrowAppointments from "../dateappointment/tomorrow";

const NursePatientDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="ml-60 p-8 mt-5">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Nurse Dashboard</h1>
        <p className="text-gray-600 mb-8">View today's and tomorrow's appointments</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
          {/* Today's Appointments Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-blue-500">
            <div className="p-5 bg-gradient-to-r from-blue-50 to-white">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Today's Appointments
              </h2>
              <p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="p-5">
              <TodayAppointments />
            </div>
          </div>
          
          {/* Tomorrow's Appointments Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-green-500">
            <div className="p-5 bg-gradient-to-r from-green-50 to-white">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Tomorrow's Appointments
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="p-5">
              <TomorrowAppointments />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NursePatientDashboard;