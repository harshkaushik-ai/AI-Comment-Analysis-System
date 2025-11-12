import { useEffect, useState } from "react";
import axios from "axios";
import { Clock } from "lucide-react"; 

const CARD_BG = "bg-white border border-blue-200/50";
const HEADER_BG = "bg-blue-50";
const TEXT_COLOR = "text-gray-800";
const PRIMARY_BLUE_TEXT = "text-blue-700";

export default function History() {
  const [history, setHistory] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
const res = await axios.get("http://localhost:5000/api/analyze/history", {
  headers: { Authorization: `Bearer ${token}` },
});
        
        setHistory(res.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching history:", error);
        setError("Failed to fetch analysis history. Check server connection.");
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatPct = (value) => (value * 100).toFixed(1) + "%";

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className={`${CARD_BG} p-6 rounded-xl shadow-xl`}>
        
        
        <h2 className={`text-3xl font-bold flex items-center gap-3 mb-6 ${PRIMARY_BLUE_TEXT}`}>
          <Clock size={28} /> Analysis History
        </h2>

        {loading ? (
          <p className="text-gray-500 italic">Loading analysis history...</p>
        ) : error ? (
          <p className="text-red-600 font-medium">{error}</p>
        ) : history.length === 0 ? (
        
          <div className="text-center p-10 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
            <p className="text-xl font-medium text-gray-500">No analysis history found.</p>
            <p className="text-sm text-gray-400 mt-2">Start a new analysis to populate this list!</p>
          </div>
        ) : (
         
          <div className="overflow-x-auto rounded-xl border border-blue-300">
            <table className={`min-w-full border-collapse text-sm ${TEXT_COLOR}`}>
              <thead>
                <tr className={`${HEADER_BG} border-b border-blue-300 text-blue-800`}>
                  <th className="px-4 py-3 text-left w-1/5">Username</th>
                  <th className="px-4 py-3 text-left w-2/5">Comment</th>
                  <th className="px-4 py-3 text-center w-1/5">Toxicity</th>
                  <th className="px-4 py-3 text-center w-1/5">Status</th> 
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {history.map((c, index) => {
                  const isToxic = (c.toxicityScore ?? 0) > 0.6;
                  return (
                    <tr 
                      key={c._id || index} 
                      className={isToxic ? "bg-red-50 hover:bg-red-100/70" : "hover:bg-blue-50"}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 truncate">
                        {c.username || 'N/A'}
                      </td>
                      <td className="px-4 py-3 max-w-lg truncate">{c.text}</td>
                      <td className="px-4 py-3 text-center">
                        <span 
                          className={`font-semibold ${isToxic ? 'text-red-600' : 'text-blue-600'}`}
                        >
                          {formatPct(c.toxicityScore)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span 
                          className={`px-3 py-1 text-xs rounded-full font-medium ${
                            isToxic ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
                          }`}
                        >
                          {isToxic ? 'Flagged' : 'Clean'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
