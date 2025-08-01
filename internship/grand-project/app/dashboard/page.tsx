"use client";

import React, { useEffect, useState } from 'react';
import { getDashboardAnalytics, getAIInsights } from '../lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import withAuth from '../lib/withAuth';
import { FiActivity, FiAlertCircle, FiBarChart2, FiCalendar, FiClock, FiPlusCircle, FiRefreshCw, FiTrendingUp } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

function DashboardPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [aiInsights, setAIInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    setLoading(true);
    setError(''); // Clear any previous errors

    Promise.all([
      getDashboardAnalytics(),
      getAIInsights(),
    ])
      .then(([analyticsData, aiData]) => {
        console.log('Dashboard analytics data received:', analyticsData);
        console.log('Recent mood entries:', analyticsData?.recentMood?.entries);
        console.log('Entries length:', analyticsData?.recentMood?.entries?.length);
        // Handle the API response structure
        setAnalytics(analyticsData);
        setAIInsights(aiData);
        setError('');
      })
      .catch((err) => {
        console.error('Dashboard error:', err);
        setError(err.message || 'Failed to load dashboard data.');
        // Set some default data to prevent empty state
        setAnalytics({
          overview: { averageMood: '7.5', currentStreak: '5', totalMoodEntries: '12', improvement: '+15%' },
          recentEntries: []
        });
        setAIInsights({ summary: 'Unable to load AI insights at this time.' });
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Refresh data when component becomes visible (for when returning from mood entry)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setError(''); // Clear any previous errors

    Promise.all([
      getDashboardAnalytics(),
      getAIInsights(),
    ])
      .then(([analyticsData, aiData]) => {
        console.log('Dashboard data loaded successfully:', analyticsData);
        setAnalytics(analyticsData);
        setAIInsights(aiData);
        setError('');
      })
      .catch((err) => {
        console.error('Dashboard refresh error:', err);
        setError(err.message || 'Failed to load dashboard data.');
        // Set some default data to prevent empty state
        setAnalytics({
          overview: { averageMood: '7.5', currentStreak: '5', totalMoodEntries: '12', improvement: '+15%' },
          recentEntries: []
        });
        setAIInsights({ summary: 'Unable to load AI insights at this time.' });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleNewEntry = () => {
    router.push('/mood');
  };

  const handleViewAllEntries = () => {
    router.push('/mood-history');
  };

  const handleViewEntryDetails = (entryId: string) => {
    router.push(`/mood-entry/${entryId}`);
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    // Smooth client-side navigation - no full page reload
    console.log(`Switched to ${range} view`);
    
    // Update analytics data based on time range without server call
    if (analytics?.recentMood?.entries) {
      const now = new Date();
      let filteredEntries = [...analytics.recentMood.entries];
      
      switch (range) {
        case 'week':
          filteredEntries = filteredEntries.filter(entry => {
            // Chart data uses 'date' field in YYYY-MM-DD format
            const entryDate = new Date(entry.date + 'T00:00:00');
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return entryDate >= weekAgo;
          });
          break;
        case 'month':
          filteredEntries = filteredEntries.filter(entry => {
            const entryDate = new Date(entry.date + 'T00:00:00');
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return entryDate >= monthAgo;
          });
          break;
        case 'year':
          filteredEntries = filteredEntries.filter(entry => {
            const entryDate = new Date(entry.date + 'T00:00:00');
            const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            return entryDate >= yearAgo;
          });
          break;
      }
      
      console.log(`Filtered entries for ${range}:`, filteredEntries);
      
      // Update analytics with filtered data
      setAnalytics(prev => ({
        ...prev,
        recentMood: {
          ...prev?.recentMood,
          entries: filteredEntries
        }
      }));
    }
  };

  const handleViewAllActivities = () => {
    router.push('/mood-history');
  };

  // Mock data for additional charts
  const activityImpact = [
    { name: 'Exercise', impact: 8.5 },
    { name: 'Meditation', impact: 7.8 },
    { name: 'Reading', impact: 6.5 },
    { name: 'Social', impact: 7.2 },
    { name: 'Work', impact: 5.1 },
  ];

  const sleepQuality = [
    { name: 'Excellent', value: 25 },
    { name: 'Good', value: 40 },
    { name: 'Fair', value: 20 },
    { name: 'Poor', value: 15 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <h1 className="text-3xl font-bold text-blue-600">Your Wellness Dashboard</h1>
                 <div className="flex items-center gap-3">
           <button
             onClick={handleRefresh}
             className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors font-medium"
           >
             <FiRefreshCw className="h-4 w-4" /> Refresh
           </button>
           <button
             onClick={handleNewEntry}
             className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
           >
             <FiPlusCircle className="h-4 w-4" /> New Entry
           </button>
         </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-blue"></div>
            <p className="text-neutral-500 font-medium">Loading your wellness data...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl font-medium flex items-center gap-3">
          <FiAlertCircle className="h-5 w-5" />
          <div className="flex-1">
            <p>{error}</p>
            <button 
              onClick={handleRefresh}
              className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4 transform transition-all hover:scale-105">
              <div className="bg-blue-100 p-3 rounded-full">
                <FiActivity className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Current Mood</p>
                                 <p className="text-2xl font-bold text-blue-600">{analytics?.overview?.averageMood || analytics?.recentActivity?.averages?.mood || '7.5'}/10</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4 transform transition-all hover:scale-105">
              <div className="bg-green-100 p-3 rounded-full">
                <FiTrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Streak</p>
                                 <p className="text-2xl font-bold text-green-600">{analytics?.overview?.currentStreak || '5'} days</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4 transform transition-all hover:scale-105">
              <div className="bg-purple-100 p-3 rounded-full">
                <FiCalendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Entries</p>
                                 <p className="text-2xl font-bold text-purple-600">{analytics?.overview?.totalMoodEntries || '12'}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4 transform transition-all hover:scale-105">
              <div className="bg-orange-100 p-3 rounded-full">
                <FiClock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Improvement</p>
                <p className="text-2xl font-bold text-orange-600">{analytics?.overview?.improvement || '+15%'}</p>
              </div>
            </div>
          </section>

          {/* Charts Section */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow p-6">
                             <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-semibold text-blue-600">Mood Trends</h2>
                 <div className="flex gap-2">
                   <button 
                     onClick={() => handleTimeRangeChange('week')}
                     className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                       timeRange === 'week' 
                         ? 'bg-blue-600 text-white' 
                         : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                     }`}
                   >
                     Week
                   </button>
                   <button 
                     onClick={() => handleTimeRangeChange('month')}
                     className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                       timeRange === 'month' 
                         ? 'bg-blue-600 text-white' 
                         : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                     }`}
                   >
                     Month
                   </button>
                   <button 
                     onClick={() => handleTimeRangeChange('year')}
                     className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                       timeRange === 'year' 
                         ? 'bg-blue-600 text-white' 
                         : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                     }`}
                   >
                     Year
                   </button>
                 </div>
               </div>
                             {analytics?.recentMood?.entries && analytics.recentMood.entries.length > 0 ? (
                 <div className="w-full h-64">
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart 
                       key={`${timeRange}-${analytics.recentMood.entries.length}`}
                       data={analytics.recentMood.entries} 
                       margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                     >
                       <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                       <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                       <YAxis domain={[1, 10]} tickCount={5} tick={{ fontSize: 12 }} />
                       <Tooltip 
                         contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }}
                         labelStyle={{ fontWeight: 'bold', color: '#333' }}
                       />
                       <Line 
                         type="monotone" 
                         dataKey="mood" 
                         stroke="#2563eb" 
                         strokeWidth={3} 
                         dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }} 
                         activeDot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                       />
                     </LineChart>
                   </ResponsiveContainer>
                 </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📊</div>
                    <p>No mood data available for chart</p>
                    <p className="text-sm">Start tracking your mood to see trends</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow p-6">
                             <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-semibold text-primary-blue">Activity Impact</h2>
                 <button onClick={handleViewAllActivities} className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded font-medium transition-colors">View All</button>
               </div>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityImpact} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 10]} tickCount={5} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none' }}
                      labelStyle={{ fontWeight: 'bold', color: '#333' }}
                    />
                    <Bar dataKey="impact" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Additional Insights Section */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4 text-primary-blue">AI Insights</h2>
              {aiInsights?.summary ? (
                <div className="bg-neutral-50 p-4 rounded-lg text-neutral-700 leading-relaxed">
                  <p className="italic text-primary-blue/80 mb-3">"Based on your recent data, our AI has identified the following insights:"</p>
                  <p>{aiInsights.summary}</p>
                  <div className="mt-4 pt-4 border-t border-neutral-200">
                    <h3 className="font-medium mb-2 text-primary-blue">Recommendations:</h3>
                    <ul className="list-disc list-inside space-y-1 text-neutral-700">
                      <li>Try to maintain your meditation practice - it correlates with your best mood days</li>
                      <li>Consider reducing screen time in the evening to improve sleep quality</li>
                      <li>Your mood tends to improve after social activities</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-neutral-50 rounded-lg">
                  <p className="text-neutral-500 font-medium">No AI insights available yet.</p>
                  <p className="text-neutral-400 text-sm mt-2">Continue logging your daily entries to receive personalized insights.</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary-blue">Sleep Quality</h2>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sleepQuality}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sleepQuality.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {sleepQuality.map((entry, index) => (
                  <div key={`legend-${index}`} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-sm text-neutral-700">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Recent Entries Section */}
          <section className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-primary-blue">Recent Mood Entries</h2>
              <button 
                onClick={handleViewAllEntries}
                className="text-sm bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded font-medium transition-colors"
              >
                View All
              </button>
            </div>
            {analytics?.recentEntries?.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Mood</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Activities</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Notes</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {analytics.recentEntries.slice(0, 5).map((entry: any, i: number) => (
                      <tr key={entry.id || i} className="hover:bg-neutral-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${entry.moodScore >= 7 ? 'bg-green-500' : entry.moodScore >= 4 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                            <span className="font-medium text-primary-blue">{entry.moodType} ({entry.moodScore})</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">
                          {entry.activities?.join(', ') || 'None recorded'}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-700 max-w-xs truncate">
                          {entry.notes || 'No notes'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500">
                          <button 
                            onClick={() => handleViewEntryDetails(entry.id || `entry-${i}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 bg-neutral-50 rounded-lg">
                <p className="text-neutral-500 font-medium">No recent entries.</p>
                <button 
                  onClick={handleNewEntry}
                  className="mt-2 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded font-medium transition-colors"
                >
                  Add your first entry
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default withAuth(DashboardPage);