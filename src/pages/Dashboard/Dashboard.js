import React, { useState, useEffect, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../utils/firebase";
import "./Dashboard.css";

const Dashboard = ({ userId }) => {
  const [actions, setActions] = useState([]);
  const [stats, setStats] = useState({
    totalActions: 0,
    completedActions: 0,
    completionRate: 0,
    upcomingDeadlines: [],
    mostActiveAction: null,
    leastActiveAction: null
  });

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

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  const calculateDaysLeft = (targetDate) => {
    const currentDate = new Date();
    const target = new Date(targetDate);
    const difference = Math.ceil(
      (target - currentDate) / (1000 * 60 * 60 * 24)
    );
    return difference >= 0 ? difference : 0;
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
      </div>

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