'use server';

import { revalidatePath } from 'next/cache';
import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { uploadPaymentSlip } from '../utils/upload-material-utils';
import { PAYMENT_STATUS } from './constant';


export const uploadPaymentSlipAction = withSession(
    async ({ 
      studentId,
      classId,
      paymentPeriod,
      file: {
        name,
        type,
        size,
        buffer
      },
      csrfToken 
    }: {
      studentId: string,
      classId: string,
      paymentPeriod: string,
      file: {
        name: string,
        type: string,
        size: number,
        buffer: number[]
      },
      csrfToken: string
    }) => {
      const client = getSupabaseServerActionClient()
  
      try {
        const { url, error } = await uploadPaymentSlip(client, {
          name,
          type,
          buffer
        }, studentId, classId, paymentPeriod)
  
        if (error) throw error
  
        // Update payment status in database
        const { error: dbError } = await client
          .from('student_payments')
          .insert({
            student_id: studentId,
            class_id: classId,
            payment_proof_url: url,
            payment_period: paymentPeriod,
            status: PAYMENT_STATUS.PENDING_VERIFICATION
          })
  
        if (dbError) throw dbError
  
        revalidatePath('/dashboard')
        return { success: true, url }
      } catch (error: any) {
        console.error('Server error:', error)
        return { success: false, error: error.message }
      }
    }
  )