// lib/blob.ts
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

export enum BlobType {
  RECEIPT = 'receipt',
  PAYMENT_SCREENSHOT = 'payment',
  PROFILE_PICTURE = 'profile',
}

export async function uploadBlob(file: File, type: BlobType = BlobType.PAYMENT_SCREENSHOT): Promise<string> {
  // Generate a unique filename with proper extension
  const fileExtension = file.name.split('.').pop() || 'png';
  const uniqueFilename = `${type}_${nanoid(10)}.${fileExtension}`;
  
  // `put` returns { url }
  const { url } = await put(uniqueFilename, file, {
    access: 'public',
  });
  return url;
}

export async function generateReceipt(transactionId: string, data: any): Promise<string> {
  // This is a placeholder for a real receipt generation
  // In a real implementation, you would generate a PDF or HTML receipt
  // For now, we're just creating a JSON file
  const receiptData = JSON.stringify(data, null, 2);
  const blob = new Blob([receiptData], { type: 'application/json' });
  const file = new File([blob], `receipt_${transactionId}.json`);
  
  return await uploadBlob(file, BlobType.RECEIPT);
}
