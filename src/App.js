import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { useState, useEffect, useReducer } from "react";
import "./App.css";
import { db } from "./firebase-config";
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, where, query } from "firebase/firestore";
import Swal from 'sweetalert2';
import CIcon from '@coreui/icons-react';
import * as icon from '@coreui/icons';
import Dropdown from 'react-bootstrap/Dropdown';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import Dashboard from './Dashboard';
import { NavLink } from "react-router-dom";
import { serverTimestamp } from "firebase/firestore";





function App() {
  
  
  // Modal state
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [payorId, setPayorId] = useState(null);


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
  const paymentRef = collection(db,"payments");
  // Reducer for refreshing data
  const [reducerValue, forceUpdate] = useReducer(x => x + 1, 0);

  const [showDeceasedModal, setShowDeceasedModal] = useState(false);
  const [deceasedUsers, setDeceasedUsers] = useState([]);
  const [selectedDeceasedUser, setSelectedDeceasedUser] = useState(null);
  const [selectedPaymentList,setSelectedPaymentList] = useState([]);


  const getDeceaseByPayorId = async (id) =>{
    const q = query(paymentRef,where("payorId","==",id));

    const data = await getDocs(q);
    
    const  paymentList = data.docs.map((doc)=>({id:doc.id,...doc.data()}));
    console.log("LIST",paymentList)
    setSelectedPaymentList(paymentList)
  }

  useEffect(() => {
    const getUsers = async () => {
      try {
        const data = await getDocs(usersCollectionRef);
        const usersList = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        setUsers(usersList);
        setFilteredUsers(usersList);
        
        const deceased = usersList.filter(user => user.status === 'DECEASED');
        setDeceasedUsers(deceased);
        setHasDeceasedUsers(deceased.length > 0); // Update this line
      } catch (error) {
        console.error("Error fetching users: ", error);
      }
    };
    getUsers();
  }, [reducerValue]);
  // Add user
  const createUser = async () => {
    try {
      await addDoc(usersCollectionRef, { 
        name: newName, 
        age: Number(newAge), 
        contactNumber: newContactNumber,  // Add this line
        createdAt: serverTimestamp(),
        status: 'ACTIVE', 
        payment: 'danger' 
      });
      forceUpdate();
      setShow(false);
      Swal.fire({
        title: `success `,
        text: 'New Member Added!',
        icon: 'success',
        confirmButtonText: 'OK'
      });

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
        Swal.fire({
          title: `UPDATED `,
          text: 'Member Updated!',
          icon: 'success',
          confirmButtonText: 'OK'
        });

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
      Swal.fire({
        title: `DELETED `,
        text: 'Member Deleted!',
        icon: 'success',
        confirmButtonText: 'OK'
      });
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

 
  

 

  // Handle dropdown action click
  const handleActionClick = async (userId, status) => {
    const userDoc = doc(db, "users", userId);
    try {
      const updateData = { status: status };
      if (status === 'DECEASED') {
        updateData.deceasedDate = new Date(); // Ensure this is the current date
      } else {
        updateData.deceasedDate = null; // Reset if not deceased
      }
      await updateDoc(userDoc, updateData);
      setDropdownStatus(prevState => ({
        ...prevState,
        [userId]: status
      }));
      Swal.fire(`Member Status Updated to "${status}"!`);
      forceUpdate();
    } catch (error) {
      Swal.fire("Error updating status!");
      console.error("Error updating status: ", error);
    }
  };
  const [selectedDeceasedUsers, setSelectedDeceasedUsers] = useState([]); // Array for multiple selections


  const updatePaymentStatusForDeceased = async () => {
    if (selectedDeceasedUsers.length > 0 && payorId) {
      try {
        for (const userId of selectedDeceasedUsers) {
          const userDoc = doc(db, "users", userId);
          const currentStatus = buttonStatus[userId] || 'danger';
          const newStatus = currentStatus === 'success' ? 'danger' : 'success';
  
          await updateDoc(userDoc, { payment: newStatus });
  
          await addDoc(collection(db, "payments"), {
            userId: userId,
            payeeId: userId,
            payorId: payorId,
            status: newStatus,
            timestamp: serverTimestamp(),
          });
  
          setButtonStatus(prevState => ({
            ...prevState,
            [userId]: newStatus,
          }));
        }
  
        Swal.fire({
          title: `Payment Status`,
          text: 'Payment status updated successfully!',
          icon: 'success',
          confirmButtonText: 'OK'
        });
        setShowDeceasedModal(false);
        setSelectedDeceasedUsers([]); // Clear selections after update
      } catch (error) {
        Swal.fire("Error updating payment status!");
        console.error("Error updating payment status: ", error);
      }
    } else {
      Swal.fire("No users selected or Payor ID is not defined!");
    }
  };
  const handleCheckboxChange = (userId) => {
    setSelectedDeceasedUsers((prev) => {
      if (prev.includes(userId)) {
        // If already selected, remove it
        return prev.filter(id => id !== userId);
      } else {
        // If not selected, add it
        return [...prev, userId];
      }
    });
  };
  
  

  

  // Page numbers
  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredUsers.length / itemsPerPage); i++) {
    pageNumbers.push(i);
  }
  const handleShowDeceased = async(id) => {
    console.log("CLICK",id);
    await getDeceaseByPayorId(id);
     setShowDeceasedModal(true);
     setPayorId(id); // 
};
  

  const isHasPayment = (deceaseUserId) =>{
    const filterData = selectedPaymentList.filter(val=>deceaseUserId === val.payeeId);
    console.log(filterData)
    return filterData.length > 0;
  }

  return (
    <Router>
      <div className="App">
      <div className="container-fluid mobile-menu">
          <div className="row flex-nowrap">
            <div className="col-md-3 col-xl-1 side-bar  px-0 bg-dark ">
              <div className="d-flex flex-column align-items-center align-items-sm-start px-3 pt-2 text-white min-vh-100">
                <Link to="/" className="d-flex align-items-center pb-3 mb-md-0 me-md-auto text-white text-decoration-none">
                  <span className="fs-5 d-none d-sm-inline">Menu</span>
                  <CIcon icon={icon.cilList} className="profile p-2" />
                </Link>
                
                <ul className="nav nav-pills flex-column mb-sm-auto mb-0 align-items-center align-items-sm-start" id="menu">
                <li className="nav-item">
                  <NavLink
                    className={`nav-link align-middle px-0`}
                    to="/"
                    activeClassName="active" // Apply active class
                  >
                    <CIcon icon={icon.cilHome} className="profile" /> <span className="ms-1 d-none d-sm-inline ">Home</span>
                  </NavLink>
                  <br />
                </li>
                <li className="nav-item">
                  <NavLink
                    className={`nav-link px-0 align-middle`}
                    to="/dashboard"
                    activeClassName="active" // Apply active class
                  >
                    <CIcon icon={icon.cilColorPalette} className="profile dashboard-size" /> <span className="ms-1 d-none d-sm-inline ">Dashboard</span>
                  </NavLink>
                </li>
              </ul>
              <div>
                <img src="/images/1.jpg" alt="" className="round-image"/>
              </div>
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
                      <CIcon icon={icon.cilUserPlus} className="size" /> ADD MEMBER
                    </Button>

                    {/* Modal */}
                    <Modal show={show} onHide={handleClose}>
                      <Modal.Header closeButton>
                        <Modal.Title>{editId ? "EDIT MEMBER" : "ADD MEMBER"}</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                COMPLETE NAME:
                <center>
                  <input
                    className="form-control"
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                  />
                  </center>
                  AGE:
                  <center>
                    <input
                    type="number"
                    className="form-control"
                    value={newAge}
                    onChange={(event) => setNewAge(event.target.value)}
                  />
                  </center>
                  CONTACT NUMBER:
                  <center>
                  <input
                    type="text"
                    className="form-control"
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
                            ADD NEW MEMBER
                          </Button>
                        )}
                      </Modal.Footer>
                    </Modal>
                    <div id="modal" inert>
                    <Modal show={showDeceasedModal} onHide={() => setShowDeceasedModal(false)}>
                  <Modal.Header closeButton>
                   <Modal.Title style={{ textAlign: 'center' }}>PAYMENTS STATUS</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Select</th>
                        <th>Name</th>
                        <th>Payment Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deceasedUsers.map((user) => (
                        <tr key={user.id}>
                         <td className="table-radio">
                          <input
                            type="checkbox"
                            name="status"
                            value={user.id}
                            checked={selectedDeceasedUsers.includes(user.id)} // Controlled checkbox state
                            onChange={() => handleCheckboxChange(user.id)}
                          />
                        </td>

                          <td>{user.name}</td>
                          <td>
                        {isHasPayment(user.id) ? (
                          <button className="btn btn-success">Paid</button>
                        ) : (
                          <button className="btn btn-danger">Unpaid</button>
                        )}
                      </td>

                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeceasedModal(false)}>
                      Close
                    </Button>
                    <Button variant="primary" onClick={updatePaymentStatusForDeceased}>
                      Update Payment Status
                    </Button>
                  </Modal.Footer>
                </Modal>
                </div>
                    <br />
                    <br />
                    {/* Table */}
                    <Table striped bordered hover className="table table-size">
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
                                
                                  <Button variant="danger" onClick={() => handleShowDeceased(user.id)}>
                                Pay
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
