import React, { useState, useEffect } from 'react';
import { checkSubscription } from '../utils/subscription';

const Subscription = () => {
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    const getSubscription = async () => {
      const sub = await checkSubscription();
      setSubscription(sub);
    };

    getSubscription();
  }, []);

  if (subscription === null) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Subscription</h2>
      <p>Your current plan: <strong>{subscription}</strong></p>
      {subscription === 'free' && (
        <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Upgrade to Premium
        </button>
      )}
    </div>
  );
};

export default Subscription; 