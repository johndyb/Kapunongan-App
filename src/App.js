import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { useState, useEffect, useReducer } from "react";
import "./App.css";
import { db } from "./firebase-config";
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import Swal from 'sweetalert2';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';
import Dropdown from 'react-bootstrap/Dropdown';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import Dashboard from './Dashboard';






function App() {
  
  // Modal state
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // Form state
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("");

  // State for users
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // State for button status
  const [buttonStatus, setButtonStatus] = useState({});
  const [newContactNumber, setNewContactNumber] = useState("");

  // State for dropdown status
  const [dropdownStatus, setDropdownStatus] = useState({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Number of items per page

  // State to check if there are any deceased users
  const [hasDeceasedUsers, setHasDeceasedUsers] = useState(false);

  // Collection reference
  const usersCollectionRef = collection(db, "users");

  // Reducer for refreshing data
  const [reducerValue, forceUpdate] = useReducer(x => x + 1, 0);

  // Add user
  const createUser = async () => {
    try {
      await addDoc(usersCollectionRef, { 
        name: newName, 
        age: Number(newAge), 
        contactNumber: newContactNumber,  // Add this line
        status: 'ACTIVE', 
        payment: 'danger' 
      });
      forceUpdate();
      setShow(false);
      Swal.fire("User Added 1 user!");

    } catch (error) {
      Swal.fire("Error adding user!");
      console.error("Error adding user: ", error);

    }
  };
  
  const handleUpdate = async () => {
    if (editId) {
      try {
        const userDoc = doc(db, "users", editId);
        await updateDoc(userDoc, { 
          name: newName, 
          age: Number(newAge), 
          contactNumber: newContactNumber // Add this line
          
        });
        forceUpdate();
        setEditId(null);
        setShow(false);
        Swal.fire("User Updated!");

      } catch (error) {
        Swal.fire("Error updating user!");
        console.error("Error updating user: ", error);


      }
    }
  };
  

  // Delete user
  const deleteUser = async (id) => {
    try {
      const userDoc = doc(db, "users", id);
      await deleteDoc(userDoc);
      forceUpdate();
      Swal.fire("User Deleted!");
    } catch (error) {
      Swal.fire("Error deleting user!");
      console.error("Error deleting user: ", error);
    }
  };

  // Handle edit button click
  const handleEdit = (id, name, age, contactNumber) => {
    setNewName(name);
    setNewAge(age);
    setNewContactNumber(contactNumber);
    setEditId(id);
    handleShow();
  };

  // Handle search input change
  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Fetch users
  useEffect(() => {
    const getUsers = async () => {
      try {
        const data = await getDocs(usersCollectionRef);
        const usersList = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        setUsers(usersList);
        setFilteredUsers(usersList);

        // Initialize button and dropdown statuses
        const statusMap = usersList.reduce((acc, user) => {
          acc[user.id] = user.payment || 'danger'; // Default to 'danger' if payment field is not set
          return acc;
        }, {});
        setButtonStatus(statusMap);

        const dropdownStatusMap = usersList.reduce((acc, user) => {
          acc[user.id] = user.status;
          return acc;
        }, {});
        setDropdownStatus(dropdownStatusMap);

        // Check if there are any deceased users
        const hasDeceased = usersList.some(user => user.status === 'DECEASED');
        setHasDeceasedUsers(hasDeceased);
      } catch (error) {
        console.error("Error fetching users: ", error);
      }
    };

    getUsers();
  }, [reducerValue]);

  // Update filtered users whenever users or search term changes
  useEffect(() => {
    const filteredItems = users.filter((user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filteredItems);
  }, [users, searchTerm]);

  // Pagination calculation
  const indexOfLastUser = currentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;

  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle button color and icon toggle
  const handleStatusToggle = async (userId) => {
    try {
      // Check if the user is deceased
      if (dropdownStatus[userId] === 'DECEASED') {
        Swal.fire("Cannot update payment status for deceased users!");
        return;
      }

      // Get the current status of the payment button
      const currentStatus = buttonStatus[userId] || 'danger';
      // Toggle the payment status
      const newStatus = currentStatus === 'success' ? 'danger' : 'success';

      // Update the payment status in the database
      const userDoc = doc(db, "users", userId);
      await updateDoc(userDoc, { payment: newStatus });

      // Update the button status state
      setButtonStatus(prevState => ({
        ...prevState,
        [userId]: newStatus
      }));

      // Show success message
      Swal.fire(`Payment status updated to ${newStatus === 'success' ? 'Paid' : 'Unpaid'}!`);
    } catch (error) {
      Swal.fire("Error updating status!");
      console.error("Error updating status: ", error);
    }
  };

  // Handle dropdown action click
  const handleActionClick = async (userId, status) => {
    const userDoc = doc(db, "users", userId);
  
    try {
      const updateData = { status: status };
      if (status === 'DECEASED') {
        // Set the date when user is marked as deceased
        updateData.deceasedDate = new Date();
      } else {
        // Clear the deceased date if status is not DECEASED
        updateData.deceasedDate = null;
      }
      
      await updateDoc(userDoc, updateData);
      setDropdownStatus(prevState => ({
        ...prevState,
        [userId]: status
      }));
      Swal.fire(`User status updated to ${status}!`);
      forceUpdate();
    } catch (error) {
      Swal.fire("Error updating status!");
      console.error("Error updating status: ", error);
    }
  };
  

  // Page numbers
  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredUsers.length / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    
    <Router>
      <div className="App">
        <Navbar className="header">
          <Container>
            <Navbar.Brand href="#home"></Navbar.Brand>
            <Navbar.Toggle />
            <Navbar.Collapse className="justify-content-end">
              <Navbar.Text>
                Signed in as: <a href="#login" className="alot">ADMIN</a>
                <CIcon icon={icon.cilUser} className="profile" />
              </Navbar.Text>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      <div className="container-fluid">
          <div className="row flex-nowrap">
            <div className="col-md-3 col-xl-1 px-sm-1 px-0 bg-dark">
              <div className="d-flex flex-column align-items-center align-items-sm-start px-3 pt-2 text-white min-vh-100">
                <Link to="/" className="d-flex align-items-center pb-3 mb-md-0 me-md-auto text-white text-decoration-none">
                  <span className="fs-5 d-none d-sm-inline">Menu</span>
                  <CIcon icon={icon.cilList} className="profile p-2" />
                </Link>
                <ul className="nav nav-pills flex-column mb-sm-auto mb-0 align-items-center align-items-sm-start" id="menu">
                <li className="nav-item">
                  <Link className={`nav-link align-middle px-0 ${window.location.pathname === '/' ? 'active' : ''}`} to="/"><Navbar.Toggle />
                    <CIcon icon={icon.cilHome} className="profile" /> <span className="ms-1 d-none d-sm-inline">Home</span>
                  </Link>
                  <br />
                </li>
                <li className="nav-item">
                  <Link className={`nav-link px-0 align-middle ${window.location.pathname === '/dashboard' ? 'active' : ''}`} to="/dashboard">
                    <CIcon icon={icon.cilColorPalette} className="profile" /> <span className="ms-1 d-none d-sm-inline">Dashboard</span>
                  </Link>
                </li>
              </ul>
              <div className="dropdown pb-4">
                  <a href="#" className="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
                    <span className="d-none d-sm-inline mx-1">ADMIN</span>
                  </a>
                  <ul className="dropdown-menu dropdown-menu-dark text-small shadow">
                    <li><a className="dropdown-item" href="#">Profile</a></li>
                    <li><a className="dropdown-item" href="#">Sign out</a></li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="col py-3">
              <Routes>
                <Route path="/" element={
                  <>
                    <CIcon icon={icon.cilSearch} className="size1" />
                    <input
                      type="text"
                      className="custom-size"
                      value={searchTerm}
                      onChange={handleInputChange}
                      placeholder='Type to search'
                    />
                    <Button variant="primary" onClick={() => { setNewName(""); setNewAge(""); setNewContactNumber(""); setEditId(null); handleShow(); }}>
                      <CIcon icon={icon.cilUserPlus} className="size" /> ADD USER
                    </Button>

                    {/* Modal */}
                    <Modal show={show} onHide={handleClose}>
                      <Modal.Header closeButton>
                        <Modal.Title>{editId ? "EDIT MEMBER" : "ADD MEMBER"}</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                <center>
                  <input
                    placeholder="Name"
                    className="form-control"
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                  />
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Age"
                    value={newAge}
                    onChange={(event) => setNewAge(event.target.value)}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Contact Number"
                    value={newContactNumber}
                    onChange={(event) => setNewContactNumber(event.target.value)}
                  />
                </center>
              </Modal.Body>
                      <Modal.Footer>
                        <Button variant="secondary" onClick={handleClose}>
                          Close
                        </Button>
                        {editId ? (
                          <Button variant="primary" onClick={handleUpdate}>
                            Update
                          </Button>
                        ) : (
                          <Button variant="primary" onClick={createUser}>
                            Save Changes
                          </Button>
                        )}
                      </Modal.Footer>
                    </Modal>
                    <br />
                    <br />

                    {/* Table */}
                    <Table striped bordered hover className="table theader">
                      <thead>
                      <tr>
                      <th>NAME</th>
                      <th>AGE</th>
                      <th>CONTACT NUMBER</th> {/* New column */}
                      <th>ACTIONS</th>
                      <th>STATUS</th>
                      <th>PAYMENT STATUS</th>
                      <th>DECEASED DATE</th>
                    </tr>
                      </thead>
                      <tbody>
                        {currentUsers.map((user) => (
                          <tr key={user.id}>
                            <td>{user.name}</td>
                            <td className="col-actions1">{user.age}</td>
                            <td className="col-actions1">{user.contactNumber}</td> {/* New cell */}
                            <td className="col-actions1">
                            <Button variant="danger" onClick={() => deleteUser(user.id)}>
                              <CIcon icon={icon.cilTrash} className="size" />
                            </Button>
                            <Button variant="info" onClick={() => handleEdit(user.id, user.name, user.age, user.contactNumber)}>
                              <CIcon icon={icon.cilColorBorder} className="size" />
                            </Button>
                          </td>
                            <td className="col-actions1">
                              <Dropdown>
                                <Dropdown.Toggle
                                  variant={dropdownStatus[user.id] === 'DECEASED' ? 'danger' : 'secondary'}
                                  id={`dropdown-basic-${user.id}`}
                                >
                                  {dropdownStatus[user.id] || 'ACTIVE'}
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                  <Dropdown.Item onClick={() => handleActionClick(user.id, 'DECEASED')}>
                                    Deceased
                                  </Dropdown.Item>
                                  <Dropdown.Item onClick={() => handleActionClick(user.id, 'ACTIVE')}>
                                    Active
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </td>
                            <td className="col-actions">
                              {/* Conditionally render the payment status button */}
                              {hasDeceasedUsers && dropdownStatus[user.id] !== 'DECEASED' && (
                                <Button
                                  variant={buttonStatus[user.id] || 'danger'}
                                  onClick={() => handleStatusToggle(user.id)}
                                >
                                  <CIcon
                                    icon={buttonStatus[user.id] === 'success' ? icon.cilCheckCircle : icon.cilXCircle}
                                    className="size"
                                  />
                                </Button>
                              )}
                              
                              {dropdownStatus[user.id] === 'DECEASED' && (
                                <Button
                                  variant="warning"
                                  onClick={() => Swal.fire("No payment status for deceased users.")}
                                >
                                  <CIcon icon={icon.cilBan} className="size" />
                                </Button>
                              )}
                              
                            </td>
                            <td className="col-actions1">
                           {user.deceasedDate ? new Date(user.deceasedDate.toDate()).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                    {/* Pagination */}
                    <nav aria-label="Page navigation example">
                      <ul className="pagination justify-content-center">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <a className="page-link" href="#" onClick={() => handlePageChange(currentPage - 1)}>Previous</a>
                        </li>
                        {pageNumbers.map(number => (
                          <li key={number} className={`page-item ${number === currentPage ? 'active' : ''}`}>
                            <a className="page-link" href="#" onClick={() => handlePageChange(number)}>{number}</a>
                          </li>
                        ))}
                        <li className={`page-item ${currentPage === pageNumbers.length ? 'disabled' : ''}`}>
                          <a className="page-link" href="#" onClick={() => handlePageChange(currentPage + 1)}>Next</a>
                        </li>
                      </ul>
                    </nav>
                  </>
                } />
                <Route path="/dashboard" element={<Dashboard />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
