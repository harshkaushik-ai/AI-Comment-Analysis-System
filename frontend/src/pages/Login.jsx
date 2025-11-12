
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  
  const ACCENT_BLUE = "blue-600";
  const HOVER_BLUE = "blue-700";
  const BG_COLOR = "bg-blue-50/50"; 
  const CARD_BG = "bg-white";
  const BORDER_COLOR = "border-blue-300 focus:border-blue-500";


  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
      console.log("🔑 Received token:", res.data.token);
      localStorage.setItem("token", res.data.token);
      setMessage("✅ Login successful! Redirecting...");
      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      
      const errorMessage = err.response?.data?.message || "Invalid credentials.";
      setMessage(`❌ ${errorMessage}`);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-[90vh] ${BG_COLOR}`}>
      <form
        onSubmit={handleLogin}
        className={`${CARD_BG} p-10 rounded-xl shadow-2xl w-full max-w-sm border border-blue-100`}
      >
        <h2 className="text-3xl font-extrabold mb-6 text-center text-blue-800">
         Login
        </h2>
        
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full border-2 ${BORDER_COLOR} rounded-lg p-3 mb-4 outline-none transition duration-200 text-gray-700`}
          required
        />
        
    
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full border-2 ${BORDER_COLOR} rounded-lg p-3 mb-6 outline-none transition duration-200 text-gray-700`}
          required
        />
        
      
        <button
          type="submit"
          className={`w-full bg-${ACCENT_BLUE} text-white py-3 rounded-lg font-semibold hover:bg-${HOVER_BLUE} transition shadow-md`}
        >
          Access Dashboard
        </button>

        <p className="text-center mt-5 text-sm text-gray-600">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/signup")}
            className={`text-${ACCENT_BLUE} cursor-pointer font-medium hover:underline`}
          >
            Sign up 
          </span>
        </p>

        {message && (
          <p className={`text-center mt-4 font-medium ${message.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default Login;