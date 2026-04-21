import { FormikHelpers } from "formik";
import { apiClient, getRuntimePublicEnv, getSyncServiceHeaders } from "../../api";
import { getClientIpAddress } from "../../config/ipConfig";
import { RegisterFormValues } from "../../models/Registration";
import log from '../../utils/logger';


const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/** Prevents double-clicks / overlapping submits from firing customer-id or POST /api/registration twice */
let registrationSubmitInFlight = false;

/**
 * Registration handler with CustomerId generation
 */
export const handleRegisterWithCustomerId = async (
  values: RegisterFormValues,
  formikHelpers: FormikHelpers<RegisterFormValues>,
  callbacks: {
    setPopupType: (
      type:
        | "customer"| "server" | "success" | "missingFields" | "noCustomerId" | "customerIdBadRequest" | "duplicateCustomer" | "duplicateGst" | "ipAddressError" | "serviceUnavailable"
        | null
    ) => void;
    setPopupOpen: (open: boolean) => void;
    setGeneratedCustomerId: (id: string | null) => void;
  }
) => {
  const { setSubmitting, setFieldError } = formikHelpers;
  const { setPopupType, setPopupOpen, setGeneratedCustomerId } = callbacks;

  if (registrationSubmitInFlight) {
    return;
  }
  registrationSubmitInFlight = true;

  try {
    setSubmitting(true);

    /**
     * STEP 1: Get Local IP Address
     * Desktop .exe uses launcher.js (minimal API): prefer backend, then public IP service, then loopback.
     */
    let ipAddress = "";

    try {
      log.info("Getting local IP address...");
      const ipResponse = await apiClient.get("/api/registration/local-ip");
      log.info("Local IP address fetched successfully");
      if (ipResponse.data?.success && ipResponse.data?.ipAddress) {
        ipAddress = String(ipResponse.data.ipAddress).trim();
      } else {
        throw new Error("Invalid IP response");
      }
    } catch (error) {
      try {
        ipAddress = (await getClientIpAddress())?.trim() || "";
      } catch {
        ipAddress = "";
        log.error("Failed to get client IP address");
      }
    }

    if (!ipAddress) {
      setPopupType("ipAddressError");
      setPopupOpen(true);
      setSubmitting(false);
      return;
    }

    /**
     * Single GET /api/registration: no duplicate registrations + GST already in store (same snapshot)
     */
    let registrations: any[] = [];
    try {
      const response = await apiClient.get<{ success: boolean; data: any[] }>(
        "/api/registration"
      );
      registrations = response.data.data || [];

      if (registrations.length > 0) {
        setPopupType("duplicateCustomer");
        setPopupOpen(true);
        setSubmitting(false);
        return;
      }
      // Empty list: GST uniqueness is enforced on POST /api/registration (no second GET)
    } catch (error) {
      log.error('error getting registrations:', error);
    }

    // Get customer ID from customer service
    const customerServiceUrl = getRuntimePublicEnv("REACT_APP_API_CUSTOMER_SERVICE_URL");
    if (!customerServiceUrl) {
      setPopupType("server");
      setPopupOpen(true);
      setSubmitting(false);
      return;
    }

    let customerId = "";

    try {
      log.info("Generating customer ID...");
      const customerServiceHeaders = getSyncServiceHeaders({
        "Content-Type": "application/json",
      });
      const response = await fetch(customerServiceUrl, {
        method: "POST",
        headers: customerServiceHeaders,
        body: JSON.stringify({
          firstname: values.firstName,
          lastname: values.lastName,
          mobile: values.mobileNumber,
          email: values.email,
          ipaddress: ipAddress,
          gstno: values.gstNumber,
        }),
      });
      log.info("Customer ID generated successfully");
      const data = await response.json();

      if (data?.success === false) {
        const error: any = new Error(
          data?.message || "CustomerId generation failed"
        );
        error.status = response.status;
        throw error;
      }

      customerId = data?.customerId || data?.data?.customerId;

      if (!customerId) {
        setPopupType("noCustomerId");
        setPopupOpen(true);
        setSubmitting(false);
        return;
      }
    } catch (error: any) {
      log.error("Failed to generate customer ID:", error);
      const statusCode = error.status;

      switch (statusCode) {
        case 400:
          setPopupType("customerIdBadRequest");
          break;

        case 409:
          setPopupType("duplicateGst");
          break;

        case 503:
          setPopupType("serviceUnavailable");
          break;

        default:
          setPopupType("server");
      }

      setPopupOpen(true);
      setSubmitting(false);
      return;
    }

    const [logoBase64, profileBase64] = await Promise.all([
      values.logo ? fileToBase64(values.logo) : Promise.resolve(""),
      values.profilePicture
        ? fileToBase64(values.profilePicture)
        : Promise.resolve(""),
    ]);

    
    const registrationData = {
      username: values.username,
      password: values.password,
      firstName: values.firstName,
      lastName: values.lastName,
      shopName: values.shopName,
      shopAddress: values.shopAddress,
      mobileNumber: values.mobileNumber,
      email: values.email,
      makingCharges: values.makingCharges,
      cgst: values.cgst,
      sgst: values.sgst,
      gstNumber: values.gstNumber,
      panNumber: values.panNumber,
      logo: logoBase64,
      profilePicture: profileBase64,
      customerId: customerId,
    };

    /**
     * STEP 7: Save Registration
     */
    log.info("Saving registration...");
    const registrationResponse = await apiClient.post(
      "/api/registration",
      registrationData
    );

    const userId = registrationResponse.data?.data?.userId || null;

    if (userId) {
      localStorage.setItem("currentUserId", String(userId));
    }

    
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("currentUserRole");

    localStorage.setItem("currentUsername", values.username || "");
    
    if (profileBase64) {
      localStorage.setItem("profileImage", profileBase64);
      window.dispatchEvent(new Event("profileImageUpdated"));
    }

    window.dispatchEvent(new Event("userRoleUpdated"));

    setGeneratedCustomerId(customerId);
    setPopupType("success");
    setPopupOpen(true);
    setSubmitting(false);
    log.info("Registration saved successfully");
    return;
  } catch (error: any) {
    log.error("Failed to save registration:", error);
    setSubmitting(false);

    if (!error.response) {
      setPopupType("server");
      setPopupOpen(true);
      return;
    }

    const errorData = error.response?.data || {};
    const errorType = errorData.errorType;
    const errorMessage =
      errorData.error || errorData.details || "Registration failed";

    switch (errorType) {
      case "DUPLICATE_GST":
        setPopupType("duplicateGst");
        setPopupOpen(true);
        return;

      case "REGISTRATION_EXISTS":
        setPopupType("duplicateCustomer");
        setPopupOpen(true);
        return;

      case "SERVER_ERROR":
        setPopupType("server");
        setPopupOpen(true);
        return;

      default:
        setFieldError("username", errorMessage);
        return;
    }
  } finally {
    registrationSubmitInFlight = false;
  }
};