
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AuthModal from "./AuthModal";

export default function Navbar() {
  const HEADER_BG = "bg-white";
  const TEXT_COLOR = "text-gray-800";
  const ACCENT_COLOR = "text-blue-600 hover:text-blue-700";
  const TRANSITION_STYLE = "transition-all duration-300 ease-in-out";

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();


  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);


  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    alert("Logged out successfully!");
  };


  const handleProtectedNav = (path) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthOpen(true);
      alert("Please log in to access your history.");
    } else {
      navigate(path);
    }
  };

  return (
    <nav
      className={`${HEADER_BG} ${TEXT_COLOR} px-6 py-4 shadow-md flex justify-between items-center border-b border-blue-100 sticky top-0 z-50`}
    >
  
      <div
        className={`text-2xl font-extrabold tracking-tight ${ACCENT_COLOR} cursor-pointer`}
        onClick={() => navigate("/")}
      >
        <span className="text-blue-800">📊 Comment</span>
        <span className="text-blue-600">Analyzer</span>
      </div>

      
      <ul className="hidden sm:flex space-x-8 text-sm font-semibold items-center">
        <li>
          <Link
            to="/"
            className={`hover:${ACCENT_COLOR} transition border-b-2 border-transparent hover:border-blue-600 pb-1`}
          >
            Dashboard
          </Link>
        </li>

        <li>
          
          <button
            onClick={() => handleProtectedNav("/History")}
            className={`hover:${ACCENT_COLOR} transition border-b-2 border-transparent hover:border-blue-600 pb-1`}
          >
            History
          </button>
        </li>

        {/* <li>
          <Link
            to="/Docs"
            className={`hover:${ACCENT_COLOR} transition border-b-2 border-transparent hover:border-blue-600 pb-1`}
          >
            Docs
          </Link>
        </li>

        <li>
          <Link
            to="/Contact"
            className={`hover:${ACCENT_COLOR} transition border-b-2 border-transparent hover:border-blue-600 pb-1`}
          >
            Contact
          </Link>
        </li> */}

        
        <li>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-gray-700 font-medium">
                👋 Hi, {user.name || user.email}
              </span>
              <button
                onClick={handleLogout}
                className={`px-4 py-2 rounded-lg font-semibold bg-red-500 text-white hover:bg-red-600 ${TRANSITION_STYLE}`}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className={`px-4 py-2 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 ${TRANSITION_STYLE}`}
            >
              Login
            </button>
          )}

          
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            onLoginSuccess={() => {
              const storedUser = localStorage.getItem("user");
              if (storedUser) {
                setUser(JSON.parse(storedUser));
              }
              alert("Logged in successfully!");
              setIsAuthOpen(false);
            }}
          />
        </li>
      </ul>
    </nav>
  );
}

