import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { AuthComponent } from './Auth';
import {
  addFood,
  getUserFoods,
  deleteFood,
  logFoodConsumption,
  getTodayLogs,
  deleteLogEntry,
  saveUserProfile,
  getUserProfile,
  Food,
  DailyLog,
  UserProfile,
} from './firebaseService';
import './App.css';

interface FoodItem extends Food {}

interface LogItem extends DailyLog {}

function App() {
  const [user, setUser] = useState<any>(null);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [todayLogs, setTodayLogs] = useState<LogItem[]>([]);
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [servings, setServings] = useState('1');
  const [inputGrams, setInputGrams] = useState('');
  const [foodName, setFoodName] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [calories, setCalories] = useState('');
  const [servingSize, setServingSize] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'log' | 'manage' | 'profile'>('log');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileGender, setProfileGender] = useState<'male' | 'female'>('male');
  const [profileHeight, setProfileHeight] = useState('');
  const [profileWeight, setProfileWeight] = useState('');
  const [showWeightUpdateModal, setShowWeightUpdateModal] = useState(false);
  const [modalWeight, setModalWeight] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Load foods and today's logs when user changes
  useEffect(() => {
    if (user) {
      loadFoods();
      loadTodayLogs();
      loadUserProfile();
      const interval = setInterval(loadTodayLogs, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadFoods = async () => {
    try {
      const userFoods = await getUserFoods(user.uid);
      setFoods(userFoods);
    } catch (err) {
      console.error('Failed to load foods:', err);
    }
  };

  const loadTodayLogs = async () => {
    try {
      const logs = await getTodayLogs(user.uid);
      setTodayLogs(logs);
    } catch (err) {
      console.error('Failed to load today logs:', err);
    }
  };

  const loadUserProfile = async () => {
    try {
      const userProfile = await getUserProfile(user.uid);
      if (userProfile) {
        setProfile(userProfile);
        setProfileGender(userProfile.gender);
        setProfileHeight(userProfile.height.toString());
        setProfileWeight(userProfile.weight.toString());
        
        // Check if weight update reminder is needed
        checkWeightUpdateReminder(userProfile);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const checkWeightUpdateReminder = (userProfile: UserProfile) => {
    if (userProfile.lastWeightUpdate) {
      const rawDate = userProfile.lastWeightUpdate;
      // Handle Firestore Timestamp or standard Date
      const lastUpdate = (rawDate as any).toDate ? (rawDate as any).toDate() : new Date(rawDate);
      const now = new Date();
      const twoWeeksMs = 14 * 24 * 60 * 60 * 1000; // 2 weeks
      
      if (now.getTime() - lastUpdate.getTime() > twoWeeksMs) {
        setModalWeight(userProfile.weight.toString());
        setShowWeightUpdateModal(true);
      }
    }
  };

  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!foodName || !protein || !carbs || !calories || !servingSize) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await addFood(
        user.uid,
        foodName,
        parseFloat(protein),
        parseFloat(carbs),
        parseFloat(calories),
        parseFloat(servingSize)
      );
      setFoodName('');
      setProtein('');
      setCarbs('');
      setCalories('');
      setServingSize('100');
      await loadFoods();
    } catch (err) {
      setError('Failed to add food');
    } finally {
      setLoading(false);
    }
  };

  const handleLogFood = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedFoodId || (!servings && !inputGrams)) {
      setError('Please select a food and enter servings or grams');
      return;
    }

    setLoading(true);
    try {
      const selectedFood = foods.find((f) => f.id === selectedFoodId);
      if (selectedFood) {
        const servingSize = selectedFood.servingSize || 100;
        // Use grams if provided, otherwise calculate from servings
        const finalServings = inputGrams ? parseFloat(inputGrams) / servingSize : parseFloat(servings);
        
        await logFoodConsumption(
          user.uid,
          selectedFoodId,
          selectedFood.name,
          finalServings,
          selectedFood.protein,
          selectedFood.carbs,
          selectedFood.calories,
          servingSize
        );
        setSelectedFoodId('');
        setSearchTerm('');
        setServings('1');
        setInputGrams('');
        await loadTodayLogs();
      }
    } catch (err) {
      setError('Failed to log food');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFood = async (foodId: string) => {
    try {
      await deleteFood(foodId);
      await loadFoods();
    } catch (err) {
      setError('Failed to delete food');
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      await deleteLogEntry(logId);
      await loadTodayLogs();
    } catch (err) {
      setError('Failed to delete log entry');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      setError('Failed to logout');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!profileHeight || !profileWeight) {
      setError('Please fill in height and weight');
      return;
    }

    setLoading(true);
    try {
      await saveUserProfile(
        user.uid,
        profileGender,
        parseFloat(profileHeight),
        parseFloat(profileWeight)
      );
      await loadUserProfile();
    } catch (err) {
      setError('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleWeightUpdate = async () => {
    if (!modalWeight) return;
    
    setLoading(true);
    try {
      await saveUserProfile(
        user.uid,
        profileGender,
        parseFloat(profileHeight),
        parseFloat(modalWeight)
      );
      setShowWeightUpdateModal(false);
      await loadUserProfile();
    } catch (err) {
      setError('Failed to update weight');
    } finally {
      setLoading(false);
    }
  };

  const dismissWeightUpdate = () => {
    setShowWeightUpdateModal(false);
  };

  // Test function - can be called from browser console
  (window as any).testWeightReminder = () => {
    if (profile) {
      setModalWeight(profile.weight.toString());
      setShowWeightUpdateModal(true);
    }
  };

  const totalProtein = todayLogs.reduce((sum, log) => sum + log.protein, 0).toFixed(1);
  const totalCarbs = todayLogs.reduce((sum, log) => sum + log.carbs, 0).toFixed(1);
  const totalCalories = todayLogs.reduce((sum, log) => sum + log.calories, 0).toFixed(0);

  // Calculate BMI
  const calculateBMI = () => {
    if (profile && profile.height && profile.weight) {
      const heightInMeters = profile.height / 100;
      return (profile.weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  };

  const bmi = calculateBMI();

  // BMI categories
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const getBMIColor = (bmi: number) => {
    if (bmi < 18.5) return '#3498db'; // Blue
    if (bmi < 25) return '#27ae60'; // Green
    if (bmi < 30) return '#f39c12'; // Orange
    return '#e74c3c'; // Red
  };

  if (!user) {
    return <AuthComponent user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🥗 Nutrition Tracker</h1>
          <p>Track your daily protein, carbs, and calories</p>
        </div>
        <AuthComponent user={user} onLogout={handleLogout} />
      </header>

      <main className="container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'log' ? 'active' : ''}`}
            onClick={() => setActiveTab('log')}
          >
            📝 Log Food
          </button>
          <button
            className={`tab ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            ⚙️ Manage Foods
          </button>
          <button
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profile
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {activeTab === 'log' && (
          <>
            <div className="input-section">
              <h2>Log Your Meal</h2>
              <form onSubmit={handleLogFood} className="form">
                <div className="form-group">
                  <label>Select Food</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsDropdownOpen(true);
                        const food = foods.find((f) => f.name === e.target.value);
                        setSelectedFoodId(food ? food.id : '');
                      }}
                      onClick={() => setIsDropdownOpen(true)}
                      placeholder="Search or select food..."
                      autoComplete="off"
                      style={{ width: '100%', boxSizing: 'border-box', paddingRight: '30px' }}
                    />
                    <span
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        cursor: 'pointer',
                        color: '#666',
                      }}
                    >
                      ▼
                    </span>
                    {isDropdownOpen && (
                      <>
                        <div
                          style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 998,
                          }}
                          onClick={() => setIsDropdownOpen(false)}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            maxHeight: '200px',
                            overflowY: 'auto',
                            backgroundColor: 'white',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            zIndex: 999,
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          }}
                        >
                          {foods
                            .filter((f) =>
                              f.name.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map((food) => (
                              <div
                                key={food.id}
                                onClick={() => {
                                  setSearchTerm(food.name);
                                  setSelectedFoodId(food.id);
                                  setIsDropdownOpen(false);
                                }}
                                style={{
                                  padding: '10px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #eee',
                                  color: '#333',
                                }}
                              >
                                <strong>{food.name}</strong>
                                <div style={{ fontSize: '0.8em', color: '#666' }}>
                                  {food.calories} cal | P: {food.protein}g | C: {food.carbs}g
                                </div>
                              </div>
                            ))}
                          {foods.filter((f) =>
                            f.name.toLowerCase().includes(searchTerm.toLowerCase())
                          ).length === 0 && (
                            <div style={{ padding: '10px', color: '#999' }}>
                              No foods found
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Number of Servings</label>
                  <input
                    type="number"
                    placeholder="e.g., 1.5"
                    value={servings}
                    onChange={(e) => {
                      setServings(e.target.value);
                      setInputGrams('');
                    }}
                    step="0.1"
                    min="0.1"
                  />
                </div>
                <div className="form-group">
                  <label>OR Grams/ml</label>
                  <input
                    type="number"
                    placeholder="e.g., 150g or 200ml"
                    value={inputGrams}
                    onChange={(e) => {
                      setInputGrams(e.target.value);
                      setServings('');
                    }}
                    step="1"
                    min="1"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-add">
                  {loading ? 'Logging...' : 'Log Food'}
                </button>
              </form>
            </div>

            <div className="totals-section">
              <h2>Today's Totals</h2>
              <div className="totals">
                <div className="total-card protein">
                  <h3>Protein</h3>
                  <p className="value">{totalProtein}g</p>
                </div>
                <div className="total-card carbs">
                  <h3>Carbs</h3>
                  <p className="value">{totalCarbs}g</p>
                </div>
                <div className="total-card calories">
                  <h3>Calories</h3>
                  <p className="value">{totalCalories}</p>
                </div>
                {bmi && (
                  <div className="total-card bmi" style={{ backgroundColor: getBMIColor(parseFloat(bmi)) }}>
                    <h3>BMI</h3>
                    <p className="value">{bmi}</p>
                    <p className="category">{getBMICategory(parseFloat(bmi))}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="foods-section">
              <h2>Today's Meals</h2>
              {todayLogs.length === 0 ? (
                <p className="empty-state">No meals logged yet. Start tracking!</p>
              ) : (
                <div className="foods-list">
                  {todayLogs.map((log) => (
                    <div key={log.id} className="food-item">
                      <div className="food-details">
                        <h3>{log.foodName}</h3>
                        <p className="quantity">{log.grams}g ({(log.servings || 1).toFixed(1)} servings)</p>
                        <div className="macros">
                          <span>🔴 {log.protein.toFixed(1)}g protein</span>
                          <span>🟡 {log.carbs.toFixed(1)}g carbs</span>
                          <span>🟠 {log.calories.toFixed(0)} cal</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="btn-remove"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'manage' && (
          <>
            <div className="input-section">
              <h2>Add New Food</h2>
              <form onSubmit={handleAddFood} className="form">
                <div className="form-group">
                  <label>Food Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Paneer"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Serving Size (grams/ml)</label>
                  <input
                    type="number"
                    placeholder="e.g., 150g or 200ml"
                    value={servingSize}
                    onChange={(e) => setServingSize(e.target.value)}
                    step="1"
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Protein (g per serving)</label>
                  <input
                    type="number"
                    placeholder="Protein"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label>Carbs (g per serving)</label>
                  <input
                    type="number"
                    placeholder="Carbs"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label>Calories (per serving)</label>
                  <input
                    type="number"
                    placeholder="Calories"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    step="0.1"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-add">
                  {loading ? 'Adding...' : 'Add Food'}
                </button>
              </form>
            </div>

            <div className="foods-section">
              <h2>Your Food Database</h2>
              {foods.length === 0 ? (
                <p className="empty-state">No foods in your database yet.</p>
              ) : (
                <div className="foods-list">
                  {foods.map((food) => (
                    <div key={food.id} className="food-item">
                      <div className="food-details">
                        <h3>{food.name}</h3>
                        <div className="macros">
                          <span>🔴 {food.protein.toFixed(1)}g protein</span>
                          <span>🟡 {food.carbs.toFixed(1)}g carbs</span>
                          <span>🟠 {food.calories.toFixed(0)} cal</span>
                        </div>
                        <p className="meta">per {food.servingSize}g/ml serving</p>
                      </div>
                      <button
                        onClick={() => handleDeleteFood(food.id)}
                        className="btn-remove"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'profile' && (
          <>
            <div className="input-section">
              <h2>Your Profile</h2>
              <form onSubmit={handleSaveProfile} className="form">
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={profileGender}
                    onChange={(e) => setProfileGender(e.target.value as 'male' | 'female')}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Height (cm)</label>
                  <input
                    type="number"
                    placeholder="e.g., 175"
                    value={profileHeight}
                    onChange={(e) => setProfileHeight(e.target.value)}
                    step="0.1"
                    min="100"
                    max="250"
                  />
                </div>
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input
                    type="number"
                    placeholder="e.g., 70"
                    value={profileWeight}
                    onChange={(e) => setProfileWeight(e.target.value)}
                    step="0.1"
                    min="30"
                    max="300"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-add">
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
              {bmi && (
                <div className="bmi-display">
                  <h3>Your BMI: {bmi}</h3>
                  <p>Category: {getBMICategory(parseFloat(bmi))}</p>
                  <div className="bmi-bar">
                    <div 
                      className="bmi-fill" 
                      style={{ 
                        width: `${Math.min(parseFloat(bmi) * 2.5, 100)}%`,
                        backgroundColor: getBMIColor(parseFloat(bmi))
                      }}
                    ></div>
                  </div>
                  <div className="bmi-scale">
                    <span>Underweight</span>
                    <span>Normal</span>
                    <span>Overweight</span>
                    <span>Obese</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Weight Update Reminder Modal */}
      {showWeightUpdateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Time to Update Your Weight! ⚖️</h3>
            <p>It's been 2 weeks since your last weight update. Keeping track of your progress helps you stay motivated!</p>
            <div className="modal-content">
              <div className="form-group">
                <label>Current Weight (kg)</label>
                <input
                  type="number"
                  value={modalWeight}
                  onChange={(e) => setModalWeight(e.target.value)}
                  step="0.1"
                  min="30"
                  max="300"
                  placeholder="Enter your current weight"
                />
              </div>
              <div className="modal-buttons">
                <button 
                  onClick={handleWeightUpdate} 
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Updating...' : 'Update Weight'}
                </button>
                <button 
                  onClick={dismissWeightUpdate} 
                  className="btn-secondary"
                >
                  Remind Me Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
