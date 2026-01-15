import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export interface Food {
  id: string;
  name: string;
  protein: number;
  carbs: number;
  calories: number;
  servingSize: number; // grams or ml per serving
  userId: string;
  createdAt: Date;
}

export interface DailyLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  foodId: string;
  foodName: string;
  servings: number;
  grams: number;
  protein: number;
  carbs: number;
  calories: number;
  createdAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  gender: 'male' | 'female';
  height: number; // in cm
  weight: number; // in kg
  lastWeightUpdate?: Date; // when weight was last updated
  createdAt: Date;
  updatedAt: Date;
}

// Add a new food to user's food list
export const addFood = async (
  userId: string,
  name: string,
  protein: number,
  carbs: number,
  calories: number,
  servingSize: number = 100
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'foods'), {
      userId,
      name,
      protein,
      carbs,
      calories,
      servingSize,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding food:', error);
    throw error;
  }
};

// Get all foods for a user
export const getUserFoods = async (userId: string): Promise<Food[]> => {
  try {
    const q = query(collection(db, 'foods'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    } as Food));
  } catch (error) {
    console.error('Error getting foods:', error);
    throw error;
  }
};

// Delete a food
export const deleteFood = async (foodId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'foods', foodId));
  } catch (error) {
    console.error('Error deleting food:', error);
    throw error;
  }
};

// Helper function to get today's date in local timezone
const getTodayDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Log food consumption
export const logFoodConsumption = async (
  userId: string,
  foodId: string,
  foodName: string,
  servings: number,
  protein: number,
  carbs: number,
  calories: number,
  servingSize: number = 100
): Promise<string> => {
  try {
    const today = getTodayDate();
    const totalGrams = servings * servingSize;
    const docRef = await addDoc(collection(db, 'dailyLogs'), {
      userId,
      date: today,
      foodId,
      foodName,
      servings,
      grams: totalGrams,
      protein: protein * servings,
      carbs: carbs * servings,
      calories: calories * servings,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error logging food:', error);
    throw error;
  }
};

// Get today's logs
export const getTodayLogs = async (userId: string): Promise<DailyLog[]> => {
  try {
    const today = getTodayDate();
    const q = query(
      collection(db, 'dailyLogs'),
      where('userId', '==', userId),
      where('date', '==', today)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    } as DailyLog));
  } catch (error) {
    console.error('Error getting today logs:', error);
    throw error;
  }
};

// Delete a log entry
export const deleteLogEntry = async (logId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'dailyLogs', logId));
  } catch (error) {
    console.error('Error deleting log entry:', error);
    throw error;
  }
};

// Save or update user profile
export const saveUserProfile = async (
  userId: string,
  gender: 'male' | 'female',
  height: number,
  weight: number
): Promise<string> => {
  try {
    // Check if profile exists
    const q = query(collection(db, 'profiles'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const now = Timestamp.now();
    const profileData = {
      userId,
      gender,
      height,
      weight,
      lastWeightUpdate: now, // Always update this when saving profile
      createdAt: now,
      updatedAt: now,
    };
    
    if (!querySnapshot.empty) {
      // Update existing profile
      const profileDoc = querySnapshot.docs[0];
      const existingData = profileDoc.data();
      
      // Only update lastWeightUpdate if weight actually changed
      const weightChanged = existingData.weight !== weight;
      
      await updateDoc(doc(db, 'profiles', profileDoc.id), {
        ...profileData,
        createdAt: existingData.createdAt,
        lastWeightUpdate: weightChanged ? now : existingData.lastWeightUpdate || now,
      });
      return profileDoc.id;
    } else {
      // Create new profile
      const docRef = await addDoc(collection(db, 'profiles'), profileData);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const q = query(collection(db, 'profiles'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    } as UserProfile;
  } catch (error) {
    console.error('Error getting profile:', error);
    throw error;
  }
};
