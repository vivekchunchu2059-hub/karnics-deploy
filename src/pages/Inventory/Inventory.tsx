import React, { useState, ChangeEvent, useEffect } from 'react';
import { Box, Paper, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Pagination, DialogContent, DialogActions, CircularProgress, IconButton, Collapse } from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, KeyboardArrowDown as KeyboardArrowDownIcon, KeyboardArrowRight as KeyboardArrowRightIcon, Inventory2 as Inventory2Icon } from '@mui/icons-material';
import AddProductButton from '../../components/Button/Button';
import { PageLayout } from '../../components/PageLayout';
import { EmptyState } from '../../components/EmptyState';
import { SearchBar, StyledTable, TableHeaderCell, TableDataRow, StyledDialog, SaveButton, inventoryPageStyles } from './InventoryWidgets';
import AddProductDialog from './AddProductDialog';
import type { Product, ProductFormData } from './Product';
import CategoryProductsTable from './CategoryProductsTable';
import { useInventorySearch } from './InventorySearch';
import { apiClient } from '../../api';
import EditProductDialog from './EditProductDialog';
import log from '../../utils/logger';


const Inventory: React.FC = () => {
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage] = useState<number>(10);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openSuccessDialog, setOpenSuccessDialog] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState<boolean>(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [openCategoryErrorDialog, setOpenCategoryErrorDialog] = useState<boolean>(false);
  const [categoryErrorMessage, setCategoryErrorMessage] = useState<string>('');

  const itemsPerPage = 10;

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle search query change - reset to page 1 when search changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  // Use custom hook for search field and filter logic
  const { SearchField, FilterMenu, selectedFilter } = useInventorySearch({
    products: [],
    page,
    onPageChange: setPage,
    itemsPerPage: 10,
    searchQuery,
    onSearchChange: handleSearchChange,
  });

  const [formData, setFormData] = useState<ProductFormData>({
    product: '',
    sku: '',
    category: '',
    metal: '',
    weight: 0,
    purity: '',
    color: '',
    price: '0',
    quantity: 0,
  });

  const flattenProducts = (groups: any[]): Product[] => {
    const flat: Product[] = [];
  
    groups.forEach((group: any) => {
      if (!group?.category) return;
  
      group.category.forEach((p: Product) => {
        flat.push({
          ...p,
          category: group.categoryName,
          metal: group.metal,
        });
      });
    });
  
    return flat;
  };
  

  // Load inventory data function - can be called from useEffect or after success message
  const loadInventoryData = async () => {
    log.info("Loading Inventory Data...");
    setLoading(true);
    try {
      // Always fetch all products to group them properly
      const response = await apiClient.get('/api/inventory', {
        params: { page: 1, limit: 10000 },
      });

      const result = response.data;
      log.info("Inventory Data fetched successfully");
      let allProductsData: Product[] = [];

      if (Array.isArray(result)) {
        allProductsData = flattenProducts(result);
      } else if (result.data) {
        allProductsData = flattenProducts(result.data);
      }

      // Apply search query filter based on selected column from hook
      if (debouncedSearchQuery.trim()) {
        const searchText = debouncedSearchQuery.trim().toLowerCase();

        let filteredProducts = allProductsData.filter((p: Product) => {
          if (selectedFilter === 'product') {
            const metal = p.metal?.toLowerCase() || '';
            return metal.includes(searchText);
          } else if (selectedFilter === 'category') {
            const category = p.category?.toLowerCase() || '';
            return category.includes(searchText);
          } else {
            const metal = p.metal?.toLowerCase() || '';
            const category = p.category?.toLowerCase() || '';
            return category.includes(searchText) || metal.includes(searchText);
          }
        });

        setAllProducts(filteredProducts);
        setProducts(filteredProducts);
      } else {
        setAllProducts(allProductsData);
        setProducts(allProductsData);
      }
    } catch (error) {
      log.error("Failed to fetch inventory data:", error);
      setProducts([]);
      setAllProducts([]);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  // Load inventory data - loads data when search changes
  // Page changes don't trigger API calls since we paginate the grouped inventory client-side
  useEffect(() => {
    loadInventoryData();
    // Reset to page 1 when search or filter changes
    setPage(1);
  }, [debouncedSearchQuery, selectedFilter]);

  const handlePageChange = (_event: ChangeEvent<unknown>, value: number) => {
    setPage(value);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDialog = () => {
    setEditMode(false);
    setFormData({
      product: '',
      sku: '',
      category: '',
      metal: '',
      weight: 0,
      purity: '',
      color: '',
      price: '0',
      quantity: 0,
    });
    setOpenDialog(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditMode(true);
    setCurrentProduct(product);
    setEditDialogOpen(true);
  };


  const handleCloseDialog = () => {
    setOpenDialog(false);
  };



  const handleSaveProduct = async (values: Partial<ProductFormData>) => {
    if (editMode && currentProduct) {
      const updatedProduct = {
        product: values.product ?? currentProduct.product,
        sku: currentProduct.sku, // SKU should not change
        weight: values.weight ?? currentProduct.weight,
        purity: values.purity ?? currentProduct.purity,
        color: values.color ?? currentProduct.color,
        price: values.price ?? currentProduct.price,
        quantity:
          typeof values.quantity === 'string'
            ? parseInt(values.quantity) || 0
            : values.quantity ?? currentProduct.quantity,
        image: (values as any).image ?? currentProduct.image,
      };
      log.info("Updating Product...");
      await apiClient.put(`/api/inventory/update/${currentProduct.sku}`, updatedProduct);
      log.info("Product updated successfully");
      setSuccessMessage('Product Updated Successfully!');
    } else {
      try {
        const newProduct = {
          product: values.product || '',
          sku: values.sku || '',
          category: values.category || '',
          metal: values.metal || '',
          weight: values.weight ?? 0,
          purity: values.purity || '',
          color: values.color || '',
          price: values.price || '0',
          quantity:
            typeof values.quantity === 'string'
              ? parseInt(values.quantity) || 0
              : values.quantity ?? 0,
          image: (values as any).image || '',
        };
        log.info("Adding Product...");
        await apiClient.post('/api/inventory/add', newProduct);
        
        setSuccessMessage('Product Added Successfully!');
        log.info("Product added successfully");
      } catch (error) {
        log.error("Failed to add product:", error);
        setSuccessMessage('Error adding product. Please try again.');
      }
    }
  
    setOpenDialog(false);
    setOpenSuccessDialog(true);
  };
  

  const handleOpenDeleteDialog = (product: Product) => {
    setIsDeletingCategory(false);
    setProductToDelete(product);
    setOpenDeleteDialog(true);
  };

  const handleCategoryDeleteClick = (categoryName: string) => {
    // Count products in this category
    const categoryProducts = products.filter(
      (p) => (p.category || 'Unknown') === categoryName
    );
    const productCount = categoryProducts.length;

    if (productCount > 0) {
      // Category has products - show error message
      setCategoryErrorMessage(`You can't delete the ${categoryName} category because it contains product items.`);
      setOpenCategoryErrorDialog(true);
    } else {
      // Category has no products - show confirmation
      setIsDeletingCategory(true);
      setCategoryToDelete(categoryName);
      setProductToDelete(null);
      setOpenDeleteDialog(true);
    }
  };


  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setProductToDelete(null);
    setIsDeletingCategory(false);
    setCategoryToDelete(null);
  };

  const handleConfirmDelete = async () => {
    setOpenDeleteDialog(false);

    try {
      // Get all products to delete from file
      if (productToDelete) {
        log.info("Deleting Product...");
        await apiClient.delete(`/api/inventory/delete/${productToDelete.sku}`);
        log.info("Product deleted successfully");
        setSuccessMessage('Product Deleted Successfully!');
      }

      // Reload all products - grouping and pagination will be handled automatically
      await loadInventoryData();
      
      // If current page would be empty, go to previous page
      // This will be handled by the grouping logic after reload

      setOpenSuccessDialog(true);
    } catch (error) {
      log.error("Failed to delete product:", error);
      setSuccessMessage(isDeletingCategory ? 'Error deleting category. Please try again.' : 'Error deleting product. Please try again.');
      setOpenSuccessDialog(true);
    } finally {
      setProductToDelete(null);
      setIsDeletingCategory(false);
      setCategoryToDelete(null);
    }
  };

  const handleCloseSuccessDialog = () => {
    setOpenSuccessDialog(false);
    setEditDialogOpen(false);
    setCurrentProduct(null);
    loadInventoryData();
  };


  const toggleCategoryExpand = (category: string) => {
    setExpandedCategory((prev) => (prev === category ? null : category));
  };

  // Group products by Category for category-level aggregated view
  const groupedInventory = React.useMemo(() => {
    type GroupRow = {
      category: string;
      metal: string;
      totalWeight: number;
      totalPrice: number;
      totalQuantity: number;
    };

    const map = new Map<
      string,
      {
        category: string;
        metal: string;
        totalWeight: number;
        totalPrice: number;
        totalQuantity: number;
      }
    >();

    allProducts.forEach((p) => {
      const category = p.category || 'Unknown';
      const metal = p.metal || 'Unknown';

      const key = `${category}-${metal}`;

      const existing =
        map.get(key) || {
          category,
          metal,
          totalWeight: 0,
          totalPrice: 0,
          totalQuantity: 0,
        };

      // Total Weight: sum of (quantity × weight) for each product
      const weight = p.weight || 0;
      const quantity = p.quantity || 0;
      existing.totalWeight += quantity > 0 ? weight * quantity : weight;

      // Total Price: sum of all product prices
      const priceNumber =
        typeof p.price === 'string'
          ? parseFloat(p.price)
          : Number(p.price);

      if (!isNaN(priceNumber)) {
        existing.totalPrice += priceNumber;
      }

      existing.totalQuantity += quantity;

      map.set(key, existing);
    });

    return Array.from(map.values());
  }, [allProducts]);

  // Paginate grouped inventory
  const paginatedData = React.useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return groupedInventory.slice(startIndex, endIndex);
  }, [groupedInventory, page, rowsPerPage]);

  // Update total pages and items based on grouped inventory
  React.useEffect(() => {
    const total = groupedInventory.length;
    setTotalItems(total);
    const newTotalPages = Math.ceil(total / rowsPerPage);
    setTotalPages(newTotalPages);
    
    // If current page is beyond available pages, go to last page
    if (page > newTotalPages && newTotalPages > 0) {
      setPage(newTotalPages);
    }
  }, [groupedInventory.length, rowsPerPage, page]);

  return (
    <PageLayout
      title="Inventory"
      icon={<Inventory2Icon sx={{ fontSize: 26 }} />}
      headerRight={
        <>
          <SearchBar>
            {SearchField}
            <AddProductButton startIcon={<AddIcon />} onClick={handleOpenDialog}>
              Add Product
            </AddProductButton>
          </SearchBar>
          {FilterMenu}
        </>
      }
    >
      {!loading && paginatedData.length === 0 ? (
        <Box sx={inventoryPageStyles.tableContainer}>
          <EmptyState
            title="No products"
            message="No products found matching your search."
            minHeight={220}
          />
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={inventoryPageStyles.tableContainer}
        >
          <StyledTable>
            <TableHead>
              <TableRow>
                <TableHeaderCell>{' '}</TableHeaderCell>
                <TableHeaderCell>S.No.</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell>Metal</TableHeaderCell>
                <TableHeaderCell>Total Weight</TableHeaderCell>
                <TableHeaderCell>Purchase Price</TableHeaderCell>
                <TableHeaderCell>Total Quantity</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={inventoryPageStyles.loadingTableCell}>
                    <CircularProgress size={24} />
                    <Typography sx={inventoryPageStyles.loadingTypography}>
                      Loading...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => (
                <React.Fragment key={`${row.category}-${row.metal}-${index}`}>
                  <TableDataRow>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => toggleCategoryExpand(`${row.category}-${row.metal}`)}
                      >
                        {expandedCategory === `${row.category}-${row.metal}` ? (
                          <KeyboardArrowDownIcon fontSize="small" />
                        ) : (
                          <KeyboardArrowRightIcon fontSize="small" />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell>{(page - 1) * rowsPerPage + index + 1}</TableCell>
                    <TableCell sx={inventoryPageStyles.categoryTableCell}>{row.category}</TableCell>
                    <TableCell>{row.metal}</TableCell>
                    <TableCell>
                      {row.metal?.toLowerCase() === 'diamond' || row.metal?.toLowerCase() === 'gemstones' || row.metal?.toLowerCase() === 'gemstone'
                        ? `${row.totalWeight.toFixed(2)} ct` 
                        : `${row.totalWeight.toFixed(2)} gms`}
                    </TableCell>
                    <TableCell>₹{row.totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>{row.totalQuantity}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => {
                          handleCategoryDeleteClick(row.category);
                        }}
                      >
                        <DeleteIcon fontSize="small" sx={inventoryPageStyles.deleteIcon} />
                      </IconButton>
                    </TableCell>

                  </TableDataRow>
                  <TableRow>
                    <TableCell colSpan={8} sx={inventoryPageStyles.expandedCategoryTableCell}>
                      <Collapse
                        in={expandedCategory === `${row.category}-${row.metal}`}
                        timeout={250}
                        unmountOnExit
                      >
                        <CategoryProductsTable
                          category={row.category}
                          products={products.filter(
                            (p) =>
                              (p.category || 'Unknown') === row.category &&
                              (p.metal || 'Unknown') === row.metal
                          )
                          }
                          onEditProduct={handleEditProduct}
                          onDeleteProduct={handleOpenDeleteDialog}
                        />
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              )))}
            </TableBody>
          </StyledTable>
        </TableContainer>
      )}

      {/* Pagination */}
      {!loading && totalPages > 0 && (
        <Box sx={inventoryPageStyles.paginationContainer}>
          <Typography sx={inventoryPageStyles.paginationTypography}>
            Showing {paginatedData.length} {paginatedData.length === 1 ? 'record' : 'records'}
            {totalItems > 0 && (
              <> (indices {((page - 1) * rowsPerPage) + 1}-{Math.min(page * rowsPerPage, totalItems)} of {totalItems})</>
            )}
          </Typography>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            siblingCount={0}
            boundaryCount={1}
            disabled={loading}
            sx={inventoryPageStyles.paginationSx}
          />
        </Box>
      )}

      {/* Add/Edit Product Dialog */}
      <AddProductDialog
        open={openDialog}
        onClose={handleCloseDialog}
        editMode={editMode}
        formData={formData}
        onSave={handleSaveProduct}
      />

      {/* Delete Confirmation Dialog */}
      <StyledDialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogContent sx={inventoryPageStyles.dialogContentSx}>
          <Box sx={inventoryPageStyles.deleteIconContainer}>
            <DeleteIcon sx={inventoryPageStyles.deleteIconSx} />
          </Box>
          <Typography
            variant="h6"
            sx={inventoryPageStyles.dialogTitleTypography}
          >
            Confirm Delete
          </Typography>
          <Typography sx={inventoryPageStyles.dialogBodyTypography}>
            {isDeletingCategory && categoryToDelete
              ? `Are you sure you want to delete the ${categoryToDelete} category?`
              : `Are you sure you want to delete ${productToDelete?.product ?? 'this product'}? This action cannot be undone.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={inventoryPageStyles.dialogActionsSx}>
          <SaveButton
            onClick={handleCloseDeleteDialog}
            sx={inventoryPageStyles.cancelButtonSx}
          >
            Cancel
          </SaveButton>
          <SaveButton
            onClick={handleConfirmDelete}
            sx={inventoryPageStyles.deleteButtonSx}
          >
            Delete
          </SaveButton>
        </DialogActions>
      </StyledDialog>

      {/* Category Error Dialog */}
      <StyledDialog open={openCategoryErrorDialog} onClose={() => setOpenCategoryErrorDialog(false)}>
        <DialogContent sx={inventoryPageStyles.dialogContentSx}>
          <Box sx={inventoryPageStyles.warningIconContainer}>
            <DeleteIcon sx={inventoryPageStyles.warningIconSx} />
          </Box>
          <Typography
            variant="h6"
            sx={inventoryPageStyles.dialogTitleTypography}
          >
            Cannot Delete Category
          </Typography>
          <Typography sx={inventoryPageStyles.dialogBodyTypography}>
            {categoryErrorMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={inventoryPageStyles.dialogActionsCentered}>
          <SaveButton onClick={() => setOpenCategoryErrorDialog(false)} sx={inventoryPageStyles.dialogButtonSx}>
            OK
          </SaveButton>
        </DialogActions>
      </StyledDialog>

      {/* Success Dialog */}
      <StyledDialog open={openSuccessDialog} onClose={handleCloseSuccessDialog}>
        <DialogContent sx={inventoryPageStyles.dialogContentSx}>
          <Box sx={inventoryPageStyles.successIconContainer}>
            <Box sx={inventoryPageStyles.checkmarkIcon} />
          </Box>
          <Typography
            variant="h6"
            sx={inventoryPageStyles.dialogTitleTypography}
          >
            Success!
          </Typography>
          <Typography sx={inventoryPageStyles.dialogBodyTypography}>
            {successMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={inventoryPageStyles.dialogActionsCentered}>
          <SaveButton onClick={handleCloseSuccessDialog} sx={inventoryPageStyles.dialogButtonSx}>
            OK
          </SaveButton>
        </DialogActions>
      </StyledDialog>
      <EditProductDialog
        open={editDialogOpen}
        product={currentProduct}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleSaveProduct}
      />

    </PageLayout>
  );
};

export default Inventory;