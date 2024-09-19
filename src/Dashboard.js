import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase-config";
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Import the CSS for the calendar
import "./dashbard.css";

const Dashboard = () => {
  const [userCount, setUserCount] = useState(0);
  const [deceasedCount, setDeceasedCount] = useState(0);
  const [date, setDate] = useState(new Date()); // State for selected date
  

  const usersCollectionRef = collection(db, "users");

  const countUsers = async () => {
    try {
      const data = await getDocs(usersCollectionRef);
      return data.size; // Total number of users
    } catch (error) {
      console.error("Error counting users: ", error);
    }
  };

  const countDeceasedUsers = async () => {
    try {
      const q = query(usersCollectionRef, where("status", "==", "DECEASED"));
      const data = await getDocs(q);
      return data.size; // Number of deceased users
    } catch (error) {
      console.error("Error counting deceased users: ", error);
    }
  };

  useEffect(() => {
    const fetchUserCounts = async () => {
      const totalCount = await countUsers();
      setUserCount(totalCount);
      
      const deceasedCount = await countDeceasedUsers();
      setDeceasedCount(deceasedCount);
    };

    fetchUserCounts();
  }, []);

  // Handle date change
  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to the Dashboard!</p>

      <div className="custom-container">
        <center>
          <CIcon icon={icon.cilUser} className="profile" />
          <p>TOTAL MEMBERS: {userCount}</p>
        </center>
      </div>
     
      <div className="custom-container">
        <center>
          <CIcon icon={icon.cilUserUnfollow} className="profile" />
          <p>NUMBER OF DECEASED MEMBER: {deceasedCount}</p>
        </center>
      </div>
      
      <div className="custom-container">
        <center>
          <h2>Calendar</h2>
          <Calendar
            onChange={handleDateChange}
            value={date}
          />
        </center>
      </div>
    </div>
  );
};

export default Dashboard;
