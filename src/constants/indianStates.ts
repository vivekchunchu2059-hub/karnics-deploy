/**
 * Indian States and Union Territories
 */

export enum IndianStates {
  ANDAMAN_AND_NICOBAR_ISLANDS = "Andaman and Nicobar Islands",
  ANDHRA_PRADESH = "Andhra Pradesh",
  ARUNACHAL_PRADESH = "Arunachal Pradesh",
  ASSAM = "Assam",
  BIHAR = "Bihar",
  CHANDIGARH = "Chandigarh",
  CHHATTISGARH = "Chhattisgarh",
  DADRA_AND_NAGAR_HAVELI_AND_DAMAN_AND_DIU = "Dadra and Nagar Haveli and Daman and Diu",
  DELHI = "Delhi",
  GOA = "Goa",
  GUJARAT = "Gujarat",
  HARYANA = "Haryana",
  HIMACHAL_PRADESH = "Himachal Pradesh",
  JAMMU_AND_KASHMIR = "Jammu and Kashmir",
  JHARKHAND = "Jharkhand",
  KARNATAKA = "Karnataka",
  KERALA = "Kerala",
  LADAKH = "Ladakh",
  LAKSHADWEEP = "Lakshadweep",
  MADHYA_PRADESH = "Madhya Pradesh",
  MAHARASHTRA = "Maharashtra",
  MANIPUR = "Manipur",
  MEGHALAYA = "Meghalaya",
  MIZORAM = "Mizoram",
  NAGALAND = "Nagaland",
  ODISHA = "Odisha",
  PUDUCHERRY = "Puducherry",
  PUNJAB = "Punjab",
  RAJASTHAN = "Rajasthan",
  SIKKIM = "Sikkim",
  TAMIL_NADU = "Tamil Nadu",
  TELANGANA = "Telangana",
  TRIPURA = "Tripura",
  UTTAR_PRADESH = "Uttar Pradesh",
  UTTARAKHAND = "Uttarakhand",
  WEST_BENGAL = "West Bengal",
}

// Array of all state values for backward compatibility
export const INDIAN_STATES = Object.values(IndianStates) as readonly string[];