// lib/storage/upload-utils.ts

import { SupabaseClient } from '@supabase/supabase-js'

export async function uploadMaterialToStorage(
    supabase: SupabaseClient,
    fileData: {
      name: string,
      type: string,
      buffer: number[]
    },
    sessionId: string
  ): Promise<{url: string, error: Error | null}> {
    try {
      const uint8Array = new Uint8Array(fileData.buffer)
      const fileExt = fileData.name.split('.').pop()
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `materials/${sessionId}/${uniqueFileName}`
  
      const { error: uploadError } = await supabase
        .storage
        .from('class-materials')
        .upload(filePath, uint8Array, {
          contentType: fileData.type,
          cacheControl: '3600'
        })
  
      if (uploadError) throw uploadError
  
      const { data: { publicUrl } } = supabase
        .storage
        .from('class-materials')
        .getPublicUrl(filePath)
  
      return { url: publicUrl, error: null }
    } catch (error) {
      return { url: '', error: error as Error }
    }
  }

export async function deleteMaterialFromStorage(
  supabase: SupabaseClient,
  url: string
): Promise<{error: Error | null}> {
  // const path = url.split('/').slice(-2).join('/')
  const path = url.split('/storage/v1/object/public/class-materials/')[1];

  // console.log('-------------------------deleting-----------',path)
  
  const { error } = await supabase
    .storage
    .from('class-materials')
    .remove([path])

  return { error }
}

export async function getFileBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }