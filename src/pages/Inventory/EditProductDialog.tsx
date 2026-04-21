import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { Product, ProductFormData } from './Product';
import { getProductImageUrl } from './productImageUtils';
import { validationSchema } from './ProductValidator';
import { StyledDialog, DialogTitleStyled, FormField, SaveButton, CancelButton } from './InventoryWidgets';
import { FileUploadContainer, FileUploadLabel, FileUploadBox, FileUploadButton } from '../Login/LoginWidgets';
import { useFormik } from 'formik';

interface EditProductDialogProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: (data: Partial<ProductFormData>) => void;
}

type EditFormValues = Partial<ProductFormData> & { weightPerItem?: number };

const EditProductDialog: React.FC<EditProductDialogProps> = ({
  open,
  product,
  onClose,
  onSave,
}) => {
  const [imageError, setImageError] = React.useState<string>('');
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = React.useState<string>('');

  const formik = useFormik<EditFormValues>({
    enableReinitialize: true,
    initialValues: {
      product: product?.product || '',
      sku: product?.sku || '',
      category: product?.category || '',
      metal: product?.metal || '',
      weightPerItem: (product as any)?.weightPerItem ?? product?.weight ?? 0,
      weight: product?.weight ?? 0,
      purity: product?.purity || '',
      color: product?.color || '',
      price: (product?.price ?? '').toString().trim(),
      quantity: product?.quantity || 0,
    },
  
    validationSchema,
  
    onSubmit: (values) => {
      const { weightPerItem, ...saveData } = values;
  
      (saveData as any).weight = weightPerItem ?? 0;
  
      if (selectedImage && imagePreviewUrl.startsWith('data:')) {
        (saveData as any).image = imagePreviewUrl;
      } else if (product?.image) {
        (saveData as any).image = product.image;
      }
  
      onSave(saveData);
    },
  });

  React.useEffect(() => {
    if (product) {
      setImagePreviewUrl(product.image ? getProductImageUrl(product.image) : '');
      setSelectedImage(null);
      setImageError('');
    }
  }, [product]);


  const MAX_IMAGE_SIZE_MB = 1;
  const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024; // 1MB

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setImageError('Please select a JPEG or PNG image file');
        event.target.value = '';
        setSelectedImage(null);
        setImagePreviewUrl('');
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setImageError(`Photo must be under ${MAX_IMAGE_SIZE_MB}MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        event.target.value = '';
        setSelectedImage(null);
        setImagePreviewUrl('');
        return;
      }
      setImageError('');
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  
  return (
    <StyledDialog open={open} onClose={onClose}>
      <DialogTitleStyled>
        Edit Product
        <IconButton onClick={onClose} className='dialog-title'>
          <CloseIcon />
        </IconButton>
      </DialogTitleStyled>

      <Box component="form" onSubmit={formik.handleSubmit} sx={{ p: 2.5 }} autoComplete='off'>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Row 1: SKU (full width) */}
          <FormField
            label="SKU"
            name="sku"
            value={formik.values.sku}
            InputProps={{
              readOnly: true,
            }}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.sku && Boolean(formik.errors.sku)}
            helperText="SKU cannot be edited"
            sx={{
              '& .MuiInputBase-root': {
                cursor: 'not-allowed',
                backgroundColor: '#f5f5f5',
              },
            }}
          />

          {/* Row 2: Item Name | Purity (50% | 50%) */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormField
              label="Item Name"
              name="product"
              value={formik.values.product}
              autoComplete="new-password"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.product && Boolean(formik.errors.product)}
              helperText={formik.touched.product && formik.errors.product}
              sx={{ flex: 1 }}
            />
            <FormField
              label="Purity"
              name="purity"
              value={formik.values.purity} 
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.purity && Boolean(formik.errors.purity)}
              helperText={formik.touched.purity && formik.errors.purity}
              sx={{ flex: 1 }}
            />
          </Box>

          {/* Row 3: Color | Weight (per item) (50% | 50%) */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormField
              label="Color"
              name="color"
              value={formik.values.color}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.color && Boolean(formik.errors.color)}
              helperText={formik.touched.color && formik.errors.color}
              sx={{ flex: 1 }}
            />
            <FormField
              label="Weight (per item)"
              name="weightPerItem"
              type="number"
              value={formik.values.weightPerItem === 0 || formik.values.weightPerItem === undefined ? '' : String(formik.values.weightPerItem)}
              onChange={(e) => {
                const value = e.target.value === '' ? '' : Number(e.target.value);
                if (value === '' || (typeof value === 'number' && value >= 0)) {
                  formik.setFieldValue('weightPerItem', value === '' ? 0 : value);
                  formik.setFieldValue('weight', value === '' ? 0 : value);
                }
              }}
              onBlur={formik.handleBlur}
              error={formik.touched.weightPerItem && Boolean(formik.errors.weightPerItem)}
              helperText={formik.touched.weightPerItem && formik.errors.weightPerItem}
              inputProps={{ step: '0.01', min: 0 }}
              sx={{ flex: 1 }}
            />
          </Box>

          {/* Row 4: Total Price | Quantity (50% | 50%) */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormField
              label="Purchase Price"
              name="price"
              type="number"
              value={formik.values.price}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.price && Boolean(formik.errors.price)}
              helperText={formik.touched.price && formik.errors.price}
              sx={{ flex: 1,
                '& input[type=number]': { MozAppearance: 'textfield', },
                '& input[type=number]::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 },
                '& input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
              }}
            />
            <FormField 
              label="Quantity" 
              name="quantity" 
              type="number"
              value={formik.values.quantity?.toString() || '0'} 
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.quantity && Boolean(formik.errors.quantity)}
              helperText={formik.touched.quantity && formik.errors.quantity}
              sx={{ flex: 1 }}
            />
          </Box>

          {/* Row 5: Image (full width) */}
          <FileUploadContainer>
            <FileUploadLabel>Photo (max 1MB)</FileUploadLabel>
            <FileUploadBox
              onClick={() => document.getElementById('edit-product-image-upload')?.click()}
            >
              <Typography sx={{ fontSize: '13px', color: selectedImage ? '#2c2c2c' : '#b0b0b0' }}>
                {selectedImage ? selectedImage.name : ''}
              </Typography>
              <FileUploadButton>Browse</FileUploadButton>
            </FileUploadBox>
            <input
              id="edit-product-image-upload"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              hidden
              onChange={handleImageChange}
            />
            <Typography sx={{ fontSize: '11px', color: imageError ? '#ff6b6b' : '#757575', marginTop: '4px' }}>
              {imageError || 'JPEG or PNG only, max 1MB. Saved as separate file.'}
            </Typography>
          </FileUploadContainer>
          {imagePreviewUrl && (
            <Box sx={{ mt: 0.5 }}>
              <Box
                component="img"
                src={imagePreviewUrl}
                alt="Preview"
                sx={{ maxWidth: 120, maxHeight: 120, objectFit: 'contain', borderRadius: 1, border: '1px solid #e0e0e0' }}
              />
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3 }}>
          <CancelButton onClick={onClose}>Cancel</CancelButton>
          <SaveButton type="submit">Save</SaveButton>
        </Box>
      </Box>
    </StyledDialog>
  );
};

export default EditProductDialog;

