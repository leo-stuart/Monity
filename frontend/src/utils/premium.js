// src/utils/premium.js

/**
 * Checks if the user has a premium subscription.
 * @param {object} user - The user object from AuthContext.
 * @returns {boolean} - True if the user has a premium subscription, false otherwise.
 */
export const isPremium = (user) => {
  return user?.subscription_tier === 'premium';
}; 