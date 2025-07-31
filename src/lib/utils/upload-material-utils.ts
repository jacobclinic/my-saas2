// lib/storage/upload-utils.ts

import { SupabaseClient } from '@supabase/supabase-js';
import getLogger from '~/core/logger';

export async function uploadMaterialToStorage(
  supabase: SupabaseClient,
  fileData: {
    name: string;
    type: string;
    buffer: number[];
  },
  sessionId: string,
): Promise<{ url: string; error: Error | null }> {
  try {
    const uint8Array = new Uint8Array(fileData.buffer);
    const fileExt = fileData.name.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `materials/${sessionId}/${uniqueFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('class-materials')
      .upload(filePath, uint8Array, {
        contentType: fileData.type,
        cacheControl: '3600',
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from('class-materials').getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (error) {
    return { url: '', error: error as Error };
  }
}

export async function deleteMaterialFromStorage(
  supabase: SupabaseClient,
  url: string,
): Promise<{ error: Error | null }> {
  // const path = url.split('/').slice(-2).join('/')
  const path = url.split('/storage/v1/object/public/class-materials/')[1];

  // console.log('-------------------------deleting-----------',path)

  const { error } = await supabase.storage
    .from('class-materials')
    .remove([path]);

  return { error };
}

export async function getFileBuffer(file: File): Promise<ArrayBuffer> {
  const logger = getLogger();
  const bufferId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

  logger.info('[getFileBuffer] Starting file buffer conversion', {
    bufferId,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as ArrayBuffer;
      logger.info(
        '[getFileBuffer] File buffer conversion completed successfully',
        {
          bufferId,
          bufferSize: result.byteLength,
        },
      );
      resolve(result);
    };

    reader.onerror = (error) => {
      logger.error('[getFileBuffer] File buffer conversion failed', {
        bufferId,
        error: error?.toString() || 'Unknown FileReader error',
      });
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
}

export async function uploadPaymentSlip(
  supabase: SupabaseClient,
  fileData: {
    name: string;
    type: string;
    buffer: number[];
  },
  studentId: string,
  classId: string,
  paymentPeriod: string,
): Promise<{ url: string; error: Error | null }> {
  const logger = getLogger();
  const uploadId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

  logger.info('[uploadPaymentSlip] Starting payment slip storage upload', {
    uploadId,
    fileName: fileData.name,
    fileType: fileData.type,
    bufferLength: fileData.buffer.length,
    studentId,
    classId,
    paymentPeriod,
  });

  try {
    const uint8Array = new Uint8Array(fileData.buffer);
    const fileExt = fileData.name.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `payment-slips/${studentId}/${paymentPeriod}/${uniqueFileName}`;

    logger.info('[uploadPaymentSlip] File path generated', {
      uploadId,
      filePath,
      fileExtension: fileExt,
      uniqueFileName,
    });

    logger.info('[uploadPaymentSlip] Uploading to Supabase storage', {
      uploadId,
      bucket: 'payment-slips',
      filePath,
      contentType: fileData.type,
    });

    const { error: uploadError } = await supabase.storage
      .from('payment-slips')
      .upload(filePath, uint8Array, {
        contentType: fileData.type,
        cacheControl: '3600',
      });

    if (uploadError) {
      logger.error('[uploadPaymentSlip] Supabase storage upload failed', {
        uploadId,
        error: uploadError.message,
        name: uploadError.name,
      });
      throw uploadError;
    }

    logger.info('[uploadPaymentSlip] File uploaded to storage successfully', {
      uploadId,
      filePath,
    });

    const {
      data: { publicUrl },
    } = supabase.storage.from('payment-slips').getPublicUrl(filePath);

    logger.info('[uploadPaymentSlip] Public URL generated successfully', {
      uploadId,
      publicUrl,
    });

    return { url: publicUrl, error: null };
  } catch (error) {
    logger.error('[uploadPaymentSlip] Upload failed with error', {
      uploadId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return { url: '', error: error as Error };
  }
}

export async function uploadTutorPaymentSlip(
  supabase: SupabaseClient,
  fileData: {
    name: string;
    type: string;
    buffer: number[];
  },
  tutorId: string,
  classId: string,
  paymentPeriod: string,
): Promise<{ url: string; error: Error | null }> {
  try {
    const uint8Array = new Uint8Array(fileData.buffer);
    const fileExt = fileData.name.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `tutor-payment-slips/${tutorId}/${paymentPeriod}/${uniqueFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('payment-slips')
      .upload(filePath, uint8Array, {
        contentType: fileData.type,
        cacheControl: '3600',
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from('payment-slips').getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (error) {
    return { url: '', error: error as Error };
  }
}

export async function uploadIdentityProof(
  supabase: SupabaseClient,
  fileData: {
    name: string;
    type: string;
    buffer: number[];
  },
  userId: string,
): Promise<{ url: string; error: Error | null }> {
  try {
    const uint8Array = new Uint8Array(fileData.buffer);
    const fileExt = fileData.name.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `identity-proof/${userId}/${uniqueFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('identity-proof')
      .upload(filePath, uint8Array, {
        contentType: fileData.type,
        cacheControl: '3600',
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from('identity-proof').getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (error) {
    return { url: '', error: error as Error };
  }
}
