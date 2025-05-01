import { pgTable, serial, varchar, numeric, timestamp, pgEnum, text, boolean } from "drizzle-orm/pg-core";

// Enum for transaction status
export const statusEnum = pgEnum("status", ["awaiting_payment", "payment_received", "transfer_in_progress", "completed", "failed"]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: varchar("clerk_id", { length: 255 }).notNull(), // for Clerk users
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(), // e.g. Nigeria or India
  currency: varchar("currency", { length: 10 }).notNull(), // e.g. NGN or INR
  schoolName: varchar("school_name", { length: 255 }),
  profilePicture: varchar("profile_picture", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 50 }),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  transactionId: varchar("transaction_id", { length: 50 }).notNull(), // unique transaction identifier
  senderId: varchar("sender_id", { length: 255 }).notNull(),
  receiverId: varchar("receiver_id", { length: 255 }).notNull(),
  amountSent: numeric("amount_sent").notNull(),
  amountReceived: numeric("amount_received").notNull(),
  fee: numeric("fee").notNull().default("50"), // 50 Rs flat fee
  fromCurrency: varchar("from_currency", { length: 10 }).notNull(),
  toCurrency: varchar("to_currency", { length: 10 }).notNull(),
  status: statusEnum("status").default("awaiting_payment"),
  receiptUrl: varchar("receipt_url", { length: 255 }),
  paymentScreenshotUrl: varchar("payment_screenshot_url", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Exchange rate table
export const exchangeRates = pgTable("exchange_rates", {
  id: serial("id").primaryKey(),
  fromCurrency: varchar("from_currency", { length: 10 }).notNull(),
  toCurrency: varchar("to_currency", { length: 10 }).notNull(),
  rate: numeric("rate").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin users table
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  transactionId: varchar("transaction_id", { length: 50 }).notNull(),
  senderId: varchar("sender_id", { length: 255 }).notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // e.g. "payment_received", "transfer_complete"
  isRead: boolean("is_read").default(false),
  relatedEntityId: varchar("related_entity_id", { length: 255 }), // e.g. transaction ID
  createdAt: timestamp("created_at").defaultNow(),
});

// Receipts table
export const receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  transactionId: varchar("transaction_id", { length: 50 }).notNull(),
  blobUrl: varchar("blob_url", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
