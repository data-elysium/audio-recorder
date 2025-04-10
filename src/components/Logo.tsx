
import React from 'react';
import Image from 'next/image';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-4">
      <Image 
        src="/icon.png"
        alt="Affordable AI Logo" 
        width={160}
        height={160}
        className="w-40 h-auto"
        priority
      />
    </div>
  );
}
export default Logo;