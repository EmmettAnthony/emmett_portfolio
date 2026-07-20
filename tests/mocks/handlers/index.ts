import { authHandlers } from "./auth";
import { invoiceHandlers } from "./invoices";
import { customerHandlers } from "./customers";
import { bookingHandlers } from "./bookings";
import { emailHandlers } from "./email";
import { notificationHandlers } from "./notifications";
import { supportHandlers } from "./support";
import { crmHandlers } from "./crm";

export const handlers = [
  ...authHandlers,
  ...invoiceHandlers,
  ...customerHandlers,
  ...bookingHandlers,
  ...emailHandlers,
  ...notificationHandlers,
  ...supportHandlers,
  ...crmHandlers,
];
