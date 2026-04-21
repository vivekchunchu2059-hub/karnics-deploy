export interface Product {
  product ?: string;
  sku ?: string;
  category ?: string;
  metal ?: string;
  weight : number;
  purity ?: string;
  color ?: string;
  price : string; // Accepts decimal values as string (e.g., "125000.50")
  quantity : number;
  image?: string; 
}

export interface ProductFormData {
  product ?: string;
  sku ?: string;
  category ?: string;
  metal ?: string;
  weight : number;
  purity ?: string;
  color ?: string;
  price : string; // Accepts decimal values as string (e.g., "125000.50")
  quantity : number;
  image?: string;
}

export interface UseInventorySearchProps {
  products: Product[];
  page: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export interface UseInventorySearchReturn {
  searchQuery: string;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filteredProducts: Product[];
  paginatedProducts: Product[];
  totalPages: number;
  SearchField: React.ReactElement;
  FilterMenu: React.ReactElement;
  selectedFilter: 'product' | 'category' | null;
}

/**
* Union type for Inventory table column headers
*/
export type InventoryTableHeader = 
| 'Product'
| 'SKU'
| 'Category'
| 'Metal'
| 'Weight'
| 'Karat'
| 'Color'
| 'Price'
| 'Quantity'
| 'Status'
| 'Action';


/**
* Array of all inventory table headers in order
*/
export const INVENTORY_TABLE_HEADERS: readonly InventoryTableHeader[] = [
'Product',
'SKU',
'Category',
'Metal',
'Weight',
'Karat',
'Color',
'Price',
'Quantity',
'Status',
'Action',
] as const;