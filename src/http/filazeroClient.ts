import axios from "axios";
import { config } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { FilazeroBusinessError, getBusinessErrorDescription } from "../utils/errors.js";

export const filazeroClient = axios.create({
  baseURL: config.apiUrl,
  headers: {
    Accept: "application/json, text/plain, */*",
    Origin: config.appOrigin,
    Referer: config.appOrigin + "/",
    "User-Agent": "MCP-Server-FilaZero/1.0",
    DNT: "1",
  },
});

export const writeHeaders = {
  "Content-Type": "application/json;charset=UTF-8",
} as const;

filazeroClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const description = getBusinessErrorDescription(error.response?.data);

      logger.error("Filazero API request failed", {
        url: error.config?.url,
        status: error.response?.status,
        description,
      });

      if (description) {
        return Promise.reject(new FilazeroBusinessError(description));
      }
    }

    return Promise.reject(error);
  },
);
