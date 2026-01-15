# Nutrition Tracker - Setup Guide

## Features

✅ **User Authentication** - Secure login/signup with Firebase
✅ **Personal Food Database** - Create and manage your favorite foods
✅ **Daily Tracking** - Log meals and track macros in real-time
✅ **Automatic Calculations** - Real-time protein, carb, and calorie totals
✅ **Persistent Data** - All your foods and logs saved in the cloud
✅ **Responsive Design** - Works on desktop, tablet, and mobile

## Getting Started

### Step 1: Set Up Firebase (Free)

1. Go to **https://console.firebase.google.com**
2. Click **"Create a project"**
3. Enter project name (e.g., "nutrition-tracker")
4. Click **"Continue"**
5. Disable Google Analytics (optional) and create the project
6. Wait for project creation to complete

### Step 2: Configure Firebase

#### Enable Authentication:
1. In Firebase Console, go to **"Build" → "Authentication"**
2. Click **"Get started"**
3. Click on **"Email/Password"**
4. Enable **"Email/Password"** toggle
5. Click **"Save"**

#### Enable Firestore Database:
1. In Firebase Console, go to **"Build" → "Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
4. Select your region (closest to you)
5. Click **"Create"**

#### Get Your Firebase Config:
1. In Firebase Console, click the **Settings icon** (⚙️) at the top
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** (</>) to add a web app
5. Enter app name (e.g., "nutrition-tracker")
6. Copy the `firebaseConfig` object

### Step 3: Add Firebase Config to Your App

1. Open `src/firebase.ts` in your editor
2. Replace the `firebaseConfig` with your actual config:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGE_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

3. Save the file

### Step 4: Start Using the App

1. The dev server should already be running (npm run dev)
2. Open **http://localhost:5173** in your browser
3. Click **"Sign Up"** to create an account
4. Use your email and password

### Step 5: Add Your Favorite Foods

1. Click the **⚙️ Manage Foods** tab
2. Add foods you eat regularly:
   - **Food Name**: e.g., "Chicken Breast"
   - **Protein**: grams per 100g
   - **Carbs**: grams per 100g  
   - **Calories**: calories per 100g

💡 **Tip**: Find nutrition info on Google or sites like MyFitnessPal

### Step 6: Start Logging

1. Click the **📝 Log Food** tab
2. Select a food from your database
3. Enter how many grams you ate
4. Click **"Log Food"**
5. Your daily totals update automatically!

## How It Works

### Adding Foods to Your Database

- Go to **⚙️ Manage Foods** tab
- Fill in the nutrition info for foods you eat regularly
- These are stored in your personal database (only you can see them)
- Macros should be per 100g for accurate tracking

### Logging Meals

- Go to **📝 Log Food** tab
- Select from your pre-created food list
- Enter the grams you ate
- The app automatically calculates the exact macros and calories
- Today's totals update in real-time

### Daily Tracking

- All your logs for today appear in the "Today's Meals" section
- Daily totals (Protein, Carbs, Calories) calculate automatically
- Meals persist even if you close the browser
- Each day starts fresh at midnight

## Example Setup

### Common Foods to Add:

**Chicken Breast (per 100g)**
- Protein: 31g
- Carbs: 0g
- Calories: 165

**Brown Rice (per 100g)**
- Protein: 2.6g
- Carbs: 23g
- Calories: 111

**Broccoli (per 100g)**
- Protein: 2.8g
- Carbs: 7g
- Calories: 34

**Eggs (per 100g)**
- Protein: 13g
- Carbs: 1.1g
- Calories: 155

## Troubleshooting

### "Authentication not working"
- Check your Firebase config is correct in `src/firebase.ts`
- Verify Email/Password auth is enabled in Firebase Console

### "Can't see my foods after logging in"
- Make sure Firestore Database is created and in test mode
- Check browser console for errors (F12 → Console tab)

### "Data not saving"
- Verify Firestore permissions allow test mode access
- Check internet connection
- Try logging out and back in

## Firestore Data Structure

**Foods Collection:**
```
foods/
  ├── {foodId}
  │   ├── userId: (your user ID)
  │   ├── name: "Chicken"
  │   ├── protein: 31
  │   ├── carbs: 0
  │   ├── calories: 165
  │   └── createdAt: timestamp
```

**Daily Logs Collection:**
```
dailyLogs/
  ├── {logId}
  │   ├── userId: (your user ID)
  │   ├── date: "2024-01-13"
  │   ├── foodId: (reference to food)
  │   ├── foodName: "Chicken"
  │   ├── grams: 200
  │   ├── protein: 62 (calculated)
  │   ├── carbs: 0 (calculated)
  │   ├── calories: 330 (calculated)
  │   └── createdAt: timestamp
```

## Firebase Free Tier Limits

- **Authentication**: Unlimited free users
- **Firestore**: 
  - 1 GB storage
  - 50,000 reads/day
  - 20,000 writes/day
  - Perfect for personal use!

## Next Steps (Optional Enhancements)

- Add daily macro targets
- Export weekly/monthly reports
- Add food search/categories
- Meal planning features
- Social sharing

## Need Help?

Check the browser console (F12) for error messages. Most issues are related to:
1. Firebase config not set correctly
2. Firestore permissions in test mode
3. Email/Password auth not enabled

Happy tracking! 🥗💪
