/**
 * Cheque Status Enum and Constants
 */

export enum CheckStatus {
  PENDING = "Pending",
  CLEARED = "Cleared",
  BOUNCED = "Bounced",
  CANCELLED = "Cancelled",
  RETURNED = "Returned",
}

// Color mapping for each check status
export const CHECK_STATUS_COLORS: Record<CheckStatus, string> = {
  [CheckStatus.PENDING]: "#ff9800",
  [CheckStatus.CLEARED]: "#4caf50",
  [CheckStatus.BOUNCED]: "#f44336",
  [CheckStatus.CANCELLED]: "#9e9e9e",
  [CheckStatus.RETURNED]: "#ff5722",
};

// Array of all check status values
export const CHECK_STATUS_OPTIONS = Object.values(CheckStatus) as readonly string[];


