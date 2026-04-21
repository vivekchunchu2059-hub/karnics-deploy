import React, { useMemo, useState } from 'react';
import { Box, Typography, TextField, Select, MenuItem, Button, styled, IconButton, Dialog, DialogActions, DialogContent, TableBody, TableCell, TableHead, TableRow as MuiTableRow } from '@mui/material';
import { useNotification } from '../../services/notificationService';
import { Add as AddIcon, Delete as DeleteIcon, Download as DownloadIcon } from '@mui/icons-material';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../../api';
import { INVOICE_CONFIG } from '../../config/invoice';
import log from '../../utils/logger';

const Container = styled(Box)(({ theme }) => ({
  marginLeft: 280,
  padding: '24px',
  backgroundColor: '#f8f9fa',
  minHeight: 'calc(100vh - 70px)',
  width: 'calc(100% - 280px)',
  overflowY: 'auto',
  overflowX: 'hidden',
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '24px',
  color: '#2c2c2c',
  marginBottom: '24px',
}));

const FormSection = styled(Box)(({ theme }) => ({
  backgroundColor: '#ffffff',
  padding: '24px',
  borderRadius: '8px',
  marginBottom: '24px',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '16px',
  color: '#2c2c2c',
  marginBottom: '20px',
  paddingBottom: '12px',
  borderBottom: '1px solid #e0e0e0',
}));

const FormField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    '& fieldset': {
      borderColor: '#d3d3d3',
    },
  },
}));

const FormSelect = styled(Select)(({ theme }) => ({
  borderRadius: '6px',
  backgroundColor: '#ffffff',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#d3d3d3',
  },
}));

const PurchaseTable = styled(Box)(({ theme }) => ({
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  overflow: 'hidden',
}));

const TableHeader = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr 1fr 1.2fr 0.6fr',
  gap: '8px',
  backgroundColor: '#fafafa',
  padding: '12px',
  fontWeight: 600,
  fontSize: '13px',
  color: '#424242',
}));

const PurchaseRow = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr 1fr 1.2fr 0.6fr',
  gap: '8px',
  padding: '12px',
  borderTop: '1px solid #f0f0f0',
  alignItems: 'center',
}));

const TotalSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '10px',
  marginTop: '16px',
}));

const TotalRow = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '160px 160px',
  gap: '16px',
  fontSize: '14px',
  alignItems: 'center',
}));

const ButtonGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: '16px',
  justifyContent: 'flex-end',
  marginTop: '24px',
}));

const SaveButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#2e2d47',
  color: '#ffffff',
  textTransform: 'none',
  fontSize: '14px',
  fontWeight: 500,
  padding: '10px 32px',
  borderRadius: '6px',
  '&:hover': {
    backgroundColor: '#3a3855',
  },
}));

const CancelButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#e0e0e0',
  color: '#424242',
  textTransform: 'none',
  fontSize: '14px',
  fontWeight: 500,
  padding: '10px 32px',
  borderRadius: '6px',
  '&:hover': {
    backgroundColor: '#bdbdbd',
  },
}));

const PrintDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    maxWidth: '900px',
    width: '100%',
    borderRadius: 0,
  },
}));

const InvoiceHeader = styled(Box)(({ theme }) => ({
  backgroundColor: '#2e2d47',
  color: '#ffffff',
  padding: '24px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
}));

const InvoiceContent = styled(Box)(({ theme }) => ({
  padding: '32px',
  backgroundColor: '#ffffff',
}));

type SaleItem = {
  itemName: string;
  metal: string;
  quantity: number | string;
  price: number | string;
  description?: string;
};

type SaleForm = {
  billNumber: string;
  billDate: string;
  customerTitle: string;
  customerName: string;
  state: string;
  city: string;
  panAadharType: string;
  panAadharNumber: string;
  address: string;
  contactNumber: string;
  discountType: 'fixed' | 'percent';
  discountValue: number;
  items: SaleItem[];
  totals?: {
    subtotal: number;
    gst: number;
    discount: number;
    grandTotal: number;
  };
  id?: number;
};

