import React, { useState } from 'react';
import { NavLink } from 'react-router-dom'; // Assuming you're using react-router

const Sidebar = () => {
  const [activeItem, setActiveItem] = useState('dashboard, App');

  const handleItemClick = (item) => {
    setActiveItem(item);
  };

  return (
    <div className="sidebar">
      <NavLink 
        to="/dashboard" 
        className={activeItem === 'dashboard' ? 'active' : ''}
        onClick={() => handleItemClick('dashboard')}
      >
        Dashboard
      </NavLink>
      <NavLink 
        to="/App" 
        className={activeItem === 'App' ? 'active' : ''}
        onClick={() => handleItemClick('App')}
      >
        Other Page
      </NavLink>
      {/* Add more links as needed */}
    </div>
  );
};

export default Sidebar;
