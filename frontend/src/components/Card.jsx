import React from 'react';

const Card = ({ title, children }) => {
    return (
        <div className="bg-[#23263a] p-4 md:p-6 rounded-xl shadow-lg text-white">
            <h2 className="text-xl md:text-2xl font-bold mb-4">{title}</h2>
            {children}
        </div>
    );
};

export default Card; 