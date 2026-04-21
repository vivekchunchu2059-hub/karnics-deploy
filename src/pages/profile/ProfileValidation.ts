import * as Yup from "yup";
import {
  emailIdRegex,
  phoneRegex,
  gstRegex
} from "../../utils/regex";

export interface ProfileValidationErrors {
  username?: string;
  firstName?: string;
  lastName?: string;
  shopName?: string;
  shopAddress?: string;
  mobileNumber?: string;
  email?: string;
  panNumber?: string;
  gstNumber?: string;
  cgst?: string;
  sgst?: string;
  makingCharges?: string;
  [key: string]: string | undefined;
}

export const getProfileValidationSchema = (isSuperAdmin: boolean) =>
  Yup.object({
    username: Yup.string().required("Username is required"),

    firstName: Yup.string()
      .trim("Remove extra spaces at the beginning or end")
      .strict(true)
      .required("First name is required")
      .min(2, "First name must be at least 2 characters"),

    lastName: Yup.string()
      .trim("Remove extra spaces at the beginning or end")
      .strict(true)
      .required("Last name is required")
      .min(2, "Last name must be at least 2 characters"),

    mobileNumber: Yup.string()
      .trim("Remove extra spaces at the beginning or end")
      .strict(true)
      .required("Mobile number is required")
      .matches(phoneRegex, "Mobile number must be exactly 10 digits"),

    email: Yup.string()
      .trim("Remove extra spaces at the beginning or end")
      .strict(true)
      .required("Email is required")
      .matches(emailIdRegex, "Please enter a valid email address"),

    // 🔥 Only required if SuperAdmin
    shopName: isSuperAdmin
      ? Yup.string().required("Shop name is required")
      : Yup.string().notRequired(),

    shopAddress: isSuperAdmin
      ? Yup.string().required("Shop address is required")
      : Yup.string().notRequired(),

    gstNumber: isSuperAdmin
      ? Yup.string()
          .trim("Remove extra spaces at the beginning or end")
          .strict(true)
          .required("GST number is required")
          .matches(gstRegex, "Invalid GST format")
      : Yup.string().notRequired(),

    panNumber: Yup.string()
      .trim("Remove extra spaces at the beginning or end")
      .strict(true)
      .nullable()
      .notRequired(),

    cgst: Yup.number().min(0).nullable(),
    sgst: Yup.number().min(0).nullable(),
    makingCharges: Yup.number().min(0).nullable(),
  });
