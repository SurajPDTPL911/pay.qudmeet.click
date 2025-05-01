import { nanoid } from 'nanoid';
import { db } from './db';
import { transactions, exchangeRates, users } from './schema';
import { eq, desc, and } from 'drizzle-orm';
import { getIO, getTransactionChannelName, SocketEvents } from './socketClient.js';
import { BlobType, generateReceipt, uploadBlob } from './blob';
import { NotificationType, createNotification } from './notifications';

// Fee amount in Rupees
const TRANSACTION_FEE = 50;

export enum TransactionType {
  NAIRA_TO_RUPEES = 'naira-to-rupees',
  RUPEES_TO_NAIRA = 'rupees-to-naira',
}

interface ReceiverInfo {
  name: string;
  accountNumber: string;
  bankName: string;
  phoneNumber: string;
}

interface CreateTransactionParams {
  senderId: string;
  amountSent: number;
  type: TransactionType;
  screenshot?: File;
  receiverInfo: ReceiverInfo;
}

interface UpdateTransactionStatusParams {
  transactionId: string;
  status: 'awaiting_payment' | 'payment_received' | 'transfer_in_progress' | 'completed' | 'failed';
  adminId?: string;
}

// Get current exchange rate
export async function getCurrentExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  const [rate] = await db
    .select()
    .from(exchangeRates)
    .where(
      and(
        eq(exchangeRates.fromCurrency, fromCurrency),
        eq(exchangeRates.toCurrency, toCurrency)
      )
    )
    .orderBy(desc(exchangeRates.updatedAt))
    .limit(1);

  if (!rate) {
    // Default exchange rates if none is found
    if (fromCurrency === 'NGN' && toCurrency === 'INR') {
      return 0.34; // Sample rate: 1 NGN = 0.34 INR
    } else if (fromCurrency === 'INR' && toCurrency === 'NGN') {
      return 2.94; // Sample rate: 1 INR = 2.94 NGN
    }
    return 1; // Fallback
  }

  return parseFloat(rate.rate.toString());
}

// Create a new transaction
export async function createTransaction(params: CreateTransactionParams): Promise<any> {
  const { senderId, amountSent, type, screenshot, receiverInfo } = params;

  try {
    // Generate unique transaction ID
    const uniqueTransactionId = nanoid(10);

    // Calculate currencies based on type
    const fromCurrency = type === TransactionType.NAIRA_TO_RUPEES ? 'NGN' : 'INR';
    const toCurrency = type === TransactionType.NAIRA_TO_RUPEES ? 'INR' : 'NGN';

    // Get current exchange rate
    const rate = await getCurrentExchangeRate(fromCurrency, toCurrency);

    // Calculate amount received after fee
    const amountReceivedRaw = amountSent * rate;
    const amountReceived = type === TransactionType.NAIRA_TO_RUPEES
      ? amountReceivedRaw - TRANSACTION_FEE
      : amountReceivedRaw - (TRANSACTION_FEE / rate); // Convert fee to Naira

    // Upload screenshot if provided
    let screenshotUrl = '';
    if (screenshot) {
      screenshotUrl = await uploadBlob(screenshot, BlobType.PAYMENT_SCREENSHOT);
    }

    // Insert transaction into database
    const [transaction] = await db.insert(transactions).values({
      transactionId: uniqueTransactionId,
      senderId,
      receiverId: 'PENDING', // Will be assigned later
      amountSent: amountSent.toString(),
      amountReceived: amountReceived.toString(),
      fee: TRANSACTION_FEE.toString(),
      fromCurrency,
      toCurrency,
      status: 'awaiting_payment',
      paymentScreenshotUrl: screenshotUrl,
      // Add receiver information
      receiverName: receiverInfo.name,
      receiverAccountNumber: receiverInfo.accountNumber,
      receiverBankName: receiverInfo.bankName,
      receiverPhoneNumber: receiverInfo.phoneNumber,
    }).returning();

    // If screenshot was uploaded, update transaction status
    if (screenshotUrl) {
      await updateTransactionStatus({
        transactionId: uniqueTransactionId,
        status: 'payment_received',
      });

      // Create notification for sender
      await createNotification(senderId, {
        title: 'Payment Received',
        message: `We have received your payment of ${amountSent} ${fromCurrency}. We are processing your transaction now.`,
        type: NotificationType.PAYMENT_RECEIVED,
        relatedEntityId: uniqueTransactionId,
      });
    }

    return transaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw new Error('Failed to create transaction');
  }
}

