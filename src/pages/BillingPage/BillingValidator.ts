import * as Yup from "yup";
import { DISCOUNT_TYPES } from "../../constants/common";
import { nameRegex, phoneRegex, emailIdRegex } from "../../utils/regex";

export const validationSchema = Yup.object({
  billDetails: Yup.object({
    billNumber: Yup.string().required("Bill Number is required"),
    billDate: Yup.string().required("Bill Date is required"),
  }).required(),
  customerDetails: Yup.object({
    customerTitle: Yup.string().required(),
    customerName: Yup.string()
      .trim("Remove extra spaces at the beginning or end")
      .strict(true)
      .matches(nameRegex, "Only letters and spaces are allowed")
      .required("Customer name is required"),
    state: Yup.string().nullable(),
    city: Yup.string().when('state', {
      is: (state: string) => state && state.trim().length > 0,
      then: (schema) => schema.trim("Remove extra spaces at the beginning or end").strict(true).required("City is required when state is selected"),
      otherwise: (schema) => schema.nullable(),
    }),
    panAadharType: Yup.string().nullable(),
    panAadharNumber: Yup.string().trim("Remove extra spaces at the beginning or end").strict(true).nullable(),
    address: Yup.string().nullable(),
    contactNumber: Yup.string()
      .trim("Remove extra spaces at the beginning or end")
      .strict(true)
      .matches(phoneRegex, "Enter valid 10 digit number")
      .required("Contact Number is required"),
    email: Yup.string()
      .trim("Remove extra spaces at the beginning or end")
      .strict(true)
      .matches(emailIdRegex, "Enter a valid email address")
      .nullable(),
  }).required(),
  paymentDetails: Yup.object().shape({
    mode: Yup.string().required("Payment mode is required"),
    // UPI validations
    upiType: Yup.string().when('mode', {
      is: (mode: string) => mode === 'upi',
      then: (schema) => schema.required("UPI type is required"),
      otherwise: (schema) => schema.nullable(),
    }),
    transitionId: Yup.string().when('mode', {
      is: (mode: string) => mode === 'upi',
      then: (schema) => schema.required("Transaction ID is required"),
      otherwise: (schema) => schema.nullable(),
    }),
    // Check validations
    amount: Yup.string().when('mode', {
      is: (mode: string) => mode === 'check',
      then: (schema) => schema.required("Amount is required"),
      otherwise: (schema) => schema.nullable(),
    }),
    checkNumber: Yup.string().when('mode', {
      is: (mode: string) => mode === 'check',
      then: (schema) => schema.required("Cheque number is required"),
      otherwise: (schema) => schema.nullable(),
    }),
    checkDate: Yup.string().when('mode', {
      is: (mode: string) => mode === 'check',
      then: (schema) => schema.required("Cheque date is required").trim(),
      otherwise: (schema) => schema.nullable(),
    }),
    bankNameAddress: Yup.string().when('mode', {
      is: (mode: string) => mode === 'check',
      then: (schema) => schema.required("Bank name and address is required"),
      otherwise: (schema) => schema.nullable(),
    }),
    checkStatus: Yup.string().when('mode', {
      is: (mode: string) => mode === 'check',
      then: (schema) => schema.required("Cheque status is required"),
      otherwise: (schema) => schema.nullable(),
    }),
    // Credit validations
    advanceAmount: Yup.string().when('mode', {
      is: (mode: string) => mode === 'credit',
      then: (schema) => schema.required("Advance amount is required"),
      otherwise: (schema) => schema.nullable(),
    }),
    numberOfInstallments: Yup.number().when('mode', {
      is: (mode: string) => mode === 'credit',
      then: (schema) => schema.required("Number of installments is required").min(1, "Must be at least 1"),
      otherwise: (schema) => schema.nullable(),
    }),
    installmentDate: Yup.string().when('mode', {
      is: (mode: string) => mode === 'credit',
      then: (schema) => schema.required("Installment date is required"),
      otherwise: (schema) => schema.nullable(),
    }),
  }).required(),
  discountType: Yup.mixed<"fixed" | "percent">()
    .oneOf([...DISCOUNT_TYPES])
    .required(),
  discountValue: Yup.number().min(0, "Discount cannot be negative").required(),
  items: Yup.array()
    .of(
      Yup.object({
        itemName: Yup.string()
          .when('metal', {
            is: (metal: string) => !metal || metal.trim() === '',
            then: (schema) => schema.test(
              'metal-required',
              'Please select metal first',
              function(value) {
                // If metal is not selected, show metal error instead
                const { metal } = this.parent;
                if (!metal || metal.trim() === '') {
                  return false; // This will show "Please select metal first"
                }
                return true;
              }
            ),
            otherwise: (schema) => schema.required("Item name is required"),
          }),
        metal: Yup.string().required("Metal is required"),
        hsn: Yup.string().required("HSN is required"),
        weight: Yup.string()
          .required("Weight is required")
          .test(
            "weight-based-on-metal",
            "Weight must be in decimal with 2 places (e.g., 10.25)",
            function (value) {
              const { metal } = this.parent;

              if (!value || value === "") return false;

              // Remove unit suffix
              const numValue = value
                .replace(/\s*(gm|gms|ct|carat|grams)$/i, "")
                .trim();

              if (!numValue) return false;

              const num = Number(numValue);
              if (isNaN(num) || num < 0) return false;

              //  If metal is diamond allow normal number
              if (metal?.toLowerCase() === "diamond" || metal?.toLowerCase() === "gemstones" ) {
                return true;
              }

              // For other metals enforce exactly 2 decimal places
              const parts = numValue.split(".");
              if (parts.length !== 2) return false;

              return /^\d{2}$/.test(parts[1]);
            }
          ),
          quantity: Yup.number()
          .required("Qty required")
          .moreThan(0, "Qty must be > 0")
          .test(
            "stock-validation",
            "Out of stock",
            function (value) {
              const { stock, sku, originalQuantity } = this.parent;
      
              // If originalQuantity exists (edit mode) and quantity is unchanged, skip stock check
              if (originalQuantity !== undefined && value === originalQuantity) {
                return true;
              }
        
              // Only validate if item has SKU and stock is defined
              if (sku && stock !== undefined) {
                if (stock === 0 && value && value > 0) {
                  return false;
                }
              }
        
              return true;
            }
          )
          .test(
            "max-stock",
            function (value) {
              const { stock, sku, originalQuantity } = this.parent;

              // Only validate if item has SKU, stock is defined and we have a quantity
              if (sku && stock !== undefined && value) {
                // If originalQuantity exists (edit mode)
                if (originalQuantity !== undefined) {
                  // If quantity unchanged → no stock error
                  if (value === originalQuantity) {
                    return true;
                  }

                  // Quantity changed: validate only the increase against available stock
                  const difference = value - originalQuantity;
                  if (difference > 0 && difference > stock) {
                    const effectiveStock = stock + originalQuantity;
                    return this.createError({
                      message: `Only ${effectiveStock} items available`,
                    });
                  }

                  // Decrease or within available stock → OK
                  return true;
                }

                // No originalQuantity (new item) – use normal stock rule
                if (value > stock) {
                  return this.createError({
                    message: `Only ${stock} items in stock`,
                  });
                }
              }

              return true;
            }
          ),
        makingCharge: Yup.number()
          .min(0, "Making charge cannot be negative")
          .nullable(),
        price: Yup.number()
          .required("Price per piece is required")
          .moreThan(0, "Price must be greater than 0"),
        description: Yup.string().nullable(),
      })
    )
    .min(1, "Add at least one item")
    .required("Items are required"),
});
