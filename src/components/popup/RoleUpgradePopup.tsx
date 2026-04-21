import React from "react";
import { Dialog, DialogContent, DialogActions, Typography, Button, Box } from "@mui/material";

interface Props {
  open: boolean;
  onConfirm: () => void;
}

const RoleUpgradePopup: React.FC<Props> = ({ open, onConfirm }) => {
  return (
    <Dialog
      open={open}
      PaperProps={{
        sx: {
          borderRadius: "18px",
          padding: 2,
          minWidth: "420px",
          textAlign: "center"
        }
      }}
    >
      <DialogContent>
        <Box>
          <Typography variant="h6" fontWeight="600" mb={2}>
            Role Privilege Updated 🎉
          </Typography>

          <Typography fontSize="14px" color="text.secondary">
            Your account privileges have been upgraded to
            <strong> Super Administrator </strong>.
            Please login again to access administrative features.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button
          variant="contained"
          onClick={onConfirm}
          sx={{ borderRadius: "8px", paddingX: 4 }}
        >
          OK, Re-login
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoleUpgradePopup;