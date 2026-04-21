import React, { useEffect, useState } from 'react';
import { Box, IconButton, DialogContent, DialogActions, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { StyledDialog, DialogTitleStyled, FormField, SaveButton, CancelButton } from '../Inventory/InventoryWidgets';
import { CustomerDetails } from '../../models/Billing';
import { customerValidationSchema } from './customerValidation';
import { customerEditFormContainerSx, customerEditFieldsContainerSx, customerEditActionsRowSx, customerSuccessDialogContentSx, customerSuccessIconContainerSx, customerSuccessCheckIconSx, customerSuccessTitleTypographySx, customerSuccessBodyTypographySx, customerSuccessDialogActionsSx, customerSuccessOkButtonSx } from './CustomerStyle';
import { useFormik } from 'formik';

interface CustomerEditDialogProps {
  open: boolean;
  customer: CustomerDetails | null;
  onClose: () => void;
  onSave: (payload: Partial<CustomerDetails>) => void;
}

type EditCustomerValues = Partial<CustomerDetails>;

const CustomerEditDialog: React.FC<CustomerEditDialogProps> = ({
  open,
  customer,
  onClose,
  onSave,
}) => {
  const formikValues = useFormik<EditCustomerValues>({
    initialValues: {
     customerName:  '',
     address: '',
     city: '',
     contactNumber: '',
     email: '',
  },
 validationSchema: customerValidationSchema,
  onSubmit: (values) => {
    onSave({...values,
      customerName: (values.customerName || '').trim(),
      contactNumber: (values.contactNumber || '').trim(),
      address: values.address || '',
      city: values.city || '',
      email: values.email?.trim(),
    });
    setOpenSuccessDialog(true);
  },
});
  const [openSuccessDialog, setOpenSuccessDialog] = useState<boolean>(false);

  useEffect(() => {
    if (customer) {
      formikValues.setValues({
        customerName: customer.customerName || '',
        address: customer.address || '',
        city: customer.city || '',
        contactNumber: customer.contactNumber || '',
        email: (customer as any).email || '',
      });
    }
  }, [customer]);


  return (
    <>
      <StyledDialog open={open} onClose={onClose}>
        <DialogTitleStyled>
          Edit Customer
          <IconButton onClick={onClose} className="dialog-title">
            <CloseIcon />
          </IconButton>
        </DialogTitleStyled>

        <Box component="form" onSubmit={formikValues.handleSubmit} sx={customerEditFormContainerSx}>
          <Box sx={customerEditFieldsContainerSx}>
            <FormField
              label="Customer Name"
              name="customerName"
              value={formikValues.values.customerName}
              onChange={formikValues.handleChange}
              onBlur={formikValues.handleBlur}
              error={ formikValues.touched.customerName && Boolean(formikValues.errors.customerName)}
              helperText={formikValues.touched.customerName && formikValues.errors.customerName}
              sx={{ flex: 1 }}
            />

            <FormField
              label="Address"
              name="address"
              value={formikValues.values.address}
              onChange={formikValues.handleChange}
              onBlur={formikValues.handleBlur}
              error={ formikValues.touched.address && Boolean(formikValues.errors.address)}
              helperText={formikValues.touched.address && formikValues.errors.address}
              sx={{ flex: 1 }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormField
                label="City"
                name="city"
                value={formikValues.values.city}
                onChange={formikValues.handleChange}
                onBlur={formikValues.handleBlur}
                error={ formikValues.touched.city && Boolean(formikValues.errors.city)}
                helperText={formikValues.touched.city && formikValues.errors.city}
                sx={{ flex: 1 }}
              />
              <FormField
                label="Phone Number"
                name="contactNumber"
                value={formikValues.values.contactNumber}
                onChange={formikValues.handleChange}
                onBlur={formikValues.handleBlur}
                error={ formikValues.touched.contactNumber && Boolean(formikValues.errors.contactNumber)}
                helperText={formikValues.touched.contactNumber && formikValues.errors.contactNumber}
                sx={{ flex: 1 }}
              />
            </Box>

            <FormField
              label="Email"
              name="email"
              value={formikValues.values.email}
              onChange={formikValues.handleChange}
              onBlur={formikValues.handleBlur}
              error={ formikValues.touched.email && Boolean(formikValues.errors.email)}
              helperText={formikValues.touched.email && formikValues.errors.email}
              sx={{ flex: 1 }}
            />
          </Box>

          <Box sx={customerEditActionsRowSx}>
            <CancelButton type="button" onClick={onClose}>
              Cancel
            </CancelButton>
            <SaveButton type="submit">
              Save
            </SaveButton>
          </Box>
        </Box>
      </StyledDialog>

      {/* Success Dialog */}
      <StyledDialog
        open={openSuccessDialog}
        onClose={() => setOpenSuccessDialog(false)}
      >
        <DialogContent sx={customerSuccessDialogContentSx}>
          <Box sx={customerSuccessIconContainerSx}>
            <Box sx={customerSuccessCheckIconSx} />
          </Box>

          <Typography variant="h6" sx={customerSuccessTitleTypographySx}>
            Success!
          </Typography>

          <Typography sx={customerSuccessBodyTypographySx}>
            Customer details updated successfully.
          </Typography>
        </DialogContent>
        <DialogActions sx={customerSuccessDialogActionsSx}>
          <SaveButton
            onClick={() => setOpenSuccessDialog(false)}
            sx={customerSuccessOkButtonSx}
          >
            OK
          </SaveButton>
        </DialogActions>
      </StyledDialog>
    </>
  );
};

export default CustomerEditDialog;

