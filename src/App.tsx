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
  Food,
  DailyLog,
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
  const [activeTab, setActiveTab] = useState<'log' | 'manage'>('log');

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

  const totalProtein = todayLogs.reduce((sum, log) => sum + log.protein, 0).toFixed(1);
  const totalCarbs = todayLogs.reduce((sum, log) => sum + log.carbs, 0).toFixed(1);
  const totalCalories = todayLogs.reduce((sum, log) => sum + log.calories, 0).toFixed(0);

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
        </div>

        {error && <div className="error-message">{error}</div>}

        {activeTab === 'log' && (
          <>
            <div className="input-section">
              <h2>Log Your Meal</h2>
              <form onSubmit={handleLogFood} className="form">
                <div className="form-group">
                  <label>Select Food</label>
                  <select
                    value={selectedFoodId}
                    onChange={(e) => setSelectedFoodId(e.target.value)}
                  >
                    <option value="">Choose a food...</option>
                    {foods.map((food) => (
                      <option key={food.id} value={food.id}>
                        {food.name}
                      </option>
                    ))}
                  </select>
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
                  <label>OR Grams</label>
                  <input
                    type="number"
                    placeholder="e.g., 150"
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
                    placeholder="e.g., Chicken Breast"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Serving Size (grams)</label>
                  <input
                    type="number"
                    placeholder="e.g., 150"
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
                        <p className="meta">per {food.servingSize}g serving</p>
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
      </main>
    </div>
  );
}

export default App;
