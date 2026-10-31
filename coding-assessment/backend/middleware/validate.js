import mongoose from "mongoose";
import { config } from "../config/env.js";
import { isSupportedLanguage, LANGUAGE_KEYS } from "../config/languages.js";
import { HttpError } from "./errorHandler.js";

export function assertObjectId(value, name) {
  if (!mongoose.isValidObjectId(value)) throw new HttpError(400, `Invalid ${name}`);
}

export function assertLanguage(language) {
  if (!isSupportedLanguage(language)) {
    throw new HttpError(400, `language must be one of: ${LANGUAGE_KEYS.join(", ")}`);
  }
}

export function assertSource(sourceCode) {
  if (typeof sourceCode !== "string" || sourceCode.trim() === "") {
    throw new HttpError(400, "sourceCode is required");
  }
  if (Buffer.byteLength(sourceCode, "utf8") > config.limits.maxSourceBytes) {
    throw new HttpError(413, `sourceCode exceeds ${config.limits.maxSourceBytes} bytes`);
  }
}

export function assertStdin(stdin) {
  if (stdin == null) return;
  if (typeof stdin !== "string") throw new HttpError(400, "stdin must be a string");
  if (Buffer.byteLength(stdin, "utf8") > config.limits.maxStdinBytes) {
    throw new HttpError(413, `stdin exceeds ${config.limits.maxStdinBytes} bytes`);
  }
}
