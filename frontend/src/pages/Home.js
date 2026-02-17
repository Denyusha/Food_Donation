import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHeart, FiMapPin, FiUsers, FiAward } from 'react-icons/fi';

const Home = () => {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <section className="text-center py-20 bg-gradient-to-r from-primary-500 to-primary-700 text-white">
        <h1 className="text-5xl font-bold mb-4">Reduce Food Waste, Feed Those in Need</h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Connect food donors with receivers to make a positive impact on our community and environment
        </p>
        {!user && (
          <div className="space-x-4">
            <Link to="/register" className="btn-primary bg-white text-primary-600 hover:bg-gray-100">
              Get Started
            </Link>
            <Link to="/donations" className="btn-secondary bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary-600">
              Browse Donations
            </Link>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <FiHeart className="text-4xl text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Donate Food</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Restaurants, individuals, and event organizers can easily post available food donations
              </p>
            </div>
            <div className="card text-center">
              <FiMapPin className="text-4xl text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Smart Matching</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Our AI-powered system matches donors with nearby receivers based on location and preferences
              </p>
            </div>
            <div className="card text-center">
              <FiUsers className="text-4xl text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Volunteer Network</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Volunteers help pick up and deliver donations, making the process seamless
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Impact</h2>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">10K+</div>
              <div className="text-gray-600 dark:text-gray-400">Meals Donated</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">500+</div>
              <div className="text-gray-600 dark:text-gray-400">Active Donors</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">200+</div>
              <div className="text-gray-600 dark:text-gray-400">Receivers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">5T</div>
              <div className="text-gray-600 dark:text-gray-400">CO₂ Reduced</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-16 text-center">
          <div className="card max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to Make a Difference?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Join our community today and start reducing food waste while helping those in need
            </p>
            <Link to="/register" className="btn-primary">
              Sign Up Now
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;

