import * as Yup from 'yup';

export const validationSchema = Yup.object({
  product: Yup.string()
    .trim("Remove extra spaces at the beginning or end")
    .strict(true)
    .required('Product name is required')
    .min(2, 'Product name must be at least 2 characters')
    .max(100, 'Product name must not exceed 100 characters')
    .matches(
      /^[a-zA-Z0-9/]+(?:[ _-][a-zA-Z0-9/]+)*$/,
      'Use letters/numbers with single space, "-" or "_" between words'
    ),
  sku: Yup.string().notRequired(),
  category: Yup.string()
    .trim("Remove extra spaces at the beginning or end")
    .strict(true)
    .required('Category is required')
    .min(2, 'Category must be at least 2 characters')
    .max(50, 'Category must not exceed 50 characters')
    .matches(/^[a-zA-Z0-9 -]+$/, 'Alphabetic chars allowed only like Necklace'),
  metal: Yup.string()
    .required('Metal type is required')
    .min(2, 'Metal type must be at least 2 characters')
    .max(50, 'Metal type must not exceed 50 characters'),
  weight: Yup.number()
    .required('Weight is required')
    .positive('Weight must be a positive number')
    .min(0.1, 'Weight must be at least 0.1')
    .max(10000, 'Weight must not exceed 10000')
    .test('decimal-format', 'Weight must be a valid number like 1.23', (value) => {
      if (value === undefined || value === null) return false;
      const stringValue = value.toString();
      return /^\d+(\.\d{1,2})?$/.test(stringValue);
    }),
  purity: Yup.string()
    .trim("Remove extra spaces at the beginning or end")
    .strict(true)
    .required('Purity is required')
    .min(1, 'Purity is required')
    .max(50, 'Purity must not exceed 50 characters')
    .matches(/^[a-zA-Z0-9 -]+$/, 'Numeric values allowed only like 18, 22'),
  color: Yup.string()
    .required('Color is required')
    .min(1, 'Color is required')
    .max(50, 'Color must not exceed 50 characters')
    .matches(/^[a-zA-Z]+$/, 'Alphabetic chars allowed only like Yellow'),
  price: Yup.string()
    .nullable()
    .notRequired()
    .test('is-valid-number', 'Price must be a valid number', (value) => {
      if (value === undefined || value === null || value === '') return true;
      const numValue = parseFloat(value);
      return !isNaN(numValue) && numValue > 0;
    })
    .test('min-value', 'Price must be at least 0.01', (value) => {
      if (value === undefined || value === null || value === '') return true;
      const numValue = parseFloat(value);
      return numValue >= 0.01;
    })
    .test('max-value', 'Price must not exceed 999,999,999', (value) => {
      if (value === undefined || value === null || value === '') return true;
      const numValue = parseFloat(value);
      return numValue <= 999999999;
    }),
  quantity: Yup.number()
    .nullable()
    .transform((value, originalValue) =>
      originalValue === '' || originalValue === null || originalValue === undefined
        ? null
        : value
    )
    .notRequired()
    .test('valid-quantity', 'Quantity must be a whole number between 0 and 999,999', (value) => {
      if (value === null || value === undefined) return true;
      if (!Number.isInteger(value)) return false;
      return value >= 0 && value <= 999999;
    }),
  image: Yup.string()
    .notRequired()
    .test(
      'relative-path',
      'Image must be a relative path only (e.g. filename.png). No leading slash, no absolute URL, no path segments.',
      (value) => {
        if (value === undefined || value === null || value === '') return true;
        const v = String(value).trim();
        if (v.startsWith('/')) return false;
        if (v.startsWith('http://') || v.startsWith('https://')) return false;
        if (v.includes('/') || v.includes('..')) return false;
        return true;
      }
    ),
});
