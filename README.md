![FinTrack Logo](https://i.imgur.com/F0arIqX.png)

> **Live Demo:** [fintrack-ten-alpha.vercel.app/login.html](https://fintrack-ten-alpha.vercel.app/login.html)

## **Preview**

| Login Page | Main Dashboard |
| :---: | :---: |
| <img src="https://i.imgur.com/MFK0tdW.png" width="400" /> | <img src="https://i.imgur.com/a16ztk0.png" width="400" /> |

## **Overview**
FinTrack is a secure, serverless financial dashboard designed for users who value simplicity and privacy. Built with a focus on security, it leverages modern database patterns to ensure complete data isolation for every user. Helps tracking financial activities, providing insights into your spending and saving patterns. 

## **Security Architecture**
Unlike traditional applications that filter data in the frontend, FinTrack enforces security at the **database level**.

## **Row Level Security (RLS)**
Every row in the `transactions` table is protected by a PostgreSQL policy:

```sql
auth.uid() = user_id
```

This guarantees users can only read, write, or delete their **own** records — even if the frontend were bypassed entirely.

### **Identity Management**
Authentication is handled exclusively via **Google OAuth 2.0**, eliminating local password storage and reducing the attack surface. Session tokens are managed by Supabase's secure client library.

---

## **Features**

- **Personalized Dashboard** — Real-time welcome message and session management
- **Transaction Logger** — Log income and expenses with date, description, amount, and category
- **Dynamic Visuals** — Automatic donut and bar chart updates via `renderAll()` logic
- **Category Breakdown** — Visual spending breakdown with percentage bars
- **Trend Analysis** — Cumulative net balance and monthly savings rate charts
- **Multi-User Isolation** — Completely private data silos for every unique Google login
- **Responsive Design** — Optimized for both desktop and mobile users

---

## 1. **Getting Started**
To get started with FinTrack, follow the installation instructions below:

1. Clone the repository:
   ```bash
   git clone https://github.com/Jayvie119/fintrack
   ```
2. Navigate to the project directory:
   ```bash
   cd fintrack
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Run the application:
   ```bash
   npm start
   ```

## 2. **Configure Supabase**



Create a `js/supabase.js` file and initialize your client:

```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_ANON_KEY';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);
```
> You can find these values in your Supabase project under **Settings → API**.


## 3. **Set up the database schema**

Run the following in your **Supabase SQL Editor**:

```sql
-- Create transactions table
CREATE TABLE transactions (
  id          bigint      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id     uuid        REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  date        date        NOT NULL,
  description text        NOT NULL,
  amount      float8      NOT NULL,
  category    text        NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- Enable Row Level Security

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- Policy: users can only access their own rows

CREATE POLICY "Users can manage their own transactions"
  ON transactions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```



## 4. **Enable Google OAuth in Supabase**



1. Go to **Authentication → Providers → Google** in your Supabase dashboard

2. Enable the provider and paste in your Google OAuth **Client ID** and **Client Secret**

3. Add `https://your-project.supabase.co/auth/v1/callback` to your Google Cloud Console's **Authorized redirect URIs**



## 5. **Launch**

Open `login.html` with a Live Server (e.g. the VS Code Live Server extension).


## 👤 **Author**

**Jayvie Lorenz G. Enorme**  
BS Computer Science 2-3 

Polytechnic University of the Philippines



---

All rights reserved © 2025 Jayvie Lorenz G. Enorme.
