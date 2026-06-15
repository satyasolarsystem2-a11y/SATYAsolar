# Satya Solar CRM System

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Edge-3ECF8E.svg?logo=supabase)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-F38020.svg?logo=cloudflare)

An enterprise-grade Customer Relationship Management (CRM) platform custom-built for **RBSC Solar**. This comprehensive system handles the end-to-end workflow of solar installations—from initial lead capture and quotation generation to dispatch, installation, and financial tracking.

---

## 🌟 Key Features

- **Dynamic Case Management:** Intelligent workflows that adapt based on the customer's occupation (Salaried, Pensioner, Business Owner) and dictate required documentation.
- **Automated Quotations:** Instantly generates professional PDF quotations based on selected hardware (panels, inverters, battery configurations) and automatically dispatches them to customers via email.
- **Financial Tracking:** Dedicated ledgers for tracking loan approvals, cash payments, EMIs, subsidies, and down payments.
- **Inventory & Dispatch Control:** Track stock levels for solar panels, inverters, and BOS components. Streamlines B2B and B2C dispatch processes.
- **Real-Time Audit Logs:** Detailed stage history and timeline tracking for every case to ensure internal transparency across departments.
- **Cloud Document Storage:** Secure and scalable customer document management powered by Supabase Storage.
- **Customer Portal:** Secure tracking and quotation approval portal for end-customers.

---

## 🛠️ Architecture & Technology Stack

The application uses a modern decoupled architecture:

### Frontend (Client-Side)
- **Framework:** React.js (v19) 
- **Styling:** Tailwind CSS
- **Routing:** React Router v7
- **Icons & UI:** Lucide React, React Hot Toast
- **Hosting:** Cloudflare Pages (Global Edge CDN)

### Backend & Database
- **Database:** Supabase (PostgreSQL) with Row Level Security (RLS)
- **Backend Logic:** Supabase Edge Functions (Deno/TypeScript) 
- **File Storage:** Supabase Storage buckets
- **Email Service:** Brevo API integration

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase CLI (for local backend development)

### 1. Clone & Install
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install
```

### 2. Environment Variables
Create a `.env` file in the `frontend/` directory with the following keys:
```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Start Development Server
```bash
npm start
```
The application will launch at `http://localhost:3000`.

---

## 📦 Deployment

This project is configured for seamless deployment to **Cloudflare Pages**.

1. Connect your GitHub repository to Cloudflare Pages.
2. Set the **Root directory** to `frontend`.
3. Set the **Build command** to `npm run build`.
4. Set the **Build output directory** to `build`.
5. Add your `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` as environment variables in the Cloudflare dashboard.

### Deploying Backend Functions
To deploy updates to the backend workflows, use the Supabase CLI:
```bash
supabase functions deploy workflow
supabase functions deploy quotation
supabase functions deploy admin
```

---

## 👨‍💻 Authorship & Maintenance

Architected, Developed, and Maintained by **Nikhil Tiwari**.

For technical queries, maintenance, or feature requests, please refer to the technical handover documentation.

---
*© 2026 RBSC Solar. All rights reserved.*