const EditBill: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();
  const invoice = (location.state as any)?.invoice as SaleForm | undefined;

  const defaultValues: SaleForm = {
    billNumber: invoice?.billNumber || '',
    billDate: invoice?.billDate || '',
    customerTitle: (invoice as any)?.customerTitle || 'Mr',
    customerName: invoice?.customerName || '',
    state: (invoice as any)?.state || '',
    city: (invoice as any)?.city || '',
    panAadharType: (invoice as any)?.panAadharType || 'Aadhar',
    panAadharNumber: (invoice as any)?.panAadharNumber || '',
    address: (invoice as any)?.address || '',
    contactNumber: invoice?.contactNumber || '',
    discountType: (invoice as any)?.discountType || 'fixed',
    discountValue: (invoice as any)?.discountValue || 0,
    items:
      invoice?.items?.map((i) => ({
        itemName: i.itemName || '',
        metal: i.metal || '',
        quantity: i.quantity || 0,
        price: i.price || 0,
        description: i.description || '',
      })) || [{ itemName: '', metal: '', quantity: 1, price: 0, description: '' }],
    totals: invoice?.totals,
    id: invoice?.id,
  };

  const { showSuccess, showError } = useNotification();
  const [printOpen, setPrintOpen] = useState(false);

  const {
    control,
    setValue,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SaleForm>({
    defaultValues,
    mode: 'onBlur',
  });

  const { fields, append, remove } = useFieldArray<SaleForm>({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const watchedValues = watch();
  const discountType = watch('discountType');
  const discountValue = Number(watch('discountValue') || 0);

  const totals = useMemo(() => {
    const subtotal = (watchedItems || []).reduce((sum: number, item: SaleForm['items'][number]) => {
      const price = Number(item?.price) || 0;
      const qty = Number(item?.quantity) || 0;
      return sum + price * qty;
    }, 0);
    const discountAmount = discountType === 'percent' ? subtotal * (discountValue / 100) : discountValue;
    const gst = subtotal * 0.03;
    const grandTotal = Math.max(subtotal + gst - discountAmount, 0);
    return { subtotal, gst, discount: discountAmount, grandTotal };
  }, [watchedItems, discountType, discountValue]);

  const onSubmit = async (data: SaleForm) => {
    try {
      log.info("Updating Invoice...");
      const payload = {
        billNumber: data.billNumber,
        billDate: data.billDate,
        customerName: `${data.customerTitle} ${data.customerName}`.trim(),
        state: data.state,
        city: data.city,
        panAadharType: data.panAadharType,
        panAadharNumber: data.panAadharNumber,
        address: data.address,
        contactNumber: data.contactNumber,
        discountType: data.discountType,
        discountValue: data.discountValue,
        items: data.items.map((item) => ({
          itemName: item.itemName,
          metal: item.metal,
          quantity: Number(item.quantity),
          price: Number(item.price),
          description: item.description,
        })),
        totals,
      };

      await apiClient.put(`/api/sales/${params.id || data.id}`, payload);
      log.info("Invoice updated successfully");
      showSuccess('Invoice updated successfully');
      navigate('/invoices');
    } catch (error: any) {
      log.error("Failed to update invoice:", error);
      const details = error?.response?.data?.details;
      const message = Array.isArray(details)
        ? details.join(', ')
        : error?.response?.data?.error || 'Failed to update invoice';
      showError(message);
    }
  };

  const handlePrint = () => setPrintOpen(true);
  const handlePrintClose = () => setPrintOpen(false);

  const handleAddItem = () => append({ itemName: '', metal: '', quantity: 1, price: 0, description: '' });

  const renderInvoiceTable = () => (
    <Box sx={{ mt: 3 }}>
      <TableHeader>
        <span>Item</span>
        <span>Metal</span>
        <span>Qty</span>
        <span>Price</span>
        <span>Description</span>
        <span>Action</span>
      </TableHeader>
      {fields.map((fieldItem, index) => (
        <PurchaseRow key={fieldItem.id}>
          <FormField
            fullWidth
            size="small"
            value={fieldItem.itemName}
            error={!!errors.items?.[index]?.itemName}
            helperText={errors.items?.[index]?.itemName?.message}
            onChange={(e) => {
              const value = e.target.value;
              setValue(`items.${index}.itemName`, value);
            }}
          />
          <FormSelect
            fullWidth
            size="small"
            displayEmpty
            value={fieldItem.metal}
            error={!!errors.items?.[index]?.metal}
            onChange={(e) => setValue(`items.${index}.metal`, e.target.value as string)}
          >
            <MenuItem value="">
              <em>Select</em>
            </MenuItem>
            <MenuItem value="Gold">Gold</MenuItem>
            <MenuItem value="Silver">Silver</MenuItem>
            <MenuItem value="Platinum">Platinum</MenuItem>
            <MenuItem value="Diamond">Diamond</MenuItem>
            <MenuItem value="Gemstones">Gemstones</MenuItem>
          </FormSelect>
          <FormField
            type="number"
            fullWidth
            size="small"
            inputProps={{ step: '0.01' }}
            value={fieldItem.quantity}
            error={!!errors.items?.[index]?.quantity}
            helperText={errors.items?.[index]?.quantity?.message}
            onChange={(e) => setValue(`items.${index}.quantity`, e.target.value === '' ? '' : Number(e.target.value))}
          />
          <FormField
            type="number"
            fullWidth
            size="small"
            inputProps={{ step: '0.01' }}
            value={fieldItem.price}
            error={!!errors.items?.[index]?.price}
            helperText={errors.items?.[index]?.price?.message}
            onChange={(e) => setValue(`items.${index}.price`, e.target.value === '' ? '' : Number(e.target.value))}
          />
          <FormField
            fullWidth
            size="small"
            value={fieldItem.description || ''}
            onChange={(e) => setValue(`items.${index}.description`, e.target.value)}
          />
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton className="delete" onClick={() => remove(index)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </PurchaseRow>
      ))}
    </Box>
  );

  return (
    <Container>
      <PageTitle>Edit Invoice</PageTitle>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormSection>
          <SectionTitle>Bill Details</SectionTitle>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <Box>
              <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>Bill Number</Typography>
              <Controller
                name="billNumber"
                control={control}
                rules={{ required: 'Bill Number is required' }}
                render={({ field }) => (
                  <FormField {...field} fullWidth error={!!errors.billNumber} helperText={errors.billNumber?.message} />
                )}
              />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>Bill Date</Typography>
              <Controller
                name="billDate"
                control={control}
                rules={{ required: 'Bill Date is required' }}
                render={({ field }) => (
                  <FormField
                    {...field}
                    fullWidth
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.billDate}
                    helperText={errors.billDate?.message}
                  />
                )}
              />
            </Box>
          </Box>
        </FormSection>

        <FormSection>
          <SectionTitle>Customer Details</SectionTitle>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <Box>
                <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>Customer Name</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Controller
                    name="customerTitle"
                    control={control}
                    render={({ field }) => (
                      <FormSelect {...field} size="small" sx={{ width: '100px' }}>
                        <MenuItem value="Mr">Mr</MenuItem>
                        <MenuItem value="Mrs">Mrs</MenuItem>
                        <MenuItem value="Ms">Ms</MenuItem>
                      </FormSelect>
                    )}
                  />
                  <Controller
                    name="customerName"
                    control={control}
                    rules={{ required: 'Customer name is required' }}
                    render={({ field }) => (
                      <FormField
                        {...field}
                        fullWidth
                        size="small"
                        error={!!errors.customerName}
                        helperText={errors.customerName?.message}
                      />
                    )}
                  />
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>State</Typography>
                  <Controller
                    name="state"
                    control={control}
                    rules={{ required: 'State is required' }}
                    render={({ field }) => (
                      <FormField
                        {...field}
                        fullWidth
                        size="small"
                        error={!!errors.state}
                        helperText={errors.state?.message}
                      />
                    )}
                  />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>City</Typography>
                  <Controller
                    name="city"
                    control={control}
                    rules={{ required: 'City is required' }}
                    render={({ field }) => (
                      <FormField
                        {...field}
                        fullWidth
                        size="small"
                        error={!!errors.city}
                        helperText={errors.city?.message}
                      />
                    )}
                  />
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <Box>
                <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>PAN/Aadhar Type</Typography>
                <Controller
                  name="panAadharType"
                  control={control}
                  render={({ field }) => (
                    <FormSelect fullWidth {...field} size="small">
                      <MenuItem value="Aadhar">Aadhar</MenuItem>
                      <MenuItem value="PAN">PAN</MenuItem>
                      <MenuItem value="Passport">Passport</MenuItem>
                    </FormSelect>
                  )}
                />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>PAN/Aadhar Number</Typography>
                <Controller
                  name="panAadharNumber"
                  control={control}
                  rules={{ required: 'PAN/Aadhar Number is required' }}
                  render={({ field }) => (
                    <FormField
                      {...field}
                      fullWidth
                      size="small"
                      error={!!errors.panAadharNumber}
                      helperText={errors.panAadharNumber?.message}
                    />
                  )}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 4 }}>
              <Box>
                <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>Address</Typography>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <FormField
                      {...field}
                      fullWidth
                      multiline
                      minRows={3}
                      size="small"
                      error={!!errors.address}
                      helperText={errors.address?.message}
                    />
                  )}
                />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>Contact Number</Typography>
                <Controller
                  name="contactNumber"
                  control={control}
                  rules={{
                    required: 'Contact Number is required',
                    pattern: { value: /^[0-9]{10,15}$/, message: 'Enter valid number' },
                  }}
                  render={({ field }) => (
                    <FormField
                      {...field}
                      fullWidth
                      size="small"
                      error={!!errors.contactNumber}
                      helperText={errors.contactNumber?.message}
                    />
                  )}
                />
              </Box>
            </Box>
          </Box>
        </FormSection>

        <FormSection>
          <SectionTitle>Purchase Items</SectionTitle>
          <PurchaseTable>
            <TableHeader>
              <span>Item</span>
              <span>Metal</span>
              <span>Qty</span>
              <span>Price</span>
              <span>Description</span>
              <span>Action</span>
            </TableHeader>
            {renderInvoiceTable()}
          </PurchaseTable>

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            sx={{ mt: 2, borderColor: '#d3d3d3', color: '#424242' }}
            onClick={handleAddItem}
          >
            Add Item
          </Button>
        </FormSection>

        <FormSection>
          <SectionTitle>Discount</SectionTitle>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ minWidth: 160 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>Type</Typography>
              <Controller
                name="discountType"
                control={control}
                render={({ field }) => (
                  <FormSelect {...field} fullWidth size="small">
                    <MenuItem value="fixed">Fixed (₹)</MenuItem>
                    <MenuItem value="percent">Percentage (%)</MenuItem>
                  </FormSelect>
                )}
              />
            </Box>
            <Box sx={{ minWidth: 180 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>Amount</Typography>
              <Controller
                name="discountValue"
                control={control}
                render={({ field }) => (
                  <FormField
                    {...field}
                    type="number"
                    fullWidth
                    size="small"
                    inputProps={{ step: '0.01', min: 0 }}
                  />
                )}
              />
            </Box>
            {discountType === 'percent' && (
              <Typography sx={{ color: '#616161', fontSize: '13px' }}>
                Applied: ₹{totals.discount.toFixed(2)}
              </Typography>
            )}
          </Box>
        </FormSection>

        <FormSection>
          <SectionTitle>Totals</SectionTitle>
          <TotalSection>
            <TotalRow>
              <Typography sx={{ color: '#616161' }}>Subtotal</Typography>
              <Typography sx={{ fontWeight: 600 }}>₹{totals.subtotal.toFixed(2)}</Typography>
            </TotalRow>
            <TotalRow>
              <Typography sx={{ color: '#616161' }}>GST (3%)</Typography>
              <Typography sx={{ fontWeight: 600 }}>₹{totals.gst.toFixed(2)}</Typography>
            </TotalRow>
            <TotalRow>
              <Typography sx={{ color: '#616161' }}>Discount</Typography>
              <Typography sx={{ fontWeight: 600 }}>₹{totals.discount.toFixed(2)}</Typography>
            </TotalRow>
            <TotalRow>
              <Typography sx={{ color: '#616161' }}>Grand Total</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '18px', color: '#2e2d47' }}>
                ₹{totals.grandTotal.toFixed(2)}
              </Typography>
            </TotalRow>
          </TotalSection>
        </FormSection>

        <ButtonGroup>
          <CancelButton type="button" onClick={() => navigate('/invoices')}>
            Cancel
          </CancelButton>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handlePrint}>
            Print
          </Button>
          <SaveButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </SaveButton>
        </ButtonGroup>
      </form>

      <PrintDialog open={printOpen} onClose={handlePrintClose} maxWidth="md" fullWidth>
        <DialogContent sx={{ padding: 0 }}>
          <InvoiceHeader>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {INVOICE_CONFIG.shopName}
              </Typography>
              {INVOICE_CONFIG.tagline && (
                <Typography sx={{ fontSize: '12px', color: '#e0e0e0' }}>
                  {INVOICE_CONFIG.tagline}
                </Typography>
              )}
              <Typography sx={{ fontSize: '12px', lineHeight: 1.4, mt: 0.5 }}>
                {INVOICE_CONFIG.addressLines.join(', ')}
              </Typography>
              <Typography sx={{ fontSize: '12px', lineHeight: 1.4 }}>
                {INVOICE_CONFIG.phone} {INVOICE_CONFIG.email ? `| ${INVOICE_CONFIG.email}` : ''}
              </Typography>
              {INVOICE_CONFIG.gstNumber && (
                <Typography sx={{ fontSize: '12px', lineHeight: 1.4 }}>
                  {INVOICE_CONFIG.gstNumber}
                </Typography>
              )}
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: '12px' }}>
                Bill No: {watchedValues.billNumber || '—'}
              </Typography>
              <Typography sx={{ fontSize: '12px' }}>
                Date: {watchedValues.billDate || '—'}
              </Typography>
            </Box>
          </InvoiceHeader>

          <InvoiceContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: '14px', mb: 1 }}>
                  BILL TO:
                </Typography>
                <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>
                  {`${watchedValues.customerTitle || ''} ${watchedValues.customerName || ''}`.trim() || 'Customer'}
                </Typography>
                <Typography sx={{ fontSize: '12px', lineHeight: 1.6, color: '#666' }}>
                  {watchedValues.address || 'Address not provided'}
                  <br />
                  {watchedValues.contactNumber ? `Mobile: ${watchedValues.contactNumber}` : ''}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ fontSize: '12px', color: '#666', mb: 0.5 }}>
                  PAYMENT MODE
                </Typography>
                <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>
                  Cash
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 2 }}>
              <TableHead>
              <MuiTableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Metal</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Total</TableCell>
              </MuiTableRow>
              </TableHead>
              <TableBody>
                {watchedItems.map((item, idx) => {
                  const qty = Number(item.quantity) || 0;
                  const price = Number(item.price) || 0;
                  const lineTotal = qty * price;
                  return (
                  <MuiTableRow key={`${item.itemName || 'item'}-${idx}`}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        {item.itemName || '—'}
                        {item.description ? (
                          <span style={{ fontSize: '11px', color: '#666', display: 'block' }}>
                            {item.description}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>{item.metal || '—'}</TableCell>
                      <TableCell align="right">{qty}</TableCell>
                      <TableCell align="right">₹{price.toFixed(2)}</TableCell>
                      <TableCell align="right">₹{lineTotal.toFixed(2)}</TableCell>
                  </MuiTableRow>
                  );
                })}
              <MuiTableRow sx={{ backgroundColor: '#fff3e0' }}>
                  <TableCell colSpan={4} />
                  <TableCell sx={{ fontWeight: 600 }}>Subtotal</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    ₹{totals.subtotal.toFixed(2)}
                  </TableCell>
              </MuiTableRow>
              <MuiTableRow>
                  <TableCell colSpan={4} />
                  <TableCell>GST (3%)</TableCell>
                  <TableCell align="right">
                    ₹{totals.gst.toFixed(2)}
                  </TableCell>
              </MuiTableRow>
              <MuiTableRow>
                  <TableCell colSpan={4} />
                  <TableCell>Discount</TableCell>
                  <TableCell align="right">
                    ₹{totals.discount.toFixed(2)}
                  </TableCell>
              </MuiTableRow>
              <MuiTableRow sx={{ backgroundColor: '#fff3e0' }}>
                  <TableCell colSpan={4} />
                  <TableCell sx={{ fontWeight: 700 }}>Grand Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    ₹{totals.grandTotal.toFixed(2)}
                  </TableCell>
              </MuiTableRow>
              </TableBody>
            </Box>
          </InvoiceContent>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePrintClose}>Close</Button>
          <Button variant="contained" onClick={() => window.print()} startIcon={<DownloadIcon />}>
            Download / Print
          </Button>
        </DialogActions>
      </PrintDialog>
    </Container>
  );
};

export default EditBill;
