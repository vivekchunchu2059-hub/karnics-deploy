import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { Formik, Form, FormikHelpers } from "formik";
import { useLocation, useNavigate } from "react-router-dom";
import { apiClient } from "../../api";
import { INVOICE_CONFIG } from "../../config/invoice";
import { ActionsBar } from "./components/ActionsBar";
import { validationSchema } from "./BillingValidator";
import { billingDialogContainerSx, billingDialogHeaderIconSx, billingDialogHeaderSx, billingDialogHeaderTitleSx,} from "./components/BillingStyles";
import { PageLayout } from "../../components/PageLayout";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import { useNotification } from "../../services/notificationService";
import { BillDetailsSection } from "./components/BillDetailsSection";
import { CustomerSection } from "./components/CustomerSection";
import { GSTSection } from "./components/GSTSection";
import { PaymentModeSection } from "./components/PaymentModeSection";
import { DiscountSection } from "./components/DiscountSection";
import { PurchaseItemsSection } from "./components/PurchaseItemsSection";
import { BillingFormValues, BillingTotals, InvoiceRecords } from "../../models/Billing";
import { API_ENDPOINTS, MESSAGES } from "../../constants/common";
import { INDIAN_STATES } from "../../constants/indianStates";
import { InvoiceResponse } from "../../models/Billing";
import log from '../../utils/logger';

/** Shared print handler: opens the browser print dialog. Used by InvoiceDialog in Billing and Installment flow. */
export const openInvoicePrintDialog = () => {
  window.print();
};

