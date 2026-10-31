import mongoose from "mongoose";

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function notFound(_req, _res, next) {
  next(new HttpError(404, "Not found"));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message || "Internal server error";

  if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
  } else if (err.type === "entity.too.large") {
    status = 413;
    message = "Request body too large";
  }

  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 && status !== 503 ? "Internal server error" : message, details: err.details });
}
