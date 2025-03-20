import React, { useState, useEffect, useCallback } from "react";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "./Dashboard.css";

const Dashboard = ({ userId }) => {
  const [actions, setActions] = useState([]);
//   const [dailyProgress, setDailyProgress] = useState([]);
//   const [streakData, setStreakData] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [stats, setStats] = useState({
    totalActions: 0,
    completedActions: 0,
    completionRate: 0,
    upcomingDeadlines: [],
    mostActiveAction: null,
    leastActiveAction: null
  });
  const [activitiesData, setActivitiesData] = useState([]);
  const [monthlyHeatmapData, setMonthlyHeatmapData] = useState([]);

  const fetchActions = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(
        collection(db, "users", userId, "actions")
      );
      const actionsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setActions(actionsData);
      calculateStats(actionsData);
    } catch (error) {
      console.error("Error fetching actions for dashboard: ", error);
    }
  }, [userId]);

  const fetchDailyProgress = useCallback(async () => {
    try {
      // Fetch daily progress data
      const userProgressRef = doc(db, "users", userId, "progress", "daily");
      const userProgressDoc = await getDoc(userProgressRef);
      
      // Get the last 30 days as date strings
      const last30Days = getLast30Days();
      
      let progressData = {};
      if (userProgressDoc.exists()) {
        progressData = userProgressDoc.data();
      } else {
        // Initialize with empty document if it doesn't exist yet
        await setDoc(userProgressRef, {});
      }
      
      // Convert to array format for graphs and calculations
    //   const dailyData = last30Days.map(dateString => {
    //     return {
    //       date: dateString,
    //       actionsCompleted: progressData[dateString] || 0
    //     };
    //   });
      
    //   setDailyProgress(dailyData);
      
      // Calculate streaks based on actual data
      calculateStreaks(progressData);
      
      // Format data for the activities line chart
      const activitiesChartData = last30Days.map(dateString => {
        // Format date for x-axis display (MM-DD)
        const dateParts = dateString.split('-');
        const formattedDate = `${dateParts[1]}-${dateParts[2]}`;
        
        return {
          date: formattedDate,
          activities: progressData[dateString] || 0
        };
      });
      
      setActivitiesData(activitiesChartData);
      
      // Generate data for the monthly heatmap
      generateMonthlyHeatmap(progressData);
      
    } catch (error) {
      console.error("Error fetching daily progress: ", error);
    }
  }, [userId]);

  const getLast30Days = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().split('T')[0]); // Format as YYYY-MM-DD
    }
    
    return dates;
  };

  const calculateStreaks = (progressData) => {
    const dates = Object.keys(progressData).sort();
    if (dates.length === 0) {
      setCurrentStreak(0);
      setLongestStreak(0);
    //   setStreakData([]);
      return;
    }

    // Calculate current streak
    let current = 0;
    let longest = 0;
    let streakMap = {};
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    // Check if there's any progress today or yesterday
    const hasProgressToday = progressData[today] && progressData[today] > 0;
    const hasProgressYesterday = progressData[yesterdayString] && progressData[yesterdayString] > 0;
    
    // Go through each date in last 30 days to calculate streak
    const last30Days = getLast30Days();
    last30Days.forEach(date => {
      if (progressData[date] && progressData[date] > 0) {
        streakMap[date] = { date, count: progressData[date], active: true };
      } else {
        streakMap[date] = { date, count: 0, active: false };
      }
    });
    
    // Calculate current streak - count backwards from today/yesterday
    let streakStartDate = hasProgressToday ? today : 
                          hasProgressYesterday ? yesterdayString : null;
    
    if (streakStartDate) {
      current = 1; // Start with 1 if today/yesterday has progress
      let currentDate = new Date(streakStartDate);
      
      while (true) {
        currentDate.setDate(currentDate.getDate() - 1);
        const dateString = currentDate.toISOString().split('T')[0];
        
        if (progressData[dateString] && progressData[dateString] > 0) {
          current++;
        } else {
          break;
        }
      }
    }
    
    // Calculate longest streak
    let tempStreak = 0;
    dates.forEach((date, index) => {
      if (progressData[date] && progressData[date] > 0) {
        tempStreak++;
        
        if (index === dates.length - 1 || !progressData[dates[index + 1]] || progressData[dates[index + 1]] === 0) {
          longest = Math.max(longest, tempStreak);
          tempStreak = 0;
        }
      }
    });
    
    setCurrentStreak(current);
    setLongestStreak(longest);
    // setStreakData(Object.values(streakMap));
  };

  const calculateStats = (actionsData) => {
    if (!actionsData.length) return;

    let totalAllActions = 0;
    let totalCompletedActions = 0;
    
    // Calculate total actions and completed actions
    actionsData.forEach(action => {
      totalAllActions += action.totalActions;
      totalCompletedActions += action.actionsDone;
    });
    
    // Calculate completion rate
    const completionRate = (totalCompletedActions / totalAllActions) * 100;
    
    // Sort actions by deadline for upcoming deadlines
    const sortedByDeadline = [...actionsData].sort((a, b) => 
      new Date(a.deadlineDate) - new Date(b.deadlineDate)
    );
    
    // Get upcoming deadlines (next 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const upcomingDeadlines = sortedByDeadline.filter(action => {
      const deadline = new Date(action.deadlineDate);
      return deadline >= today && deadline <= nextWeek;
    });
    
    // Calculate progress percentage for each action
    const actionsWithProgress = actionsData.map(action => ({
      ...action,
      progressPercentage: (action.actionsDone / action.totalActions) * 100
    }));
    
    // Sort by progress percentage
    const sortedByProgress = [...actionsWithProgress].sort((a, b) => 
      a.progressPercentage - b.progressPercentage
    );
    
    // Get most active and least active actions
    const leastActiveAction = sortedByProgress[0] || null;
    const mostActiveAction = sortedByProgress[sortedByProgress.length - 1] || null;
    
    setStats({
      totalActions: totalAllActions,
      completedActions: totalCompletedActions,
      completionRate: completionRate.toFixed(1),
      upcomingDeadlines,
      mostActiveAction,
      leastActiveAction
    });
  };

  // Generate month data for the heatmap using real data
  const generateMonthlyHeatmap = (progressData) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const monthsData = [];
    
    // Generate data for each month
    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
      const days = [];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateString = `${currentYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dateObj = new Date(dateString);
        
        // Skip future dates
        if (dateObj > today) {
          days.push({ date: dateString, count: 0, active: false });
          continue;
        }
        
        // Use actual data from progressData
        const activityCount = progressData[dateString] || 0;
        
        days.push({
          date: dateString,
          count: activityCount,
          active: activityCount > 0
        });
      }
      
      monthsData.push({
        month: new Date(currentYear, month, 1).toLocaleString('default', { month: 'short' }),
        days
      });
    }
    
    setMonthlyHeatmapData(monthsData);
  };

  useEffect(() => {
    fetchActions();
    fetchDailyProgress();
  }, [fetchActions, fetchDailyProgress]);

  const calculateDaysLeft = (targetDate) => {
    const currentDate = new Date();
    const target = new Date(targetDate);
    const difference = Math.ceil(
      (target - currentDate) / (1000 * 60 * 60 * 24)
    );
    return difference >= 0 ? difference : 0;
  };

  // Helper function to get color for heatmap based on count
  const getHeatmapColor = (count) => {
    if (count <= 0) return '#333';
    if (count <= 2) return '#e6ffed';
    if (count <= 5) return '#56d364';
    return '#2da44e';
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>
      
      <div className="stats-overview">
        <div className="stat-card">
          <h3>Overall Progress</h3>
          <div className="progress-circle">
            <div className="progress-circle-inner">
              <span className="progress-percentage">{stats.completionRate}%</span>
            </div>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="#333"
                strokeWidth="12"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="#4caf50"
                strokeWidth="12"
                strokeDasharray="339.3"
                strokeDashoffset={(339.3 * (100 - stats.completionRate)) / 100}
                transform="rotate(-90 60 60)"
              />
            </svg>
          </div>
          <p className="stat-detail">
            {stats.completedActions} of {stats.totalActions} actions completed
          </p>
        </div>
        
        <div className="stat-card">
          <h3>Action Summary</h3>
          <div className="action-summary">
            <div className="summary-item">
              <span className="summary-label">Total Actions:</span>
              <span className="summary-value">{actions.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">In Progress:</span>
              <span className="summary-value">
                {actions.filter(a => a.actionsDone < a.totalActions).length}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Completed:</span>
              <span className="summary-value">
                {actions.filter(a => a.actionsDone === a.totalActions).length}
              </span>
            </div>
          </div>
        </div>
        
        <div className="stat-card streak-card">
          <h3>Current Streak</h3>
          <div className="streak-container">
            <div className="streak-circle">
              <span className="streak-number">{currentStreak}</span>
              <span className="streak-label">days</span>
            </div>
            <div className="streak-info">
              <div className="streak-detail">
                <span className="streak-detail-label">Longest Streak:</span>
                <span className="streak-detail-value">{longestStreak} days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Daily Activities Graph - Now using real data */}
      <div className="stats-detail-row">
        <div className="stat-card daily-activities-card">
          <h3>Activities by Day</h3>
          <div className="activities-graph">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={activitiesData}
                // margin={{ top: 5, right: 20, left: 20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#aaa', fontSize: 10 }} 
                  tickCount={10}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fill: '#aaa', fontSize: 12 }}
                  domain={[0, 'auto']}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e1e2f', border: '1px solid #333', borderRadius: '8px', color: 'white' }} 
                  labelStyle={{ color: '#4caf50' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="activities" 
                  stroke="#ff9800" 
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#ff9800', stroke: '#ff9800' }}
                  activeDot={{ r: 6, fill: '#ff9800', stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* LeetCode-style Monthly Activity Heatmap - Now using real data */}
      <div className="stats-detail-row">
        <div className="stat-card heatmap-card">
          <h3>Activity Heatmap</h3>
          <div className="monthly-heatmap-container">
            {monthlyHeatmapData.map((monthData, monthIndex) => (
              <div key={monthIndex} className="month-heatmap">
                <div className="month-label">{monthData.month}</div>
                <div className="month-days">
                  {monthData.days.map((day, dayIndex) => (
                    <div 
                      key={dayIndex} 
                      className={`day-cell ${day.active ? 'active' : ''}`}
                      style={{ 
                        backgroundColor: getHeatmapColor(day.count),
                        display: dayIndex < 31 ? 'block' : 'none' // Only show first 31 days max
                      }}
                      title={`${day.date}: ${day.count} activities`}
                    ></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="heatmap-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#333' }}></div>
              <span>None</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#e6ffed' }}></div>
              <span>Low</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#56d364' }}></div>
              <span>Medium</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#2da44e' }}></div>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Daily Progress Graph */}
      {/* <div className="stats-detail-row">
        <div className="stat-card daily-progress-card">
          <h3>Daily Progress</h3>
          <div className="daily-progress-graph">
            <div className="graph-container">
              {dailyProgress.map((day, index) => (
                <div key={index} className="graph-bar-container">
                  <div 
                    className="graph-bar" 
                    style={{ 
                      height: `${Math.min(day.actionsCompleted * 10, 100)}%`,
                      backgroundColor: day.actionsCompleted > 0 ? '#4caf50' : '#555'
                    }}
                  ></div>
                  <div className="graph-date">{day.date.split('-')[2]}</div>
                </div>
              ))}
            </div>
            <div className="graph-labels">
              <div className="graph-y-label">Actions Completed</div>
              <div className="graph-x-label">Last 30 Days</div>
            </div>
          </div>
        </div>
      </div> */}

      <div className="stats-detail-row">
        <div className="stat-card action-performance">
          <h3>Action Performance</h3>
          {actions.length > 0 ? (
            <div className="performance-bars">
              {actions.map(action => (
                <div key={action.id} className="performance-bar-item">
                  <div className="performance-bar-header">
                    <span className="performance-bar-title">{action.actionName}</span>
                    <span className="performance-bar-percentage">
                      {((action.actionsDone / action.totalActions) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="performance-bar-container">
                    <div 
                      className="performance-bar-progress"
                      style={{ width: `${(action.actionsDone / action.totalActions) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data-message">No actions available</p>
          )}
        </div>
        
        <div className="stat-card">
          <h3>Upcoming Deadlines</h3>
          {stats.upcomingDeadlines.length > 0 ? (
            <div className="deadlines-list">
              {stats.upcomingDeadlines.map(action => (
                <div key={action.id} className="deadline-item">
                  <div className="deadline-info">
                    <h4>{action.actionName}</h4>
                    <p className="deadline-date">{new Date(action.deadlineDate).toLocaleDateString()}</p>
                  </div>
                  <div className="days-left">
                    <span className="days-number">{calculateDaysLeft(action.deadlineDate)}</span>
                    <span className="days-label">days left</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data-message">No upcoming deadlines</p>
          )}
        </div>
      </div>

      <div className="stats-detail-row">
        <div className="stat-card">
          <h3>Most Active</h3>
          {stats.mostActiveAction ? (
            <div className="action-highlight">
              <h4>{stats.mostActiveAction.actionName}</h4>
              <div className="highlight-progress">
                <div className="highlight-progress-bar">
                  <div 
                    className="highlight-progress-fill"
                    style={{ width: `${stats.mostActiveAction.progressPercentage}%` }}
                  ></div>
                </div>
                <span className="highlight-percentage">
                  {stats.mostActiveAction.progressPercentage.toFixed(1)}%
                </span>
              </div>
              <p className="highlight-detail">
                {stats.mostActiveAction.actionsDone} of {stats.mostActiveAction.totalActions} actions completed
              </p>
            </div>
          ) : (
            <p className="no-data-message">No data available</p>
          )}
        </div>
        
        <div className="stat-card">
          <h3>Needs Attention</h3>
          {stats.leastActiveAction ? (
            <div className="action-highlight">
              <h4>{stats.leastActiveAction.actionName}</h4>
              <div className="highlight-progress">
                <div className="highlight-progress-bar">
                  <div 
                    className="highlight-progress-fill highlight-progress-warning"
                    style={{ width: `${stats.leastActiveAction.progressPercentage}%` }}
                  ></div>
                </div>
                <span className="highlight-percentage">
                  {stats.leastActiveAction.progressPercentage.toFixed(1)}%
                </span>
              </div>
              <p className="highlight-detail">
                {stats.leastActiveAction.actionsDone} of {stats.leastActiveAction.totalActions} actions completed
              </p>
              <p className="days-remaining">
                {calculateDaysLeft(stats.leastActiveAction.deadlineDate)} days remaining
              </p>
            </div>
          ) : (
            <p className="no-data-message">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;