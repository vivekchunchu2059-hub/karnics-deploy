import React, { useEffect, useState } from 'react';
import { Box, IconButton, DialogContent, DialogActions, MenuItem, Select, InputAdornment, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { StyledDialog, DialogTitleStyled, FormField, SaveButton, CancelButton } from './InventoryWidgets';
import type { ProductFormData } from './Product';
import { useFormik } from 'formik';
import { validationSchema } from './ProductValidator';
import { generateSKU } from './SKUGenerator';
import { fetchMetals, type MetalOption } from '../../utils/commonUtil';
import log from '../../utils/logger';
import { FileUploadContainer, FileUploadLabel, FileUploadBox, FileUploadButton } from '../Login/LoginWidgets';


interface AddProductDialogProps {
  open: boolean;
  onClose: () => void;
  editMode: boolean;
  formData: ProductFormData;
  onSave: (values: ProductFormData) => void;
}

const AddProductDialog: React.FC<AddProductDialogProps> = ({
  open,
  onClose,
  editMode,
  formData,
  onSave,
}) => {
  const [metals, setMetals] = useState<MetalOption[]>([]);
  const MAX_IMAGE_SIZE_MB = 1;
  const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

  const [imageError, setImageError] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [weightUnit, setWeightUnit] = useState<string>('gm');

  useEffect(() => {
    const loadMetals = async () => {
      const metalsData = await fetchMetals();
      setMetals(metalsData);
    };

    loadMetals();
  }, []);

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

  const formik = useFormik<ProductFormData>({
    initialValues: {
      product: formData.product || '',
      sku: formData.sku || '',
      category: formData.category || '',
      metal: formData.metal || '',
      weight: formData.weight || 0,
      purity: formData.purity || '',
      color: formData.color || '',
      price: formData.price || "",
      quantity: formData.quantity || 0,
    },
    validationSchema: validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      // Generate SKU on Add button click if all required fields are valid (only for new products)
      if (!editMode) {
        const product = values.product || '';
        const category = values.category || '';
        const metal = values.metal || '';
        const purity = values.purity || '';
        const color = values.color || '';

        // Generate SKU if all required fields have values
        if (product && category && metal && purity && color) {
          const generatedSKU = generateSKU(product, category, metal, purity, color);
          values.sku = generatedSKU;
        }
      }
      // Include image data in the product object
      const productData = {
        ...values,
        image: imagePreviewUrl ? imagePreviewUrl : "",
      };

      onSave(productData as ProductFormData);
    },
  });

  useEffect(() => {
    if (open) {
      formik.setTouched({});
      formik.setErrors({});
      
      formik.setValues({
        product: formData.product || '',
        sku: formData.sku || '',
        category: formData.category || '',
        metal: formData.metal || '',
        weight: formData.weight || 0,
        purity: formData.purity || '',
        color: formData.color || '',
        price: formData.price || '',
        quantity: formData.quantity || 0,
      });
      // Set weight unit based on metal     
       const metalLower = formData.metal?.toLowerCase() || '';
      if (metalLower === 'diamond' || metalLower === 'gemstones' || metalLower === 'gemstone') {
        setWeightUnit('ct');
      } else {
        setWeightUnit('gm');
      }
      setImageError('');
      setSelectedImage(null);
      setImagePreviewUrl((formData as any).image || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, formData]);

  const handleClose = () => {
    formik.resetForm();
    formik.setTouched({});
    formik.setErrors({});
    
    setImageError('');
    setSelectedImage(null);
    setImagePreviewUrl('');
    setWeightUnit('gm');
  
    onClose();
  };

  return (
    <StyledDialog open={open} onClose={handleClose}>

      <DialogTitleStyled>
        {editMode ? 'Edit Product' : 'Product Details'}
        <IconButton
          onClick={handleClose}
          className='dialog-title'>
          <CloseIcon />
        </IconButton>
      </DialogTitleStyled>

      <form onSubmit={formik.handleSubmit} autoComplete='off'>
        <DialogContent className=''>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <FormField
              fullWidth
              label="Item Name"
              placeholder="Ex. Golden Necklace"
              name="product"
              value={formik.values.product}
              autoComplete="new-password"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.product && Boolean(formik.errors.product)}
              helperText={formik.touched.product && formik.errors.product}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormField
                fullWidth
                label="SKU"
                placeholder="GNCL"
                name="sku"
                value={formik.values.sku}
                //onChange={formik.handleChange}
                //onBlur={formik.handleBlur}
                InputProps={{
                  readOnly: true,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    backgroundColor: '#f5f5f5',
                    cursor: 'not-allowed',
                  },
                }}
              />
              <FormField
                fullWidth
                label="Category"
                placeholder="Necklace, Ring, etc."
                name="category"
                value={formik.values.category}
                autoComplete="new-password"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.category && Boolean(formik.errors.category)}
                helperText={formik.touched.category && formik.errors.category}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormField
                fullWidth
                label="Metal Type"
                select
                name="metal"
                value={formik.values.metal}
                onChange={(e) => {
                  formik.handleChange(e);
                  const selectedMetal = e.target.value;
                  const metalLower = selectedMetal.toLowerCase();
                  if (metalLower === 'diamond' || metalLower === 'gemstones' || metalLower === 'gemstone') {
                    setWeightUnit('ct');
                  } else {
                    setWeightUnit('gm');
                  }
                }}
                onBlur={formik.handleBlur}
                error={formik.touched.metal && Boolean(formik.errors.metal)}
                helperText={formik.touched.metal && formik.errors.metal}
              >
                {metals.map((metal) => (
                  <MenuItem
                    key={metal.name}
                    value={metal.name}
                    sx={{ color: metal.color || '#000000' }}
                  >
                    {metal.name}
                  </MenuItem>
                ))}
              </FormField>
              <FormField
                fullWidth
                label="Weight (per item)"
                placeholder="ex. 4.5"
                name="weight"
                type="number"
                value={formik.values.weight === 0 ? '' : String(formik.values.weight)}
                onChange={(e) => {
                  const value = e.target.value === '' ? '' : Number(e.target.value);
                  if (value === '' || (typeof value === 'number' && value >= 0)) {
                    formik.setFieldValue('weight', value === '' ? 0 : value);
                  }
                }}
                onBlur={formik.handleBlur}
                error={formik.touched.weight && Boolean(formik.errors.weight)}
                helperText={formik.touched.weight && formik.errors.weight}
                inputProps={{ step: "0.01", min: 0 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end" sx={{ p: 0, m: 0, maxWidth: '30%' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          borderLeft: '1px solid #d3d3d3',
                          pl: 1.5,
                          ml: 1,
                        }}
                      >
                        <Select
                          variant="standard"
                          disableUnderline
                          value={weightUnit}
                          sx={{
                            minWidth: 56,
                            fontSize: '0.875rem',
                            '& .MuiSelect-select': { px: 0 },
                          }}
                        >
                          <MenuItem value="gm">gm</MenuItem>
                          <MenuItem value="ct">ct</MenuItem>
                        </Select>
                      </Box>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormField
                fullWidth
                label="Purity"
                placeholder="18K, 22K, etc."
                name="purity"
                value={formik.values.purity}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.purity && Boolean(formik.errors.purity)}
                helperText={formik.touched.purity && formik.errors.purity}
              />
              <FormField
                fullWidth
                label="Color"
                placeholder="Yellow, White, Rose, etc."
                name="color"
                value={formik.values.color} 
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.color && Boolean(formik.errors.color)}
                helperText={formik.touched.color && formik.errors.color}
              />

            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormField
                fullWidth
                label="Purchase Price"
                type="number"
                name="price"
                placeholder="ex. 50000"
                value={formik.values.price === '0' || formik.values.price === '' ? '' : formik.values.price}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₹</InputAdornment>
                  ),
                }}
                sx={{
                  '& input[type=number]': {
                    MozAppearance: 'textfield',
                  },
                  '& input[type=number]::-webkit-outer-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0,
                  },
                  '& input[type=number]::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0,
                  },
                }}
              />

              <FormField
                fullWidth
                label="Quantity"
                placeholder="ex. 12"
                type="number"
                name="quantity"
                value={formik.values.quantity === 0 ? '' : String(formik.values.quantity)}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.quantity && Boolean(formik.errors.quantity)}
                helperText={formik.touched.quantity && formik.errors.quantity}
              />
            </Box>
            <FileUploadContainer>
              <FileUploadLabel>{`Photo (max ${MAX_IMAGE_SIZE_MB}MB)`}</FileUploadLabel>
              <FileUploadBox
                onClick={() => document.getElementById('add-product-image-upload')?.click()}
              >
                <Typography sx={{ fontSize: '13px', color: selectedImage ? '#2c2c2c' : '#b0b0b0' }}>
                  {selectedImage ? selectedImage.name : ''}
                </Typography>
                <FileUploadButton>Browse</FileUploadButton>
              </FileUploadBox>
              <input
                id="add-product-image-upload"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                hidden
                onChange={handleImageChange}
              />
              <Typography sx={{ fontSize: '11px', color: imageError ? '#ff6b6b' : '#757575', marginTop: '4px' }}>
                {imageError || 'JPEG or PNG only, max 1MB. Saved as separate image file.'}
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
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <CancelButton type="button" onClick={handleClose}>Cancel</CancelButton>
          <SaveButton type="submit">
            {editMode ? 'Update' : 'Add'}
          </SaveButton>
        </DialogActions>
      </form>
    </StyledDialog>
  );
};

export default AddProductDialog;


