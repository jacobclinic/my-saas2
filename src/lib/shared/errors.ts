import { ErrorCodes } from "./error-codes";

export class AppError extends Error {
    constructor(message: string, public code: string) {
        super(message);
    }
}

export class HttpError extends AppError {
    statusCode: number;
    constructor(message: string, code: string, statusCode: number) {
        super(message, code);
        this.statusCode = statusCode;
    }
}

export class ZoomError extends AppError {
    constructor(message: string) {
        super(message, ErrorCodes.ZOOM_ERROR);
    }
}

export class DatabaseError extends AppError {
    constructor(message: string) {
        super(message, ErrorCodes.DATABASE_ERROR);
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, ErrorCodes.VALIDATION_ERROR);
    }
}

export class ServiceError extends AppError {
    constructor(message: string) {
        super(message, ErrorCodes.SERVICE_LEVEL_ERROR);
    }
}
