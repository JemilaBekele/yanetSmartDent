import TodayAppointments from './dateappointment/TodayAppointments';
import UnconfirmedInvoices from '@/app/components/invoice/dashboard/listconfirminvoice';
import ActiveOrders from './active/activepatient';
import TomorrowAppointments from './dateappointment/tomorrow';

const PatientDashboard = () => {
  return (
    <div className="min-h-screen mt-5 bg-gray-100">
      <div className="ml-60 p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Patient Dashboard</h1>
        <p className="text-gray-600 mb-8">Overview of appointments, active orders, and invoices</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
          {/* Active Orders Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-purple-500">
            <div className="p-5 bg-gradient-to-r from-purple-50 to-white">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Active Orders
              </h2>
              <p className="text-sm text-gray-500 mt-1">Currently active patient orders</p>
            </div>
            <div className="p-5">
              <ActiveOrders />
            </div>
          </div>
          
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
          
          {/* Unconfirmed Invoices Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-amber-500">
            <div className="p-5 bg-gradient-to-r from-amber-50 to-white">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
                Unconfirmed Invoices
              </h2>
              <p className="text-sm text-gray-500 mt-1">Pending invoice confirmation</p>
            </div>
            <div className="p-5">
              <UnconfirmedInvoices />
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

export default PatientDashboard;