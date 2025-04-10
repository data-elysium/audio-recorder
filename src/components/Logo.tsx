
import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-4">
      <img 
        src="/icon.png"
        alt="Affordable AI Logo" 
        className="w-40 h-auto"
      />
    </div>
  );
};

export default Logo;