import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { FiUsers, FiPackage, FiTrendingUp } from 'react-icons/fi';

const Impact = () => {
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImpact();
  }, []);

  const fetchImpact = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/analytics/impact`);
      setImpact(response.data.impact);
    } catch (error) {
      console.error('Error fetching impact:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Our Impact</h1>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Total Meals</p>
              <p className="text-3xl font-bold">{impact?.totalMeals || 0}</p>
            </div>
            <FiPackage className="text-4xl text-primary-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400">People Fed</p>
              <p className="text-3xl font-bold">{impact?.totalPeopleFed || 0}</p>
            </div>
            <FiUsers className="text-4xl text-green-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400">CO₂ Reduced (kg)</p>
              <p className="text-3xl font-bold">{impact?.co2Reduction || 0}</p>
            </div>
            <FiTrendingUp className="text-4xl text-blue-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Total Donations</p>
              <p className="text-3xl font-bold">{impact?.totalDonations || 0}</p>
            </div>
            <FiPackage className="text-4xl text-purple-600" />
          </div>
        </div>
      </div>

      {/* Top Donors */}
      {impact?.topDonors && impact.topDonors.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4">Top Donors</h2>
          <div className="space-y-3">
            {impact.topDonors.map((donor, index) => (
              <div
                key={donor._id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xl font-bold w-8">#{index + 1}</span>
                  <span className="font-semibold">{donor.donorName}</span>
                </div>
                <span className="text-primary-600 font-semibold">
                  {donor.totalMeals} meals
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Impact Message */}
      <div className="card bg-gradient-to-r from-primary-500 to-primary-700 text-white">
        <h2 className="text-2xl font-bold mb-4">Making a Difference Together</h2>
        <p className="text-lg mb-4">
          Through our platform, we've successfully connected donors and receivers,
          reducing food waste and helping those in need.
        </p>
        <p className="text-lg">
          Every donation counts. Join us in making a positive impact on our community and environment.
        </p>
      </div>
    </div>
  );
};

export default Impact;

