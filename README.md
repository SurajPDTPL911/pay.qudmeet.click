# Pay.Qudmeet

A secure currency exchange platform for students, facilitating transactions between Nigerian Naira and Indian Rupees.

## Features

- 🔐 **Trusted Middleman**: Secure, transparent money transfers between Nigeria and India
- 📈 **Real-time Exchange Rates**: Daily updated rates with complete transparency
- 💬 **In-app Chat**: Direct communication with the other party in the transaction
- 📱 **Status Tracking**: Full visibility into transaction progress
- 🧠 **AI Assistant**: 24/7 support for common questions
- 📄 **Transaction Receipts**: Downloadable proof of all transactions
- 🔔 **Real-time Notifications**: Stay updated on all transaction activities

## Technology Stack

- **Frontend**: Next.js 14 with App Router
- **Backend**: Next.js Server Actions + API Routes
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Clerk
- **File Storage**: Vercel Blob
- **AI Assistant**: Google Gemini AI
- **Real-time Chat**: Socket.io
- **Email Notifications**: Resend

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or a NeonDB account)
- Clerk account for authentication
- Vercel account (for Blob storage)
- No external real-time service needed (Socket.io is included)
- Google AI API key for the AI assistant
- Resend account for emails

### Environment Setup

Create a `.env` file with the following variables:

```
# Database
DATABASE_URL=

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=

# No additional configuration needed for Socket.io
# It works out of the box with the custom server

# Resend for email notifications
RESEND_API_KEY=
FROM_EMAIL=notifications@pay.qudmeet.click

# Google Generative AI for chatbot
GOOGLE_AI_API_KEY=
```

### Installation

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:migrate` - Run database migrations

## Core Flows

1. **User Registration**:
   - Sign up with email/phone
   - Complete profile with currency preferences

2. **Currency Exchange**:
   - Initiate exchange
   - Upload payment proof
   - Chat with counterparty
   - Receive confirmation
   - Download receipt

3. **Admin Operations**:
   - Approve/reject transactions
   - Update exchange rates
   - Manage users

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
