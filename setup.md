# Chihwa Rentals - Setup Guide

## Prerequisites
- Node.js installed (v18 or later)
- Git installed
- Expo CLI: `npm install -g expo-cli eas-cli`

---

## Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd again
Step 2: Install Dependencies
bash
# Backend
cd backend
npm install

# Mobile
cd ../mobile
npm install

# Web
cd ../web
npm install
Step 3: Set Up Environment Variables
Create a .env file in the backend folder:

env
DATABASE_URL=postgresql://postgres:Wekeza2004@%23@aws-0-us-east-1.pooler.supabase.com:5432/postgres
JWT_SECRET=chihwa-rentals-jwt-secret-key-2026
PORT=4000
Step 4: Run the Project Locally
Open 3 separate terminals:

Terminal 1 — Backend
bash
cd backend
npm start
Should show: Server running on port 4000

Terminal 2 — Mobile (Development)
bash
cd mobile
npx expo start
Scan the QR code with Expo Go app or press a for Android emulator.

Terminal 3 — Web (Development)
bash
cd web
npm start
Opens in browser at http://localhost:3000

Step 5: API URL Configuration
The mobile app API URL is in mobile/src/utils/api.js. Update it when backend is deployed:

javascript
const API_URL = "https://your-backend.onrender.com";
Step 6: Create Accounts
Run the SQL queries below in Supabase SQL Editor (https://supabase.com/dashboard → your project → SQL Editor).

🔵 Create a Landlord
sql
-- 1. Create user login
INSERT INTO public.user_ (id, email, phone, password_hash, role, email_verified, status)
VALUES (
  gen_random_uuid(),
  'landlord@example.com',
  '0600000000',
  '$2b$12$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', -- bcrypt hash of your password
  'landlord',
  true,
  'active'
)
RETURNING id; -- SAVE THIS UUID

-- 2. Create landlord profile (replace UUID from above)
INSERT INTO public.landlord (id, user_id, first_name, last_name, company_name, address_line1, city, province, postal_code, country)
VALUES (
  gen_random_uuid(),
  'UUID-FROM-STEP-1',
  'YourFirstName',
  'YourLastName',
  'Your Company',
  'Your Address',
  'Your City',
  'Your Province',
  0000,
  'South Africa'
);
🟢 Create a Caretaker
sql
-- 1. Create user login
INSERT INTO public.user_ (id, email, phone, password_hash, role, email_verified, status)
VALUES (
  gen_random_uuid(),
  'caretaker@example.com',
  '0710000000',
  '$2b$12$bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', -- bcrypt hash
  'caretaker',
  true,
  'active'
)
RETURNING id; -- SAVE THIS UUID

-- 2. Create caretaker profile
INSERT INTO public.caretaker (id, user_id, landlord_id, first_name, last_name, id_number, address, emergency_contact, hire_date)
VALUES (
  gen_random_uuid(),
  'UUID-FROM-STEP-1',
  'LANDLORD-UUID-HERE',
  'YourFirstName',
  'YourLastName',
  '0000000000000',
  'Your Address',
  '0710000000',
  CURRENT_DATE
);
🟠 Create a Tenant
sql
-- 1. Create user login
INSERT INTO public.user_ (id, email, phone, password_hash, role, email_verified, status)
VALUES (
  gen_random_uuid(),
  'tenant@example.com',
  '0810000000',
  '$2b$12$cccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', -- bcrypt hash
  'tenant',
  true,
  'active'
)
RETURNING id; -- SAVE THIS UUID

-- 2. Create tenant profile
INSERT INTO public.tenant (
  id, user_id, landlord_id, first_name, last_name, date_of_birth, gender,
  nationality, marital_status, id_document_type, id_number,
  employment_status, monthly_income,
  emergency_name, emergency_relationship, emergency_phone,
  number_of_occupants, tenant_since, profile_completed
)
VALUES (
  gen_random_uuid(),
  'UUID-FROM-STEP-1',
  'LANDLORD-UUID-HERE',
  'YourFirstName',
  'YourLastName',
  '2000-01-01',
  'male',
  'South African',
  'single',
  'sa_id',
  '0000000000000',
  'employed',
  15000.00,
  'Contact Name',
  'Relative',
  '0820000000',
  1,
  CURRENT_DATE,
  true
);

-- 3. Optional: Assign a vacant unit to this tenant
UPDATE public.unit 
SET status = 'occupied', current_tenant_id = 'TENANT-UUID-FROM-STEP-2'
WHERE id = (
  SELECT id FROM public.unit WHERE status = 'vacant' LIMIT 1
);

-- 4. Optional: Create a lease
INSERT INTO public.lease (
  id, tenant_id, unit_id, landlord_id,
  lease_start_date, lease_end_date,
  rent_amount, deposit_amount, deposit_paid,
  payment_frequency, payment_due_day,
  status, water_included, created_by
)
SELECT
  gen_random_uuid(),
  'TENANT-UUID-FROM-STEP-2',
  id,
  'LANDLORD-UUID-HERE',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '12 months',
  monthly_rent,
  monthly_rent,
  false,
  'monthly',
  1,
  'active',
  true,
  'LANDLORD-USER-UUID-HERE'
FROM public.unit
WHERE current_tenant_id = 'TENANT-UUID-FROM-STEP-2';
🔐 How to Generate a Password Hash
Use this Node.js script or an online bcrypt generator:

bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YourPassword123', 12));"
Replace 'YourPassword123' with your actual password. Copy the output into the SQL query above.

📝 Quick Reference
Replace This	With
landlord@example.com	Your actual email
0600000000	Your phone number
$2b$12$aaaa...	Your bcrypt password hash
UUID-FROM-STEP-1	The UUID returned by the first INSERT
LANDLORD-UUID-HERE	The landlord's profile UUID
TENANT-UUID-FROM-STEP-2	The tenant's profile UUID
🗄️ Database
We use Supabase (cloud PostgreSQL).

Dashboard: supabase.com/dashboard

Connection string is in the .env file