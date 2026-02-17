// Badge system for gamification

const BADGES = {
  HUNGER_HERO: 'Hunger Hero',
  ZERO_WASTE_STAR: 'Zero Waste Star',
  ECO_SAVER: 'Eco Saver',
  FIRST_DONATION: 'First Donation',
  MILESTONE_100: '100 Meals Milestone',
  MILESTONE_500: '500 Meals Milestone',
  VOLUNTEER_CHAMPION: 'Volunteer Champion',
  QUALITY_MASTER: 'Quality Master'
};

const checkBadges = async (user, donation) => {
  const badgesToAdd = [];

  // First donation
  if (donation.status === 'completed' && user.badges.length === 0) {
    badgesToAdd.push(BADGES.FIRST_DONATION);
  }

  // Calculate total meals donated
  const Donation = require('../models/Donation');
  const completedDonations = await Donation.find({
    donorId: user._id,
    status: 'completed'
  });

  const totalMeals = completedDonations.reduce((sum, d) => sum + d.quantity, 0);

  // Milestone badges
  if (totalMeals >= 100 && !user.badges.some(b => b.name === BADGES.MILESTONE_100)) {
    badgesToAdd.push(BADGES.MILESTONE_100);
  }

  if (totalMeals >= 500 && !user.badges.some(b => b.name === BADGES.MILESTONE_500)) {
    badgesToAdd.push(BADGES.MILESTONE_500);
  }

  // Hunger Hero (10+ completed donations)
  if (completedDonations.length >= 10 && !user.badges.some(b => b.name === BADGES.HUNGER_HERO)) {
    badgesToAdd.push(BADGES.HUNGER_HERO);
  }

  // Zero Waste Star (50+ completed donations)
  if (completedDonations.length >= 50 && !user.badges.some(b => b.name === BADGES.ZERO_WASTE_STAR)) {
    badgesToAdd.push(BADGES.ZERO_WASTE_STAR);
  }

  // Add badges
  for (const badgeName of badgesToAdd) {
    await user.addBadge(badgeName);
  }

  return badgesToAdd;
};

module.exports = { BADGES, checkBadges };

