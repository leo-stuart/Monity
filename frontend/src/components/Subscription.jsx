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
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="bg-[#23263a] p-4 md:p-6 rounded-xl shadow-lg text-white">
      <h2 className="text-xl md:text-2xl font-bold mb-4">Subscription</h2>
      <p className="text-md md:text-lg">Your current plan: <strong className="capitalize text-[#01C38D]">{subscription}</strong></p>
      {subscription === 'free' && (
        <button className="mt-6 w-full md:w-auto bg-gradient-to-r from-[#01C38D] to-[#01C38D]/80 text-white font-bold py-3 px-6 rounded-lg hover:from-[#01C38D]/90 hover:to-[#01C38D]/70 transition-all">
          Upgrade to Premium
        </button>
      )}
    </div>
  );
};

export default Subscription; 