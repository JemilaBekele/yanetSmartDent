"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableCaption,
  TableHead,
  TableHeader,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CodeOutlined } from '@ant-design/icons';
import { LeftOutlined, RightOutlined, DoubleLeftOutlined, DoubleRightOutlined } from '@ant-design/icons';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Appointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentEndTime: string;
  reasonForVisit?: string;
  doctorId: { id: string; username: string };
  status: string;
  patientId: {
    id: {
      _id: string;
      firstname: string;
      phoneNumber: string;
      cardno: string;
    };
    username: string;
    cardno: string;
  };
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    patientName: string;
    phoneNumber: string;
    cardno: string;
    reasonForVisit: string;
    status: string;
    appointmentTime: string;
    appointmentEndTime: string;
    doctorName: string;
  };
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

const TodayAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [showPastAppointments, setShowPastAppointments] = useState<boolean>(false);
  const [calendarView, setCalendarView] = useState<"table" | "calendar">("table");
  const [pageSize, setPageSize] = useState<number>(10);
  const [pageIndex, setPageIndex] = useState<number>(0);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/app/listappoint", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const data = await response.json();

      if (data.success) {
        setAppointments(data.data || []);
      } else {
        setError(data.message || "Unknown error occurred");
      }
    } catch (err) {
      setError("Error fetching appointments.");
    } finally {
      setLoading(false);
    }
  };

  // Format time as "HH:MM AM/PM"
  const formatTime = (time: string) => {
    if (!time || !time.includes(":")) return "Invalid Time";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    if (isNaN(hour)) return "Invalid Time";
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes.padStart(2, "0")} ${ampm}`;
  };

  // Convert time to 24-hour format for sorting (returns minutes since midnight)
  const timeTo24Hour = (time: string) => {
    if (!time || !time.includes(":")) return Infinity;
    const [hours, rest] = time.split(":");
    if (!rest) return Infinity;
    const [minutes, ampm] = rest.includes("AM") || rest.includes("PM") ? rest.split(" ") : [rest, ""];
    const hourNum = parseInt(hours);
    const minuteNum = parseInt(minutes);
    if (isNaN(hourNum) || isNaN(minuteNum)) return Infinity;
    let adjustedHour = hourNum;
    if (ampm === "PM" && hourNum !== 12) adjustedHour += 12;
    if (ampm === "AM" && hourNum === 12) adjustedHour = 0;
    return adjustedHour * 60 + minuteNum;
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-200 text-blue-800";
      case "Completed":
        return "bg-green-200 text-green-800";
      case "Cancelled":
        return "bg-red-200 text-red-800";
      case "Pending":
        return "bg-yellow-200 text-yellow-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  // Get color scheme based on appointment status
  const getStatusColors = (status: string) => {
    switch (status) {
      case "Scheduled":
        return {
          backgroundColor: '#dbeafe', // blue-100
          borderColor: '#3b82f6', // blue-500
          textColor: '#1e40af' // blue-800
        };
      case "Completed":
        return {
          backgroundColor: '#dcfce7', // green-100
          borderColor: '#22c55e', // green-500
          textColor: '#166534' // green-800
        };
      case "Cancelled":
        return {
          backgroundColor: '#fee2e2', // red-100
          borderColor: '#ef4444', // red-500
          textColor: '#991b1b' // red-800
        };
      case "Pending":
        return {
          backgroundColor: '#fef3c7', // yellow-100
          borderColor: '#eab308', // yellow-500
          textColor: '#92400e' // yellow-800
        };
      default:
        return {
          backgroundColor: '#f3f4f6', // gray-100
          borderColor: '#6b7280', // gray-500
          textColor: '#374151' // gray-700
        };
    }
  };

  const handlePageChange = (newPageIndex: number) => {
    setPageIndex(newPageIndex);
  };

  // Get today's date (YYYY-MM-DD)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Sort appointments by date (ascending for upcoming, descending for past)
  const sortedAppointments = [...appointments].sort(
    (a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
  );

  // Filter past and upcoming appointments
  const upcomingAppointments = sortedAppointments.filter(
    (appt) => new Date(appt.appointmentDate) >= today
  );
  // Sort upcoming appointments by date and time in ascending order
  const sortedUpcomingAppointments = [...upcomingAppointments].sort((a, b) => {
    const dateA = new Date(a.appointmentDate).getTime();
    const dateB = new Date(b.appointmentDate).getTime();
    if (dateA === dateB) {
      return timeTo24Hour(a.appointmentTime) - timeTo24Hour(b.appointmentTime);
    }
    return dateA - dateB;
  });

  const pastAppointments = sortedAppointments.filter(
    (appt) => new Date(appt.appointmentDate) < today
  );
  // Sort past appointments by date and time in descending order
  const sortedPastAppointments = [...pastAppointments].sort((a, b) => {
    const dateA = new Date(a.appointmentDate).getTime();
    const dateB = new Date(b.appointmentDate).getTime();
    if (dateA === dateB) {
      return timeTo24Hour(a.appointmentTime) - timeTo24Hour(b.appointmentTime);
    }
    return dateB - dateA;
  });

  // Filter appointments for the selected doctor and whether past or upcoming are to be displayed
  const filteredAppointments = selectedDoctor
    ? (showPastAppointments ? sortedPastAppointments : sortedUpcomingAppointments).filter(
        (appt) => appt.doctorId?.id === selectedDoctor
      )
    : [];

  // Paginate the filtered appointments for table view
  const paginatedAppointments = filteredAppointments.slice(
    pageIndex * pageSize, 
    (pageIndex + 1) * pageSize
  );
  const totalPages = Math.ceil(filteredAppointments.length / pageSize);

  // Convert appointments to calendar events using actual appointmentEndTime
  const calendarEvents: CalendarEvent[] = filteredAppointments.map((appt) => {
    const startDateTime = new Date(appt.appointmentDate);
    const [startHours, startMinutes] = appt.appointmentTime.split(":");
    startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
    
    const endDateTime = new Date(appt.appointmentDate);
    
    // Use the actual appointmentEndTime from the database
    if (appt.appointmentEndTime && appt.appointmentEndTime.includes(":")) {
      const [endHours, endMinutes] = appt.appointmentEndTime.split(":");
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
    } else {
      // Fallback: if no end time, assume 1 hour duration
      endDateTime.setHours(startDateTime.getHours() + 1, startDateTime.getMinutes(), 0, 0);
    }

    // Ensure end time is after start time
    if (endDateTime <= startDateTime) {
      endDateTime.setHours(startDateTime.getHours() + 1, startDateTime.getMinutes(), 0, 0);
    }

    const statusColors = getStatusColors(appt.status);

    return {
      id: appt.id,
      title: `${appt.patientId?.id?.firstname || 'Unknown Patient'}`,
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
      extendedProps: {
        patientName: appt.patientId?.id?.firstname || 'Unknown',
        phoneNumber: appt.patientId?.id?.phoneNumber || 'N/A',
        cardno: appt.patientId?.id?.cardno || 'N/A',
        reasonForVisit: appt.reasonForVisit || 'Not specified',
        status: appt.status || 'Scheduled',
        appointmentTime: appt.appointmentTime,
        appointmentEndTime: appt.appointmentEndTime,
        doctorName: appt.doctorId?.username || 'Unknown Doctor'
      },
      backgroundColor: statusColors.backgroundColor,
      borderColor: statusColors.borderColor,
      textColor: statusColors.textColor
    };
  });

  // Custom event content renderer with better information display
  const renderEventContent = (eventInfo: any) => {
    return (
      <div 
        className="p-1 text-xs w-full h-full rounded border-l-4"
        style={{ 
          borderLeftColor: eventInfo.event.borderColor,
          backgroundColor: eventInfo.event.backgroundColor
        }}
      >
        <div className="font-semibold truncate" style={{ color: eventInfo.event.textColor }}>
          {eventInfo.event.title}
        </div>
        <div className="truncate text-gray-600">
          {eventInfo.event.extendedProps.reasonForVisit}
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className={`px-1 rounded text-xs ${getStatusClass(eventInfo.event.extendedProps.status)}`}>
            {eventInfo.event.extendedProps.status}
          </span>
          <span className="text-xs opacity-75">
            {formatTime(eventInfo.event.extendedProps.appointmentTime)}
          </span>
        </div>
      </div>
    );
  };

  // Enhanced tooltip for events
  const handleEventMouseEnter = (mouseEnterInfo: any) => {
    const event = mouseEnterInfo.event;
    const tooltip = document.createElement('div');
    tooltip.className = 'fc-event-tooltip';
    tooltip.innerHTML = `
      <div class="bg-white p-3 rounded-lg shadow-lg border max-w-xs">
        <h3 class="font-bold text-sm mb-2">Appointment Details</h3>
        <p class="text-xs"><strong>Patient:</strong> ${event.extendedProps.patientName}</p>
        <p class="text-xs"><strong>Doctor:</strong> ${event.extendedProps.doctorName}</p>
        <p class="text-xs"><strong>Time:</strong> ${formatTime(event.extendedProps.appointmentTime)} - ${formatTime(event.extendedProps.appointmentEndTime)}</p>
        <p class="text-xs"><strong>Reason:</strong> ${event.extendedProps.reasonForVisit}</p>
        <p class="text-xs"><strong>Status:</strong> ${event.extendedProps.status}</p>
        <p class="text-xs"><strong>Card No:</strong> ${event.extendedProps.cardno}</p>
      </div>
    `;
    tooltip.style.position = 'absolute';
    tooltip.style.zIndex = '1000';
    tooltip.style.top = mouseEnterInfo.jsEvent.pageY + 10 + 'px';
    tooltip.style.left = mouseEnterInfo.jsEvent.pageX + 10 + 'px';
    
    document.body.appendChild(tooltip);
    
    // Store reference to remove later
    mouseEnterInfo.el._tooltip = tooltip;
  };

  const handleEventMouseLeave = (mouseLeaveInfo: any) => {
    if (mouseLeaveInfo.el._tooltip) {
      mouseLeaveInfo.el._tooltip.remove();
      mouseLeaveInfo.el._tooltip = null;
    }
  };

  // Handle event click
  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event;
    alert(
      `Appointment Details:\n` +
      `Patient: ${event.extendedProps.patientName}\n` +
      `Doctor: ${event.extendedProps.doctorName}\n` +
      `Phone: ${event.extendedProps.phoneNumber}\n` +
      `Card No: ${event.extendedProps.cardno}\n` +
      `Reason: ${event.extendedProps.reasonForVisit}\n` +
      `Status: ${event.extendedProps.status}\n` +
      `Time: ${formatTime(event.extendedProps.appointmentTime)} - ${formatTime(event.extendedProps.appointmentEndTime)}`
    );
  };

  // Extract unique doctors by doctor ID with null safety
  const uniqueDoctors = Array.from(
    new Map(
      upcomingAppointments
        .filter(appt => appt.doctorId?.id) // Filter out null doctorIds
        .map((appt) => [appt.doctorId.id, appt.doctorId])
    ).values()
  );

  return (
    <div className="mt-24 ml-0 lg:ml-60 w-full max-w-6xl lg:max-w-[calc(100%-15rem)] mx-auto p-5 rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Appointments</h1>

      {loading ? (
        <div className="text-center">Loading appointments...</div>
      ) : error ? (
        <div className="text-center bg-red-100 text-red-500 p-4 rounded">{error}</div>
      ) : (
        <div className="flex flex-col lg:flex-row">
          {/* Sidebar for selecting doctors by ID */}
          <div className="w-full lg:w-1/4 p-4 bg-gray-100 rounded-lg mb-4 lg:mb-0 lg:mr-4">
            <h2 className="text-lg font-bold mb-4">Select Doctor</h2>
            {uniqueDoctors.length > 0 ? (
              <ul className="space-y-2">
                {uniqueDoctors.map((doctor) => (
                  <li
                    key={doctor.id}
                    className={`cursor-pointer px-3 py-2 rounded-md ${
                      selectedDoctor === doctor.id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                    onClick={() => {
                      setSelectedDoctor(doctor.id);
                      setPageIndex(0); // Reset to first page when doctor changes
                    }}
                  >
                    {doctor.username || 'Unknown Doctor'}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No doctors available.</p>
            )}
          </div>

          {/* Main content - Appointments for selected doctor */}
          <div className="w-full lg:w-3/4 p-4">
            {selectedDoctor ? (
              <>
                <div className="flex flex-col lg:flex-row justify-between mb-4 gap-4">
                  <h2 className="text-xl font-bold">
                    Appointments for{" "}
                    {uniqueDoctors.find((d) => d.id === selectedDoctor)?.username || selectedDoctor}
                  </h2>
                  
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                      onClick={() => {
                        setShowPastAppointments(!showPastAppointments);
                        setPageIndex(0); // Reset to first page when switching between past/upcoming
                      }}
                    >
                      {showPastAppointments ? "Show Upcoming" : "Show Past"}
                    </button>
                    
                    <button
                      className={`px-4 py-2 rounded-md ${
                        calendarView === "table" 
                          ? "bg-blue-500 text-white" 
                          : "bg-gray-300 text-gray-700"
                      }`}
                      onClick={() => setCalendarView("table")}
                    >
                      Table View
                    </button>
                    
                    <button
                      className={`px-4 py-2 rounded-md ${
                        calendarView === "calendar" 
                          ? "bg-blue-500 text-white" 
                          : "bg-gray-300 text-gray-700"
                      }`}
                      onClick={() => setCalendarView("calendar")}
                    >
                      Calendar View
                    </button>
                  </div>
                </div>

                {/* Status Legend for Calendar View */}
                {calendarView === "calendar" && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-semibold mb-2">Appointment Status Legend:</h3>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-200 border border-blue-500 rounded mr-1"></div>
                        <span>Scheduled</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-200 border border-green-500 rounded mr-1"></div>
                        <span>Completed</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-200 border border-red-500 rounded mr-1"></div>
                        <span>Cancelled</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-200 border border-yellow-500 rounded mr-1"></div>
                        <span>Pending</span>
                      </div>
                    </div>
                  </div>
                )}

                {calendarView === "table" ? (
                  <>
                    <Table>
                      <TableCaption>
                        {showPastAppointments
                          ? `Past appointments for Dr. ${
                              uniqueDoctors.find((d) => d.id === selectedDoctor)?.username || selectedDoctor
                            }`
                          : `Upcoming appointments for Dr. ${
                              uniqueDoctors.find((d) => d.id === selectedDoctor)?.username || selectedDoctor
                            }`}
                      </TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Appointment Date</TableHead>
                          <TableHead>Start Time</TableHead>
                          <TableHead>End Time</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Phone Number</TableHead>
                          <TableHead>Card No</TableHead>
                          <TableHead>Reason for Visit</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedAppointments.length > 0 ? (
                          paginatedAppointments.map((appointment) => (
                            <TableRow key={appointment.id}>
                              <TableCell>
                                {new Date(appointment.appointmentDate).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </TableCell>
                              <TableCell>{formatTime(appointment.appointmentTime)}</TableCell>
                              <TableCell>{formatTime(appointment.appointmentEndTime)}</TableCell>
                              <TableCell>{appointment.patientId?.id?.firstname || 'Unknown'}</TableCell>
                              <TableCell>{appointment.patientId?.id?.phoneNumber || 'N/A'}</TableCell>
                              <TableCell>{appointment.patientId?.id?.cardno || 'N/A'}</TableCell>
                              <TableCell>{appointment.reasonForVisit || "Not specified"}</TableCell>
                              <TableCell>
                                <p
                                  className={`flex items-center justify-center px-1 py-1 rounded-full ${getStatusClass(
                                    appointment.status
                                  )}`}
                                >
                                  {appointment.status}
                                </p>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-gray-500">
                              No {showPastAppointments ? "past" : "upcoming"} appointments found for this doctor.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>

                    {/* Pagination Controls */}
                    {filteredAppointments.length > 0 && (
                      <div className="flex items-center justify-between px-2 mt-4">
                        <div className="flex-1 text-sm text-muted-foreground">
                          Page {pageIndex + 1} of {totalPages} ({filteredAppointments.length} total appointments)
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => handlePageChange(0)}
                            disabled={pageIndex === 0}
                          >
                            <DoubleLeftOutlined className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handlePageChange(pageIndex - 1)}
                            disabled={pageIndex === 0}
                          >
                            <LeftOutlined className="h-4 w-4" />
                          </Button>
                          <Select
                            value={`${pageSize}`}
                            onValueChange={(value) => {
                              setPageSize(Number(value));
                              setPageIndex(0);
                            }}
                          >
                            <SelectTrigger className="h-8 w-[70px]">
                              <SelectValue placeholder={pageSize.toString()} />
                            </SelectTrigger>
                            <SelectContent side="top">
                              {[10, 20, 30, 40, 50].map((size) => (
                                <SelectItem key={size} value={`${size}`}>
                                  {size}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            onClick={() => handlePageChange(pageIndex + 1)}
                            disabled={pageIndex >= totalPages - 1}
                          >
                            <RightOutlined className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handlePageChange(totalPages - 1)}
                            disabled={pageIndex >= totalPages - 1}
                          >
                            <DoubleRightOutlined className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white p-4 rounded-lg shadow">
                    <FullCalendar
                      plugins={[dayGridPlugin, interactionPlugin]}
                      initialView="dayGridMonth"
                      headerToolbar={{
                        left: "prev,next today",
                        center: "title",
                        right: "" // Remove other view buttons
                      }}
                      events={calendarEvents}
                      eventContent={renderEventContent}
                      eventClick={handleEventClick}
                      eventMouseEnter={handleEventMouseEnter}
                      eventMouseLeave={handleEventMouseLeave}
                      height="600px"
                      weekends={true}
                      editable={false}
                      selectable={false}
                      dayMaxEvents={3}
                      eventDisplay="block"
                      dayHeaderFormat={{ weekday: 'short', day: 'numeric', month: 'short' }}
                      dayCellContent={(args) => {
                        return { html: `<div class="fc-daygrid-day-number">${args.dayNumberText}</div>` };
                      }}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500 p-8 bg-gray-100 rounded-lg">
                <p className="text-lg">Select a doctor to view their appointments.</p>
                <p className="text-sm mt-2">Choose a doctor from the sidebar to see their schedule in table or calendar view.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TodayAppointments;