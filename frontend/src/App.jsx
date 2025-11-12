import React from "react";
import ReelAnalyzer from "./components/ReelAnalyzer";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Docs from "./pages/Docs";
import Contact from "./pages/Contact";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";  
import History from "./pages/History";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PrivateRoute from "./utils/PrivateRoute";


function App() {
  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      <Navbar className="sticky top-0 z-50" />
      <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home
              
                 />}  />
            <Route path="/docs" element={<Docs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/history" element={<PrivateRoute><History /></PrivateRoute >} />
            <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        

          </Routes>
        </main>
      
      <Footer />
      </div>
      

    </>
  );
}

export default App;
