import { Database } from "~/database.types";

export type DBZoomCustomerKeyMapping = Database["public"]["Tables"]["zoom_customer_key_mapping"]["Row"];
export type DBStudentSessionAttendance = Database["public"]["Tables"]["student_session_attendance"]["Row"];
export type SessionUserMapping = Omit<DBZoomCustomerKeyMapping, "customer_key" | "id" | "created_at"> & {
    user_email: string | null;
}

export interface GenerateZoomCustomerKeyMappingParams {
    sessionId: string;
    csrfToken: string;
}

export interface GenerateZoomCustomerKeyMappingResponse {
    success: boolean;
    message?: string;
    customerKey?: string;
    error?: {
        code: string;
        message: string;
    };
}

export const generateZoomCustomerKeyMappingSuccess = (customerKey: string): GenerateZoomCustomerKeyMappingResponse => ({
    success: true,
    customerKey,
});

export const generateZoomCustomerKeyMappingFailure = (message: string, code: string): GenerateZoomCustomerKeyMappingResponse => ({
    success: false,
    error: {
        code,
        message,
    },
});




// Note: Webhook payload types are now centralized in zoom/v2/types.ts
// Mark attendance is handled directly by the service layer with Result<T, E> pattern
