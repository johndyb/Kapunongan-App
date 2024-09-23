import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase-config";
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Import the CSS for the calendar
import "./dashbard.css"; // Ensure the CSS file name is correct

const Dashboard = () => {
  const [userCount, setUserCount] = useState(0);
  const [deceasedCount, setDeceasedCount] = useState(0);
  const [newMembersCount, setNewMembersCount] = useState(0); // New state for new members
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

  const countNewMembersThisMonth = async () => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const endOfMonth = new Date();
    endOfMonth.setHours(23, 59, 59, 999); // End of the current day

    try {
      const q = query(
        usersCollectionRef,
        where("createdAt", ">=", startOfMonth),
        where("createdAt", "<=", endOfMonth)
      );
      const data = await getDocs(q);
      return data.size; // Number of new members added this month
    } catch (error) {
      console.error("Error counting new members: ", error);
    }
  };

  useEffect(() => {
    const fetchUserCounts = async () => {
      const totalCount = await countUsers();
      setUserCount(totalCount);
      
      const deceasedCount = await countDeceasedUsers();
      setDeceasedCount(deceasedCount);

      const newCount = await countNewMembersThisMonth();
      setNewMembersCount(newCount); // Set the new members count
    };

    fetchUserCounts();
  }, []);

  // Handle date change
  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  return (
    <div className="mobile-menu">
      <h1>Dashboard</h1>
      <p>Welcome to the Dashboard!</p>

      <div className="container">
        <div className="row text-center">
          {/* Total Members */}
          <div className="col">
            <div className="card-container total-members">
            <br/>
              <CIcon icon={icon.cilPeople} className="profile" />
              <p>TOTAL MEMBERS: {userCount}</p>
            </div>
          </div>

          {/* Deceased Members */}
          <div className="col">
            <div className="card-container deceased-members">
            <br/>
              <CIcon icon={icon.cilUserUnfollow} className="profile" />
              <p>TOTAL DECEASED MEMBERS: {deceasedCount}</p>
            </div>
          </div>

          {/* New Members This Month */}
          <div className="col">
            <div className="card-container new-members">
            <br/>
              <CIcon icon={icon.cilUserPlus} className="profile" />
              <p>NEW MEMBER FOR THIS MONTH: {newMembersCount}</p>
            </div>
          </div>

          {/* Calendar */}
          <div className="col">
            <div className="card-container calendar">
            <CIcon icon={icon.cilCalendar} className="profile" />
              <h4>CALENDAR</h4>
              <Calendar
                onChange={handleDateChange}
                value={date}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