const normalizeText = (val: string) =>
  (val || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const calculateTotals = (values: BillingFormValues): BillingTotals => {
  const cgstPercent = values.gstEnabled ? (values.cgstPercent || 0) : 0;
  const sgstPercent = values.gstEnabled ? (values.gstPercent || 0) : 0;
  const subtotal = (values.items || []).reduce((sum, item) => {
    const price = Number(item?.price) || 0;
    const qty = Number(item?.quantity) || 0;
    const making = Number(item?.makingCharge) || 0;
    return sum + price * qty + making;
  }, 0);

  const cgstAmount = subtotal * (cgstPercent / 100);
  const sgstAmount = subtotal * (sgstPercent / 100);
  const discount =
    values.discountType === "percent"
      ? subtotal * ((Number(values.discountValue) || 0) / 100)
      : Number(values.discountValue) || 0;
  const rawGrand = Math.max(
    subtotal + cgstAmount + sgstAmount - discount,
    0
  );
  // Single canonical value for API, invoice list, and print (2 decimal paise)
  const grandTotal = Math.round(rawGrand * 100) / 100;

  return {
    subtotal,
    cgstAmount,
    sgstAmount,
    discount,
    grandTotal,
  };
};

interface BillingProps {
  embedded?: boolean;
  onClose?: () => void;
  invoice?: InvoiceRecords | null;
  requestNewInvoice?: boolean;
  onPrintInvoice?: (data: any) => void;
}

const Billing: React.FC<BillingProps> = ({
  embedded = false,
  onClose,
  invoice = null,
  requestNewInvoice = false,
  onPrintInvoice,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationInvoice = (location.state as { invoice?: InvoiceRecords })?.invoice;
  const invoiceData = invoice ?? locationInvoice;
  const locationRequestNewInvoice = Boolean((location.state as { newInvoice?: boolean } | null)?.newInvoice);
  const shouldRequestNewInvoice = requestNewInvoice || locationRequestNewInvoice;
  const isEditMode = Boolean(invoiceData?.id);
  
  const [openPrintDialog, setOpenPrintDialog] = useState<boolean>(false);
  const { showSuccess, showError } = useNotification();
  const [lastSavedData, setLastSavedData] = useState<{
    values: BillingFormValues;
    totals: BillingTotals;
  } | null>(null);
  const [stateOptions] = useState<string[]>([...INDIAN_STATES]);
  const [formikRef, setFormikRef] = useState<any>(null);
  const [existingInvoices, setExistingInvoices] = useState<string[]>([]);
  const [registrationData, setRegistrationData] = useState<{
    cgst: number;
    sgst: number;
    gstNumber: string;
    makingCharges: number;
    shopName?: string;
    shopAddress?: string;
    mobileNumber?: string;
    email?: string;
    logo?: string;
  } | null>(null);

  const generateBillNumber = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const sequence = Math.floor(Math.random() * 9000) + 1000;
    const series = INVOICE_CONFIG.billSeries || "INV";
    return `${year}-${month}-${series}${sequence}`;
  }, []);

  // Fetch all existing invoice numbers for duplicate check
  useEffect(() => {
    const fetchInvoices = async () => {
      log.info("Fetching Invoices...");
      try {
        const response = await apiClient.get<InvoiceResponse>(`${API_ENDPOINTS.INVOICES}?page=1&limit=10000`);
        log.info("Invoices fetched successfully");
        const invoiceNumbers = (response.data.data || []).map((inv: InvoiceRecords) => 
          inv.billDetails?.billNumber || (inv as any).billNumber
        ).filter(Boolean);
        setExistingInvoices(invoiceNumbers);
        log.info("Invoice Numbers fetched successfully");
      } catch (error) {
        log.error("Failed to fetch invoices:", error);
      }
    };
    fetchInvoices();
  }, []);

  // Fetch registration data (from registration.json); refetch when profile updates cgst/sgst/makingCharges
  const fetchRegistrationData = useCallback(async () => {
    try {
      const response = await apiClient.get<{ success: boolean; data: any[] }>('/api/registration');
      const registrations = response.data.data || [];
      if (registrations.length === 0) return;
      const latestRegistration = registrations[registrations.length - 1];
      const data = {
        cgst: Number(latestRegistration.cgst) || 0,
        sgst: Number(latestRegistration.sgst) || 0,
        gstNumber: latestRegistration.gstNumber,
        makingCharges: Number(latestRegistration.makingCharges) || 0,
        shopName: latestRegistration.shopName,
        shopAddress: latestRegistration.shopAddress,
        mobileNumber: latestRegistration.mobileNumber,
        email: latestRegistration.email,
        logo: latestRegistration.logo,
      };
      setRegistrationData(data);
      const formik = formikRef;
      if (formik?.setFieldValue) {
        formik.setFieldValue('cgstPercent', data.cgst);
        formik.setFieldValue('gstPercent', data.sgst);
        const items = formik.values?.items;
        if (Array.isArray(items)) {
          items.forEach((_, index) => {
            formik.setFieldValue(`items.${index}.makingCharge`, data.makingCharges);
          });
        }
      }
    } catch (error) {
      log.error('Error fetching registration data:', error);
    }
  }, [formikRef]);

  useEffect(() => {
    fetchRegistrationData();
  }, [openPrintDialog, fetchRegistrationData]);

  useEffect(() => {
    const onRegistrationUpdated = () => fetchRegistrationData();
    window.addEventListener('registrationUpdated', onRegistrationUpdated);
    return () => window.removeEventListener('registrationUpdated', onRegistrationUpdated);
  }, [fetchRegistrationData]);

  const initialValues = useMemo<BillingFormValues>(() => {
    if (invoiceData) {
      // Convert InvoiceRecords to BillingFormValues (Edit Mode)
      const billNumber = invoiceData.billDetails?.billNumber || (invoiceData as any).billNumber || "";
      const billDate = invoiceData.billDetails?.billDate || (invoiceData as any).billDate || "";
      
      // Handle customer name - extract title if present in the name string
      const customerName = invoiceData.customerDetails?.customerName || (invoiceData as any).customerName || "";
      let customerTitle = invoiceData.customerDetails?.customerTitle || (invoiceData as any).customerTitle;
      let finalCustomerName = customerName;
      
      // If title is not in customerDetails, try to extract from customerName string
      if (!customerTitle) {
        const titleMatch = customerName.match(/^(Mr|Mrs|Ms)\s+(.+)$/);
        if (titleMatch) {
          customerTitle = titleMatch[1];
          finalCustomerName = titleMatch[2];
        } else {
          customerTitle = "Mr";
        }
      } else if (customerName && customerName.match(/^(Mr|Mrs|Ms)\s+/)) {
        // If title exists but name also has title prefix, remove it
        finalCustomerName = customerName.replace(/^(Mr|Mrs|Ms)\s+/, "");
      }
      
      return {
        billDetails: {
          billNumber,
          billDate,
        },
        customerDetails: {
          customerTitle: customerTitle || "Mr",
          customerName: finalCustomerName,
          state: invoiceData.customerDetails?.state || (invoiceData as any).state || "",
          city: invoiceData.customerDetails?.city || (invoiceData as any).city || "",
          panAadharType: invoiceData.customerDetails?.panAadharType || (invoiceData as any).panAadharType || "Aadhar",
          panAadharNumber: invoiceData.customerDetails?.panAadharNumber || (invoiceData as any).panAadharNumber || "",
          address: invoiceData.customerDetails?.address || (invoiceData as any).address || "",
          contactNumber: invoiceData.customerDetails?.contactNumber || (invoiceData as any).contactNumber || "",
          email: invoiceData.customerDetails?.email || (invoiceData as any).email || "",
        },
        gstEnabled: (invoiceData as any).gstEnabled !== undefined ? (invoiceData as any).gstEnabled : true,
        gstPercent: (invoiceData as any).gstPercent || 3.3,
        cgstPercent: (invoiceData as any).cgstPercent || 3.2,
        paymentDetails: {
          mode: (invoiceData as any).paymentMode || (invoiceData as any).paymentDetails?.mode || "cash",
          amount: (invoiceData as any).paymentAmount || (invoiceData as any).paymentDetails?.amount || "",
          upiType: (invoiceData as any).upiType || (invoiceData as any).paymentDetails?.upiType || "",
          transitionId: (invoiceData as any).transitionId || (invoiceData as any).paymentDetails?.transitionId || "",
          checkNumber: (invoiceData as any).checkNumber || (invoiceData as any).paymentDetails?.checkNumber || "",
          checkDate: (invoiceData as any).checkDate || (invoiceData as any).paymentDetails?.checkDate || "",
          bankNameAddress: (invoiceData as any).bankNameAddress || (invoiceData as any).paymentDetails?.bankNameAddress || "",
          checkStatus: (invoiceData as any).paymentDetails?.checkStatus || "pending",
          advanceAmount: (invoiceData as any).paymentDetails?.advanceAmount || "",
          numberOfInstallments: (invoiceData as any).paymentDetails?.numberOfInstallments || "",
          installmentDate: (invoiceData as any).paymentDetails?.installmentDate || "",
        },
        discountType: (invoiceData as any).discountType || "fixed",
        discountValue: (invoiceData as any).discountValue || 0,
        items: invoiceData.items?.length > 0
          ? invoiceData.items.map((item) => {
              // Normalize weight - ensure it has the correct unit based on metal type
              let weight = item.weight?.toString() || "";
              if (weight) {
                const metalLower = (item.metal || "").toLowerCase();
                const hasUnit = weight.match(/\s*(gm|gms|ct|carat|grams)$/i);
                if (!hasUnit) {
                  // If no unit, add default unit based on metal type
                  if (metalLower === 'diamond' || metalLower === 'gemstones' || metalLower === 'gemstone') {
                    weight = `${weight.trim()} ct`;
                  } else {
                    weight = `${weight.trim()} gm`;
                  }
                }
              }
              return {
                itemName: item.itemName || "",
                metal: item.metal || "",
                hsn: item.hsn || INVOICE_CONFIG.defaultHsn || "",
                weight: weight,
                quantity: item.quantity || 1,
                makingCharge: item.makingCharge || INVOICE_CONFIG.defaultMakingCharge || 0,
                price: (item.price && item.price > 0 ? item.price : "") as number | "",
                description: item.description || "",
                sku: item.sku || undefined,
              };
            })
          : [
              {
                itemName: "",
                metal: "",
                hsn: INVOICE_CONFIG.defaultHsn || "",
                weight: "",
                quantity: 1,
                makingCharge: registrationData?.makingCharges ? Number(registrationData.makingCharges) : (INVOICE_CONFIG.defaultMakingCharge || 0),
                price: "",
                description: "",
              },
            ],
      };
    }
    
    // Default initial values - NO invoice number generated here
    return {
      billDetails: {
        billNumber: "",
        billDate: "",
      },
      customerDetails: {
        customerTitle: "Mr",
        customerName: "",
        state: "",
        city: "",
        panAadharType: "Aadhar",
        panAadharNumber: "",
        address: "",
        contactNumber: "",
        email: "",
      },
      gstEnabled: true,
      gstPercent: registrationData?.sgst ? Number(registrationData.sgst) : 3.3,
      cgstPercent: registrationData?.cgst ? Number(registrationData.cgst) : 3.2,
      paymentDetails: {
        mode: "cash",
        amount: "",
        upiType: "",
        transitionId: "",
        checkNumber: "",
        checkDate: "",
        bankNameAddress: "",
        checkStatus: "pending",
        advanceAmount: "",
        numberOfInstallments: undefined,
        installmentDate: "",
      },
      discountType: "fixed",
      discountValue: 0,
      items: [
        {
          itemName: "",
          metal: "",
          hsn: INVOICE_CONFIG.defaultHsn || "",
          weight: "",
          quantity: 1,
          makingCharge: registrationData?.makingCharges ? Number(registrationData.makingCharges) : (INVOICE_CONFIG.defaultMakingCharge || 0),
          price: 0,
          description: "",
          
        },
      ],
    };
  }, [invoiceData, registrationData]);


  const handleSubmit = async (
    values: BillingFormValues,
    helpers: FormikHelpers<BillingFormValues>
  ) => {
    try {
      // Check for duplicate invoice number (only for new invoices, not updates)
      const isEditing = invoiceData?.id;
      if (!isEditing) {
        const billNumber = values.billDetails.billNumber || "";
        const isDuplicate = existingInvoices.includes(billNumber);
        if (isDuplicate) {
          showError(`Invoice already exists! Please generate a new invoice. This invoice number ${billNumber} already exists.`);
          helpers.setSubmitting(false);
          return;
        }
      }




      const totals = calculateTotals(values);
      const payload = {
        billNumber: values.billDetails.billNumber,
        billDate: values.billDetails.billDate,
        customerName: `${values.customerDetails.customerTitle} ${values.customerDetails.customerName}`.trim(),
        state: values.customerDetails.state,
        city: values.customerDetails.city,
        panAadharType: values.customerDetails.panAadharType,
        panAadharNumber: values.customerDetails.panAadharNumber,
        address: values.customerDetails.address,
        contactNumber: values.customerDetails.contactNumber,
        email: values.customerDetails.email || undefined,
        customerDetails: {
          customerTitle: values.customerDetails.customerTitle,
          customerName: values.customerDetails.customerName,
          state: values.customerDetails.state,
          city: values.customerDetails.city,
          panAadharType: values.customerDetails.panAadharType,
          panAadharNumber: values.customerDetails.panAadharNumber,
          address: values.customerDetails.address,
          contactNumber: values.customerDetails.contactNumber,
          email: values.customerDetails.email || undefined,
        },
        gstEnabled: values.gstEnabled,
        gstPercent: values.gstPercent,
        cgstPercent: values.cgstPercent,
        discountType: values.discountType,
        discountValue: values.discountValue,
        paymentDetails: values.paymentDetails,
        items: values.items.map((item) => ({
          itemName: item.itemName,
          metal: item.metal,
          hsn: item.hsn,
          weight: item.weight || undefined,
          quantity: Number(item.quantity),
          makingCharge: Number(item.makingCharge) || 0,
          price: Number(item.price),
          description: item.description,
          sku: item.sku || undefined,
        })),
        totals,
      };
      
      if (isEditing) {
        // Update existing record
        await apiClient.put(`${API_ENDPOINTS.INVOICES}/${invoiceData.id}`, payload);
        showSuccess("Invoice updated successfully");
       
      } else {
        // Create new record
        await apiClient.post(API_ENDPOINTS.INVOICES, payload);
        showSuccess(MESSAGES.SAVE_SUCCESS);
        // Add the new invoice number to the existing list
        if (values.billDetails.billNumber) {
          setExistingInvoices(prev => [...prev, values.billDetails.billNumber!]);
        }
      
      }
       // Don't reset form after save - keep the data
        setLastSavedData({ values, totals });
    } catch (error: any) {
      log.error("Error submitting invoice:", error);
      const details = error?.response?.data?.details;
      const message = Array.isArray(details)
        ? details.join(", ")
        : error?.response?.data?.error || MESSAGES.SAVE_ERROR;
      showError(message);
    } finally {
      helpers.setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  
  
    setLastSavedData(null);
  };

  const handlePrintDialogOpen = (values: any, totals: any) => {
    if (!onPrintInvoice) return;
  
    onPrintInvoice({
      billDetails: values.billDetails,
      customerDetails: values.customerDetails,
      items: values.items,
      totals,
      paymentMode: values.paymentDetails?.mode?.toUpperCase() || "CASH",
      cgstPercent: values.cgstPercent,
      sgstPercent: values.gstPercent,
      gstEnabled: values.gstEnabled,
      registrationData,
    });
  };

  const handlePrintDialogClose = () => setOpenPrintDialog(false);

  const handleNewInvoice = useCallback(() => {
    if (formikRef) {
      setLastSavedData(null);
      if (!embedded) {
        navigate("/billing", { replace: true });
      }
    }
  }, [embedded, formikRef, generateBillNumber, navigate, registrationData]);

  // Trigger same flow as "+ New Invoice" when navigated from Invoices page.
  useEffect(() => {
    if (!shouldRequestNewInvoice) return;
    if (isEditMode) return;
    if (!formikRef) return;
  
    const newBillNumber = generateBillNumber();
  
    formikRef.setFieldValue("billDetails.billNumber", newBillNumber);
  }, [shouldRequestNewInvoice, isEditMode, formikRef, generateBillNumber]);

  const billingContent = (
    <>
      {!embedded && (
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, mb: 2, fontSize: "18px" }}
        >
          Customer Billing
        </Typography>
      )}

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {(formik) => {
          // Store formik instance in ref for New Invoice button
          if (!formikRef) {
            setFormikRef(formik);
          }
          
          const totals = calculateTotals(formik.values);
          const snapshotValues = lastSavedData?.values || formik.values;
          const snapshotTotals = lastSavedData?.totals || totals;
          return (
            <>
              <Form noValidate>
                <BillDetailsSection formik={formik} isEditMode={isEditMode} />
                <CustomerSection
                  formik={formik}
                  isEditMode={isEditMode}
                  stateOptions={stateOptions}
                  hasSelectedState={Boolean(formik.values.customerDetails.state)}
                  normalizeText={normalizeText}
                  onStateChange={(state) => {
                    formik.setFieldValue("customerDetails.state", state);
                    if (!state) {
                      formik.setFieldValue("customerDetails.city", "");
                    }
                  }}
                />
                
                {/* Combined GST & Discount Section */}
                <Box sx={{ 
                  backgroundColor: "#ffffff", 
                  padding: "16px", 
                  borderRadius: "8px", 
                  marginBottom: "16px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 3
                }}>
                  <GSTSection formik={formik} />
                  <DiscountSection
                    formik={formik}
                    appliedDiscount={totals.discount}
                  />
                </Box>

                <PaymentModeSection formik={formik} isReadOnly={isEditMode} />
                <PurchaseItemsSection formik={formik} totals={totals} cgstPercent={formik.values.cgstPercent} sgstPercent={formik.values.gstPercent} makingCharges={registrationData?.makingCharges} isEditMode={isEditMode} initialItemsCount={invoiceData?.items?.length || 0} />
                <ActionsBar
                  isSubmitting={formik.isSubmitting}
                  buttonText={invoiceData?.id ? "Update" : "Save"}
                  onCancel={() => {
                    if (onClose) {
                      onClose();
                      return;
                    }
                    if (isEditMode) {
                      navigate("/invoices");
                    }
                  }}
  
                  onPrint={() => {
                    if (lastSavedData || isEditMode) {
                      handlePrintDialogOpen(formik.values, totals);
                    } else {
                      showError(MESSAGES.PRINT_ERROR);
                    }
                  }}
                />
              </Form>
            </>
          );
        }}
      </Formik>
    </>
  );

  if (embedded) {
    return (
      <Box sx={billingDialogContainerSx}>
        <Box sx={billingDialogHeaderSx}>
          <PointOfSaleIcon sx={billingDialogHeaderIconSx} />
          <Typography variant="h6" sx={billingDialogHeaderTitleSx}>
            Billing
          </Typography>
        </Box>
        {billingContent}
      </Box>
    );
  }

  return (
    <PageLayout
      title="Billing"
      icon={<PointOfSaleIcon sx={{ fontSize: 26 }} />}
      contentPadding="16px"
    >
      {billingContent}
    </PageLayout>
  );
};

export default Billing;

