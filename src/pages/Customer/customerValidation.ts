import * as Yup from 'yup';
import { nameRegex, phoneRegex, emailIdRegex } from '../../utils/regex';
import { CustomerDetails } from '../../models/Billing';

export type CustomerFormValues = Pick<
  CustomerDetails,
  'customerName' | 'address' | 'city' | 'contactNumber'
> & {
  email?: string;
};

export interface CustomerValidationErrors {
  customerName?: string;
  address?: string;
  city?: string;
  contactNumber?: string;
  email?: string;
  [key: string]: string | undefined;
}

export const customerValidationSchema = Yup.object({
  customerName: Yup.string()
    .trim('Remove extra spaces at the beginning or end')
    .strict(true)
    .matches(nameRegex, 'Customer name can contain only letters and spaces')
    .required('Customer name is required'),

  address: Yup.string()
    .notRequired(),

  city: Yup.string()
    .trim('Remove extra spaces at the beginning or end')
    .strict(true)
    .matches(nameRegex, 'City can contain only letters and spaces')
    .notRequired(),

  contactNumber: Yup.string()
    .trim('Remove extra spaces at the beginning or end')
    .strict(true)
    .matches(phoneRegex, {
      message: 'Phone number must be exactly 10 digits',
      excludeEmptyString: true,
    })
    .notRequired(),

  email: Yup.string()
    .trim('Remove extra spaces at the beginning or end')
    .strict(true)
    .matches(emailIdRegex, {
      message: 'Please enter a valid email address',
      excludeEmptyString: true,
    })
    .notRequired(),
});


