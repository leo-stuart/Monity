import { get } from './api';

/**
 * Checks the subscription status of the current user.
 * 
 * @returns {Promise<string>} A promise that resolves with the user's subscription tier.
 */
export const checkSubscription = async () => {
  try {
    const response = await get('/subscription-tier');
    return response.data.subscription_tier || 'free';
  } catch (error) {
    console.error('Failed to fetch subscription status:', error);
    return 'free';
  }
}; 