// Update transaction status
export async function updateTransactionStatus(params: UpdateTransactionStatusParams): Promise<boolean> {
  const { transactionId, status, adminId } = params;

  try {
    // Get transaction
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.transactionId, transactionId))
      .limit(1);

    if (!transaction) {
      return false;
    }

    // Update status
    await db.update(transactions)
      .set({
        status,
        ...(status === 'completed' ? { completedAt: new Date() } : {}),
      })
      .where(eq(transactions.transactionId, transactionId));

    // Send real-time update via Socket.io
    // In serverless environment, we can't use Socket.io directly
    // This is handled by the API route instead
    try {
      const roomName = getTransactionChannelName(transactionId);

      // Log the transaction update for debugging
      console.log(`[Socket] Sending transaction update to room ${roomName}:`, {
        transactionId,
        status,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error with Socket.io transaction update:', error);
      // Continue execution even if Socket.io fails
    }

    // Create notifications based on status
    if (status === 'payment_received') {
      // Notify sender
      await createNotification(transaction.senderId, {
        title: 'Payment Confirmed',
        message: `Your payment of ${transaction.amountSent} ${transaction.fromCurrency} has been confirmed. We are processing your transaction.`,
        type: NotificationType.PAYMENT_RECEIVED,
        relatedEntityId: transactionId,
      });
    } else if (status === 'transfer_in_progress') {
      // Notify sender
      await createNotification(transaction.senderId, {
        title: 'Transfer in Progress',
        message: `We are transferring ${transaction.amountReceived} ${transaction.toCurrency} to your recipient.`,
        type: NotificationType.PAYMENT_SENT,
        relatedEntityId: transactionId,
      });
    } else if (status === 'completed') {
      // Generate receipt
      const receiptUrl = await generateReceipt(transactionId, {
        transactionId,
        amountSent: transaction.amountSent,
        amountReceived: transaction.amountReceived,
        fromCurrency: transaction.fromCurrency,
        toCurrency: transaction.toCurrency,
        fee: transaction.fee,
        date: new Date(),
        status: 'completed',
      });

      // Update transaction with receipt URL
      await db.update(transactions)
        .set({ receiptUrl })
        .where(eq(transactions.transactionId, transactionId));

      // Notify sender
      await createNotification(transaction.senderId, {
        title: 'Transaction Completed',
        message: `Your transaction has been completed. Your receipt is ready.`,
        type: NotificationType.TRANSACTION_COMPLETED,
        relatedEntityId: transactionId,
      });

      // Notify sender about receipt
      await createNotification(transaction.senderId, {
        title: 'Receipt Ready',
        message: `Your receipt for transaction ${transactionId} is ready. You can download it from the transaction details page.`,
        type: NotificationType.RECEIPT_READY,
        relatedEntityId: transactionId,
      });

      // Notify receiver if exists
      if (transaction.receiverId !== 'PENDING') {
        await createNotification(transaction.receiverId, {
          title: 'Payment Received',
          message: `You have received ${transaction.amountReceived} ${transaction.toCurrency}.`,
          type: NotificationType.PAYMENT_RECEIVED,
          relatedEntityId: transactionId,
        });
      }
    } else if (status === 'failed') {
      // Notify sender
      await createNotification(transaction.senderId, {
        title: 'Transaction Failed',
        message: `Your transaction has failed. Please contact support for assistance.`,
        type: NotificationType.TRANSACTION_FAILED,
        relatedEntityId: transactionId,
      });
    }

    return true;
  } catch (error) {
    console.error('Error updating transaction status:', error);
    return false;
  }
}

// Get user transactions
export async function getUserTransactions(userId: string, limit: number = 20): Promise<any[]> {
  try {
    const userTransactions = await db.select()
      .from(transactions)
      .where(
        eq(transactions.senderId, userId)
      )
      .orderBy(desc(transactions.createdAt))
      .limit(limit);

    return userTransactions;
  } catch (error) {
    console.error('Error getting user transactions:', error);
    return [];
  }
}

// Get transaction by ID
export async function getTransactionById(transactionId: string): Promise<any> {
  try {
    const [transaction] = await db.select()
      .from(transactions)
      .where(eq(transactions.transactionId, transactionId))
      .limit(1);

    return transaction;
  } catch (error) {
    console.error('Error getting transaction:', error);
    return null;
  }
}

// Match a transaction with a receiver
export async function matchTransaction(transactionId: string, receiverId: string): Promise<boolean> {
  try {
    await db.update(transactions)
      .set({ receiverId })
      .where(eq(transactions.transactionId, transactionId));

    return true;
  } catch (error) {
    console.error('Error matching transaction:', error);
    return false;
  }
}

// Update exchange rate
export async function updateExchangeRate(fromCurrency: string, toCurrency: string, rate: number): Promise<boolean> {
  try {
    await db.insert(exchangeRates).values({
      fromCurrency,
      toCurrency,
      rate: rate.toString(),
    });

    return true;
  } catch (error) {
    console.error('Error updating exchange rate:', error);
    return false;
  }
}