import { supabase } from '../supabase'
import { logError } from '../../utils/logger'

export const paymentQueries = {
  // Upload payment proof to Supabase Storage
  async uploadPaymentProof(file: File, bookingId: string): Promise<string | null> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${bookingId}-${Date.now()}.${fileExt}`
    // Don't include bucket name in filePath - just the file name or subdirectory
    const filePath = fileName

    const { data, error } = await supabase.storage
      .from('payment-proofs') // Bucket name
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      logError('Error uploading payment proof', error, 'paymentQueries')
      return null
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(filePath)

    return publicUrl
  }
}

