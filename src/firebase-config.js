
import { initializeApp } from "firebase/app";
import { getFirestore } from '@firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBffhU1l1lq6OfxD7MkILLl1pcC6fwsRpo",
  authDomain: "fir-tutorial-5ca55.firebaseapp.com",
  projectId: "fir-tutorial-5ca55",
  storageBucket: "fir-tutorial-5ca55.appspot.com",
  messagingSenderId: "396444860156",
  appId: "1:396444860156:web:7ac49c20e0ae2d97532179",
  measurementId: "G-R1NH9R1JYY"
};


const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);