import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-8 text-center">
      <p>&copy; {new Date().getFullYear()} APTner. All rights reserved.</p>
    </footer>
  );
};

export default Footer; 