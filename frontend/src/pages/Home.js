import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHeart, FiSearch } from 'react-icons/fi';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section - Clean gradient without map */}
      <section className="relative min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
        <div className="text-center px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-gray-900">
            Share Food, Share Love
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 max-w-2xl mx-auto text-gray-700 px-4">
            Connect surplus food with those in need through real-time 3D tracking
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/donations/create"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
            >
              <FiHeart className="w-5 h-5" />
              Donate Food
            </Link>
            <Link
              to="/donations"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/20 hover:bg-white/30 text-white rounded-full font-semibold text-lg transition-all backdrop-blur-sm"
            >
              <FiSearch className="w-5 h-5" />
              Find Donations
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-4 bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-600 dark:text-gray-400">
            🟢 Tracking location • 0 donations nearby
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-900 dark:text-white">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 px-4 sm:px-0">
            <div className="bg-gradient-to-b from-gray-200 to-gray-300 rounded-xl text-center p-6 sm:p-8 shadow-sm">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl sm:text-3xl">🍽️</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-black">Donate Food</h3>
              <p className="text-sm sm:text-base text-black">
                Restaurants, individuals, and event organizers can easily post available food donations
              </p>
            </div>
            <div className="bg-gradient-to-b from-gray-200 to-gray-300 rounded-xl text-center p-6 sm:p-8 shadow-sm">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl sm:text-3xl">🤝</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-black">Smart Matching</h3>
              <p className="text-sm sm:text-base text-black">
                Our AI-powered system matches donors with nearby receivers based on location and preferences
              </p>
            </div>
            <div className="bg-gradient-to-b from-gray-200 to-gray-300 rounded-xl text-center p-6 sm:p-8 shadow-sm sm:col-span-2 md:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl sm:text-3xl">🚚</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-black">Volunteer Network</h3>
              <p className="text-sm sm:text-base text-black">
                Volunteers help pick up and deliver donations, making the process seamless
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-16 bg-emerald-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-900 dark:text-white">Our Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center px-4 sm:px-0">
            <div className="p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-emerald-600 mb-2">10K+</div>
              <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Meals Donated</div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-emerald-600 mb-2">500+</div>
              <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Active Donors</div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-emerald-600 mb-2">200+</div>
              <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Receivers</div>
            </div>
            <div className="p-4 sm:p-6">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-emerald-600 mb-2">5T</div>
              <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">CO₂ Reduced</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-16 text-center bg-white dark:bg-gray-900">
          <div className="card max-w-2xl mx-auto p-6 sm:p-8 mx-4 sm:mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900 dark:text-white">Ready to Make a Difference?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm sm:text-base">
              Join our community today and start reducing food waste while helping those in need
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-semibold text-base sm:text-lg transition-all"
            >
              Sign Up Now
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;

