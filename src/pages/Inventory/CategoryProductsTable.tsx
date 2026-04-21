import React, { useState } from 'react';
import { Box, TableBody, TableHead, TableRow, Tooltip, TableContainer, Paper } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Image as ImageIcon } from '@mui/icons-material';
import type { Product } from './Product';
import { getProductImageUrl } from './productImageUtils';
import { getStatusColors, CategoryTableContainer, CategoryTable, CategoryProductHeaderCell, CategoryImageCell, CategoryBodyCell, CategoryIconWrapper, CategoryIconButton } from './InventoryWidgets';
import { EmptyState } from '../../components/EmptyState';

interface CategoryProductsTableProps {
  category: string;
  products: Product[];
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
}


const getStatus = (quantity: number) => {
  if (quantity === 0) return 'Out of Stock';
  if (quantity <= 5) return 'Low Stock';
  return 'In Stock';
};

const placeholderSx = {
  width: '32px',
  height: '32px',
  minWidth: '32px',
  maxWidth: '32px',
  minHeight: '32px',
  maxHeight: '32px',
  backgroundColor: '#f5f5f5',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const ProductImageCellContent: React.FC<{
  productImage: string;
  alt: string;
}> = ({ productImage, alt }) => {
  const [error, setError] = useState(false);
  if (error || !productImage) {
    return (
      <Box sx={placeholderSx}>
        <ImageIcon sx={{ fontSize: 18, color: '#bdbdbd' }} />
      </Box>
    );
  }
  return (
    <Tooltip
      title={
        <Box sx={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <Box
            component="img"
            src={productImage}
            alt={alt}
            sx={{ width: 200, height: 200, objectFit: 'cover', display: 'block' }}
            onError={() => setError(true)}
          />
        </Box>
      }
      placement="right"
      arrow
      enterDelay={200}
      leaveDelay={100}
      TransitionProps={{ timeout: { enter: 300, exit: 200 } }}
      componentsProps={{
        tooltip: {
          sx: {
            backgroundColor: 'white',
            padding: '12px',
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
            maxWidth: 'none',
            borderRadius: '8px',
            position: 'relative',
            '& .MuiTooltip-arrow': { color: 'white' },
            animation: 'fadeInZoom 0.3s ease-out',
            '@keyframes fadeInZoom': {
              '0%': { opacity: 0, transform: 'scale(0.8)' },
              '100%': { opacity: 1, transform: 'scale(1)' },
            },
          },
        },
        popper: { sx: { zIndex: 1300, pointerEvents: 'none' } },
      }}
    >
      <Box
        component="img"
        src={productImage}
        alt={alt}
        onError={() => setError(true)}
        sx={{
          width: '32px',
          height: '32px',
          minWidth: '32px',
          maxWidth: '32px',
          minHeight: '32px',
          maxHeight: '32px',
          objectFit: 'cover',
          borderRadius: '6px',
          display: 'block',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'transform 0.2s ease-in-out',
          '&:hover': { transform: 'scale(1.05)' },
        }}
      />
    </Tooltip>
  );
};


const CategoryProductsTable: React.FC<CategoryProductsTableProps> = ({
  category,
  products,
  onEditProduct,
  onDeleteProduct,
}) => {

  if (products.length === 0) {
    return (
      <EmptyState
        title="No products"
        message="No products found for this category."
        minHeight={180}
      />
    );
  }

  return (
    <CategoryTableContainer>
      <TableContainer
        component={Paper}
        sx={{
          maxHeight: '600px',
          overflowY: 'auto',
          overflowX: 'auto',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          boxShadow: 'none',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f5f5f5',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#bdbdbd',
            borderRadius: '10px',
            '&:hover': {
              background: '#9e9e9e',
            },
          },
          scrollbarWidth: 'thin',
          scrollbarColor: '#bdbdbd #f5f5f5',
        }}
      >
        <CategoryTable 
          size="small" 
          stickyHeader
        >
          <TableHead>
            <TableRow>
              <CategoryProductHeaderCell></CategoryProductHeaderCell>
              <CategoryProductHeaderCell>SKU</CategoryProductHeaderCell>
              <CategoryProductHeaderCell>Item Name</CategoryProductHeaderCell>
              <CategoryProductHeaderCell>Purity</CategoryProductHeaderCell>
              <CategoryProductHeaderCell>Color</CategoryProductHeaderCell>
              <CategoryProductHeaderCell>Weight(per item)</CategoryProductHeaderCell>
              <CategoryProductHeaderCell>Purchase Price</CategoryProductHeaderCell>
              <CategoryProductHeaderCell align="center">Status</CategoryProductHeaderCell>
              <CategoryProductHeaderCell>Quantity</CategoryProductHeaderCell>
              <CategoryProductHeaderCell align="center">Action</CategoryProductHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => {
              const productImage = getProductImageUrl(product.image);
              const status = getStatus(product.quantity);  

              return (

                <TableRow 
                  key={product.sku}
                  sx={{
                    '&:hover': {
                      backgroundColor: '#f9f9f9',
                    },
                  }}
                >
                  <CategoryImageCell>
                    {productImage ? (
                      <ProductImageCellContent
                        productImage={productImage}
                        alt={product.product || 'Product image'}
                      />
                    ) : (
                      <Box sx={placeholderSx}>
                        <ImageIcon sx={{ fontSize: 18, color: '#bdbdbd' }} />
                      </Box>
                    )}
                  </CategoryImageCell>
                  <CategoryBodyCell sx={{ paddingLeft: '8px' }}>{product.sku}</CategoryBodyCell>
                  <CategoryBodyCell>{product.product}</CategoryBodyCell>
                  <CategoryBodyCell>{product.purity}</CategoryBodyCell>
                  <CategoryBodyCell>{product.color}</CategoryBodyCell>
                  <CategoryBodyCell>
                    {product.metal?.toLowerCase() === 'diamond' || product.metal?.toLowerCase() === 'gemstones' || product.metal?.toLowerCase() === 'gemstone'
                      ? `${product.weight} ct` 
                      : `${product.weight} gm`}
                  </CategoryBodyCell>
                  <CategoryBodyCell>₹{Number(product.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</CategoryBodyCell>
                  <CategoryBodyCell align="center">
                    <Box
                      sx={{
                        display: 'inline-flex',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 500,
                        ...(() => {
                          const { textColor, bgColor } = getStatusColors(status);
                          return {
                            color: textColor,
                            backgroundColor: bgColor,
                          };
                        })(),
                      }}
                    >
                      {status}
                    </Box>
                  </CategoryBodyCell>
                  <CategoryBodyCell>{product.quantity}</CategoryBodyCell>
                  <CategoryBodyCell align="center">
                    <CategoryIconWrapper>
                      <CategoryIconButton
                        size="small"
                        aria-label="edit product"
                        onClick={() => onEditProduct(product)}
                      >
                        <EditIcon />
                      </CategoryIconButton>
                      <CategoryIconButton
                        size="small"
                        aria-label="delete product"
                        onClick={() => onDeleteProduct(product)}
                      >
                        <DeleteIcon />
                      </CategoryIconButton>
                    </CategoryIconWrapper>
                  </CategoryBodyCell>
                </TableRow>
              );
            })}
          </TableBody>
        </CategoryTable>
      </TableContainer>
    </CategoryTableContainer>
  );
};

export default CategoryProductsTable;