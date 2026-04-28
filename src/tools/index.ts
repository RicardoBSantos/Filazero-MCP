import { listCompanies } from "./listCompanies.js";
import { getCompanyServices } from "./getCompanyServices.js";
import { getAvailableDates } from "./getAvailableDates.js";
import { getAvailableSessions } from "./getAvailableSessions.js";
import { getBookingForm } from "./getBookingForm.js";
import { scheduleAppointment } from "./scheduleAppointment.js";
import { checkTicketStatus } from "./checkTicketStatus.js";
import { listMyTickets } from "./listMyTickets.js";

export const ALL_TOOLS = [
  listCompanies,
  getCompanyServices,
  getAvailableDates,
  getAvailableSessions,
  getBookingForm,
  scheduleAppointment,
  checkTicketStatus,
  listMyTickets,
] as const;
