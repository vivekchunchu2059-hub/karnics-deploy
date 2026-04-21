import React from "react";
import { ButtonGroup, CancelButton, PrintButton, SaveButton } from "./BillingStyles";

type ActionsBarProps = {
  onCancel?: () => void;
  onPrint: () => void;
  isSubmitting: boolean;
  buttonText?: string;
};

export const ActionsBar: React.FC<ActionsBarProps> = ({
  onCancel,
  onPrint,
  isSubmitting,
  buttonText = "Save",
}) => (
  <ButtonGroup>
      <CancelButton type="button" onClick={onCancel}>
        Cancel
      </CancelButton>
    <PrintButton type="button" onClick={onPrint}>
      Print
    </PrintButton>
    <SaveButton type="submit" disabled={isSubmitting}>
      {isSubmitting ? (buttonText === "Update" ? "Updating..." : "Saving...") : buttonText}
    </SaveButton>
  </ButtonGroup>
);

