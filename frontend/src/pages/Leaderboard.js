import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiAward, FiTrendingUp } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [filter]);

  const fetchLeaderboard = async () => {
    try {
      const params = filter ? { role: filter } : {};
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/users/leaderboard`, { params });
      setLeaderboard(response.data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const getRankIcon = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Leaderboard</h1>

      <div className="card mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-2 rounded-lg ${filter === '' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('donor')}
            className={`px-4 py-2 rounded-lg ${filter === 'donor' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
          >
            Donors
          </button>
          <button
            onClick={() => setFilter('receiver')}
            className={`px-4 py-2 rounded-lg ${filter === 'receiver' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
          >
            Receivers
          </button>
          <button
            onClick={() => setFilter('volunteer')}
            className={`px-4 py-2 rounded-lg ${filter === 'volunteer' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
          >
            Volunteers
          </button>
        </div>
      </div>

      <div className="card">
        <div className="space-y-4">
          {leaderboard.map((user, index) => (
            <div
              key={user._id}
              className={`flex items-center justify-between p-4 rounded-lg ${
                index < 3 ? 'bg-primary-50 dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold w-12 text-center">
                  {getRankIcon(index)}
                </div>
                <div>
                  <h3 className="font-semibold">{user.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user.organizationName || user.role}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">{user.points}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Points</p>
                </div>
                {user.badges && user.badges.length > 0 && (
                  <div className="flex gap-2">
                    {user.badges.slice(0, 3).map((badge, badgeIndex) => (
                      <span
                        key={badgeIndex}
                        className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs"
                        title={badge.name}
                      >
                        <FiAward />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {leaderboard.length === 0 && (
          <p className="text-center text-gray-600 dark:text-gray-400 py-8">
            No users found
          </p>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;

