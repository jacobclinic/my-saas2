// lib/storage/upload-utils.ts

import { SupabaseClient } from '@supabase/supabase-js';

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
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
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
  try {
    const uint8Array = new Uint8Array(fileData.buffer);
    const fileExt = fileData.name.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `payment-slips/${studentId}/${paymentPeriod}/${uniqueFileName}`;

    // console.log('-----uploadPaymentSlip-----1--filePath:', filePath);

    const { error: uploadError } = await supabase.storage
      .from('payment-slips')
      .upload(filePath, uint8Array, {
        contentType: fileData.type,
        cacheControl: '3600',
      });

    if (uploadError) throw uploadError;

    // console.log('-----uploadPaymentSlip-----2--uploadError:', uploadError);

    const {
      data: { publicUrl },
    } = supabase.storage.from('payment-slips').getPublicUrl(filePath);

    // console.log('-----uploadPaymentSlip-----3--publicUrl:', publicUrl);

    return { url: publicUrl, error: null };
  } catch (error) {
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
