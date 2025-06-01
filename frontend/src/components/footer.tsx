import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-8 text-center w-full">
      <div className="container mx-auto px-4">
        <p>&copy; {new Date().getFullYear()} APTner. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
