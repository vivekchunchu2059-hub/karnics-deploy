import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  MenuItem,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  InputAdornment,
  Select,
} from "@mui/material";
import { FieldArray, FormikErrors, FormikProps } from "formik";
import {
  ActionButton,
  AddItemButton,
  FormField,
  FormSection,
  FormSelect,
  PurchaseTable,
  SectionTitle,
  TableAddIcon,
  TableDeleteIcon,
} from "./BillingStyles";
import { BillingFormValues, BillingItem, BillingTotals } from "../../../models/Billing";
import { INVOICE_CONFIG } from "../../../config/invoice";
import { PURCHASE_ITEMS_TABLE_HEADERS } from "../../../constants/common";
import { fetchMetals, type MetalOption } from "../../../utils/commonUtil";
import { Autocomplete } from "@mui/material";
import { apiClient } from "../../../api";
import { Tooltip } from "@mui/material";
import log from "../../../utils/logger";
import { formatInrAmount } from "../../../utils/formatCurrency";

type PurchaseItemsSectionProps = {
  formik: FormikProps<BillingFormValues>;
  totals: BillingTotals;
  cgstPercent: number;
  sgstPercent: number;
  makingCharges?: number;
  isEditMode?: boolean;
  initialItemsCount?: number;
};

type InventoryProduct = {
  product: string;
  weight: number;
};


type InventoryItem = {
  category: InventoryProduct[];
};

