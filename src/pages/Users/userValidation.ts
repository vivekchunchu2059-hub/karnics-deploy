import * as Yup from "yup";
import { nameRegex, emailIdRegex, phoneRegex, passwordRegex, userIdRegex } from "../../utils/regex";


export interface ValidationErrors {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  [key: string]: string | undefined;
}

export const userValidationSchema = Yup.object({
  username: Yup.string()
    .trim("Remove extra spaces at the beginning or end")
    .strict(true)
    .matches(userIdRegex, "Invalid username format")
    .required("Username is required"),

  firstName: Yup.string()
    .trim("Remove extra spaces at the beginning or end")
    .strict(true)
    .matches(nameRegex, "Only letters allowed")
    .required("First name is required"),

  lastName: Yup.string()
    .trim("Remove extra spaces at the beginning or end")
    .strict(true)
    .matches(nameRegex, "Only letters allowed")
    .required("Last name is required"),

  email: Yup.string()
    .trim("Remove extra spaces at the beginning or end")
    .strict(true)
    .matches(emailIdRegex, "Invalid email format")
    .required("Email is required"),

  phone: Yup.string()
    .trim("Remove extra spaces at the beginning or end")
    .strict(true)
    .matches(phoneRegex, "Phone must be 10 digits")
    .required("Phone number is required"),

  password: Yup.string()
    .trim("Remove extra spaces at the beginning or end")
    .strict(true)
    .matches(
      passwordRegex,
      "Password must contain 8+ chars, capital, small, number & special character"
    )
    .required("Password is required"),

  confirmPassword: Yup.string()
    .trim("Remove extra spaces at the beginning or end")
    .strict(true)
    .matches(
      passwordRegex,
      "Password must contain 8+ chars, capital, small, number & special character"
    )
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required")
});


