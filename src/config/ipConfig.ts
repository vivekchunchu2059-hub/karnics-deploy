import log from '../utils/logger';

export const getClientIpAddress = async (): Promise<string> => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      log.info(" Client Public IP:",data.ip);
      return data.ip;
    } catch (error) {
      log.error("Failed to fetch IP address", error);
      return "";
    }
  };