export const PurchaseItemsSection: React.FC<PurchaseItemsSectionProps> = ({
  formik,
  totals,
  cgstPercent,
  sgstPercent,
  makingCharges,
  isEditMode = false,
  initialItemsCount = 0,
}) => {
  const [metals, setMetals] = useState<MetalOption[]>([]);
  const [focusedFields, setFocusedFields] = useState<{ [key: string]: boolean }>({});
  const [hoveredFields, setHoveredFields] = useState<{ [key: string]: boolean }>({});
  const itemNameInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [availableStock, setAvailableStock] = useState<{ [key: number]: number }>({});
  const originalQuantitiesRef = useRef<{ [sku: string]: number }>({});
  const sectionRef = useRef<HTMLDivElement>(null);
  const restoreScrollRef = useRef<{ scrollParent: HTMLElement; scrollTop: number } | null>(null);

  const getScrollParent = useCallback((el: HTMLElement | null): HTMLElement | null => {
    if (!el) return null;
    let p = el.parentElement;
    while (p) {
      const style = getComputedStyle(p);
      const oy = style.overflowY;
      if (oy === "auto" || oy === "scroll" || oy === "overlay") return p;
      p = p.parentElement;
    }
    return null;
  }, []);

  const restoreScroll = useCallback(() => {
    const saved = restoreScrollRef.current;
    if (!saved) return;
    if (saved.scrollParent.scrollTop !== saved.scrollTop) {
      saved.scrollParent.scrollTop = saved.scrollTop;
    }
  }, []);

  const scrollSectionIntoView = useCallback(() => {
    sectionRef.current?.scrollIntoView({ block: "nearest", behavior: "auto" });
  }, []);

  useEffect(() => {
    const loadMetals = async () => {
      const metalsData = await fetchMetals();
      setMetals(metalsData);
    };

    loadMetals();
  }, []);

  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);

  // Auto-populate making charge from registration.json (makingCharges prop from parent) when item has no value
  useEffect(() => {
    const charge = makingCharges != null ? Number(makingCharges) : undefined;
    if (charge === undefined || Number.isNaN(charge)) return;
    const items = formik.values.items;
    if (!Array.isArray(items)) return;
    items.forEach((item, index) => {
      const current = item.makingCharge;
      const isEmpty = current === undefined || (typeof current === "number" && current === 0) || Number(current) === 0;
      if (isEmpty) {
        formik.setFieldValue(`items.${index}.makingCharge`, charge);
      }
    });
  }, [makingCharges]);

  useEffect(() => {
    const loadInventory = async () => {
      log.info("Fetching Inventory Data...");
      try {
        const response = await apiClient.get("/api/inventory", {
          params: { page: 1, limit: 10000 },
        });
        log.info("Inventory Data fetched successfully");
        const result = response.data;

        if (Array.isArray(result)) {
          setInventoryData(result);
        } else if (result.data) {
          setInventoryData(result.data);
        } else {
          setInventoryData([]);
        }
      } catch (error) {
        log.error("Failed to fetch inventory data:", error);
        setInventoryData([]);
      }
    };

    loadInventory();
  }, []);

  useEffect(() => {
    if (!isEditMode) return;

    if (Object.keys(originalQuantitiesRef.current).length > 0) return;

    const originals: Record<string, number> = {};

    for (const item of formik.initialValues.items) {
      if (item.sku) {
        originals[item.sku] = Number(item.quantity) || 0;
      }
    }

    originalQuantitiesRef.current = originals;

    log.info("Original Quantities fetched successfully");

    // Set originalQuantity in form values for Yup validation to access
    formik.values.items.forEach((item, index) => {
      if (index < initialItemsCount && item.sku) {
        const originalQty = originalQuantitiesRef.current[item.sku];
        if (originalQty !== undefined) {
          formik.setFieldValue(`items.${index}.originalQuantity`, originalQty);
        }
      }
    });

    // Clear Yup validation errors for existing items after original quantities are set
    // This prevents Yup errors from showing when original quantity > current stock
    formik.values.items.forEach((item, index) => {
      if (index < initialItemsCount && item.sku) {
        const originalQty = originalQuantitiesRef.current[item.sku];
        const currentQty = Number(item.quantity) || 0;
        
        // If quantity matches original, clear any stock-related Yup errors
        if (originalQty !== undefined && currentQty === originalQty) {
          const error = (formik.errors.items?.[index] as FormikErrors<BillingItem>)?.quantity;
          // Check if error is a stock-related error from Yup
          if (error && (typeof error === 'string' && (error.includes("stock") || error.includes("Only")))) {
            formik.setFieldError(`items.${index}.quantity`, undefined);
          }
        }
      }
    });
  }, [isEditMode, formik, initialItemsCount]);

  // Load stock for items that have SKU but no stock value (e.g., when editing invoice)
  useEffect(() => {
    if (inventoryData.length > 0) {
      const allProducts = inventoryData.flatMap((inv: any) =>
        inv.category.map((prod: any) => ({
          sku: prod.sku,
          quantity: prod.quantity || 0,
        }))
      );

      formik.values.items.forEach((item, index) => {
        if (item.sku && item.stock === undefined) {
          const product = allProducts.find((p: any) => p.sku === item.sku);
          if (product) {
            const sku = formik.values.items[index].sku;

            let stock = 0;

            if (sku) {
              const product = allProducts.find((p: any) => p.sku === sku);
              stock = product ? Number(product.quantity) || 0 : 0;
            }
            formik.setFieldValue(`items.${index}.stock`, stock);
            setAvailableStock(prev => ({ ...prev, [index]: stock }));
          }
        }
      });

      // Clear Yup validation errors for existing items when quantity matches original
      // This prevents Yup from showing errors when original quantity > current stock
      if (isEditMode && Object.keys(originalQuantitiesRef.current).length > 0) {
        formik.values.items.forEach((item, index) => {
          if (index < initialItemsCount && item.sku) {
            const originalQty = originalQuantitiesRef.current[item.sku];
            const currentQty = Number(item.quantity) || 0;
            
            // If quantity matches original, clear any stock-related Yup errors
            if (originalQty !== undefined && currentQty === originalQty) {
              const error = (formik.errors.items?.[index] as FormikErrors<BillingItem>)?.quantity;
              // Check if error is a stock-related error from Yup
              if (error && (typeof error === 'string' && (error.includes("stock") || error.includes("Only")))) {
                formik.setFieldError(`items.${index}.quantity`, undefined);
              }
            }
          }
        });
      }
    }
  }, [inventoryData, formik.values.items, isEditMode, initialItemsCount]);



  const allProducts = inventoryData.flatMap((inv: any) =>
    inv.category.map((prod: any) => ({
      product: prod.product,
      weight: prod.weight,
      metal: inv.metal, // Include metal information to determine weight unit
      sku: prod.sku,
      stock: 0,// Include SKU for inventory tracking
      quantity: prod.quantity || 0,
      // Include quantity for stock validation
    }))
  );



  return (
    <FormSection ref={sectionRef}>
      <SectionTitle>Purchase Items</SectionTitle>
      <FieldArray name="items">
        {({ remove, push }) => (
          <>
            <TableContainer>
              <PurchaseTable>
                <TableHead>
                  <TableRow>
                    {PURCHASE_ITEMS_TABLE_HEADERS.map((header, index) => (
                      <TableCell
                        key={index}
                        align={header.align}
                        sx={
                          header.label === "Making Charges"
                            ? { minWidth: 115, whiteSpace: "nowrap" }
                            : header.label === "Total"
                              ? { width: 120, maxWidth: 120 }
                              : header.label === "Action"
                                ? { width: 72, maxWidth: 72 }
                                : undefined
                        }
                      >
                        {header.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formik.values.items.map((item, index) => {
                    const currentItem = formik.values.items?.[index];
                    const currentItemName = currentItem?.itemName || "";
                    const qty = Number(item?.quantity) || 0;
                    const price = Number(item?.price) || 0;
                    const makingCharge = Number(item?.makingCharge) || 0;
                    const lineTotal = qty * price + makingCharge;
                    const itemErrors =
                      (formik.errors.items?.[index] as
                        | FormikErrors<BillingItem>
                        | string
                        | undefined) || {};
                    const itemTouched =
                      (formik.touched.items?.[index] as
                        | Partial<Record<keyof BillingItem, boolean>>
                        | undefined) || {};

                    const itemNameKey = `itemName-${index}`;
                    const descriptionKey = `description-${index}`;
                    const metalKey = `metal-${index}`;
                    const isItemNameFocused = focusedFields[itemNameKey] || false;
                    const isDescriptionFocused = focusedFields[descriptionKey] || false;
                    const isMetalFocused = focusedFields[metalKey] || false;

                    // Check if item is out of stock by checking current inventory
                    const currentStock = item.sku
                      ? (() => {
                        const product = allProducts.find((p: any) => p.sku === item.sku);
                        return product ? (Number(product.quantity) || 0) : undefined;
                      })()
                      : undefined;
                    // Item is out of stock if it has SKU and stock is 0
                    const isOutOfStock = Boolean(item.sku && currentStock !== undefined && currentStock === 0);
                    // Check if this is an existing item (from original invoice) or a new item (added during edit)
                    const isExistingItem = isEditMode && index < initialItemsCount;
                    // Only disable existing items that are out of stock. New items remain enabled even if out of stock
                    const shouldDisableItem = Boolean(isOutOfStock && isExistingItem);

                    return (
                      <TableRow
                        key={index}
                        sx={shouldDisableItem ? {
                          '& > td': {
                            position: 'relative',
                            opacity: 0.6,
                          },
                          '& > td:last-child': {
                            opacity: 1.0, // Keep delete button at full opacity
                          }
                        } : {}}
                      >
                        {/* Hidden field for HSN */}
                        <input type="hidden" {...formik.getFieldProps(`items.${index}.hsn`)} />

                        {/* Metal */}
                        <TableCell sx={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                          <Tooltip
                            title={item.metal || ''}
                            arrow
                            open={!isMetalFocused && !!item.metal && (hoveredFields[metalKey] || false)}
                            onOpen={() => {
                              if (!isMetalFocused && item.metal) {
                                setHoveredFields(prev => ({ ...prev, [metalKey]: true }));
                              }
                            }}
                            onClose={() => {
                              setHoveredFields(prev => ({ ...prev, [metalKey]: false }));
                            }}
                            disableHoverListener={isMetalFocused || !item.metal}
                            disableFocusListener={true}
                            disableTouchListener={true}
                          >
                            <Box>
                              <FormSelect
                                fullWidth
                                size="small"
                                displayEmpty
                                {...formik.getFieldProps(`items.${index}.metal`)}
                                onOpen={() => {
                                  const section = sectionRef.current;
                                  let scrollParent = section ? getScrollParent(section) : null;
                                  if (!scrollParent && section) {
                                    const docEl = document.scrollingElement as HTMLElement | null;
                                    if (docEl && docEl.scrollTop !== undefined) scrollParent = docEl;
                                  }
                                  if (scrollParent) {
                                    restoreScrollRef.current = { scrollParent, scrollTop: scrollParent.scrollTop };
                                  }
                                }}
                                onFocus={() => {
                                  setFocusedFields(prev => ({ ...prev, [metalKey]: true }));
                                  setHoveredFields(prev => ({ ...prev, [metalKey]: false }));
                                }}
                                onBlur={() => {
                                  setFocusedFields(prev => ({ ...prev, [metalKey]: false }));
                                }}
                                onChange={(e) => {
                                  if (shouldDisableItem) {
                                    formik.setFieldError(`items.${index}.quantity`, undefined);
                                    return;
                                   } // read-only in edit mode for disabled items
                                  const selectedMetal = e.target.value as string;
                                  formik.setFieldValue(`items.${index}.metal`, selectedMetal);

                                  // Auto-set weight unit based on metal type
                                  const metalLower = selectedMetal.toLowerCase();
                                  const currentWeight = item.weight || '';
                                  const numValue = currentWeight.replace(/\s*(gm|gms|ct|carat|grams)$/i, '').trim();

                                  if (numValue) {
                                    if (metalLower === 'diamond' || metalLower === 'gemstones' || metalLower === 'gemstone') {
                                      formik.setFieldValue(`items.${index}.weight`, `${numValue} ct`);
                                    } else {
                                      formik.setFieldValue(`items.${index}.weight`, `${numValue} gm`);
                                    }
                                  } else {
                                    // Even if there's no weight value, set the unit based on metal
                                    if (metalLower === 'diamond' || metalLower === 'gemstones' || metalLower === 'gemstone') {
                                      // Don't set weight if empty, but the unit dropdown will show 'ct' when user types
                                    }
                                  }

                                  // Keep scroll at current position (prevent jump on selection)
                                  requestAnimationFrame(() => {
                                    requestAnimationFrame(restoreScroll);
                                  });
                                  setTimeout(restoreScroll, 0);
                                  setTimeout(restoreScroll, 50);
                                  setTimeout(restoreScroll, 120);
                                  setTimeout(() => {
                                    restoreScroll();
                                    scrollSectionIntoView();
                                  }, 200);
                                }}
                                MenuProps={{
                                  disableScrollLock: true,
                                  onClose: restoreScroll,
                                }}
                                error={Boolean(
                                  itemTouched.metal &&
                                  (itemErrors as FormikErrors<BillingItem>)?.metal
                                )}
                                sx={{
                                  width: '100%',
                                  '& .MuiSelect-select': {
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '100%',
                                  },
                                }}
                              >
                                <MenuItem value="" onClick={(e) => e.preventDefault()}>
                                  <em>Select</em>
                                </MenuItem>
                                {metals.map((metal) => (
                                  <MenuItem
                                    key={metal.name}
                                    value={metal.name}
                                    sx={{ color: metal.color || '#000000' }}
                                    onClick={(e) => e.preventDefault()}
                                  >
                                    {metal.name}
                                  </MenuItem>
                                ))}
                              </FormSelect>
                            </Box>
                          </Tooltip>
                          {itemTouched.metal &&
                            (itemErrors as FormikErrors<BillingItem>)?.metal && (
                              <Typography color="error" variant="caption">
                                {(itemErrors as FormikErrors<BillingItem>)
                                  ?.metal as string}
                              </Typography>
                            )}
                        </TableCell>

                        {/* Weight */}
                        <TableCell sx={{ width: '75px' }}>
                          <FormField
                            type="text"
                            size="small"
                            placeholder="1.5"
                            fullWidth
                            value={item.weight?.replace(/\s*(gm|gms|ct|carat|grams)$/i, '') || ''}
                            onChange={(e) => {
                              if (shouldDisableItem) {
                                formik.setFieldError(`items.${index}.quantity`, undefined);
                                return;
                               } // read-only in edit mode for disabled items
                              const numValue = e.target.value;
                              const currentWeight = item.weight || '';
                              const unitMatch = currentWeight.match(/\s*(gm|ct)$/i);
                              const metalLower = item.metal?.toLowerCase() || '';
                              // If metal is diamond or gemstones, default to 'ct', otherwise 'gm'
                              let unit = unitMatch ? unitMatch[1] : 'gm';
                              if (!unitMatch && (metalLower === 'diamond' || metalLower === 'gemstones' || metalLower === 'gemstone')) {
                                unit = 'ct';
                              }
                              formik.setFieldValue(
                                `items.${index}.weight`,
                                numValue ? `${numValue} ${unit}` : ''
                              );
                            }}
                            onBlur={(e) => {
                              // Format weight to 2 decimal places only for manually entered items (not from inventory)
                              if (!item.sku) {
                                const currentWeight = item.weight || '';
                                const unitMatch = currentWeight.match(/\s*(gm|ct)$/i);
                                const metalLower = item.metal?.toLowerCase() || '';
                                let unit = unitMatch ? unitMatch[1] : 'gm';
                                if (!unitMatch && (metalLower === 'diamond' || metalLower === 'gemstones' || metalLower === 'gemstone')) {
                                  unit = 'ct';
                                }

                                // Extract numeric value
                                const numValue = currentWeight.replace(/\s*(gm|gms|ct|carat|grams)$/i, '').trim();

                                if (numValue) {
                                  const numericValue = Number(numValue);
                                  if (!isNaN(numericValue)) {
                                    // Format to 2 decimal places
                                    const formattedValue = numericValue.toFixed(2);
                                    formik.setFieldValue(
                                      `items.${index}.weight`,
                                      `${formattedValue} ${unit}`
                                    );
                                  }
                                }
                              }
                              formik.setFieldTouched(`items.${index}.weight`, true);
                            }}
                            error={Boolean(
                              itemTouched.weight &&
                              (itemErrors as FormikErrors<BillingItem>)?.weight
                            )}
                            helperText={
                              itemTouched.weight &&
                              (itemErrors as FormikErrors<BillingItem>)?.weight
                            }
                            InputProps={{
                              sx: {
                                display: 'flex',
                                '& input': {
                                  flex: '1 1 55%',
                                  minWidth: 0,
                                },
                              },
                              endAdornment: (
                                <InputAdornment position="end" sx={{ p: 0, m: 0, maxWidth: '35%' }}>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      borderLeft: '1px solid #d3d3d3',
                                      pl: 1,
                                      ml: 1,
                                    }}
                                  >
                                    <Select
                                      variant="standard"
                                      disableUnderline
                                      value={(() => {
                                        const metalLower = item.metal?.toLowerCase() || '';
                                        const weightUnit = item.weight?.match(/\s*(gm|ct)$/i)?.[1];
                                        // If metal is diamond or gemstones, default to 'ct', otherwise 'gm'
                                        if (metalLower === 'diamond' || metalLower === 'gemstones' || metalLower === 'gemstone') {
                                          return weightUnit || 'ct';
                                        }
                                        return weightUnit || 'gm';
                                      })()}
                                      onChange={(e) => {
                                        const newUnit = e.target.value;
                                        const numValue = item.weight?.replace(/\s*(gm|gms|ct|carat|grams)$/i, '') || '';
                                        formik.setFieldValue(
                                          `items.${index}.weight`,
                                          numValue ? `${numValue} ${newUnit}` : ''
                                        );
                                      }}
                                      sx={{
                                        minWidth: 56,
                                        fontSize: '0.875rem',
                                        '& .MuiSelect-select': {
                                          px: 0,
                                        },
                                        '& .MuiSelect-icon': {
                                          display: 'none',
                                        },
                                      }}
                                    >
                                      <MenuItem value="gm" onClick={(e) => e.preventDefault()}>gm</MenuItem>
                                      <MenuItem value="ct" onClick={(e) => e.preventDefault()}>ct</MenuItem>
                                    </Select>
                                  </Box>
                                </InputAdornment>
                              ),
                            }}
                          />
                        </TableCell>

                        {/* Item Name */}
                        <TableCell sx={{ width: '150px' }}>
                          <Autocomplete
                            freeSolo
                            size="small"
                            blurOnSelect={false}
                            value={currentItemName || ""}
                            options={
                              item.metal
                                ? allProducts.filter(
                                  (p) =>
                                    p.metal?.toLowerCase() === item.metal?.toLowerCase() &&
                                    p.product
                                      .toLowerCase()
                                      .includes(currentItemName.toLowerCase())
                                )
                                : []
                            }
                            getOptionLabel={(option) =>
                              typeof option === "string" ? option : option.product
                            }
                            inputValue={currentItemName || ""}
                            onInputChange={(event, value) => {
                              if (shouldDisableItem) return; // read-only in edit mode for disabled items
                              // Ensure field is marked as focused when typing
                              setFocusedFields(prev => ({ ...prev, [itemNameKey]: true }));
                              if (!item.metal) {
                                // Clear any existing Yup validation errors first
                                formik.setFieldError(`items.${index}.itemName`, undefined);
                                // Set custom error message
                                formik.setFieldError(
                                  `items.${index}.itemName`,
                                  "Please select metal first"
                                );
                                formik.setFieldTouched(`items.${index}.itemName`, true);
                                // Don't update the value if metal is not selected
                                return;
                              }
                              // Clear error if metal is selected
                              formik.setFieldError(`items.${index}.itemName`, undefined);
                              formik.setFieldValue(`items.${index}.itemName`, value);
                            }}
                            onChange={(event, value) => {
                              if (shouldDisableItem) return; // read-only in edit mode for disabled items
                              //  If user cleared the selection
                              if (!value) {
                                formik.setFieldValue(`items.${index}.itemName`, "");
                                formik.setFieldValue(`items.${index}.weight`, "");
                                formik.setFieldValue(`items.${index}.sku`, undefined);
                                formik.setFieldValue(`items.${index}.stock`, undefined);
                                setAvailableStock(prev => {
                                  const newStock = { ...prev };
                                  delete newStock[index];
                                  return newStock;
                                });
                                formik.setFieldError(`items.${index}.quantity`, undefined);
                                return;
                              }

                              // If user selected from inventory
                              if (typeof value !== "string") {
                                formik.setFieldValue(`items.${index}.itemName`, value.product);
                                // Store SKU for inventory quantity reduction
                                if (value.sku) {
                                  formik.setFieldValue(`items.${index}.sku`, value.sku);
                                }
                                
                                const sku = value.sku;
                                
                                let stock = 0;
                                
                                if (sku) {
                                  const product = allProducts.find((p: any) => p.sku === sku);
                                  stock = product ? Number(product.quantity) || 0 : 0;
                                }
                                setAvailableStock(prev => ({ ...prev, [index]: stock }));
                                // Store stock in form values for Yup validation
                                formik.setFieldValue(`items.${index}.stock`, stock);

                                // For new items in edit mode, if out of stock, don't auto-fill quantity or show error immediately
                                const isNewItem = isEditMode && index >= initialItemsCount;
                                if (isNewItem && stock === 0) {
                                  // Clear quantity if it was auto-filled, and don't show error until user clicks on quantity field
                                  formik.setFieldValue(`items.${index}.quantity`, "");
                                  formik.setFieldError(`items.${index}.quantity`, undefined);
                                  formik.setFieldTouched(`items.${index}.quantity`, false);
                                } else {
                                  // Clear manual errors - let Yup handle validation
                                  formik.setFieldError(`items.${index}.quantity`, undefined);
                                  // Trigger validation
                                  formik.validateField(`items.${index}.quantity`);
                                }

                                const metal = value.metal || "";
                                const metalLower = metal.toLowerCase();

                                let weightUnit = "gm";

                                if (
                                  metalLower === "diamond" ||
                                  metalLower === "gemstone" ||
                                  metalLower.includes("gem")
                                ) {
                                  weightUnit = "ct";
                                }

                                // Format weight properly
                                if (value.weight) {
                                  let rawWeight =
                                    typeof value.weight === "number"
                                      ? value.weight.toString()
                                      : value.weight
                                        .toString()
                                        .replace(/\s*(gm|gms|ct|carat|grams)$/i, "")
                                        .trim();

                                  let formattedWeight = rawWeight;

                                  // Apply decimal formatting ONLY for gram metals
                                  if (weightUnit === "gm") {
                                    const numericWeight = Number(rawWeight);
                                    if (!isNaN(numericWeight)) {
                                      formattedWeight = numericWeight.toFixed(2);
                                    }
                                  }

                                  formik.setFieldValue(
                                    `items.${index}.weight`,
                                    formattedWeight ? `${formattedWeight} ${weightUnit}` : ""
                                  );
                                } else {
                                  formik.setFieldValue(`items.${index}.weight`, "");
                                }

                                // Restore focus to this row's item name input after re-render (prevents jump to first field)
                                const rowIndex = index;
                                requestAnimationFrame(() => {
                                  requestAnimationFrame(() => {
                                    itemNameInputRefs.current[rowIndex]?.focus();
                                  });
                                });
                              }
                            }}
                            renderInput={(params) => (
                              <Tooltip
                                title={currentItemName || ""}
                                arrow
                                open={!isItemNameFocused && !!currentItemName && (hoveredFields[itemNameKey] || false)}
                                onOpen={() => {
                                  if (!isItemNameFocused && currentItemName) {
                                    setHoveredFields(prev => ({ ...prev, [itemNameKey]: true }));
                                  }
                                }}
                                onClose={() => {
                                  setHoveredFields(prev => ({ ...prev, [itemNameKey]: false }));
                                }}
                                disableHoverListener={isItemNameFocused || !currentItemName}
                                disableFocusListener={true}
                                disableTouchListener={true}
                              >
                                <FormField
                                  {...params}
                                  fullWidth
                                  size="small"
                                  inputRef={(el) => {
                                    (itemNameInputRefs.current as Record<number, HTMLInputElement | null>)[index] = el;
                                    const paramsWithRef = params as typeof params & { inputRef?: React.Ref<HTMLInputElement | null> };
                                    const existingRef = paramsWithRef.inputRef;
                                    if (typeof existingRef === "function") existingRef(el);
                                    else if (existingRef) (existingRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                                  }}
                                  onFocus={() => {
                                    setFocusedFields(prev => ({ ...prev, [itemNameKey]: true }));
                                    setHoveredFields(prev => ({ ...prev, [itemNameKey]: false }));
                                    // Check if metal is selected when focusing on item name
                                    if (!item.metal) {
                                      formik.setFieldTouched(`items.${index}.itemName`, true);
                                      formik.setFieldError(
                                        `items.${index}.itemName`,
                                        "Please select metal first"
                                      );
                                    }
                                  }}
                                  onBlur={() => {
                                    setFocusedFields(prev => ({ ...prev, [itemNameKey]: false }));
                                    formik.setFieldTouched(`items.${index}.itemName`, true);
                                  }}
                                  sx={{
                                    "& input": {
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    },
                                  }}
                                  error={
                                    Boolean(
                                      itemTouched.itemName &&
                                      (itemErrors as FormikErrors<BillingItem>)?.itemName
                                    )
                                  }
                                  helperText={
                                    itemTouched.itemName &&
                                    (itemErrors as FormikErrors<BillingItem>)?.itemName
                                  }
                                />
                              </Tooltip>
                            )}
                          />
                        </TableCell>

                        {/* Description */}
                        <TableCell sx={{ width: "170px" }}>
                          <Tooltip
                            title={item.description || ""}
                            arrow
                            open={!isDescriptionFocused && !!item.description && (hoveredFields[descriptionKey] || false)}
                            onOpen={() => {
                              if (!isDescriptionFocused && item.description) {
                                setHoveredFields(prev => ({ ...prev, [descriptionKey]: true }));
                              }
                            }}
                            onClose={() => {
                              setHoveredFields(prev => ({ ...prev, [descriptionKey]: false }));
                            }}
                            disableHoverListener={isDescriptionFocused || !item.description}
                            disableFocusListener={true}
                            disableTouchListener={true}
                          >
                            <FormField
                              fullWidth
                              size="small"
                              placeholder="Notes"
                              {...formik.getFieldProps(`items.${index}.description`)}
                              onChange={(e) => {
                                if (shouldDisableItem) {
                                  formik.setFieldError(`items.${index}.quantity`, undefined);
                                  return;
                                 } // read-only in edit mode for disabled items
                                // Ensure field is marked as focused when typing
                                setFocusedFields(prev => ({ ...prev, [descriptionKey]: true }));
                                setHoveredFields(prev => ({ ...prev, [descriptionKey]: false }));
                                formik.setFieldValue(`items.${index}.description`, e.target.value);
                              }}
                              onFocus={() => {
                                setFocusedFields(prev => ({ ...prev, [descriptionKey]: true }));
                                setHoveredFields(prev => ({ ...prev, [descriptionKey]: false }));
                              }}
                              onBlur={() => {
                                setFocusedFields(prev => ({ ...prev, [descriptionKey]: false }));
                              }}
                              sx={{
                                "& input": {
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                },
                              }}
                            />
                          </Tooltip>
                        </TableCell>

                        {/* Quantity */}
                        <TableCell sx={{ width: '80px' }}>
                          <FormField
                            type="number"
                            fullWidth
                            size="small"
                            placeholder="1"
                            inputProps={{ step: "1", min: 1 }}
                            value={item.quantity && item.quantity > 0 ? item.quantity : ""}
                            onFocus={(e) => {
                              if (shouldDisableItem) return; // read-only in edit mode for disabled items
                              // For new items in edit mode, if out of stock, show error when user clicks on quantity field
                              const isNewItem = isEditMode && index >= initialItemsCount;
                              const sku = formik.values.items[index].sku;

                              let stock = 0;

                              if (sku) {
                                const product = allProducts.find((p: any) => p.sku === sku);
                                stock = product ? Number(product.quantity) || 0 : 0;
                              }
                              if (isNewItem && stock !== undefined && stock === 0) {
                                formik.setFieldError(`items.${index}.quantity`, "This product is out of stock");
                                formik.setFieldTouched(`items.${index}.quantity`, true);
                              }
                            }}
                            onChange={(e) => {
                              if (shouldDisableItem) {
                                formik.setFieldError(`items.${index}.quantity`, undefined);
                                return;
                               } // read-only in edit mode for disabled items
                              const inputValue = e.target.value;
                              const enteredQuantity = inputValue === "" ? "" : Number(inputValue);
                              formik.setFieldValue(
                                `items.${index}.quantity`,
                                enteredQuantity
                              );

                              // Check if this is an existing item or new item
                              const isNewItem = isEditMode && index >= initialItemsCount;
                              const isExistingItem = isEditMode && index < initialItemsCount;
                              const sku = formik.values.items[index].sku;

                              let stock = 0;

                              if (sku) {
                                const product = allProducts.find((p: any) => p.sku === sku);
                                stock = product ? Number(product.quantity) || 0 : 0;
                              }

                              // For new items in edit mode or create invoice mode, check stock immediately
                              if ((isNewItem || !isEditMode) && stock !== undefined && enteredQuantity !== "") {
                                const qty = typeof enteredQuantity === "number" ? enteredQuantity : Number(enteredQuantity);
                                if (!isNaN(qty)) {
                                  if (stock === 0 && qty > 0) {
                                    formik.setFieldError(`items.${index}.quantity`, "This product is out of stock");
                                    formik.setFieldTouched(`items.${index}.quantity`, true);
                                  } else if (qty > stock) {
                                    formik.setFieldError(`items.${index}.quantity`, `Only ${stock} items in stock`);
                                    formik.setFieldTouched(`items.${index}.quantity`, true);
                                  } else if (qty > 0 && qty <= stock) {
                                    formik.setFieldError(`items.${index}.quantity`, undefined);
                                  }
                                }
                              }
                              // For existing items in edit mode, validate using SKU-based original quantities
                              else if (!shouldDisableItem && isExistingItem && stock !== undefined && enteredQuantity !== "") {
                                const sku = formik.values.items[index].sku;

                                // Only validate if item has SKU (inventory items)
                                if (sku) {
                                  const originalQty = originalQuantitiesRef.current[sku] || 0;
                                  const updatedQty = Number(enteredQuantity);


                                  if (!isNaN(updatedQty)) {
                                    // If quantity unchanged → no validation
                                    if (updatedQty === originalQty) {
                                      formik.setFieldError(`items.${index}.quantity`, undefined);
                                      return;
                                    }

                                    // Calculate difference
                                    const difference = updatedQty - originalQty;

                                    if (difference > 0) {
                                      // Quantity increased - validate against available stock
                                      if (difference > stock) {
                                        const effectiveStock = stock + originalQty;
                                        formik.setFieldError(
                                          `items.${index}.quantity`,
                                          `Only ${effectiveStock} items available`
                                        );
                                        formik.setFieldTouched(`items.${index}.quantity`, true);
                                      } else {
                                        formik.setFieldError(`items.${index}.quantity`, undefined);
                                      }
                                    } else if (difference < 0) {
                                      // Quantity decreased - allow without validation
                                      formik.setFieldError(`items.${index}.quantity`, undefined);
                                    }
                                  }
                                } else {
                                  // Item without SKU - trigger Yup validation only
                                  formik.validateField(`items.${index}.quantity`);
                                }
                              }
                            }}
                            error={Boolean(
                              !shouldDisableItem &&
                              ((itemTouched.quantity || formik.submitCount > 0) &&
                                (formik.errors.items?.[index] as FormikErrors<BillingItem>)?.quantity)
                            )}

                            helperText={
                              // For existing items that are out of stock, show as message (not error)
                              (isOutOfStock && isExistingItem)
                                ? "out of stock"
                                : // For new items or other errors, show error message
                                ((itemTouched.quantity || formik.submitCount > 0)
                                  ? (formik.errors.items?.[index] as FormikErrors<BillingItem> | undefined)?.quantity || ""
                                  : "")
                            }
                          />
                        </TableCell>

                        {/* Price per Piece */}
                        <TableCell sx={{ width: '130px' }}>
                          <FormField
                            type="number"
                            fullWidth
                            size="small"
                            placeholder="0"
                            inputProps={{ step: "0.01", min: 1 }}
                            value={item.price && item.price > 0 ? item.price : ""}
                            onChange={(e) =>
                              shouldDisableItem
                                ? undefined // read-only in edit mode for disabled items
                                :
                              formik.setFieldValue(
                                `items.${index}.price`,
                                e.target.value === "" ? "" : Number(e.target.value)
                              )
                            }
                            error={Boolean(
                              itemTouched.price &&
                              (itemErrors as FormikErrors<BillingItem>)?.price
                            )}
                            helperText={
                              itemTouched.price &&
                              (itemErrors as FormikErrors<BillingItem>)?.price
                            }
                          />
                        </TableCell>

                        {/* Making Charges */}
                        <TableCell sx={{ width: 115, minWidth: 115, maxWidth: 115 }}>
                          <FormField
                            type="number"
                            fullWidth
                            size="small"
                            inputProps={{ step: "100", min: 0 }}
                            value={item.makingCharge}
                            onChange={(e) =>
                              shouldDisableItem
                                ? undefined // read-only in edit mode for disabled items
                                :
                              formik.setFieldValue(
                                `items.${index}.makingCharge`,
                                e.target.value === "" ? "" : Number(e.target.value)
                              )
                            }

                            error={Boolean(
                              itemTouched.makingCharge &&
                              (itemErrors as FormikErrors<BillingItem>)
                                ?.makingCharge
                            )}
                            helperText={
                              itemTouched.makingCharge &&
                              (itemErrors as FormikErrors<BillingItem>)
                                ?.makingCharge
                            }
                          />
                        </TableCell>

                        {/* Total */}
                        <TableCell sx={{ fontWeight: 600, width: 120, maxWidth: 120 }}>
                          ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>

                        {/* Action */}
                        <TableCell align="center" sx={{ width: 72, maxWidth: 72 }}>
                          <ActionButton
                            disabled={formik?.values?.items?.length === 1}
                            className="delete"
                            onClick={() => remove(index)}
                            aria-label="Remove item"
                          >
                            <TableDeleteIcon fontSize="small" />
                          </ActionButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </PurchaseTable>
            </TableContainer>

            <AddItemButton
              variant="outlined"
              startIcon={<TableAddIcon />}
              onClick={() =>
                push({
                  itemName: "",
                  metal: "",
                  hsn: INVOICE_CONFIG.defaultHsn || "",
                  weight: "",
                  quantity: 1,
                  makingCharge: makingCharges ? Number(makingCharges) : (INVOICE_CONFIG.defaultMakingCharge || 0),
                  price: "",
                  description: "",
                })
              }
            >
              Add Item
            </AddItemButton>
          </>
        )}
      </FieldArray>

      {/* Totals Box */}
      <Box
        sx={{
          mt: 4,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Box
          sx={{
            backgroundColor: "#fafafa",
            borderRadius: "8px",
            padding: "20px 24px",
            minWidth: "320px",
            border: "1px solid #e0e0e0",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
            <Typography sx={{ fontSize: "14px", color: "#616161" }}>Sub Total</Typography>
            <Typography sx={{ fontSize: "14px", fontWeight: 600 }}>
              ₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
          {totals.cgstAmount > 1 && (
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
              <Typography sx={{ fontSize: "14px", color: "#616161" }}>CGST</Typography>
              <Typography sx={{ fontSize: "14px", fontWeight: 600 }}>
                ₹{totals.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>
          )}
          {totals.sgstAmount > 0 && (
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
              <Typography sx={{ fontSize: "14px", color: "#616161" }}>SGST</Typography>
              <Typography sx={{ fontSize: "14px", fontWeight: 600 }}>
                ₹{totals.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography sx={{ fontSize: "14px", color: "#616161" }}>Discount</Typography>
            <Typography sx={{ fontSize: "14px", fontWeight: 600 }}>
              ₹{totals.discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              pt: 2,
              borderTop: "2px solid #d0d0d0"
            }}
          >
            <Typography sx={{ fontSize: "16px", fontWeight: 700, color: "#2e2d47" }}>
              Grand Total
            </Typography>
            <Typography sx={{ fontSize: "18px", fontWeight: 700, color: "#2e2d47" }}>
              ₹{formatInrAmount(totals.grandTotal)}
            </Typography>
          </Box>
        </Box>
      </Box>
    </FormSection>
  );
};