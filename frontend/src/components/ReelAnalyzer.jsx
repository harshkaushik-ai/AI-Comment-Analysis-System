import React, { useState, useMemo, useCallback, useEffect } from "react";
import axios from "axios";
import { CSVLink } from "react-csv";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Search, EyeOff, Eye, Download, Copy, Trash2, Check, RotateCcw, Filter, Sun, Moon } from "lucide-react";


const PRIMARY_COLOR = "indigo"; 
const PRIMARY_HEX = "#4f46e5"; 
const DANGER_COLOR = "red";
const PRIMARY_LIGHT = "bg-indigo-600 hover:bg-indigo-700 text-white";
const SECONDARY_LIGHT = "bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200";
const BACKGROUND_LIGHT = "bg-gray-50";
const CARD_BG_LIGHT = "bg-white border border-gray-200";
const TEXT_COLOR_LIGHT = "text-gray-800";
const HEADER_BG_LIGHT = "bg-indigo-50";

const BACKGROUND_DARK = "bg-gray-900";
const CARD_BG_DARK = "bg-gray-800 border border-indigo-700/50";
const TEXT_COLOR_DARK = "text-gray-100";
const HEADER_BG_DARK = "bg-indigo-900/30";


const TOXIC_THRESH = 0.6; 
const TRANSITION_STYLE = "transition-all duration-300 ease-in-out";


const TOXICITY_RANGES = [
  { label: "0% (Min)", value: 0.0 },
  { label: "20%", value: 0.2 },
  { label: "40%", value: 0.4 },
  { label: "60%", value: 0.6 },
  { label: "80%", value: 0.8 },
  { label: "100% (Max)", value: 1.0 },
];


const LENGTH_OPTIONS = [
  { label: "All Lengths", value: "all" },
  { label: "Short (1-20 chars)", value: "short" },
  { label: "Medium (21-80 chars)", value: "medium" },
  { label: "Long (80+ chars)", value: "long" },
];

function formatPct(v) {
  return (v * 100).toFixed(1) + "%";
}

const SkeletonCard = ({ isDark, className = "" }) => (
  <div className={`${isDark ? CARD_BG_DARK : CARD_BG_LIGHT} p-6 rounded-xl shadow-lg h-48 ${className}`}>
    <div className={`h-4 ${isDark ? 'bg-indigo-800' : 'bg-indigo-200'} rounded w-1/2 mb-4`}></div>
    <div className={`h-10 ${isDark ? 'bg-indigo-700' : 'bg-indigo-300'} rounded w-1/3 mb-4`}></div>
    <div className={`h-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-2/3`}></div>
  </div>
);

const LoadingSkeleton = ({ isDark }) => (
  <div className="space-y-8 animate-pulse">
   
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <SkeletonCard isDark={isDark} />
      <div className={`${isDark ? CARD_BG_DARK : CARD_BG_LIGHT} p-6 rounded-xl shadow-lg h-48 lg:col-span-1`}>
        <div className={`h-4 ${isDark ? 'bg-indigo-800' : 'bg-indigo-200'} rounded w-1/2 mb-4`}></div>
        <div className={`h-28 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full w-28 mx-auto`}></div>
      </div>
      <div className={`${isDark ? CARD_BG_DARK : CARD_BG_LIGHT} p-6 rounded-xl shadow-lg h-48 lg:col-span-1`}>
        <div className={`h-4 ${isDark ? 'bg-indigo-800' : 'bg-indigo-200'} rounded w-1/2 mb-4`}></div>
        <div className={`h-32 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
      </div>
    </div>

    
    <div className={`${isDark ? CARD_BG_DARK : CARD_BG_LIGHT} p-6 rounded-xl shadow-lg`}>
      <div className={`h-5 ${isDark ? 'bg-indigo-600' : 'bg-indigo-800'} rounded w-1/4 mb-6`}></div>
      <div className="flex justify-between mb-4">
        <div className={`h-10 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/3`}></div>
        <div className={`h-10 ${isDark ? 'bg-indigo-600' : 'bg-indigo-600'} rounded w-28`}></div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-indigo-300/50">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`flex justify-between items-center px-4 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'} ${i % 2 === 0 ? (isDark ? 'bg-gray-800' : 'bg-white') : (isDark ? 'bg-gray-700/50' : 'bg-gray-50')}`}>
            <div className={`h-3 ${isDark ? 'bg-gray-600' : 'bg-gray-200'} rounded w-1/6`}></div>
            <div className={`h-3 ${isDark ? 'bg-gray-600' : 'bg-gray-200'} rounded w-1/2`}></div>
            <div className={`h-3 ${isDark ? 'bg-gray-600' : 'bg-gray-200'} rounded w-1/6`}></div>
            <div className={`h-8 w-12 ${isDark ? 'bg-gray-600' : 'bg-gray-300'} rounded-full`}></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);



export default function ReelAnalyzer() {
  
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [avgToxicity, setAvgToxicity] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [hideToxic, setHideToxic] = useState(false);
  const [sortKey, setSortKey] = useState("toxicity");
  const [sortDir, setSortDir] = useState("desc");
  const [minToxicity, setMinToxicity] = useState(0.0);
  const [maxToxicity, setMaxToxicity] = useState(1.0);
  const [lengthFilter, setLengthFilter] = useState("all");
  const [nextToken, setNextToken] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  

  const [pendingHides, setPendingHides] = useState({});
  
  const [toastMessage, setToastMessage] = useState(null);
  
 
  const [isDark, setIsDark] = useState(false); 


  const CURRENT_BG = isDark ? BACKGROUND_DARK : BACKGROUND_LIGHT;
  const CURRENT_CARD_BG = isDark ? CARD_BG_DARK : CARD_BG_LIGHT;
  const CURRENT_TEXT_COLOR = isDark ? TEXT_COLOR_DARK : TEXT_COLOR_LIGHT;
  const CURRENT_HEADER_BG = isDark ? HEADER_BG_DARK : HEADER_BG_LIGHT;
  const CURRENT_PRIMARY = isDark ? "bg-indigo-500 hover:bg-indigo-600 text-white" : PRIMARY_LIGHT;
  const CURRENT_SECONDARY = isDark ? "bg-gray-700 hover:bg-gray-600 text-indigo-300" : SECONDARY_LIGHT;
  const COLORS = isDark ? ['#6366f1', '#f87171'] : ['#4f46e5', '#ef4444']; 

 



const analyzeUrl = useCallback(async () => {
  setError("");
  setLoading(true);

  try {
    if (!url || (!url.includes("instagram.com") && !url.includes("youtube.com") && !url.includes("youtu.be") && !url.includes("facebook.com"))) {
      setError("Enter a valid Instagram or YouTube URL.");
      setLoading(false);
      return;
    }

    const res = await axios.post("http://localhost:5000/api/analyze", { url });

    const resComments = (res.data.comments || []).map((c) => ({
      id: c.id ?? c._id ?? c.igCommentId ?? crypto.randomUUID(),
      username: c.username ?? "unknown_user",
      text: c.text ?? "",
      toxicity:
        typeof c.toxicity === "number"
          ? c.toxicity
          : typeof c.overallToxicity === "number"
          ? c.overallToxicity
          : 0,
      hidden: !!c.hidden,
    }));

    setComments(resComments);
    setAvgToxicity(res.data.avgToxicity ?? 0);
  setNextToken(res.data.nextToken || null);
  } catch (err) {
    console.error("Error analyzing URL:", err);
    setError(err.response?.data?.error || err.message || "Analysis failed");
  } finally {
    setLoading(false);
  }
}, [url]);

  // const analyzeReel = useCallback(async () => {
  //   setError("");
  //   setLoading(true);
  //   try {
  //     if (!reelUrl || !reelUrl.includes("instagram.com")) {
  //       setError("Enter a valid Instagram Reel URL.");
  //       setLoading(false);
  //       return;
  //     }

      
  //     const res = await axios.post("http://localhost:5000/api/analyze", { reelUrl });
  //     const resComments = (res.data.comments || []).map((c) => ({
  //       id: c.id ?? c._id ?? c.igCommentId ?? crypto.randomUUID(), 
  //       username: c.username ?? "unknown_user",
  //       text: c.text ?? "",
  //       toxicity: typeof c.toxicity === "number" ? c.toxicity : (typeof c.overallToxicity === "number" ? c.overallToxicity : 0),
  //       hidden: !!c.hidden,
  //     }));


  //     setComments(resComments);
  //     setAvgToxicity(res.data.avgToxicity ?? 0);
  //   } catch (err) {
  //     console.error("Error analyzing reel:", err);
  //     setError(err.response?.data?.error || err.message || "Analysis failed");
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [reelUrl]);


  
  const visibleComments = useMemo(() => {
    let arr = comments.filter(c =>
      
      !c.hidden &&
      !pendingHides.hasOwnProperty(c.id) &&
      !(hideToxic && c.toxicity > TOXIC_THRESH)
    );

 
    arr = arr.filter(c => c.toxicity >= minToxicity && c.toxicity <= maxToxicity);

    arr = arr.filter(c => {
      const len = c.text.length;
      if (lengthFilter === "short") return len >= 1 && len <= 20;
      if (lengthFilter === "medium") return len > 20 && len <= 80;
      if (lengthFilter === "long") return len > 80;
      return true; // "all"
    });

    
    if (search) {
      const s = search.toLowerCase();
      arr = arr.filter(c => c.text.toLowerCase().includes(s) || c.username.toLowerCase().includes(s) || c.id.includes(s));
    }

  
    arr.sort((a, b) => {
      let v = sortKey === "username" ? a.username.localeCompare(b.username) : a.toxicity - b.toxicity;
      return sortDir === "asc" ? v : -v;
    });
    return arr;
  }, [comments, hideToxic, search, sortKey, sortDir, pendingHides, minToxicity, maxToxicity, lengthFilter]);
  

  const histData = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0];
    comments.forEach(c => {
      const t = Math.max(0, Math.min(1, (c.toxicity || 0)));
      const idx = Math.min(4, Math.floor(t * 5));
      buckets[idx] += 1;
    });
    return [
      { name: "0–20%", count: buckets[0] },
      { name: "20–40%", count: buckets[1] },
      { name: "40–60%", count: buckets[2] },
      { name: "60–80%", count: buckets[3] },
      { name: "80–100%", count: buckets[4] },
    ];
  }, [comments]);

  const pieData = useMemo(() => {
    const toxic = comments.filter(c => c.toxicity > TOXIC_THRESH).length;
    const clean = comments.length - toxic;
    return [
      { name: "Clean", value: clean },
      { name: "Toxic", value: toxic },
    ];
  }, [comments]);

  const csvData = useMemo(() => comments.map(c => ({
    id: c.id, username: c.username, text: c.text, toxicity: c.toxicity
  })), [comments]);




  const showToast = useCallback((message) => {
 
    setToastMessage(message);
    const timer = setTimeout(() => setToastMessage(null), 10000); 
    return () => clearTimeout(timer); 
  }, []); 

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
    showToast("ID Copied!");
  };


  const clearPendingHide = useCallback((id) => {
    setPendingHides(prev => {
        const timerId = prev[id];
        if (timerId) {
            clearTimeout(timerId);
        }
        const newHides = { ...prev };
        delete newHides[id];
        return newHides;
    });
  }, []);

  const startHideComment = useCallback((id) => {
    clearPendingHide(id); 

    const timer = setTimeout(() => {
        setComments(prev => prev.map(c => c.id === id ? { ...c, hidden: true } : c));
        
        setPendingHides(prev => {
            const newHides = { ...prev };
            delete newHides[id];
            return newHides;
        });

        showToast("Comment permanently hidden.");
    }, 10000); 
    

    setPendingHides(prev => ({
        ...prev,
        [id]: timer,
    }));

    
    showToast(
      <div className="flex items-center gap-2">
        Comment queued for hiding (10s).
        <button
          onClick={() => undoHideComment(id)}
          className="ml-2 px-3 py-1 bg-white text-indigo-600 rounded-full text-xs font-semibold hover:bg-gray-100 flex items-center gap-1 shadow-md"
        >
          <RotateCcw size={14} /> Undo
        </button>
      </div>
    );
  }, [clearPendingHide, showToast]);

  const undoHideComment = useCallback((id) => {
    clearPendingHide(id); 
    showToast("Undo successful. Comment restored.");
  }, [clearPendingHide, showToast]);
  
  const unhideComment = useCallback((id) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, hidden: false } : c));
    showToast("Comment unhidden.");
  }, [showToast]);

  const toggleHideComment = useCallback((id, currentlyHidden) => {
    if (currentlyHidden) {
      unhideComment(id);
    } else {
      startHideComment(id);
    }
  }, [unhideComment, startHideComment]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(pendingHides).forEach(clearTimeout);
    };
  }, [pendingHides]); 

const fetchComments = async (token = null) => {
  try {
    if (token) setLoadingMore(true);
    const res = await axios.post("http://localhost:5000/api/analyze", {
      url,
      nextToken: token,
    });

    const raw = res.data.comments || [];

      // Normalize incoming comment shape to match the initial analyze mapping
      const newComments = raw.map((c) => ({
        id: c.id ?? c._id ?? c.igCommentId ?? crypto.randomUUID(),
    username: c.username || c.author || c.user?.username || "unknown_user",
        text: c.text ?? c.textDisplay ?? "",
        toxicity: typeof c.toxicity === "number" ? c.toxicity : (typeof c.overallToxicity === "number" ? c.overallToxicity : 0),
        hidden: !!c.hidden,
      }));

    // Deduplicate by id in case the backend returns overlapping pages
    setComments((prev) => {
      const existing = new Set(prev.map((p) => p.id));
      const filtered = newComments.filter((nc) => !existing.has(nc.id));
      if (filtered.length === 0) {
        // no new items — keep previous
        return prev;
      }
      return [...prev, ...filtered];
    });
    setNextToken(res.data.nextToken || null);
  } catch (err) {
    console.error("Error loading comments:", err);
  } finally {
    if (token) setLoadingMore(false);
  }
};



  return (
    <div className={`${CURRENT_BG} min-h-screen p-4 md:p-10 font-sans ${CURRENT_TEXT_COLOR} ${TRANSITION_STYLE}`}>
      
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`fixed bottom-4 right-4 bg-indigo-600 text-white p-3 rounded-xl shadow-2xl flex items-center gap-2 z-50 text-sm font-medium ${TRANSITION_STYLE}`}
          >
            {typeof toastMessage === 'string' && <Check size={18} />}
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
      

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto flex justify-between items-center mb-10">
        <h1 className={`text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-800 ${isDark ? 'drop-shadow-[0_2px_2px_rgba(79,46,255,0.7)]' : 'drop-shadow-md'} ${TRANSITION_STYLE}`}>
          <span role="img" aria-label="Microscope">🔬</span> AI Comment Analysis System
        </h1>
        <button
          onClick={() => setIsDark(p => !p)}
          className={`p-2 rounded-full ${isDark ? 'bg-gray-800 text-yellow-300 hover:bg-gray-700' : 'bg-white text-indigo-600 hover:bg-gray-100'} shadow-md border ${isDark ? 'border-indigo-700' : 'border-gray-200'} ${TRANSITION_STYLE}`}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </motion.div>

      <div className="max-w-7xl mx-auto space-y-10">
      
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className={`${CURRENT_CARD_BG} p-6 rounded-xl shadow-lg lg:col-span-5`}>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <input
                className={`flex-grow ${isDark ? 'bg-gray-700 text-gray-200 border-indigo-700' : 'bg-indigo-50 text-gray-700 border-indigo-300'} p-3 rounded-xl outline-none border focus:ring-2 focus:ring-indigo-500 transition duration-150 font-mono`}
                placeholder="Paste Instagram reel URL or Facebook reel URL or Youtube Video URL for analysis ... "
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button
                onClick={analyzeUrl}
                disabled={loading}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition duration-150 shadow-md ${CURRENT_PRIMARY} disabled:opacity-50`}
              >
                {loading ? "Analyzing..." : <><Search size={18} /> Analyze Reel</>}
              </button>
              <button
                onClick={() => { setUrl(""); setComments([]); setAvgToxicity(null); setError(""); }}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition duration-150 shadow-md ${CURRENT_SECONDARY}`}
              >
                <Trash2 size={18} /> Clear
              </button>
            </div>
            {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center text-red-500 font-medium italic">{error}</motion.div>}
          </div>
        </div>


        
        {loading && comments.length === 0 ? (
            <LoadingSkeleton isDark={isDark} />
        ) : comments.length > 0 ? (
            <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
      
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`${CURRENT_CARD_BG} p-6 rounded-xl shadow-xl lg:col-span-1 border-l-4 border-indigo-500`}>
                        <h3 className={`text-lg font-bold text-indigo-500 mb-2`}>Overall Toxicity Score</h3>
                        <div className="flex items-baseline gap-2 mb-4">
                            <div className={`text-6xl font-extrabold text-${PRIMARY_COLOR}-700 ${isDark ? 'text-indigo-400' : 'text-indigo-800'}`}>
                            {avgToxicity !== null ? formatPct(avgToxicity) : "--"}
                            </div>
                        </div>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                            Analysis based on **{comments.length}** comments processed by the sentiment model.
                        </p>
                    </motion.div>

             
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`${CURRENT_CARD_BG} p-6 rounded-xl shadow-xl lg:col-span-1 border-l-4 border-indigo-500`}>
                        <h3 className={`text-lg font-bold text-indigo-500 mb-1`}>Clean vs. Toxic Breakdown (&gt;{TOXIC_THRESH * 100}%)</h3>
                        <div className="flex flex-col items-center justify-center" style={{ width: "100%", height: 200 }}>
                            <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={5}
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={isDark ? 'none' : 'white'} />
                                ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ background: isDark ? '#1f2937' : 'white', border: `1px solid ${isDark ? '#4f46e5' : '#e5e7eb'}`, borderRadius: '6px' }} 
                                    formatter={(value, name, props) => [`${value} comments`, props.payload.percent !== undefined ? formatPct(props.payload.percent) : '']} 
                                />
                                <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '10px', color: isDark ? 'white' : '#1f2937' }} />
                            </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

             
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className={`${CURRENT_CARD_BG} p-6 rounded-xl shadow-xl lg:col-span-1 border-l-4 border-indigo-500`}>
                        <h3 className={`text-lg font-bold text-indigo-500 mb-4`}>Toxicity Distribution (5 Bins)</h3>
                        <div style={{ width: "100%", height: 200 }}>
                            <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={histData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                                <XAxis dataKey="name" stroke={isDark ? '#9ca3af' : '#6b7280'} style={{ fontSize: '10px' }} />
                                <YAxis allowDecimals={false} stroke={isDark ? '#9ca3af' : '#6b7280'} />
                                <Tooltip contentStyle={{ background: isDark ? '#1f2937' : 'white', border: `1px solid ${isDark ? '#4f46e5' : '#e5e7eb'}`, borderRadius: '6px' }} formatter={(value) => [value, "Comments"]} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {histData.map((entry, idx) => (
                                    <Cell
                                    key={`cell-${idx}`}
                                    fill={idx >= 3 ? COLORS[1] : COLORS[0]} 
                                    />
                                ))}
                                </Bar>
                            </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>

                
                <div className={`${CURRENT_CARD_BG} p-6 rounded-xl shadow-xl`}>
                    <h2 className={`text-2xl font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-800'} mb-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} pb-2`}>
                        <Filter size={20} className="inline mr-2 align-text-bottom" /> Filtered Comments
                    </h2>

                    <div className="flex flex-wrap items-end justify-between mb-6 gap-4 border-b border-dashed border-gray-300/50 pb-4">
                        
                       
                        <div className="flex flex-wrap items-end gap-4">
                          
                            <div className="relative w-full sm:max-w-xs">
                                <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} block mb-1`}>Search</label>
                                <Search size={18} className={`absolute left-3 bottom-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                                <input
                                type="text"
                                placeholder="Search comments or users..."
                                className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'} ${TRANSITION_STYLE}`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                
                                />
                            </div>

                            
                            <div className="w-full sm:max-w-[140px]">
                                <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} block mb-1`}>Min Toxicity</label>
                                <select
                                    value={minToxicity}
                                    onChange={(e) => setMinToxicity(parseFloat(e.target.value))}
                                    className={`w-full py-2 px-3 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-500 outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'} ${TRANSITION_STYLE}`
                                  }
                                  style={{
      backgroundColor: isDark ? '#374151' : '#ffffff',
      color: isDark ? '#ffffff' : '#1f2937',
    }}
                                >
                                    {TOXICITY_RANGES.map(r => (
                                        <option key={`min-${r.value}`} value={r.value} disabled={r.value > maxToxicity}>
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                           
                            <div className="w-full sm:max-w-[140px]">
                                <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} block mb-1`}>Max Toxicity</label>
                                <select
                                    value={maxToxicity}
                                    onChange={(e) => setMaxToxicity(parseFloat(e.target.value))}
                                    className={`w-full py-2 px-3 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-500 outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'} ${TRANSITION_STYLE}`}
                                style={{
                                        backgroundColor: isDark ? '#374151' : '#ffffff',
      color: isDark ? '#ffffff' : '#1f2937',
    }}
                                >
                                    {TOXICITY_RANGES.map(r => (
                                        <option key={`max-${r.value}`} value={r.value} disabled={r.value < minToxicity}>
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            
                            <div className="w-full sm:max-w-[140px]">
                                <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} block mb-1`}>Comment Length</label>
                                <select
                                    value={lengthFilter}
                                    onChange={(e) => setLengthFilter(e.target.value)}
                                    className={`w-full py-2 px-3 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-500 outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'} ${TRANSITION_STYLE}`}
                                
                                style={{
      backgroundColor: isDark ? '#374151' : '#ffffff',
      color: isDark ? '#ffffff' : '#1f2937',
    }}>
                                    {LENGTH_OPTIONS.map(l => (
                                        <option key={l.value} value={l.value}>
                                            {l.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            
                            <div className="flex items-end h-[42px] mb-1">
                                <label className={`inline-flex items-center text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} whitespace-nowrap`}>
                                    <input
                                    type="checkbox"
                                    checked={hideToxic}
                                    onChange={e => setHideToxic(e.target.checked)}
                                    className={`mr-2 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500`}
                                    />
                                    Hide &gt;{TOXIC_THRESH * 100}%
                                </label>
                            </div>
                        </div>

                        <div className="flex items-end h-full">
                            <CSVLink
                                data={csvData}
                                filename="reel_comments_analysis.csv"
                                className={`flex items-center gap-1 px-4 py-2 rounded-xl font-bold text-sm transition duration-150 shadow-md ${CURRENT_PRIMARY}`}
                            >
                                <Download size={16} /> Download Report
                            </CSVLink>
                        </div>
                    </div>
                    
                   
                    <div className="overflow-x-auto rounded-xl shadow-inner-lg">
                        <table className={`min-w-full border-collapse text-sm ${CURRENT_TEXT_COLOR}`}>
                            <thead>
                            <tr className={`${CURRENT_HEADER_BG} border-b ${isDark ? 'border-indigo-800' : 'border-indigo-300'} ${isDark ? 'text-indigo-300' : 'text-indigo-800'} sticky top-0 z-10 shadow-sm`}>
                                <th className="px-4 py-3 text-left">User</th>
                                <th className="px-4 py-3 text-left">Comment</th>
                                <th
                                className="px-4 py-3 cursor-pointer hover:bg-indigo-100/50"
                                onClick={() => {
                                    setSortKey("toxicity");
                                    setSortDir(sortKey === "toxicity" && sortDir === "desc" ? "asc" : "desc");
                                }}
                                >
                                Toxicity {sortKey === "toxicity" && (sortDir === "desc" ? '🔽' : '🔼')}
                                </th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                            </thead>
                            <tbody className={`${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                            {visibleComments.length === 0 && Object.keys(pendingHides).length === 0 ? (
                                <tr>
                                <td colSpan={4} className={`p-6 text-center ${isDark ? 'text-gray-500 bg-gray-700/30' : 'text-gray-500 bg-gray-50'} italic`}>
                                    No comments found matching the active filters.
                                </td>
                                </tr>
                            ) : (
                                <AnimatePresence initial={false}>
                                {visibleComments.map((c, index) => {
                                    const isToxic = c.toxicity > TOXIC_THRESH;
                                    // const rowBg = isDark 
                                    //     ? (index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/80') 
                                    //     : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50');
                                    const rowBg = isToxic
                                           ? (isDark ? 'bg-red-900/40' : 'bg-red-100')
                                           : (isDark 
                                               ? (index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/80') 
                                               : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50'));

                                    
                                    return (
                                        <motion.tr
                                        key={c.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        transition={{ duration: 0.3 }}
                                        className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-100'} ${rowBg} ${
                                            isToxic ? (isDark ? 'hover:bg-red-900/100 ' : 'hover:bg-red-200') : (isDark ? 'hover:bg-indigo-900/30' : 'hover:bg-indigo-50')
                                        } ${TRANSITION_STYLE}`}
                                        >
                                        <td className="px-4 py-3 font-medium">{c.username}</td>
                                        <td className="px-4 py-3 max-w-lg break-words text-left">{c.text}</td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex flex-col items-center">
                                            
                                            <div className={`w-20 h-2 rounded overflow-hidden mb-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                                <div
                                                style={{ width: `${Math.min(100, c.toxicity * 100)}%` }}
                                                className={`h-full ${isToxic ? "bg-red-500" : "bg-indigo-500"} transition-all duration-500`}
                                                />
                                            </div>
                                            <span
                                                className={`text-xs font-semibold ${
                                                isToxic ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-indigo-400' : 'text-indigo-600')
                                                }`}
                                            >
                                                {formatPct(c.toxicity)}
                                            </span>
                                            </div> 
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button 
                                                    onClick={() => copyToClipboard(c.id)}
                                                    className={`p-2 rounded-full ${isDark ? 'text-gray-400 hover:text-indigo-300 hover:bg-gray-700' : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-100'} transition-colors duration-200`}
                                                    title="Copy Comment ID"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                                
                                                
                                                <button 
                                                    onClick={() => toggleHideComment(c.id, c.hidden)}
                                                    className={`p-2 rounded-full ${isDark ? 'text-gray-400 hover:text-indigo-300 hover:bg-gray-700' : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-100'} transition-colors duration-200`}
                                                    title={c.hidden ? "Unhide Comment" : "Hide Comment (10s Undo)"}
                                                >
                                                    {c.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                        </motion.tr>
                                    );
                                })}
                                </AnimatePresence>
                            )}
                            
                            </tbody>
                        </table>

{/* Load More Button */}
{nextToken && (
  <div className="text-center my-4">
    <button
      onClick={() => fetchComments(nextToken)}
      disabled={!nextToken || loadingMore}
      className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
    >
      {loadingMore ? "Loading more..." : "Load More Comments"}
    </button>
  </div>
)}

                    </div>
                </div>

                
                {comments.some(c => c.hidden) && (
                    <div className={`${CURRENT_CARD_BG} p-6 rounded-xl shadow-xl`}>
                        <h3 className={`text-xl font-bold ${isDark ? 'text-gray-400' : 'text-gray-700'} mb-4`}>
                            <EyeOff size={18} className="inline mr-2 align-text-bottom" /> Hidden Comments ({comments.filter(c => c.hidden).length})
                        </h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {comments.filter(c => c.hidden).map(c => (
                                <motion.div 
                                    key={c.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex justify-between items-center p-3 rounded-lg ${isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gray-100 border border-gray-200'}`}
                                >
                                    <div className={`text-sm italic truncate ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                        <span className="font-semibold not-italic">{c.username}:</span> {c.text}
                                    </div>
                                    <button
                                        onClick={() => unhideComment(c.id)}
                                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition ${isDark ? 'bg-indigo-700 text-indigo-200 hover:bg-indigo-600' : 'bg-indigo-200 text-indigo-700 hover:bg-indigo-300'}`}
                                    >
                                        <Eye size={14} /> Restore
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </>
        ) : null}

        {!loading && comments.length === 0 && !error && (
            <div className={`mt-20 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <p className="text-xl font-semibold mb-4">Ready for Analysis</p>
                <p>Paste an Instagram URL or Youtube URL or Facebook URL above and click **"Analyze Reel"** to begin sentiment and toxicity analysis on the comments.</p>
            </div>
        )}
      </div>
    </div>
  );
}








































// import React, { useState, useMemo, useCallback, useEffect } from "react";
// import axios from "axios";
// import { CSVLink } from "react-csv";
// import {
//   BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
// } from "recharts";
// import { motion, AnimatePresence } from "framer-motion";
// import { Search, EyeOff, Eye, Download, Copy, Trash2, Check, RotateCcw, Filter, Sun, Moon } from "lucide-react";

// // --- PROFESSIONAL COLOR & STYLE CONSTANTS (Refined to Indigo/Dark Gray) ---
// const PRIMARY_COLOR = "indigo"; // Tailwind color name
// const PRIMARY_HEX = "#4f46e5"; // indigo-600
// const DANGER_COLOR = "red";
// const PRIMARY_LIGHT = "bg-indigo-600 hover:bg-indigo-700 text-white";
// const SECONDARY_LIGHT = "bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200";
// const BACKGROUND_LIGHT = "bg-gray-50";
// const CARD_BG_LIGHT = "bg-white border border-gray-200";
// const TEXT_COLOR_LIGHT = "text-gray-800";
// const HEADER_BG_LIGHT = "bg-indigo-50";

// const BACKGROUND_DARK = "bg-gray-900";
// const CARD_BG_DARK = "bg-gray-800 border border-indigo-700/50";
// const TEXT_COLOR_DARK = "text-gray-100";
// const HEADER_BG_DARK = "bg-indigo-900/30";

// // Define other constants
// const TOXIC_THRESH = 0.6; 
// const TRANSITION_STYLE = "transition-all duration-300 ease-in-out";

// // Toxicity Range Options (same)
// const TOXICITY_RANGES = [
//   { label: "0% (Min)", value: 0.0 },
//   { label: "20%", value: 0.2 },
//   { label: "40%", value: 0.4 },
//   { label: "60%", value: 0.6 },
//   { label: "80%", value: 0.8 },
//   { label: "100% (Max)", value: 1.0 },
// ];

// // Length Filter Options (same)
// const LENGTH_OPTIONS = [
//   { label: "All Lengths", value: "all" },
//   { label: "Short (1-20 chars)", value: "short" },
//   { label: "Medium (21-80 chars)", value: "medium" },
//   { label: "Long (80+ chars)", value: "long" },
// ];

// function formatPct(v) {
//   return (v * 100).toFixed(1) + "%";
// }

// // ===============================================
// // LOADING SKELETON COMPONENT (Updated colors)
// // ===============================================
// const SkeletonCard = ({ isDark, className = "" }) => (
//   <div className={`${isDark ? CARD_BG_DARK : CARD_BG_LIGHT} p-6 rounded-xl shadow-lg h-48 ${className}`}>
//     <div className={`h-4 ${isDark ? 'bg-indigo-800' : 'bg-indigo-200'} rounded w-1/2 mb-4`}></div>
//     <div className={`h-10 ${isDark ? 'bg-indigo-700' : 'bg-indigo-300'} rounded w-1/3 mb-4`}></div>
//     <div className={`h-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-2/3`}></div>
//   </div>
// );

// const LoadingSkeleton = ({ isDark }) => (
//   <div className="space-y-8 animate-pulse">
//     {/* Summary and Charts Grid Skeleton */}
//     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//       <SkeletonCard isDark={isDark} />
//       <div className={`${isDark ? CARD_BG_DARK : CARD_BG_LIGHT} p-6 rounded-xl shadow-lg h-48 lg:col-span-1`}>
//         <div className={`h-4 ${isDark ? 'bg-indigo-800' : 'bg-indigo-200'} rounded w-1/2 mb-4`}></div>
//         <div className={`h-28 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-full w-28 mx-auto`}></div>
//       </div>
//       <div className={`${isDark ? CARD_BG_DARK : CARD_BG_LIGHT} p-6 rounded-xl shadow-lg h-48 lg:col-span-1`}>
//         <div className={`h-4 ${isDark ? 'bg-indigo-800' : 'bg-indigo-200'} rounded w-1/2 mb-4`}></div>
//         <div className={`h-32 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
//       </div>
//     </div>

//     {/* Comment Table Skeleton */}
//     <div className={`${isDark ? CARD_BG_DARK : CARD_BG_LIGHT} p-6 rounded-xl shadow-lg`}>
//       <div className={`h-5 ${isDark ? 'bg-indigo-600' : 'bg-indigo-800'} rounded w-1/4 mb-6`}></div>
//       <div className="flex justify-between mb-4">
//         <div className={`h-10 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/3`}></div>
//         <div className={`h-10 ${isDark ? 'bg-indigo-600' : 'bg-indigo-600'} rounded w-28`}></div>
//       </div>
//       <div className="overflow-x-auto rounded-xl border border-indigo-300/50">
//         {[...Array(5)].map((_, i) => (
//           <div key={i} className={`flex justify-between items-center px-4 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'} ${i % 2 === 0 ? (isDark ? 'bg-gray-800' : 'bg-white') : (isDark ? 'bg-gray-700/50' : 'bg-gray-50')}`}>
//             <div className={`h-3 ${isDark ? 'bg-gray-600' : 'bg-gray-200'} rounded w-1/6`}></div>
//             <div className={`h-3 ${isDark ? 'bg-gray-600' : 'bg-gray-200'} rounded w-1/2`}></div>
//             <div className={`h-3 ${isDark ? 'bg-gray-600' : 'bg-gray-200'} rounded w-1/6`}></div>
//             <div className={`h-8 w-12 ${isDark ? 'bg-gray-600' : 'bg-gray-300'} rounded-full`}></div>
//           </div>
//         ))}
//       </div>
//     </div>
//   </div>
// );
// // ===============================================


// export default function ReelAnalyzer() {
//   // State from original component
//   const [reelUrl, setReelUrl] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [comments, setComments] = useState([]);
//   const [avgToxicity, setAvgToxicity] = useState(null);
//   const [error, setError] = useState("");
//   const [search, setSearch] = useState("");
//   const [hideToxic, setHideToxic] = useState(false);
//   const [sortKey, setSortKey] = useState("toxicity");
//   const [sortDir, setSortDir] = useState("desc");
//   const [minToxicity, setMinToxicity] = useState(0.0);
//   const [maxToxicity, setMaxToxicity] = useState(1.0);
//   const [lengthFilter, setLengthFilter] = useState("all");
//   const [pendingHideId, setPendingHideId] = useState(null);
//   const [undoTimer, setUndoTimer] = useState(null);
//   const [toastMessage, setToastMessage] = useState(null);
  
//   // NEW: Dark Mode State
//   const [isDark, setIsDark] = useState(false); 

//   // --- Dynamic Style Helpers ---
//   const CURRENT_BG = isDark ? BACKGROUND_DARK : BACKGROUND_LIGHT;
//   const CURRENT_CARD_BG = isDark ? CARD_BG_DARK : CARD_BG_LIGHT;
//   const CURRENT_TEXT_COLOR = isDark ? TEXT_COLOR_DARK : TEXT_COLOR_LIGHT;
//   const CURRENT_HEADER_BG = isDark ? HEADER_BG_DARK : HEADER_BG_LIGHT;
//   const CURRENT_PRIMARY = isDark ? "bg-indigo-500 hover:bg-indigo-600 text-white" : PRIMARY_LIGHT;
//   const CURRENT_SECONDARY = isDark ? "bg-gray-700 hover:bg-gray-600 text-indigo-300" : SECONDARY_LIGHT;
//   const COLORS = isDark ? ['#6366f1', '#f87171'] : ['#4f46e5', '#ef4444']; // Indigo/Blue for Clean, Red for Toxic

//   // --- API LOGIC (Identical, slightly cleaned up) ---
//   const analyzeReel = useCallback(async () => {
//     setError("");
//     setLoading(true);
//     try {
//       if (!reelUrl || !reelUrl.includes("instagram.com")) {
//         setError("Enter a valid Instagram Reel URL.");
//         setLoading(false);
//         return;
//       }

//       // NOTE: This assumes the backend is running at localhost:5000/api/analyze
//       const res = await axios.post("http://localhost:5000/api/analyze", { reelUrl });
//       const resComments = (res.data.comments || []).map((c) => ({
//         id: c.id ?? c._id ?? c.igCommentId ?? crypto.randomUUID(), // Ensure a unique ID for React keys
//         username: c.username ?? "unknown_user",
//         text: c.text ?? "",
//         toxicity: typeof c.toxicity === "number" ? c.toxicity : (typeof c.overallToxicity === "number" ? c.overallToxicity : 0),
//         hidden: !!c.hidden,
//       }));

//       setComments(resComments);
//       setAvgToxicity(res.data.avgToxicity ?? 0);
//     } catch (err) {
//       console.error("Error analyzing reel:", err);
//       setError(err.response?.data?.error || err.message || "Analysis failed");
//     } finally {
//       setLoading(false);
//     }
//   }, [reelUrl]);


//   // --- MEMOIZED DATA (Logic remains the same, dependencies updated) ---
//   const visibleComments = useMemo(() => {
//     let arr = comments.filter(c =>
//       !c.hidden &&
//       c.id !== pendingHideId &&
//       !(hideToxic && c.toxicity > TOXIC_THRESH)
//     );

//     // 3. Toxicity Range Filter
//     arr = arr.filter(c => c.toxicity >= minToxicity && c.toxicity <= maxToxicity);

//     // 4. Length Filter
//     arr = arr.filter(c => {
//       const len = c.text.length;
//       if (lengthFilter === "short") return len >= 1 && len <= 20;
//       if (lengthFilter === "medium") return len > 20 && len <= 80;
//       if (lengthFilter === "long") return len > 80;
//       return true; // "all"
//     });

//     // 5. Search Filter
//     if (search) {
//       const s = search.toLowerCase();
//       arr = arr.filter(c => c.text.toLowerCase().includes(s) || c.username.toLowerCase().includes(s) || c.id.includes(s));
//     }

//     // 6. Sorting
//     arr.sort((a, b) => {
//       let v = sortKey === "username" ? a.username.localeCompare(b.username) : a.toxicity - b.toxicity;
//       return sortDir === "asc" ? v : -v;
//     });
//     return arr;
//   }, [comments, hideToxic, search, sortKey, sortDir, pendingHideId, minToxicity, maxToxicity, lengthFilter]);

//   const histData = useMemo(() => {
//     const buckets = [0, 0, 0, 0, 0];
//     comments.forEach(c => {
//       const t = Math.max(0, Math.min(1, (c.toxicity || 0)));
//       const idx = Math.min(4, Math.floor(t * 5));
//       buckets[idx] += 1;
//     });
//     return [
//       { name: "0–20%", count: buckets[0] },
//       { name: "20–40%", count: buckets[1] },
//       { name: "40–60%", count: buckets[2] },
//       { name: "60–80%", count: buckets[3] },
//       { name: "80–100%", count: buckets[4] },
//     ];
//   }, [comments]);

//   const pieData = useMemo(() => {
//     const toxic = comments.filter(c => c.toxicity > TOXIC_THRESH).length;
//     const clean = comments.length - toxic;
//     return [
//       { name: "Clean", value: clean },
//       { name: "Toxic", value: toxic },
//     ];
//   }, [comments]);

//   const csvData = useMemo(() => comments.map(c => ({
//     id: c.id, username: c.username, text: c.text, toxicity: c.toxicity
//   })), [comments]);


//   // --- HANDLERS (Identical to original) ---
//   const showToast = useCallback((message) => {
//     if (undoTimer) clearTimeout(undoTimer);
//     setToastMessage(message);
//     const timer = setTimeout(() => setToastMessage(null), 3000); // Hide after 3 seconds
//     // Clean up timer if the component unmounts or toast is shown again
//     return () => clearTimeout(timer); 
//   }, [undoTimer]);

//   const copyToClipboard = async (text) => {
//     await navigator.clipboard.writeText(text);
//     showToast("ID Copied!");
//   };

//   const startHideComment = (id) => {
//     if (undoTimer) clearTimeout(undoTimer);
//     setPendingHideId(id);

//     const timer = setTimeout(() => {
//       setComments(prev => prev.map(c => c.id === id ? { ...c, hidden: true } : c));
//       setPendingHideId(null);
//       // Show a final confirmation toast
//       showToast("Comment permanently hidden.");
//     }, 10000); 
    
//     setUndoTimer(timer);
//     // Use a custom toast for the undo functionality
//     showToast(
//       <div className="flex items-center gap-2">
//         Comment queued for hiding (10s).
//         <button
//           onClick={() => undoHideComment(id)}
//           className="ml-2 px-3 py-1 bg-white text-indigo-600 rounded-full text-xs font-semibold hover:bg-gray-100 flex items-center gap-1 shadow-md"
//         >
//           <RotateCcw size={14} /> Undo
//         </button>
//       </div>
//     );
//   };

//   const undoHideComment = (id) => {
//     if (undoTimer) clearTimeout(undoTimer);
//     setUndoTimer(null);
//     setPendingHideId(null);
//     showToast("Undo successful. Comment restored.");
//   };
  
//   const unhideComment = (id) => {
//     setComments(prev => prev.map(c => c.id === id ? { ...c, hidden: false } : c));
//     showToast("Comment unhidden.");
//   };

//   const toggleHideComment = (id, currentlyHidden) => {
//     if (currentlyHidden) {
//       unhideComment(id);
//     } else {
//       startHideComment(id);
//     }
//   };

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//         if (undoTimer) clearTimeout(undoTimer);
//     };
//   }, [undoTimer]);


//   // --- Component Structure (The UI/UX Upgrade) ---
//   return (
//     <div className={`${CURRENT_BG} min-h-screen p-4 md:p-10 font-sans ${CURRENT_TEXT_COLOR} ${TRANSITION_STYLE}`}>
      
//       {/* Toast Notification Area */}
//       <AnimatePresence>
//         {toastMessage && (
//           <motion.div
//             initial={{ opacity: 0, y: 50, scale: 0.3 }}
//             animate={{ opacity: 1, y: 0, scale: 1 }}
//             exit={{ opacity: 0, y: 20, scale: 0.5 }}
//             transition={{ type: "spring", stiffness: 300, damping: 25 }}
//             className={`fixed bottom-4 right-4 bg-indigo-600 text-white p-3 rounded-xl shadow-2xl flex items-center gap-2 z-50 text-sm font-medium ${TRANSITION_STYLE}`}
//           >
//             {typeof toastMessage === 'string' && <Check size={18} />}
//             {toastMessage}
//           </motion.div>
//         )}
//       </AnimatePresence>
      
//       {/* Header and Dark Mode Toggle */}
//       <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto flex justify-between items-center mb-10">
//         <h1 className={`text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-800 ${isDark ? 'drop-shadow-[0_2px_2px_rgba(79,46,255,0.7)]' : 'drop-shadow-md'} ${TRANSITION_STYLE}`}>
//           <span role="img" aria-label="Microscope">🔬</span> Reel Sentiment Dashboard
//         </h1>
//         <button
//           onClick={() => setIsDark(p => !p)}
//           className={`p-2 rounded-full ${isDark ? 'bg-gray-800 text-yellow-300 hover:bg-gray-700' : 'bg-white text-indigo-600 hover:bg-gray-100'} shadow-md border ${isDark ? 'border-indigo-700' : 'border-gray-200'} ${TRANSITION_STYLE}`}
//           title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
//         >
//           {isDark ? <Sun size={20} /> : <Moon size={20} />}
//         </button>
//       </motion.div>

//       <div className="max-w-7xl mx-auto space-y-10">
        
//         {/* URL Input and Analyze/Clear Controls */}
//         <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
//           <div className={`${CURRENT_CARD_BG} p-6 rounded-xl shadow-lg lg:col-span-5`}>
//             <div className="flex flex-col md:flex-row items-center gap-4">
//               <input
//                 className={`flex-grow ${isDark ? 'bg-gray-700 text-gray-200 border-indigo-700' : 'bg-indigo-50 text-gray-700 border-indigo-300'} p-3 rounded-xl outline-none border focus:ring-2 focus:ring-indigo-500 transition duration-150 font-mono`}
//                 placeholder="Paste Instagram reel URL for analysis (e.g., https://www.instagram.com/reel/...)"
//                 value={reelUrl}
//                 onChange={(e) => setReelUrl(e.target.value)}
//               />
//               <button
//                 onClick={analyzeReel}
//                 disabled={loading}
//                 className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition duration-150 shadow-md ${CURRENT_PRIMARY} disabled:opacity-50`}
//               >
//                 {loading ? "Analyzing..." : <><Search size={18} /> Analyze Reel</>}
//               </button>
//               <button
//                 onClick={() => { setReelUrl(""); setComments([]); setAvgToxicity(null); setError(""); }}
//                 className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition duration-150 shadow-md ${CURRENT_SECONDARY}`}
//               >
//                 <Trash2 size={18} /> Clear
//               </button>
//             </div>
//             {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center text-red-500 font-medium italic">{error}</motion.div>}
//           </div>
//         </div>


//         {/* Conditional Rendering: Skeleton or Data */}
//         {loading && comments.length === 0 ? (
//             <LoadingSkeleton isDark={isDark} />
//         ) : comments.length > 0 ? (
//             <>
//                 {/* Summary and Charts Grid */}
//                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
//                     {/* Average Toxicity Card */}
//                     <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`${CURRENT_CARD_BG} p-6 rounded-xl shadow-xl lg:col-span-1 border-l-4 border-indigo-500`}>
//                         <h3 className={`text-lg font-bold text-indigo-500 mb-2`}>Overall Toxicity Score</h3>
//                         <div className="flex items-baseline gap-2 mb-4">
//                             <div className={`text-6xl font-extrabold text-${PRIMARY_COLOR}-700 ${isDark ? 'text-indigo-400' : 'text-indigo-800'}`}>
//                             {avgToxicity !== null ? formatPct(avgToxicity) : "--"}
//                             </div>
//                         </div>
//                         <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
//                             Analysis based on **{comments.length}** comments processed by the sentiment model.
//                         </p>
//                     </motion.div>

//                     {/* Pie Chart Card (Toxic vs. Clean) */}
//                     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`${CURRENT_CARD_BG} p-6 rounded-xl shadow-xl lg:col-span-1 border-l-4 border-indigo-500`}>
//                         <h3 className={`text-lg font-bold text-indigo-500 mb-1`}>Clean vs. Toxic Breakdown (&gt;{TOXIC_THRESH * 100}%)</h3>
//                         <div className="flex flex-col items-center justify-center" style={{ width: "100%", height: 200 }}>
//                             <ResponsiveContainer width="100%" height="100%">
//                             <PieChart>
//                                 <Pie
//                                 data={pieData}
//                                 dataKey="value"
//                                 nameKey="name"
//                                 innerRadius={50}
//                                 outerRadius={80}
//                                 paddingAngle={5}
//                                 labelLine={false}
//                                 label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
//                                 >
//                                 {pieData.map((entry, index) => (
//                                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={isDark ? 'none' : 'white'} />
//                                 ))}
//                                 </Pie>
//                                 <Tooltip 
//                                     contentStyle={{ background: isDark ? '#1f2937' : 'white', border: `1px solid ${isDark ? '#4f46e5' : '#e5e7eb'}`, borderRadius: '6px' }} 
//                                     formatter={(value, name, props) => [`${value} comments`, props.payload.percent !== undefined ? formatPct(props.payload.percent) : '']} 
//                                 />
//                                 <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '10px', color: isDark ? 'white' : '#1f2937' }} />
//                             </PieChart>
//                             </ResponsiveContainer>
//                         </div>
//                     </motion.div>

//                     {/* Bar Chart Card (Toxicity Distribution) */}
//                     <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className={`${CURRENT_CARD_BG} p-6 rounded-xl shadow-xl lg:col-span-1 border-l-4 border-indigo-500`}>
//                         <h3 className={`text-lg font-bold text-indigo-500 mb-4`}>Toxicity Distribution (5 Bins)</h3>
//                         <div style={{ width: "100%", height: 200 }}>
//                             <ResponsiveContainer width="100%" height="100%">
//                             <BarChart data={histData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
//                                 <XAxis dataKey="name" stroke={isDark ? '#9ca3af' : '#6b7280'} style={{ fontSize: '10px' }} />
//                                 <YAxis allowDecimals={false} stroke={isDark ? '#9ca3af' : '#6b7280'} />
//                                 <Tooltip contentStyle={{ background: isDark ? '#1f2937' : 'white', border: `1px solid ${isDark ? '#4f46e5' : '#e5e7eb'}`, borderRadius: '6px' }} formatter={(value) => [value, "Comments"]} />
//                                 <Bar dataKey="count" radius={[4, 4, 0, 0]}>
//                                 {histData.map((entry, idx) => (
//                                     <Cell
//                                     key={`cell-${idx}`}
//                                     fill={idx >= 3 ? COLORS[1] : COLORS[0]} // Red for 0.6-1.0, Blue otherwise
//                                     />
//                                 ))}
//                                 </Bar>
//                             </BarChart>
//                             </ResponsiveContainer>
//                         </div>
//                     </motion.div>
//                 </div>

//                 {/* Comment Table and Controls */}
//                 <div className={`${CURRENT_CARD_BG} p-6 rounded-xl shadow-xl`}>
//                     <h2 className={`text-2xl font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-800'} mb-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} pb-2`}>
//                         <Filter size={20} className="inline mr-2 align-text-bottom" /> Filtered Comments
//                     </h2>

//                     <div className="flex flex-wrap items-end justify-between mb-6 gap-4 border-b border-dashed border-gray-300/50 pb-4">
                        
//                         {/* Filter Group */}
//                         <div className="flex flex-wrap items-end gap-4">
//                             {/* Search */}
//                             <div className="relative w-full sm:max-w-xs">
//                                 <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} block mb-1`}>Search</label>
//                                 <Search size={18} className={`absolute left-3 bottom-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
//                                 <input
//                                 type="text"
//                                 placeholder="Search comments or users..."
//                                 className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'} ${TRANSITION_STYLE}`}
//                                 value={search}
//                                 onChange={(e) => setSearch(e.target.value)}
//                                 />
//                             </div>

//                             {/* Toxicity Min Filter */}
//                             <div className="w-full sm:max-w-[140px]">
//                                 <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} block mb-1`}>Min Toxicity</label>
//                                 <select
//                                     value={minToxicity}
//                                     onChange={(e) => setMinToxicity(parseFloat(e.target.value))}
//                                     className={`w-full py-2 px-3 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-500 outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'} ${TRANSITION_STYLE}`}
//                                 >
//                                     {TOXICITY_RANGES.map(r => (
//                                         <option key={`min-${r.value}`} value={r.value} disabled={r.value > maxToxicity}>
//                                             {r.label}
//                                         </option>
//                                     ))}
//                                 </select>
//                             </div>

//                             {/* Toxicity Max Filter */}
//                             <div className="w-full sm:max-w-[140px]">
//                                 <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} block mb-1`}>Max Toxicity</label>
//                                 <select
//                                     value={maxToxicity}
//                                     onChange={(e) => setMaxToxicity(parseFloat(e.target.value))}
//                                     className={`w-full py-2 px-3 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-500 outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'} ${TRANSITION_STYLE}`}
//                                 >
//                                     {TOXICITY_RANGES.map(r => (
//                                         <option key={`max-${r.value}`} value={r.value} disabled={r.value < minToxicity}>
//                                             {r.label}
//                                         </option>
//                                     ))}
//                                 </select>
//                             </div>

//                             {/* Length Filter */}
//                             <div className="w-full sm:max-w-[140px]">
//                                 <label className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} block mb-1`}>Comment Length</label>
//                                 <select
//                                     value={lengthFilter}
//                                     onChange={(e) => setLengthFilter(e.target.value)}
//                                     className={`w-full py-2 px-3 rounded-lg border bg-white focus:ring-2 focus:ring-indigo-500 outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'} ${TRANSITION_STYLE}`}
//                                 >
//                                     {LENGTH_OPTIONS.map(l => (
//                                         <option key={l.value} value={l.value}>
//                                             {l.label}
//                                         </option>
//                                     ))}
//                                 </select>
//                             </div>

//                             {/* Hide Toxic Toggle */}
//                             <div className="flex items-end h-[42px] mb-1">
//                                 <label className={`inline-flex items-center text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} whitespace-nowrap`}>
//                                     <input
//                                     type="checkbox"
//                                     checked={hideToxic}
//                                     onChange={e => setHideToxic(e.target.checked)}
//                                     className={`mr-2 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500`}
//                                     />
//                                     Hide &gt;{TOXIC_THRESH * 100}%
//                                 </label>
//                             </div>
//                         </div>

//                         {/* Download Control */}
//                         <div className="flex items-end h-full">
//                             <CSVLink
//                                 data={csvData}
//                                 filename="reel_comments_analysis.csv"
//                                 className={`flex items-center gap-1 px-4 py-2 rounded-xl font-bold text-sm transition duration-150 shadow-md ${CURRENT_PRIMARY}`}
//                             >
//                                 <Download size={16} /> Download CSV
//                             </CSVLink>
//                         </div>
//                     </div>
                    
//                     {/* Comments Table */}
//                     <div className="overflow-x-auto rounded-xl shadow-inner-lg">
//                         <table className={`min-w-full border-collapse text-sm ${CURRENT_TEXT_COLOR}`}>
//                             <thead>
//                             <tr className={`${CURRENT_HEADER_BG} border-b ${isDark ? 'border-indigo-800' : 'border-indigo-300'} ${isDark ? 'text-indigo-300' : 'text-indigo-800'} sticky top-0 z-10 shadow-sm`}>
//                                 <th className="px-4 py-3 text-left">User</th>
//                                 <th className="px-4 py-3 text-left">Comment</th>
//                                 <th
//                                 className="px-4 py-3 cursor-pointer hover:bg-indigo-100/50"
//                                 onClick={() => {
//                                     setSortKey("toxicity");
//                                     setSortDir(sortKey === "toxicity" && sortDir === "desc" ? "asc" : "desc");
//                                 }}
//                                 >
//                                 Toxicity {sortKey === "toxicity" && (sortDir === "desc" ? '🔽' : '🔼')}
//                                 </th>
//                                 <th className="px-4 py-3">Actions</th>
//                             </tr>
//                             </thead>
//                             <tbody className={`${isDark ? 'bg-gray-800' : 'bg-white'}`}>
//                             {visibleComments.length === 0 && pendingHideId === null ? (
//                                 <tr>
//                                 <td colSpan={4} className={`p-6 text-center ${isDark ? 'text-gray-500 bg-gray-700/30' : 'text-gray-500 bg-gray-50'} italic`}>
//                                     No comments found matching the active filters.
//                                 </td>
//                                 </tr>
//                             ) : (
//                                 visibleComments.map((c, index) => {
//                                 const isToxic = c.toxicity > TOXIC_THRESH;
//                                 const rowBg = isDark 
//                                     ? (index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/80') 
//                                     : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50');
                                
//                                 return (
//                                     <motion.tr
//                                     key={c.id}
//                                     initial={{ opacity: 0, y: 10 }}
//                                     animate={{ opacity: 1, y: 0 }}
//                                     exit={{ opacity: 0, x: -50 }}
//                                     transition={{ duration: 0.3 }}
//                                     className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-100'} ${rowBg} ${
//                                         isToxic ? (isDark ? 'hover:bg-red-900/40' : 'hover:bg-red-50') : (isDark ? 'hover:bg-indigo-900/30' : 'hover:bg-indigo-50')
//                                     } ${TRANSITION_STYLE}`}
//                                     >
//                                     <td className="px-4 py-3 font-medium">{c.username}</td>
//                                     <td className="px-4 py-3 max-w-lg break-words text-left">{c.text}</td>
//                                     <td className="px-4 py-3 text-center">
//                                         <div className="flex flex-col items-center">
//                                         {/* Toxicity Bar */}
//                                         <div className={`w-20 h-2 rounded overflow-hidden mb-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
//                                             <div
//                                             style={{ width: `${Math.min(100, c.toxicity * 100)}%` }}
//                                             className={`h-full ${isToxic ? "bg-red-500" : "bg-indigo-500"} transition-all duration-500`}
//                                             />
//                                         </div>
//                                         <span
//                                             className={`text-xs font-semibold ${
//                                             isToxic ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-indigo-400' : 'text-indigo-600')
//                                             }`}
//                                         >
//                                             {formatPct(c.toxicity)}
//                                         </span>
//                                         </div>
//                                     </td>
//                                     <td className="px-4 py-3 text-center whitespace-nowrap">
//                                         <div className="flex items-center justify-center gap-2">
//                                         <button
//                                             onClick={() => copyToClipboard(c.id)}
//                                             title="Copy Comment ID"
//                                             className={`p-2 rounded-full ${isDark ? 'text-indigo-300 bg-gray-700 hover:bg-gray-600' : 'text-indigo-600 bg-indigo-100 hover:bg-indigo-200'} shadow-sm ${TRANSITION_STYLE}`}
//                                         >
//                                             <Copy size={14} />
//                                         </button>
//                                         <button
//                                             onClick={() => toggleHideComment(c.id, c.hidden)}
//                                             title={c.hidden ? "Unhide Comment" : "Hide Comment"}
//                                             className={`p-2 rounded-full ${c.hidden ? 'text-green-500 bg-green-100/50' : 'text-gray-600 bg-gray-100/50'} ${isDark && c.hidden ? 'bg-green-900/50' : isDark ? 'bg-gray-700' : ''} hover:bg-opacity-100 shadow-sm ${TRANSITION_STYLE}`}
//                                         >
//                                             {c.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
//                                         </button>
//                                         {isToxic && (
//                                             <span className={`text-xs px-2 py-1 ${isDark ? 'bg-red-900/30 text-red-300 border-red-700' : 'bg-red-500/10 text-red-700 border-red-300'} font-medium rounded-full border`}>
//                                             <span role="img" aria-label="Danger">⚠️</span> Risk
//                                             </span>
//                                         )}
//                                         </div>
//                                     </td>
//                                     </motion.tr>
//                                 );
//                                 })
//                             )}
//                             {/* Pending Hide Row */}
//                             {pendingHideId && comments.find(c => c.id === pendingHideId) && (
//                                 <tr className={`${isDark ? 'bg-yellow-900/40 border-yellow-800' : 'bg-yellow-50/50 border-yellow-200'} sticky bottom-0`}>
//                                     <td colSpan={4} className="p-3 text-center text-gray-600 italic font-medium">
//                                         <div className="flex items-center justify-center gap-3">
//                                             Comment **{comments.find(c => c.id === pendingHideId)?.username}'s** comment is pending removal. Click UNDO to stop the process.
//                                             <button
//                                                 onClick={() => undoHideComment(pendingHideId)}
//                                                 className={`ml-4 px-4 py-2 bg-yellow-400 text-yellow-900 rounded-lg text-sm font-bold hover:bg-yellow-500 flex items-center gap-1 transition shadow-md`}
//                                             >
//                                                 <RotateCcw size={16} /> UNDO
//                                             </button>
//                                         </div>
//                                     </td>
//                                 </tr>
//                             )}
//                             </tbody>
//                         </table>
//                     </div>
//                 </div>
//             </>
//         ) : (
//             // Default message when nothing is analyzed yet
//             <div className={`${CURRENT_CARD_BG} p-12 rounded-xl shadow-lg text-center ${isDark ? 'text-gray-400' : 'text-gray-500'} border-l-4 border-indigo-500/50`}>
//                 <h3 className="text-xl font-semibold mb-2">Welcome to the Reel Sentiment Analyzer</h3>
//                 <p>Paste a valid **Instagram Reel URL** above and click **Analyze Reel** to begin. The system will retrieve, analyze, and visualize the comment toxicity for moderation and insights.</p>
//                 <p className="mt-4 text-xs">Note: Analysis is performed on a server endpoint (`http://localhost:5000/api/analyze`) and may take a moment.</p>
//             </div>
//         )}
//       </div>
//     </div>
//   );
// }


















// import React, { useState, useMemo, useCallback } from "react";
// import axios from "axios";
// import { CSVLink } from "react-csv";
// import {
//   BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
// } from "recharts";
// import { motion, AnimatePresence } from "framer-motion";
// import { Search, EyeOff, Eye, Download, Copy, Trash2, Check, RotateCcw } from "lucide-react";

// // Define constants
// const TOXIC_THRESH = 0.6;
// const PRIMARY_BLUE = "bg-blue-600 hover:bg-blue-700 text-white";
// const SECONDARY_BLUE = "bg-blue-100 hover:bg-blue-200 text-blue-800";
// const BACKGROUND_LIGHT = "bg-white";
// const CARD_BG = "bg-white border border-blue-200/50";
// const TEXT_COLOR = "text-gray-800";
// const HEADER_BG = "bg-blue-50";

// // NEW: Toxicity Range Options
// const TOXICITY_RANGES = [
//   { label: "0% (Min)", value: 0.0 },
//   { label: "20%", value: 0.2 },
//   { label: "40%", value: 0.4 },
//   { label: "60%", value: 0.6 },
//   { label: "80%", value: 0.8 },
//   { label: "100% (Max)", value: 1.0 },
// ];

// // NEW: Length Filter Options
// const LENGTH_OPTIONS = [
//   { label: "All Lengths", value: "all" },
//   { label: "Short (1-20 chars)", value: "short" },
//   { label: "Medium (21-80 chars)", value: "medium" },
//   { label: "Long (80+ chars)", value: "long" },
// ];

// function formatPct(v) {
//   return (v * 100).toFixed(1) + "%";
// }

// // ===============================================
// // LOADING SKELETON COMPONENT (Remains the same)
// // ===============================================
// const LoadingSkeleton = () => (
//     <div className="space-y-8 animate-pulse">
//         {/* Summary and Charts Grid Skeleton */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             <div className={`${CARD_BG} p-6 rounded-xl shadow-lg h-48 lg:col-span-1`}>
//                 <div className="h-4 bg-blue-200 rounded w-1/2 mb-4"></div>
//                 <div className="h-10 bg-blue-300 rounded w-1/3 mb-4"></div>
//                 <div className="h-3 bg-gray-200 rounded w-2/3"></div>
//             </div>
//             <div className={`${CARD_BG} p-6 rounded-xl shadow-lg h-48 lg:col-span-1`}>
//                 <div className="h-4 bg-blue-200 rounded w-1/2 mb-4"></div>
//                 <div className="h-28 bg-gray-200 rounded-full w-28 mx-auto"></div>
//             </div>
//             <div className={`${CARD_BG} p-6 rounded-xl shadow-lg h-48 lg:col-span-1`}>
//                 <div className="h-4 bg-blue-200 rounded w-1/2 mb-4"></div>
//                 <div className="h-32 bg-gray-200 rounded"></div>
//             </div>
//         </div>

//         {/* Comment Table Skeleton */}
//         <div className={`${CARD_BG} p-6 rounded-xl shadow-lg`}>
//             <div className="h-5 bg-blue-800 rounded w-1/4 mb-6"></div>
//             <div className="flex justify-between mb-4">
//                 <div className="h-10 bg-gray-200 rounded w-1/3"></div>
//                 <div className="h-10 bg-blue-600 rounded w-28"></div>
//             </div>
//             <div className="overflow-x-auto rounded-xl border border-blue-300">
//                 {[...Array(5)].map((_, i) => (
//                     <div key={i} className={`flex justify-between items-center px-4 py-4 border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
//                         <div className="h-3 bg-gray-200 rounded w-1/6"></div>
//                         <div className="h-3 bg-gray-200 rounded w-1/2"></div>
//                         <div className="h-3 bg-gray-200 rounded w-1/6"></div>
//                         <div className="h-8 w-12 bg-gray-300 rounded-full"></div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     </div>
// );
// // ===============================================


// export default function ReelAnalyzer() {
//   const [reelUrl, setReelUrl] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [comments, setComments] = useState([]);
//   const [avgToxicity, setAvgToxicity] = useState(null);
//   const [error, setError] = useState("");
//   const [search, setSearch] = useState("");
//   const [hideToxic, setHideToxic] = useState(false);
//   const [sortKey, setSortKey] = useState("toxicity");
//   const [sortDir, setSortDir] = useState("desc");
  
//   // NEW State for Toxicity Range Filtering (default is 0.0 to 1.0)
//   const [minToxicity, setMinToxicity] = useState(0.0);
//   const [maxToxicity, setMaxToxicity] = useState(1.0);
  
//   // NEW State for Length Filtering
//   const [lengthFilter, setLengthFilter] = useState("all"); // 'all', 'short', 'medium', 'long'
  
//   // State for Undo feature
//   const [pendingHideId, setPendingHideId] = useState(null);
//   const [undoTimer, setUndoTimer] = useState(null);
  
//   // State for Toast message
//   const [toastMessage, setToastMessage] = useState(null);

//   // --- API LOGIC (Identical to previous) ---
//   const analyzeReel = async () => {
//     // ... (analyzeReel function remains the same) ...
//     setError("");
//     setLoading(true);
//     try {
//       if (!reelUrl || !reelUrl.includes("instagram.com")) {
//         setError("Enter a valid Instagram Reel URL.");
//         setLoading(false);
//         return;
//       }

//       const res = await axios.post("http://localhost:5000/api/analyze", { reelUrl });
//       const resComments = (res.data.comments || []).map((c) => ({
//         id: c.id ?? c._id ?? c.igCommentId ?? "",
//         username: c.username ?? "unknown_user",
//         text: c.text ?? "",
//         toxicity: typeof c.toxicity === "number" ? c.toxicity : (typeof c.overallToxicity === "number" ? c.overallToxicity : 0),
//         hidden: !!c.hidden,
//       }));

//       setComments(resComments);
//       setAvgToxicity(res.data.avgToxicity ?? 0);
//     } catch (err) {
//       console.error("Error analyzing reel:", err);
//       setError(err.response?.data?.error || err.message || "Analysis failed");
//     } finally {
//       setLoading(false);
//     }
//   };


//   // --- MEMOIZED DATA (Updated to include new filter logic) ---

//   const visibleComments = useMemo(() => {
//     let arr = comments.filter(c => 
//         // 1. Check for pending hide and permanent hide
//         !c.hidden && 
//         c.id !== pendingHideId &&
        
//         // 2. Hide Toxic Filter (Toxicity > 0.6) - Note: This is an alternative filter to the range filter, but we'll respect it.
//         !(hideToxic && c.toxicity > TOXIC_THRESH)
//     );
    
//     // 3. Toxicity Range Filter
//     arr = arr.filter(c => c.toxicity >= minToxicity && c.toxicity <= maxToxicity);

//     // 4. Length Filter
//     arr = arr.filter(c => {
//         const len = c.text.length;
//         if (lengthFilter === "short") return len >= 1 && len <= 20;
//         if (lengthFilter === "medium") return len > 20 && len <= 80;
//         if (lengthFilter === "long") return len > 80;
//         return true; // "all"
//     });

//     // 5. Search Filter
//     if (search) {
//       const s = search.toLowerCase();
//       arr = arr.filter(c => c.text.toLowerCase().includes(s) || c.username.toLowerCase().includes(s) || c.id.includes(s));
//     }
    
//     // 6. Sorting
//     arr.sort((a, b) => {
//       let v = sortKey === "username" ? a.username.localeCompare(b.username) : a.toxicity - b.toxicity;
//       return sortDir === "asc" ? v : -v;
//     });
//     return arr;
//   }, [comments, hideToxic, search, sortKey, sortDir, pendingHideId, minToxicity, maxToxicity, lengthFilter]); // Added new dependencies

//   // ... (histData, pieData, csvData logic remains the same) ...

//   const histData = useMemo(() => {
//     const buckets = [0, 0, 0, 0, 0];
//     comments.forEach(c => {
//       const t = Math.max(0, Math.min(1, (c.toxicity || 0)));
//       const idx = Math.min(4, Math.floor(t * 5));
//       buckets[idx] += 1;
//     });
//     return [
//       { name: "0–20%", count: buckets[0] },
//       { name: "20–40%", count: buckets[1] },
//       { name: "40–60%", count: buckets[2] },
//       { name: "60–80%", count: buckets[3] },
//       { name: "80–100%", count: buckets[4] },
//     ];
//   }, [comments]);

//   const pieData = useMemo(() => {
//     const toxic = comments.filter(c => c.toxicity > TOXIC_THRESH).length;
//     const clean = comments.length - toxic;
//     return [
//       { name: "Clean", value: clean },
//       { name: "Toxic", value: toxic },
//     ];
//   }, [comments]);

//   const csvData = useMemo(() => comments.map(c => ({
//     id: c.id, username: c.username, text: c.text, toxicity: c.toxicity
//   })), [comments]);


//   // --- HANDLERS ---

//   const showToast = useCallback((message) => {
//     setToastMessage(message);
//     setTimeout(() => setToastMessage(null), 3000); // Hide after 3 seconds
//   }, []);

//   const copyToClipboard = async (text) => {
//     await navigator.clipboard.writeText(text);
//     showToast("ID Copied!");
//   };

//   const startHideComment = (id) => {
//     if (undoTimer) clearTimeout(undoTimer);
//     setPendingHideId(id);

//     const timer = setTimeout(() => {
//       setComments(prev => prev.map(c => c.id === id ? { ...c, hidden: true } : c));
//       setPendingHideId(null);
//     }, 10000); 
    
//     setUndoTimer(timer);
//     showToast(
//       <div className="flex items-center gap-2">
//         Comment hidden.
//         <button
//           onClick={() => undoHideComment(id)}
//           className="ml-2 px-3 py-1 bg-white text-blue-600 rounded-full text-xs font-semibold hover:bg-gray-100 flex items-center gap-1"
//         >
//           <RotateCcw size={14} /> Undo
//         </button>
//       </div>
//     );
//   };

//   const undoHideComment = (id) => {
//     if (undoTimer) clearTimeout(undoTimer);
//     setUndoTimer(null);
//     setPendingHideId(null);
//     showToast("Undo successful.");
//   };
  
//   const unhideComment = (id) => {
//     setComments(prev => prev.map(c => c.id === id ? { ...c, hidden: false } : c));
//     showToast("Comment unhidden.");
//   };

//   const toggleHideComment = (id, currentlyHidden) => {
//     if (currentlyHidden) {
//       unhideComment(id);
//     } else {
//       startHideComment(id);
//     }
//   };

//   const COLORS = ['#3b82f6', '#ef4444']; // Blue for Clean, Red for Toxic

  

//   return (
//     <div className={`${BACKGROUND_LIGHT} min-h-screen p-10 ${TEXT_COLOR}`}>
      
//       {/* Toast Notification Area */}
//       <AnimatePresence>
//         {toastMessage && (
//           <motion.div
//             initial={{ opacity: 0, y: 50, scale: 0.3 }}
//             animate={{ opacity: 1, y: 0, scale: 1 }}
//             exit={{ opacity: 0, y: 20, scale: 0.5 }}
//             transition={{ type: "spring", stiffness: 300, damping: 25 }}
//             className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-lg shadow-xl flex items-center gap-2 z-50 text-sm font-medium"
//           >
//             {typeof toastMessage === 'string' ? <Check size={18} /> : null}
//             {toastMessage}
//           </motion.div>
//         )}
//       </AnimatePresence>
      
//       <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
//         <h1 className="text-5xl font-extrabold mb-8 text-center text-blue-800 drop-shadow-sm">
//           🎥 Instagram Toxicity Detector
//         </h1>
//       </motion.div>

//       <div className="max-w-6xl mx-auto space-y-8">
        
//         {/* URL Input and Analyze Button */}
//         <div className={`${CARD_BG} p-6 rounded-xl shadow-lg`}>
//           <div className="flex flex-col md:flex-row items-center gap-4">
//             <input
//               className="flex-grow bg-blue-50 text-gray-700 p-3 rounded-lg outline-none border border-blue-300 focus:ring-2 focus:ring-blue-500 transition duration-150"
//               placeholder="Paste Instagram reel URL..."
//               value={reelUrl}
//               onChange={(e) => setReelUrl(e.target.value)}
//             />
//             <button
//               onClick={analyzeReel}
//               disabled={loading}
//               className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition duration-150 ${PRIMARY_BLUE} disabled:opacity-50`}
//             >
//               {loading ? "Analyzing..." : "Analyze"}
//             </button>
//             <button
//               onClick={() => { setReelUrl(""); setComments([]); setAvgToxicity(null); setError(""); }}
//               className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition duration-150 ${SECONDARY_BLUE}`}
//             >
//               <Trash2 size={18} /> Clear
//             </button>
//           </div>
//           {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-red-600 font-medium text-center">{error}</motion.div>}
//         </div>

//         {/* Conditional Rendering: Show Skeleton or Data */}
//         {loading && comments.length === 0 ? (
//             <LoadingSkeleton />
//         ) : comments.length > 0 ? (
//             <>
//                 {/* Summary and Charts Grid */}
//                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
//                     {/* Average Toxicity Card */}
//                     <div className={`${CARD_BG} p-6 rounded-xl shadow-lg lg:col-span-1`}>
//                         <h3 className="text-lg font-semibold text-blue-600 mb-4">Overall Sentiment</h3>
//                         <div className="flex items-baseline gap-2 mb-4">
//                             <div className="text-5xl font-extrabold text-blue-800">
//                             {avgToxicity !== null ? formatPct(avgToxicity) : "--"}
//                             </div>
//                             <div className="text-lg font-medium text-gray-500">Avg. Toxicity</div>
//                         </div>
//                         <p className="text-sm text-gray-500 border-t pt-3 mt-3">
//                             Based on **{comments.length}** comments analyzed from the Reel.
//                         </p>
//                     </div>

//                     {/* Pie Chart Card (Toxic vs. Clean) */}
//                     <div className={`${CARD_BG} p-6 rounded-xl shadow-lg lg:col-span-1`}>
//                         <h3 className="text-lg font-semibold text-blue-600 mb-1">Toxic vs. Clean</h3>
//                         <div className="flex flex-col items-center justify-center" style={{ width: "100%", height: 200 }}>
//                             <ResponsiveContainer width="100%" height="100%">
//                             <PieChart>
//                                 <Pie
//                                 data={pieData}
//                                 dataKey="value"
//                                 nameKey="name"
//                                 innerRadius={50}
//                                 outerRadius={80}
//                                 paddingAngle={5}
//                                 label
//                                 >
//                                 {pieData.map((entry, index) => (
//                                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                                 ))}
//                                 </Pie>
//                                 <Tooltip formatter={(value) => [`${value} comments`, formatPct(value / comments.length)]} />
//                                 <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" align="center" />
//                             </PieChart>
//                             </ResponsiveContainer>
//                         </div>
//                     </div>

//                     {/* Bar Chart Card (Toxicity Distribution) */}
//                     <div className={`${CARD_BG} p-6 rounded-xl shadow-lg lg:col-span-1`}>
//                         <h3 className="text-lg font-semibold text-blue-600 mb-4">Toxicity Distribution</h3>
//                         <div style={{ width: "100%", height: 200 }}>
//                             <ResponsiveContainer width="100%" height="100%">
//                             <BarChart data={histData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
//                                 <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '10px' }} />
//                                 <YAxis allowDecimals={false} stroke="#6b7280" />
//                                 <Tooltip formatter={(value) => [value, "Comments"]} />
//                                 <Bar dataKey="count">
//                                 {histData.map((entry, idx) => (
//                                     <Cell
//                                     key={`cell-${idx}`}
//                                     fill={idx >= 3 ? "#ef4444" : "#3b82f6"} // Red for 0.6-1.0, Blue otherwise
//                                     />
//                                 ))}
//                                 </Bar>
//                             </BarChart>
//                             </ResponsiveContainer>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Comment Table and Controls */}
//                 <div className={`${CARD_BG} p-6 rounded-xl shadow-lg`}>
//                     <h2 className="text-2xl font-bold text-blue-800 mb-4">Comment Analysis</h2>

//                     <div className="flex flex-wrap items-start justify-between mb-4 gap-4">
//                         {/* Filter Group */}
//                         <div className="flex flex-wrap items-end gap-4">
//                             {/* Search */}
//                             <div className="relative w-full sm:max-w-xs">
//                                 <label className="text-xs font-medium text-gray-500 block mb-1">Search</label>
//                                 <Search size={18} className="absolute left-3 bottom-3 text-gray-400" />
//                                 <input
//                                 type="text"
//                                 placeholder="Search comments or users..."
//                                 className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
//                                 value={search}
//                                 onChange={(e) => setSearch(e.target.value)}
//                                 />
//                             </div>

//                             {/* Toxicity Min Filter */}
//                             <div className="w-full sm:max-w-[150px]">
//                                 <label className="text-xs font-medium text-gray-500 block mb-1">Min Toxicity</label>
//                                 <select
//                                     value={minToxicity}
//                                     onChange={(e) => setMinToxicity(parseFloat(e.target.value))}
//                                     className="w-full py-2 px-3 rounded-lg border border-gray-300 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
//                                 >
//                                     {TOXICITY_RANGES.map(r => (
//                                         <option key={`min-${r.value}`} value={r.value} disabled={r.value > maxToxicity}>
//                                             {r.label}
//                                         </option>
//                                     ))}
//                                 </select>
//                             </div>

//                             {/* Toxicity Max Filter */}
//                             <div className="w-full sm:max-w-[150px]">
//                                 <label className="text-xs font-medium text-gray-500 block mb-1">Max Toxicity</label>
//                                 <select
//                                     value={maxToxicity}
//                                     onChange={(e) => setMaxToxicity(parseFloat(e.target.value))}
//                                     className="w-full py-2 px-3 rounded-lg border border-gray-300 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
//                                 >
//                                     {TOXICITY_RANGES.map(r => (
//                                         <option key={`max-${r.value}`} value={r.value} disabled={r.value < minToxicity}>
//                                             {r.label}
//                                         </option>
//                                     ))}
//                                 </select>
//                             </div>

//                              {/* Length Filter */}
//                              <div className="w-full sm:max-w-[150px]">
//                                 <label className="text-xs font-medium text-gray-500 block mb-1">Comment Length</label>
//                                 <select
//                                     value={lengthFilter}
//                                     onChange={(e) => setLengthFilter(e.target.value)}
//                                     className="w-full py-2 px-3 rounded-lg border border-gray-300 bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
//                                 >
//                                     {LENGTH_OPTIONS.map(l => (
//                                         <option key={l.value} value={l.value}>
//                                             {l.label}
//                                         </option>
//                                     ))}
//                                 </select>
//                             </div>
//                         </div>

//                         {/* Download Control */}
//                         <div className="flex items-end h-full">
//                             <CSVLink
//                                 data={csvData}
//                                 filename="reel_comments_analysis.csv"
//                                 className={`flex items-center gap-1 px-4 py-2 rounded-lg font-semibold text-sm transition duration-150 ${PRIMARY_BLUE}`}
//                             >
//                                 <Download size={16} /> Download Report
//                             </CSVLink>
//                         </div>
//                     </div>

//                     <div className="overflow-x-auto rounded-xl border border-blue-300">
//                     <table className={`min-w-full border-collapse text-sm ${TEXT_COLOR}`}>
//                         <thead>
//                         <tr className={`${HEADER_BG} border-b border-blue-300 text-blue-800 sticky top-0 z-10 shadow-sm`}>
//                             <th className="px-4 py-3 border-r border-blue-300/50 text-left">User</th>
//                             <th className="px-4 py-3 border-r border-blue-300/50 text-left">Comment</th>
//                             <th
//                             className="px-4 py-3 border-r border-blue-300/50 cursor-pointer"
//                             onClick={() => {
//                                 setSortKey("toxicity");
//                                 setSortDir(sortKey === "toxicity" && sortDir === "desc" ? "asc" : "desc");
//                             }}
//                             >
//                             Toxicity {sortKey === "toxicity" && (sortDir === "desc" ? '🔽' : '🔼')}
//                             </th>
//                             <th className="px-4 py-3">Actions</th>
//                         </tr>
//                         </thead>
//                         <tbody className="bg-white">
//                         {visibleComments.length === 0 && pendingHideId === null ? (
//                             <tr>
//                             <td colSpan={4} className="p-6 text-center text-gray-500 italic bg-gray-50">
//                                 No comments found matching the active filters.
//                             </td>
//                             </tr>
//                         ) : (
//                             visibleComments.map((c) => {
//                             const isToxic = c.toxicity > TOXIC_THRESH;
//                             return (
//                                 <tr
//                                 key={c.id}
//                                 className={`transition-all duration-200 border-b border-gray-100 ${
//                                     isToxic ? "bg-red-50 hover:bg-red-100" : "hover:bg-blue-50"
//                                 }`}
//                                 >
//                                 <td className="px-4 py-3 font-medium">{c.username}</td>
//                                 <td className="px-4 py-3 max-w-lg break-words text-left">{c.text}</td>
//                                 <td className="px-4 py-3 text-center">
//                                     <div className="flex flex-col items-center">
//                                     {/* Toxicity Bar */}
//                                     <div className="w-20 h-2 rounded overflow-hidden mb-1 bg-gray-200">
//                                         <div
//                                         style={{ width: `${Math.min(100, c.toxicity * 100)}%` }}
//                                         className={`h-full ${isToxic ? "bg-red-500" : "bg-blue-500"}`}
//                                         />
//                                     </div>
//                                     <span
//                                         className={`text-xs font-semibold ${
//                                         isToxic ? "text-red-600" : "text-blue-600"
//                                         }`}
//                                     >
//                                         {formatPct(c.toxicity)}
//                                     </span>
//                                     </div>
//                                 </td>
//                                 <td className="px-4 py-3 text-center">
//                                     <div className="flex items-center justify-center gap-2">
//                                     <button
//                                         onClick={() => copyToClipboard(c.id)}
//                                         title="Copy Comment ID"
//                                         className={`p-2 rounded-full text-blue-600 ${SECONDARY_BLUE} bg-opacity-70`}
//                                     >
//                                         <Copy size={14} />
//                                     </button>
//                                     <button
//                                         onClick={() => toggleHideComment(c.id, c.hidden)}
//                                         title={c.hidden ? "Unhide Comment" : "Hide Comment"}
//                                         className={`p-2 rounded-full ${c.hidden ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'} hover:bg-opacity-100 transition`}
//                                     >
//                                         {c.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
//                                     </button>
//                                     {isToxic && (
//                                         <span className="text-xs px-2 py-1 bg-red-500/10 text-red-700 font-medium rounded-full border border-red-300">
//                                         High Risk
//                                         </span>
//                                     )}
//                                     </div>
//                                 </td>
//                                 </tr>
//                             );
//                             })
//                         )}
//                         {/* Show the pending hidden comment at the bottom if it exists */}
//                         {pendingHideId && comments.find(c => c.id === pendingHideId) && (
//                             <tr className="bg-yellow-50/50 border-b border-yellow-200">
//                                 <td colSpan={4} className="p-3 text-center text-gray-600 italic font-medium">
//                                     <div className="flex items-center justify-center gap-3">
//                                         Comment **{comments.find(c => c.id === pendingHideId)?.username}'s** comment is pending removal (10s).
//                                         <button
//                                             onClick={() => undoHideComment(pendingHideId)}
//                                             className="ml-4 px-4 py-2 bg-yellow-400 text-yellow-900 rounded-lg text-sm font-semibold hover:bg-yellow-500 flex items-center gap-1 transition"
//                                         >
//                                             <RotateCcw size={16} /> UNDO
//                                         </button>
//                                     </div>
//                                 </td>
//                             </tr>
//                         )}
//                         </tbody>
//                     </table>
//                     </div>
//                     {/* Added Hide Toxic toggle back for clarity */}
//                     <div className="mt-4">
//                     <label className="inline-flex items-center text-sm font-medium text-gray-700">
//                         <input
//                         type="checkbox"
//                         checked={hideToxic}
//                         onChange={e => setHideToxic(e.target.checked)}
//                         className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//                         />
//                         **Filter** out all comments with Toxicity &gt; {TOXIC_THRESH * 100}% (Applies before range filter)
//                     </label>
//                     </div>
//                 </div>
//             </>
//         ) : (
//             // Default message when nothing is analyzed yet
//             <div className={`${CARD_BG} p-6 rounded-xl shadow-lg text-center text-gray-500`}>
//                 Enter an Instagram Reel URL above to start the toxicity analysis.
//             </div>
//         )}
//       </div>
//     </div>
//   );
// }





















// import React, { useState, useMemo, useCallback } from "react";
// import axios from "axios";
// import { CSVLink } from "react-csv";
// import {
//   BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
// } from "recharts";
// import { motion, AnimatePresence } from "framer-motion";
// import { Search, EyeOff, Eye, Download, Copy, Trash2, Check, RotateCcw } from "lucide-react";

// // Define constants
// const TOXIC_THRESH = 0.6;
// const PRIMARY_BLUE = "bg-blue-600 hover:bg-blue-700 text-white";
// const SECONDARY_BLUE = "bg-blue-100 hover:bg-blue-200 text-blue-800";
// const BACKGROUND_LIGHT = "bg-white";
// const CARD_BG = "bg-white border border-blue-200/50";
// const TEXT_COLOR = "text-gray-800";
// const HEADER_BG = "bg-blue-50";

// function formatPct(v) {
//   return (v * 100).toFixed(1) + "%";
// }

// // ===============================================
// // NEW: LOADING SKELETON COMPONENT
// // ===============================================
// const LoadingSkeleton = () => (
//     <div className="space-y-8 animate-pulse">
//         {/* Summary and Charts Grid Skeleton */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             <div className={`${CARD_BG} p-6 rounded-xl shadow-lg h-48 lg:col-span-1`}>
//                 <div className="h-4 bg-blue-200 rounded w-1/2 mb-4"></div>
//                 <div className="h-10 bg-blue-300 rounded w-1/3 mb-4"></div>
//                 <div className="h-3 bg-gray-200 rounded w-2/3"></div>
//             </div>
//             <div className={`${CARD_BG} p-6 rounded-xl shadow-lg h-48 lg:col-span-1`}>
//                 <div className="h-4 bg-blue-200 rounded w-1/2 mb-4"></div>
//                 <div className="h-28 bg-gray-200 rounded-full w-28 mx-auto"></div>
//             </div>
//             <div className={`${CARD_BG} p-6 rounded-xl shadow-lg h-48 lg:col-span-1`}>
//                 <div className="h-4 bg-blue-200 rounded w-1/2 mb-4"></div>
//                 <div className="h-32 bg-gray-200 rounded"></div>
//             </div>
//         </div>

//         {/* Comment Table Skeleton */}
//         <div className={`${CARD_BG} p-6 rounded-xl shadow-lg`}>
//             <div className="h-5 bg-blue-800 rounded w-1/4 mb-6"></div>
//             <div className="flex justify-between mb-4">
//                 <div className="h-10 bg-gray-200 rounded w-1/3"></div>
//                 <div className="h-10 bg-blue-600 rounded w-28"></div>
//             </div>
//             <div className="overflow-x-auto rounded-xl border border-blue-300">
//                 {[...Array(5)].map((_, i) => (
//                     <div key={i} className={`flex justify-between items-center px-4 py-4 border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
//                         <div className="h-3 bg-gray-200 rounded w-1/6"></div>
//                         <div className="h-3 bg-gray-200 rounded w-1/2"></div>
//                         <div className="h-3 bg-gray-200 rounded w-1/6"></div>
//                         <div className="h-8 w-12 bg-gray-300 rounded-full"></div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     </div>
// );
// // ===============================================


// export default function ReelAnalyzer() {
//   const [reelUrl, setReelUrl] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [comments, setComments] = useState([]);
//   const [avgToxicity, setAvgToxicity] = useState(null);
//   const [error, setError] = useState("");
//   const [search, setSearch] = useState("");
//   const [hideToxic, setHideToxic] = useState(false);
//   const [sortKey, setSortKey] = useState("toxicity");
//   const [sortDir, setSortDir] = useState("desc");
  
//   // New state for Undo feature
//   const [pendingHideId, setPendingHideId] = useState(null);
//   const [undoTimer, setUndoTimer] = useState(null);
  
//   // New state for Toast message
//   const [toastMessage, setToastMessage] = useState(null);

//   // --- API LOGIC (Identical to previous) ---
//   const analyzeReel = async () => {
//     setError("");
//     setLoading(true);
//     try {
//       if (!reelUrl || !reelUrl.includes("instagram.com")) {
//         setError("Enter a valid Instagram Reel URL.");
//         setLoading(false);
//         return;
//       }

//       const res = await axios.post("http://localhost:5000/api/analyze", { reelUrl });
//       const resComments = (res.data.comments || []).map((c) => ({
//         id: c.id ?? c._id ?? c.igCommentId ?? "",
//         username: c.username ?? "unknown_user",
//         text: c.text ?? "",
//         toxicity: typeof c.toxicity === "number" ? c.toxicity : (typeof c.overallToxicity === "number" ? c.overallToxicity : 0),
//         hidden: !!c.hidden,
//       }));

//       setComments(resComments);
//       setAvgToxicity(res.data.avgToxicity ?? 0);
//     } catch (err) {
//       console.error("Error analyzing reel:", err);
//       setError(err.response?.data?.error || err.message || "Analysis failed");
//     } finally {
//       setLoading(false);
//     }
//   };


//   // --- MEMOIZED DATA (Logic remains largely the same, but incorporates pendingHideId) ---

//   const visibleComments = useMemo(() => {
//     let arr = comments.filter(c => 
//         !(hideToxic && c.toxicity > TOXIC_THRESH) && 
//         !c.hidden && 
//         c.id !== pendingHideId // Exclude the comment pending hide
//     );
//     if (search) {
//       const s = search.toLowerCase();
//       arr = arr.filter(c => c.text.toLowerCase().includes(s) || c.username.toLowerCase().includes(s) || c.id.includes(s));
//     }
//     arr.sort((a, b) => {
//       let v = sortKey === "username" ? a.username.localeCompare(b.username) : a.toxicity - b.toxicity;
//       return sortDir === "asc" ? v : -v;
//     });
//     return arr;
//   }, [comments, hideToxic, search, sortKey, sortDir, pendingHideId]); // Added pendingHideId dependency

//   // ... (histData, pieData, csvData remain the same) ...

//   const histData = useMemo(() => {
//     const buckets = [0, 0, 0, 0, 0];
//     comments.forEach(c => {
//       const t = Math.max(0, Math.min(1, (c.toxicity || 0)));
//       const idx = Math.min(4, Math.floor(t * 5));
//       buckets[idx] += 1;
//     });
//     return [
//       { name: "0–20%", count: buckets[0] },
//       { name: "20–40%", count: buckets[1] },
//       { name: "40–60%", count: buckets[2] },
//       { name: "60–80%", count: buckets[3] },
//       { name: "80–100%", count: buckets[4] },
//     ];
//   }, [comments]);

//   const pieData = useMemo(() => {
//     const toxic = comments.filter(c => c.toxicity > TOXIC_THRESH).length;
//     const clean = comments.length - toxic;
//     return [
//       { name: "Clean", value: clean },
//       { name: "Toxic", value: toxic },
//     ];
//   }, [comments]);

//   const csvData = useMemo(() => comments.map(c => ({
//     id: c.id, username: c.username, text: c.text, toxicity: c.toxicity
//   })), [comments]);


//   // --- NEW HANDLERS FOR UNDO & TOAST ---

//   const showToast = useCallback((message) => {
//     setToastMessage(message);
//     setTimeout(() => setToastMessage(null), 3000); // Hide after 3 seconds
//   }, []);

//   const copyToClipboard = async (text) => {
//     await navigator.clipboard.writeText(text);
//     showToast("ID Copied!");
//   };

//   const startHideComment = (id) => {
//     if (undoTimer) clearTimeout(undoTimer);
//     setPendingHideId(id);

//     // Set a timer to perform the final hide after 10 seconds
//     const timer = setTimeout(() => {
//       setComments(prev => prev.map(c => c.id === id ? { ...c, hidden: true } : c));
//       setPendingHideId(null);
//     }, 10000); // 10-second undo window
    
//     setUndoTimer(timer);
//     showToast(
//       <div className="flex items-center gap-2">
//         Comment hidden.
//         <button
//           onClick={() => undoHideComment(id)}
//           className="ml-2 px-3 py-1 bg-white text-blue-600 rounded-full text-xs font-semibold hover:bg-gray-100 flex items-center gap-1"
//         >
//           <RotateCcw size={14} /> Undo
//         </button>
//       </div>
//     );
//   };

//   const undoHideComment = (id) => {
//     if (undoTimer) clearTimeout(undoTimer);
//     setUndoTimer(null);
//     setPendingHideId(null);
//     showToast("Undo successful.");
//     // No need to change the 'hidden' state since the final change was cancelled.
//   };
  
//   const unhideComment = (id) => {
//     setComments(prev => prev.map(c => c.id === id ? { ...c, hidden: false } : c));
//     showToast("Comment unhidden.");
//   };

//   const toggleHideComment = (id, currentlyHidden) => {
//     if (currentlyHidden) {
//       unhideComment(id);
//     } else {
//       startHideComment(id);
//     }
//   };

//   const COLORS = ['#3b82f6', '#ef4444']; // Blue for Clean, Red for Toxic

//   // --- COMPONENT RENDER ---

//   return (
//     <div className={`${BACKGROUND_LIGHT} min-h-screen p-10 ${TEXT_COLOR}`}>
      
//       {/* Toast Notification Area */}
//       <AnimatePresence>
//         {toastMessage && (
//           <motion.div
//             initial={{ opacity: 0, y: 50, scale: 0.3 }}
//             animate={{ opacity: 1, y: 0, scale: 1 }}
//             exit={{ opacity: 0, y: 20, scale: 0.5 }}
//             transition={{ type: "spring", stiffness: 300, damping: 25 }}
//             className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-lg shadow-xl flex items-center gap-2 z-50 text-sm font-medium"
//           >
//             {typeof toastMessage === 'string' ? <Check size={18} /> : null}
//             {toastMessage}
//           </motion.div>
//         )}
//       </AnimatePresence>
      
//       <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
//         <h1 className="text-5xl font-extrabold mb-8 text-center text-blue-800 drop-shadow-sm">
//           🎥 Instagram Reel Toxicity Dashboard
//         </h1>
//       </motion.div>

//       <div className="max-w-6xl mx-auto space-y-8">
        
//         {/* URL Input and Analyze Button */}
//         <div className={`${CARD_BG} p-6 rounded-xl shadow-lg`}>
//           <div className="flex flex-col md:flex-row items-center gap-4">
//             <input
//               className="flex-grow bg-blue-50 text-gray-700 p-3 rounded-lg outline-none border border-blue-300 focus:ring-2 focus:ring-blue-500 transition duration-150"
//               placeholder="Paste Instagram reel URL..."
//               value={reelUrl}
//               onChange={(e) => setReelUrl(e.target.value)}
//             />
//             <button
//               onClick={analyzeReel}
//               disabled={loading}
//               className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition duration-150 ${PRIMARY_BLUE} disabled:opacity-50`}
//             >
//               {loading ? "Analyzing..." : "Analyze"}
//             </button>
//             <button
//               onClick={() => { setReelUrl(""); setComments([]); setAvgToxicity(null); setError(""); }}
//               className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition duration-150 ${SECONDARY_BLUE}`}
//             >
//               <Trash2 size={18} /> Clear
//             </button>
//           </div>
//           {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-red-600 font-medium text-center">{error}</motion.div>}
//         </div>

//         {/* Conditional Rendering: Show Skeleton or Data */}
//         {loading && comments.length === 0 ? (
//             <LoadingSkeleton />
//         ) : comments.length > 0 ? (
//             <>
//                 {/* Summary and Charts Grid */}
//                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
//                     {/* Average Toxicity Card */}
//                     <div className={`${CARD_BG} p-6 rounded-xl shadow-lg lg:col-span-1`}>
//                         <h3 className="text-lg font-semibold text-blue-600 mb-4">Overall Sentiment</h3>
//                         <div className="flex items-baseline gap-2 mb-4">
//                             <div className="text-5xl font-extrabold text-blue-800">
//                             {avgToxicity !== null ? formatPct(avgToxicity) : "--"}
//                             </div>
//                             <div className="text-lg font-medium text-gray-500">Avg. Toxicity</div>
//                         </div>
//                         <p className="text-sm text-gray-500 border-t pt-3 mt-3">
//                             Based on **{comments.length}** comments analyzed from the Reel.
//                         </p>
//                     </div>

//                     {/* Pie Chart Card (Toxic vs. Clean) */}
//                     <div className={`${CARD_BG} p-6 rounded-xl shadow-lg lg:col-span-1`}>
//                         <h3 className="text-lg font-semibold text-blue-600 mb-1">Toxic vs. Clean</h3>
//                         <div className="flex flex-col items-center justify-center" style={{ width: "100%", height: 200 }}>
//                             <ResponsiveContainer width="100%" height="100%">
//                             <PieChart>
//                                 <Pie
//                                 data={pieData}
//                                 dataKey="value"
//                                 nameKey="name"
//                                 innerRadius={50}
//                                 outerRadius={80}
//                                 paddingAngle={5}
//                                 label
//                                 >
//                                 {pieData.map((entry, index) => (
//                                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                                 ))}
//                                 </Pie>
//                                 <Tooltip formatter={(value) => [`${value} comments`, formatPct(value / comments.length)]} />
//                                 <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" align="center" />
//                             </PieChart>
//                             </ResponsiveContainer>
//                         </div>
//                     </div>

//                     {/* Bar Chart Card (Toxicity Distribution) */}
//                     <div className={`${CARD_BG} p-6 rounded-xl shadow-lg lg:col-span-1`}>
//                         <h3 className="text-lg font-semibold text-blue-600 mb-4">Toxicity Distribution</h3>
//                         <div style={{ width: "100%", height: 200 }}>
//                             <ResponsiveContainer width="100%" height="100%">
//                             <BarChart data={histData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
//                                 <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '10px' }} />
//                                 <YAxis allowDecimals={false} stroke="#6b7280" />
//                                 <Tooltip formatter={(value) => [value, "Comments"]} />
//                                 <Bar dataKey="count">
//                                 {histData.map((entry, idx) => (
//                                     <Cell
//                                     key={`cell-${idx}`}
//                                     fill={idx >= 3 ? "#ef4444" : "#3b82f6"} // Red for 0.6-1.0, Blue otherwise
//                                     />
//                                 ))}
//                                 </Bar>
//                             </BarChart>
//                             </ResponsiveContainer>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Comment Table and Controls */}
//                 <div className={`${CARD_BG} p-6 rounded-xl shadow-lg`}>
//                     <h2 className="text-2xl font-bold text-blue-800 mb-4">Comment Analysis</h2>

//                     <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
//                     {/* Search */}
//                     <div className="relative flex-1 min-w-[200px] max-w-sm">
//                         <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                         <input
//                         type="text"
//                         placeholder="Search comments or users..."
//                         className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
//                         value={search}
//                         onChange={(e) => setSearch(e.target.value)}
//                         />
//                     </div>

//                     {/* Controls */}
//                     <div className="flex items-center gap-4">
                        
//                         <CSVLink
//                         data={csvData}
//                         filename="reel_comments_analysis.csv"
//                         className={`flex items-center gap-1 px-4 py-2 rounded-lg font-semibold text-sm transition duration-150 ${PRIMARY_BLUE}`}
//                         >
//                         <Download size={16} /> Download CSV
//                         </CSVLink>
//                     </div>
//                     </div>

//                     <div className="overflow-x-auto rounded-xl border border-blue-300">
//                     <table className={`min-w-full border-collapse text-sm ${TEXT_COLOR}`}>
//                         <thead>
//                         <tr className={`${HEADER_BG} border-b border-blue-300 text-blue-800 sticky top-0 z-10 shadow-sm`}>
//                             <th className="px-4 py-3 border-r border-blue-300/50 text-left">User</th>
//                             <th className="px-4 py-3 border-r border-blue-300/50 text-left">Comment</th>
//                             <th
//                             className="px-4 py-3 border-r border-blue-300/50 cursor-pointer"
//                             onClick={() => {
//                                 setSortKey("toxicity");
//                                 setSortDir(sortKey === "toxicity" && sortDir === "desc" ? "asc" : "desc");
//                             }}
//                             >
//                             Toxicity {sortKey === "toxicity" && (sortDir === "desc" ? '🔽' : '🔼')}
//                             </th>
//                             <th className="px-4 py-3">Actions</th>
//                         </tr>
//                         </thead>
//                         <tbody className="bg-white">
//                         {visibleComments.length === 0 && pendingHideId === null ? (
//                             <tr>
//                             <td colSpan={4} className="p-6 text-center text-gray-500 italic bg-gray-50">
//                                 No comments found matching the filters.
//                             </td>
//                             </tr>
//                         ) : (
//                             visibleComments.map((c) => {
//                             const isToxic = c.toxicity > TOXIC_THRESH;
//                             return (
//                                 <tr
//                                 key={c.id}
//                                 className={`transition-all duration-200 border-b border-gray-100 ${
//                                     isToxic ? "bg-red-50 hover:bg-red-100" : "hover:bg-blue-50"
//                                 }`}
//                                 >
//                                 <td className="px-4 py-3 font-medium">{c.username}</td>
//                                 <td className="px-4 py-3 max-w-lg break-words text-left">{c.text}</td>
//                                 <td className="px-4 py-3 text-center">
//                                     <div className="flex flex-col items-center">
//                                     {/* Toxicity Bar */}
//                                     <div className="w-20 h-2 rounded overflow-hidden mb-1 bg-gray-200">
//                                         <div
//                                         style={{ width: `${Math.min(100, c.toxicity * 100)}%` }}
//                                         className={`h-full ${isToxic ? "bg-red-500" : "bg-blue-500"}`}
//                                         />
//                                     </div>
//                                     <span
//                                         className={`text-xs font-semibold ${
//                                         isToxic ? "text-red-600" : "text-blue-600"
//                                         }`}
//                                     >
//                                         {formatPct(c.toxicity)}
//                                     </span>
//                                     </div>
//                                 </td>
//                                 <td className="px-4 py-3 text-center">
//                                     <div className="flex items-center justify-center gap-2">
//                                     <button
//                                         onClick={() => copyToClipboard(c.id)}
//                                         title="Copy Comment ID"
//                                         className={`p-2 rounded-full text-blue-600 ${SECONDARY_BLUE} bg-opacity-70`}
//                                     >
//                                         <Copy size={14} />
//                                     </button>
//                                     <button
//                                         onClick={() => toggleHideComment(c.id, c.hidden)}
//                                         title={c.hidden ? "Unhide Comment" : "Hide Comment"}
//                                         className={`p-2 rounded-full ${c.hidden ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'} hover:bg-opacity-100 transition`}
//                                     >
//                                         {c.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
//                                     </button>
//                                     {/* {isToxic && (
//                                         <span className="text-xs px-2 py-1 bg-red-500/10 text-red-700 font-medium rounded-full border border-red-300">
//                                         High Risk
//                                         </span>
//                                     )} */}
//                                     </div>
//                                 </td>
//                                 </tr>
//                             );
//                             })
//                         )}
//                         {/* Show the pending hidden comment at the bottom if it exists */}
//                         {pendingHideId && comments.find(c => c.id === pendingHideId) && (
//                             <tr className="bg-yellow-50/50 border-b border-yellow-200">
//                                 <td colSpan={4} className="p-3 text-center text-gray-600 italic font-medium">
//                                     <div className="flex items-center justify-center gap-3">
//                                         Comment **{comments.find(c => c.id === pendingHideId)?.username}'s** comment is pending removal (10s).
//                                         <button
//                                             onClick={() => undoHideComment(pendingHideId)}
//                                             className="ml-4 px-4 py-2 bg-yellow-400 text-yellow-900 rounded-lg text-sm font-semibold hover:bg-yellow-500 flex items-center gap-1 transition"
//                                         >
//                                             <RotateCcw size={16} /> UNDO
//                                         </button>
//                                     </div>
//                                 </td>
//                             </tr>
//                         )}
//                         </tbody>
//                     </table>
//                     </div>
//                     {/* Added Hide Toxic toggle back for clarity */}
//                     <div className="mt-4">
//                     <label className="inline-flex items-center text-sm font-medium text-gray-700">
//                         <input
//                         type="checkbox"
//                         checked={hideToxic}
//                         onChange={e => setHideToxic(e.target.checked)}
//                         className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//                         />
//                         **Filter** out all comments with Toxicity &gt; {TOXIC_THRESH * 100}%
//                     </label>
//                     </div>
//                 </div>
//             </>
//         ) : (
//             // Default message when nothing is analyzed yet
//             <div className={`${CARD_BG} p-6 rounded-xl shadow-lg text-center text-gray-500`}>
//                 Enter an Instagram Reel URL above to start the toxicity analysis.
//             </div>
//         )}
//       </div>
//     </div>
//   );
// }

















// import React, { useState, useMemo, useCallback } from "react";
// import axios from "axios";
// import { CSVLink } from "react-csv";
// import {
//   BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
// } from "recharts";
// import { motion, AnimatePresence } from "framer-motion";
// import { Search, EyeOff, Eye, Download, Copy, Trash2, Check, RotateCcw } from "lucide-react"; // Added RotateCcw for Undo

// // Define constants
// const TOXIC_THRESH = 0.6;
// const PRIMARY_BLUE = "bg-blue-600 hover:bg-blue-700 text-white";
// const SECONDARY_BLUE = "bg-blue-100 hover:bg-blue-200 text-blue-800";
// const BACKGROUND_LIGHT = "bg-white";
// const CARD_BG = "bg-white border border-blue-200/50";
// const TEXT_COLOR = "text-gray-800";
// const HEADER_BG = "bg-blue-50";

// function formatPct(v) {
//   return (v * 100).toFixed(1) + "%";
// }

// export default function ReelAnalyzer() {
//   const [reelUrl, setReelUrl] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [comments, setComments] = useState([]);
//   const [avgToxicity, setAvgToxicity] = useState(null);
//   const [error, setError] = useState("");
//   const [search, setSearch] = useState("");
//   const [hideToxic, setHideToxic] = useState(false);
//   const [sortKey, setSortKey] = useState("toxicity");
//   const [sortDir, setSortDir] = useState("desc");
  
//   // New state for Undo feature
//   const [pendingHideId, setPendingHideId] = useState(null);
//   const [undoTimer, setUndoTimer] = useState(null);
  
//   // New state for Toast message
//   const [toastMessage, setToastMessage] = useState(null);

//   // --- API LOGIC (Identical to previous) ---
//   const analyzeReel = async () => {
//     // ... (analyzeReel function remains the same) ...
//     setError("");
//     setLoading(true);
//     try {
//       if (!reelUrl || !reelUrl.includes("instagram.com")) {
//         setError("Enter a valid Instagram Reel URL.");
//         setLoading(false);
//         return;
//       }

//       const res = await axios.post("http://localhost:5000/api/analyze", { reelUrl });
//       const resComments = (res.data.comments || []).map((c) => ({
//         id: c.id ?? c._id ?? c.igCommentId ?? "",
//         username: c.username ?? "unknown_user",
//         text: c.text ?? "",
//         toxicity: typeof c.toxicity === "number" ? c.toxicity : (typeof c.overallToxicity === "number" ? c.overallToxicity : 0),
//         hidden: !!c.hidden,
//       }));

//       setComments(resComments);
//       setAvgToxicity(res.data.avgToxicity ?? 0);
//     } catch (err) {
//       console.error("Error analyzing reel:", err);
//       setError(err.response?.data?.error || err.message || "Analysis failed");
//     } finally {
//       setLoading(false);
//     }
//   };


//   // --- MEMOIZED DATA (Logic remains largely the same, but incorporates pendingHideId) ---

//   const visibleComments = useMemo(() => {
//     let arr = comments.filter(c => 
//         !(hideToxic && c.toxicity > TOXIC_THRESH) && 
//         !c.hidden && 
//         c.id !== pendingHideId // Exclude the comment pending hide
//     );
//     if (search) {
//       const s = search.toLowerCase();
//       arr = arr.filter(c => c.text.toLowerCase().includes(s) || c.username.toLowerCase().includes(s) || c.id.includes(s));
//     }
//     arr.sort((a, b) => {
//       let v = sortKey === "username" ? a.username.localeCompare(b.username) : a.toxicity - b.toxicity;
//       return sortDir === "asc" ? v : -v;
//     });
//     return arr;
//   }, [comments, hideToxic, search, sortKey, sortDir, pendingHideId]); // Added pendingHideId dependency

//   // ... (histData, pieData, csvData remain the same) ...

//   const histData = useMemo(() => {
//     const buckets = [0, 0, 0, 0, 0];
//     comments.forEach(c => {
//       const t = Math.max(0, Math.min(1, (c.toxicity || 0)));
//       const idx = Math.min(4, Math.floor(t * 5));
//       buckets[idx] += 1;
//     });
//     return [
//       { name: "0–20%", count: buckets[0] },
//       { name: "20–40%", count: buckets[1] },
//       { name: "40–60%", count: buckets[2] },
//       { name: "60–80%", count: buckets[3] },
//       { name: "80–100%", count: buckets[4] },
//     ];
//   }, [comments]);

//   const pieData = useMemo(() => {
//     const toxic = comments.filter(c => c.toxicity > TOXIC_THRESH).length;
//     const clean = comments.length - toxic;
//     return [
//       { name: "Clean", value: clean },
//       { name: "Toxic", value: toxic },
//     ];
//   }, [comments]);

//   const csvData = useMemo(() => comments.map(c => ({
//     id: c.id, username: c.username, text: c.text, toxicity: c.toxicity
//   })), [comments]);


//   // --- NEW HANDLERS FOR UNDO & TOAST ---

//   const showToast = useCallback((message) => {
//     setToastMessage(message);
//     setTimeout(() => setToastMessage(null), 3000); // Hide after 3 seconds
//   }, []);

//   const copyToClipboard = async (text) => {
//     await navigator.clipboard.writeText(text);
//     showToast("ID Copied!");
//   };

//   const startHideComment = (id) => {
//     if (undoTimer) clearTimeout(undoTimer);
//     setPendingHideId(id);

//     // Set a timer to perform the final hide after 5 seconds
//     const timer = setTimeout(() => {
//       setComments(prev => prev.map(c => c.id === id ? { ...c, hidden: true } : c));
//       setPendingHideId(null);
//     }, 10000); // 5-second undo window
    
//     setUndoTimer(timer);
//     showToast(
//       <div className="flex items-center gap-2">
//         Comment hidden.
//         <button
//           onClick={() => undoHideComment(id)}
//           className="ml-2 px-3 py-1 bg-white text-blue-600 rounded-full text-xs font-semibold hover:bg-gray-100 flex items-center gap-1"
//         >
//           <RotateCcw size={14} /> Undo
//         </button>
//       </div>
//     );
//   };

//   const undoHideComment = (id) => {
//     if (undoTimer) clearTimeout(undoTimer);
//     setUndoTimer(null);
//     setPendingHideId(null);
//     showToast("Undo successful.");
//     // No need to change the 'hidden' state since the final change was cancelled.
//   };
  
//   const unhideComment = (id) => {
//     setComments(prev => prev.map(c => c.id === id ? { ...c, hidden: false } : c));
//     showToast("Comment unhidden.");
//   };

//   // The toggleHideComment function is replaced by startHideComment/unhideComment for better UX
//   const toggleHideComment = (id, currentlyHidden) => {
//     if (currentlyHidden) {
//       unhideComment(id);
//     } else {
//       startHideComment(id);
//     }
//   };

//   const COLORS = ['#3b82f6', '#ef4444']; // Blue for Clean, Red for Toxic

//   // --- COMPONENT RENDER ---

//   return (
//     <div className={`${BACKGROUND_LIGHT} min-h-screen p-10 ${TEXT_COLOR}`}>
      
//       {/* Toast Notification Area */}
//       <AnimatePresence>
//         {toastMessage && (
//           <motion.div
//             initial={{ opacity: 0, y: 50, scale: 0.3 }}
//             animate={{ opacity: 1, y: 0, scale: 1 }}
//             exit={{ opacity: 0, y: 20, scale: 0.5 }}
//             transition={{ type: "spring", stiffness: 300, damping: 25 }}
//             className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-lg shadow-xl flex items-center gap-2 z-50 text-sm font-medium"
//           >
//             {typeof toastMessage === 'string' ? <Check size={18} /> : null}
//             {toastMessage}
//           </motion.div>
//         )}
//       </AnimatePresence>
      
//       <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
//         <h1 className="text-5xl font-extrabold mb-8 text-center text-blue-800 drop-shadow-sm">
//           🎥 Instagram Reel Toxicity Dashboard
//         </h1>
//       </motion.div>

//       <div className="max-w-6xl mx-auto space-y-8">
        
//         {/* URL Input and Analyze Button */}
//         <div className={`${CARD_BG} p-6 rounded-xl shadow-lg`}>
//           <div className="flex flex-col md:flex-row items-center gap-4">
//             <input
//               className="flex-grow bg-blue-50 text-gray-700 p-3 rounded-lg outline-none border border-blue-300 focus:ring-2 focus:ring-blue-500 transition duration-150"
//               placeholder="Paste Instagram reel URL..."
//               value={reelUrl}
//               onChange={(e) => setReelUrl(e.target.value)}
//             />
//             <button
//               onClick={analyzeReel}
//               disabled={loading}
//               className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition duration-150 ${PRIMARY_BLUE} disabled:opacity-50`}
//             >
//               {loading ? "Analyzing..." : "Analyze"}
//             </button>
//             <button
//               onClick={() => { setReelUrl(""); setComments([]); setAvgToxicity(null); setError(""); }}
//               className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition duration-150 ${SECONDARY_BLUE}`}
//             >
//               <Trash2 size={18} /> Clear
//             </button>
//           </div>
//           {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-red-600 font-medium text-center">{error}</motion.div>}
//         </div>

//         {/* Summary and Charts Grid */}
//         {comments.length > 0 && (
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
//             {/* Average Toxicity Card */}
//             <div className={`${CARD_BG} p-6 rounded-xl shadow-lg lg:col-span-1`}>
//               <h3 className="text-lg font-semibold text-blue-600 mb-4">Overall Sentiment</h3>
//               <div className="flex items-baseline gap-2 mb-4">
//                 <div className="text-5xl font-extrabold text-blue-800">
//                   {avgToxicity !== null ? formatPct(avgToxicity) : "--"}
//                 </div>
//                 <div className="text-lg font-medium text-gray-500">Avg. Toxicity</div>
//               </div>
//               <p className="text-sm text-gray-500 border-t pt-3 mt-3">
//                 Based on **{comments.length}** comments analyzed from the Reel.
//               </p>
//             </div>

//             {/* Pie Chart Card (Toxic vs. Clean) */}
//             <div className={`${CARD_BG} p-6 rounded-xl shadow-lg lg:col-span-1`}>
//               <h3 className="text-lg font-semibold text-blue-600 mb-1">Toxic vs. Clean</h3>
//               <div className="flex flex-col items-center justify-center" style={{ width: "100%", height: 200 }}>
//                 <ResponsiveContainer width="100%" height="100%">
//                   <PieChart>
//                     <Pie
//                       data={pieData}
//                       dataKey="value"
//                       nameKey="name"
//                       innerRadius={50}
//                       outerRadius={80}
//                       paddingAngle={5}
//                       label
//                     >
//                       {pieData.map((entry, index) => (
//                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                       ))}
//                     </Pie>
//                     <Tooltip formatter={(value) => [`${value} comments`, formatPct(value / comments.length)]} />
//                     <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" align="center" />
//                   </PieChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>

//             {/* Bar Chart Card (Toxicity Distribution) */}
//             <div className={`${CARD_BG} p-6 rounded-xl shadow-lg lg:col-span-1`}>
//               <h3 className="text-lg font-semibold text-blue-600 mb-4">Toxicity Distribution</h3>
//               <div style={{ width: "100%", height: 200 }}>
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={histData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
//                     <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '10px' }} />
//                     <YAxis allowDecimals={false} stroke="#6b7280" />
//                     <Tooltip formatter={(value) => [value, "Comments"]} />
//                     <Bar dataKey="count">
//                       {histData.map((entry, idx) => (
//                         <Cell
//                           key={`cell-${idx}`}
//                           fill={idx >= 3 ? "#ef4444" : "#3b82f6"} // Red for 0.6-1.0, Blue otherwise
//                         />
//                       ))}
//                     </Bar>
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Comment Table and Controls */}
//         {comments.length > 0 && (
//           <div className={`${CARD_BG} p-6 rounded-xl shadow-lg`}>
//             <h2 className="text-2xl font-bold text-blue-800 mb-4">Comment Analysis</h2>

//             <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
//               {/* Search */}
//               <div className="relative flex-1 min-w-[200px] max-w-sm">
//                 <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Search comments or users..."
//                   className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                 />
//               </div>

//               {/* Controls */}
//               <div className="flex items-center gap-4">
//                 {/* <label className="inline-flex items-center text-sm font-medium text-gray-700">
//                   <input
//                     type="checkbox"
//                     checked={hideToxic}
//                     onChange={e => setHideToxic(e.target.checked)}
//                     className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//                   />
//                   Hide Toxic (&gt; {TOXIC_THRESH * 100}%)
//                 </label> */}
                
//                 <CSVLink
//                   data={csvData}
//                   filename="reel_comments_analysis.csv"
//                   className={`flex items-center gap-1 px-4 py-2 rounded-lg font-semibold text-sm transition duration-150 ${PRIMARY_BLUE}`}
//                 >
//                   <Download size={16} /> Download CSV
//                 </CSVLink>
//               </div>
//             </div>

//             <div className="overflow-x-auto rounded-xl border border-blue-300">
//               <table className={`min-w-full border-collapse text-sm ${TEXT_COLOR}`}>
//                 <thead>
//                   <tr className={`${HEADER_BG} border-b border-blue-300 text-blue-800`}>
//                     <th className="px-4 py-3 border-r border-blue-300/50 text-left">User</th>
//                     <th className="px-4 py-3 border-r border-blue-300/50 text-left">Comment</th>
//                     <th
//                       className="px-4 py-3 border-r border-blue-300/50 cursor-pointer"
//                       onClick={() => {
//                         setSortKey("toxicity");
//                         setSortDir(sortKey === "toxicity" && sortDir === "desc" ? "asc" : "desc");
//                       }}
//                     >
//                       Toxicity {sortKey === "toxicity" && (sortDir === "desc" ? '🔽' : '🔼')}
//                     </th>
//                     <th className="px-4 py-3">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white">
//                   {visibleComments.length === 0 && pendingHideId === null ? (
//                     <tr>
//                       <td colSpan={4} className="p-6 text-center text-gray-500 italic bg-gray-50">
//                         No comments found matching the filters.
//                       </td>
//                     </tr>
//                   ) : (
//                     visibleComments.map((c) => {
//                       const isToxic = c.toxicity > TOXIC_THRESH;
//                       return (
//                         <tr
//                           key={c.id}
//                           className={`transition-all duration-200 border-b border-gray-100 ${
//                             isToxic ? "bg-red-100 hover:bg-red-200" : "hover:bg-blue-50"
//                           }`}
//                         >
//                           <td className="px-4 py-3 font-medium">{c.username}</td>
//                           <td className="px-4 py-3 max-w-lg break-words text-left">{c.text}</td>
//                           <td className="px-4 py-3 text-center">
//                             <div className="flex flex-col items-center">
//                               {/* Toxicity Bar */}
//                               <div className="w-20 h-2 rounded overflow-hidden mb-1 bg-gray-200">
//                                 <div
//                                   style={{ width: `${Math.min(100, c.toxicity * 100)}%` }}
//                                   className={`h-full ${isToxic ? "bg-red-500" : "bg-blue-500"}`}
//                                 />
//                               </div>
//                               <span
//                                 className={`text-xs font-semibold ${
//                                   isToxic ? "text-red-600" : "text-blue-600"
//                                 }`}
//                               >
//                                 {formatPct(c.toxicity)}
//                               </span>
//                             </div>
//                           </td>
//                           <td className="px-4 py-3 text-center">
//                             <div className="flex items-center justify-center gap-2">
//                               <button
//                                 onClick={() => copyToClipboard(c.id)}
//                                 title="Copy Comment ID"
//                                 className={`p-2 rounded-full text-blue-600 ${SECONDARY_BLUE} bg-opacity-70`}
//                               >
//                                 <Copy size={14} />
//                               </button>
//                               {/* Replaced old toggle with new logic */}
//                               <button
//                                 onClick={() => toggleHideComment(c.id, c.hidden)}
//                                 title={c.hidden ? "Unhide Comment" : "Hide Comment"}
//                                 className={`p-2 rounded-full ${c.hidden ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'} hover:bg-opacity-100 transition`}
//                               >
//                                 {c.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
//                               </button>
//                               {/* {isToxic && (
//                                 <span className="text-xs px-2 py-1 bg-red-500/10 text-red-700 font-medium rounded-full border border-red-300">
//                                   High Risk
//                                 </span>
//                               )} */}
//                             </div>
//                           </td>
//                         </tr>
//                       );
//                     })
//                   )}
//                   {/* Show the pending hidden comment at the bottom if it exists */}
//                   {pendingHideId && comments.find(c => c.id === pendingHideId) && (
//                     <tr className="bg-yellow-50/50 border-b border-yellow-200">
//                         <td colSpan={4} className="p-3 text-center text-gray-600 italic font-medium">
//                             <div className="flex items-center justify-center gap-3">
//                                 Comment **{comments.find(c => c.id === pendingHideId)?.username}'s** comment is pending removal (10s).
//                                 <button
//                                     onClick={() => undoHideComment(pendingHideId)}
//                                     className="ml-4 px-4 py-2 bg-yellow-400 text-yellow-900 rounded-lg text-sm font-semibold hover:bg-yellow-500 flex items-center gap-1 transition"
//                                 >
//                                     <RotateCcw size={16} /> UNDO
//                                 </button>
//                             </div>
//                         </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//             {/* Added Hide Toxic toggle back for clarity */}
//             <div className="mt-4">
//               <label className="inline-flex items-center text-sm font-medium text-gray-700">
//                 <input
//                   type="checkbox"
//                   checked={hideToxic}
//                   onChange={e => setHideToxic(e.target.checked)}
//                   className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//                 />
//                 **Filter** out all comments with Toxicity &gt; {TOXIC_THRESH * 100}%
//               </label>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


















// import React, { useState, useMemo } from "react";
// import axios from "axios";
// import { CSVLink } from "react-csv";
// import {
//   BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
// } from "recharts";
// import { motion } from "framer-motion";
// import { Search, EyeOff, Eye, Download, Copy, Trash2 } from "lucide-react"; // Importing icons for better UI

// // Define constants
// const TOXIC_THRESH = 0.06;
// const PRIMARY_BLUE = "bg-blue-600 hover:bg-blue-700 text-white";
// const SECONDARY_BLUE = "bg-blue-100 hover:bg-blue-200 text-blue-800";
// const BACKGROUND_LIGHT = "bg-white";
// const CARD_BG = "bg-white border border-blue-200/50";
// const TEXT_COLOR = "text-gray-800";
// const HEADER_BG = "bg-blue-50";

// function formatPct(v) {
//   return (v * 100).toFixed(1) + "%";
// }

// export default function ReelAnalyzer() {
//   const [reelUrl, setReelUrl] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [comments, setComments] = useState([]);
//   const [avgToxicity, setAvgToxicity] = useState(null);
//   const [error, setError] = useState("");
//   const [search, setSearch] = useState("");
//   const [hideToxic, setHideToxic] = useState(false);
//   const [sortKey, setSortKey] = useState("toxicity");
//   const [sortDir, setSortDir] = useState("desc");

//   const analyzeReel = async () => {
//     setError("");
//     setLoading(true);
//     try {
//       if (!reelUrl || !reelUrl.includes("instagram.com")) {
//         setError("Enter a valid Instagram Reel URL.");
//         setLoading(false);
//         return;
//       }

//       // Simulating a safe URL check for this example (replace with actual API logic)
//       const res = await axios.post("http://localhost:5000/api/analyze", { reelUrl });
//       const resComments = (res.data.comments || []).map((c) => ({
//         id: c.id ?? c._id ?? c.igCommentId ?? "",
//         username: c.username ?? "unknown_user",
//         text: c.text ?? "",
//         toxicity: typeof c.toxicity === "number" ? c.toxicity : (typeof c.overallToxicity === "number" ? c.overallToxicity : 0),
//         hidden: !!c.hidden,
//       }));

//       setComments(resComments);
//       setAvgToxicity(res.data.avgToxicity ?? 0);
//     } catch (err) {
//       console.error("Error analyzing reel:", err);
//       setError(err.response?.data?.error || err.message || "Analysis failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const visibleComments = useMemo(() => {
//     let arr = comments.filter(c => !(hideToxic && c.toxicity > TOXIC_THRESH) && !c.hidden);
//     if (search) {
//       const s = search.toLowerCase();
//       arr = arr.filter(c => c.text.toLowerCase().includes(s) || c.username.toLowerCase().includes(s) || c.id.includes(s));
//     }
//     arr.sort((a, b) => {
//       let v = sortKey === "username" ? a.username.localeCompare(b.username) : a.toxicity - b.toxicity;
//       return sortDir === "asc" ? v : -v;
//     });
//     return arr;
//   }, [comments, hideToxic, search, sortKey, sortDir]);

//   const histData = useMemo(() => {
//     const buckets = [0, 0, 0, 0, 0];
//     comments.forEach(c => {
//       // Scale toxicity to 0-1 range for the bar chart bucket logic, then multiply by 100 for percentage
//       const t = Math.max(0, Math.min(1, (c.toxicity || 0))); // assuming toxicity is already 0-1 from backend
//       const idx = Math.min(4, Math.floor(t * 5)); // maps 0-0.2 to 0, 0.2-0.4 to 1, etc.
//       buckets[idx] += 1;
//     });
//     return [
//       { name: "0–20%", count: buckets[0] },
//       { name: "20–40%", count: buckets[1] },
//       { name: "40–60%", count: buckets[2] },
//       { name: "60–80%", count: buckets[3] },
//       { name: "80–100%", count: buckets[4] },
//     ];
//   }, [comments]);

//   const pieData = useMemo(() => {
//     const toxic = comments.filter(c => c.toxicity > TOXIC_THRESH).length;
//     const clean = comments.length - toxic;
//     return [
//       { name: "Clean", value: clean },
//       { name: "Toxic", value: toxic },
//     ];
//   }, [comments]);

//   const csvData = useMemo(() => visibleComments.map(c => ({
//     id: c.id, username: c.username, text: c.text, toxicity: c.toxicity
//   })), [visibleComments]);

//   const toggleHideComment = (id) => {
//     setComments(prev => prev.map(c => c.id === id ? { ...c, hidden: !c.hidden } : c));
//   };

//   const copyToClipboard = async (text) => {
//     await navigator.clipboard.writeText(text);
//   };

//   const COLORS = ['#3b82f6', '#ef4444']; // Blue for Clean, Red for Toxic

//   return (
//     <div className={`${BACKGROUND_LIGHT} min-h-screen p-10 ${TEXT_COLOR}`}>
//       <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
//         <h1 className="text-5xl font-extrabold mb-8 text-center text-blue-800 drop-shadow-sm">
//           🎥 Instagram Toxicity Detection
//         </h1>
//       </motion.div>

//       <div className="max-w-6xl mx-auto space-y-8">
        
//         {/* URL Input and Analyze Button */}
//         <div className={`${CARD_BG} p-6 rounded-xl shadow-lg`}>
//           <div className="flex flex-col md:flex-row items-center gap-4">
//             <input
//               className="flex-grow bg-blue-50 text-gray-700 p-3 rounded-lg outline-none border border-blue-300 focus:ring-2 focus:ring-blue-500 transition duration-150"
//               placeholder="Paste Instagram reel URL..."
//               value={reelUrl}
//               onChange={(e) => setReelUrl(e.target.value)}
//             />
//             <button
//               onClick={analyzeReel}
//               disabled={loading}
//               className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition duration-150 ${PRIMARY_BLUE} disabled:opacity-50`}
//             >
//               {loading ? "Analyzing..." : "Analyze"}
//             </button>
//             <button
//               onClick={() => { setReelUrl(""); setComments([]); setAvgToxicity(null); setError(""); }}
//               className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition duration-150 ${SECONDARY_BLUE}`}
//             >
//               <Trash2 size={18} /> Clear
//             </button>
//           </div>
//           {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-red-600 font-medium text-center">{error}</motion.div>}
//         </div>

//         {/* Summary and Charts Grid */}
//         {comments.length > 0 && (
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
//             {/* Average Toxicity Card */}
//             <div className={`${CARD_BG} p-6 rounded-xl shadow-lg lg:col-span-1`}>
//               <h3 className="text-lg font-semibold text-blue-600 mb-4">Overall Sentiment</h3>
//               <div className="flex items-baseline gap-2 mb-4">
//                 <div className="text-5xl font-extrabold text-blue-800">
//                   {avgToxicity !== null ? formatPct(avgToxicity) : "--"}
//                 </div>
//                 <div className="text-lg font-medium text-gray-500">Avg. Toxicity</div>
//               </div>
//               <p className="text-sm text-gray-500 border-t pt-3 mt-3">
//                 Based on **{comments.length}** comments analyzed from the Reel.
//               </p>
//             </div>

//             {/* Pie Chart Card (Toxic vs. Clean) */}
//             <div className={`${CARD_BG} p-6 rounded-xl shadow-lg lg:col-span-1`}>
//               <h3 className="text-lg font-semibold text-blue-600 mb-1">Toxic vs. Clean</h3>
//               <div className="flex flex-col items-center justify-center" style={{ width: "100%", height: 200 }}>
//                 <ResponsiveContainer width="100%" height="100%">
//                   <PieChart>
//                     <Pie
//                       data={pieData}
//                       dataKey="value"
//                       nameKey="name"
//                       innerRadius={50}
//                       outerRadius={80}
//                       paddingAngle={5}
//                       label
//                     >
//                       {pieData.map((entry, index) => (
//                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                       ))}
//                     </Pie>
//                     <Tooltip formatter={(value) => `${value} comments (${formatPct(value / comments.length)})`} />
//                     <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" align="center" />
//                   </PieChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>

//             {/* Bar Chart Card (Toxicity Distribution) */}
//             <div className={`${CARD_BG} p-6 rounded-xl shadow-lg lg:col-span-1`}>
//               <h3 className="text-lg font-semibold text-blue-600 mb-4">Toxicity Distribution</h3>
//               <div style={{ width: "100%", height: 200 }}>
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={histData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
//                     <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '10px' }} />
//                     <YAxis allowDecimals={false} stroke="#6b7280" />
//                     <Tooltip formatter={(value) => [value, "Comments"]} />
//                     <Bar dataKey="count">
//                       {histData.map((entry, idx) => (
//                         <Cell
//                           key={`cell-${idx}`}
//                           fill={idx >= 3 ? "#ef4444" : "#3b82f6"} // Red for 0.6-1.0, Blue otherwise
//                         />
//                       ))}
//                     </Bar>
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Comment Table and Controls */}
//         {comments.length > 0 && (
//           <div className={`${CARD_BG} p-6 rounded-xl shadow-lg`}>
//             <h2 className="text-2xl font-bold text-blue-800 mb-4">Comment Analysis</h2>

//             <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
//               {/* Search */}
//               <div className="relative flex-1 min-w-[200px] max-w-sm">
//                 <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Search comments or users..."
//                   className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                 />
//               </div>

//               {/* Controls */}
//               <div className="flex items-center gap-4">
//                 <label className="inline-flex items-center text-sm font-medium text-gray-700">
//                   <input
//                     type="checkbox"
//                     checked={hideToxic}
//                     onChange={e => setHideToxic(e.target.checked)}
//                     className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//                   />
//                   Hide Toxic (&gt; {TOXIC_THRESH * 100}%)
//                 </label>
                
//                 <CSVLink
//                   data={csvData}
//                   filename="reel_comments_analysis.csv"
//                   className={`flex items-center gap-1 px-4 py-2 rounded-lg font-semibold text-sm transition duration-150 ${PRIMARY_BLUE}`}
//                 >
//                   <Download size={16} /> Download CSV
//                 </CSVLink>
//               </div>
//             </div>

//             <div className="overflow-x-auto rounded-xl border border-blue-300">
//               <table className={`min-w-full border-collapse text-sm ${TEXT_COLOR}`}>
//                 <thead>
//                   <tr className={`${HEADER_BG} border-b border-blue-300 text-blue-800`}>
//                     <th className="px-4 py-3 border-r border-blue-300/50 text-left">User</th>
//                     <th className="px-4 py-3 border-r border-blue-300/50 text-left">Comment</th>
//                     <th
//                       className="px-4 py-3 border-r border-blue-300/50 cursor-pointer"
//                       onClick={() => {
//                         setSortKey("toxicity");
//                         setSortDir(sortKey === "toxicity" && sortDir === "desc" ? "asc" : "desc");
//                       }}
//                     >
//                       Toxicity {sortKey === "toxicity" && (sortDir === "desc" ? '🔽' : '🔼')}
//                     </th>
//                     <th className="px-4 py-3">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white">
//                   {visibleComments.length === 0 ? (
//                     <tr>
//                       <td colSpan={4} className="p-6 text-center text-gray-500 italic bg-gray-50">
//                         No comments found matching the filters.
//                       </td>
//                     </tr>
//                   ) : (
//                     visibleComments.map((c) => {
//                       const isToxic = c.toxicity > TOXIC_THRESH;
//                       return (
//                         <tr
//                           key={c.id}
//                           className={`transition-all duration-200 border-b border-gray-100 ${
//                             isToxic ? "bg-red-50 hover:bg-red-100" : "hover:bg-blue-50"
//                           }`}
//                         >
//                           <td className="px-4 py-3 font-medium">{c.username}</td>
//                           <td className="px-4 py-3 max-w-lg break-words text-left">{c.text}</td>
//                           <td className="px-4 py-3 text-center">
//                             <div className="flex flex-col items-center">
//                               {/* Toxicity Bar */}
//                               <div className="w-20 h-2 rounded overflow-hidden mb-1 bg-gray-200">
//                                 <div
//                                   style={{ width: `${Math.min(100, c.toxicity * 100)}%` }}
//                                   className={`h-full ${isToxic ? "bg-red-500" : "bg-blue-500"}`}
//                                 />
//                               </div>
//                               <span
//                                 className={`text-xs font-semibold ${
//                                   isToxic ? "text-red-600" : "text-blue-600"
//                                 }`}
//                               >
//                                 {formatPct(c.toxicity)}
//                               </span>
//                             </div>
//                           </td>
//                           <td className="px-4 py-3 text-center">
//                             <div className="flex items-center justify-center gap-2">
//                               <button
//                                 onClick={() => copyToClipboard(c.id)}
//                                 title="Copy Comment ID"
//                                 className={`p-2 rounded-full text-blue-600 ${SECONDARY_BLUE} bg-opacity-70`}
//                               >
//                                 <Copy size={14} />
//                               </button>
//                               <button
//                                 onClick={() => toggleHideComment(c.id)}
//                                 title={c.hidden ? "Unhide Comment" : "Hide Comment"}
//                                 className={`p-2 rounded-full ${c.hidden ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'} hover:bg-opacity-100 transition`}
//                               >
//                                 {c.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
//                               </button>
//                               {isToxic && (
//                                 <span className="text-xs px-2 py-1 bg-red-500/10 text-red-700 font-medium rounded-full border border-red-300">
//                                   High Risk
//                                 </span>
//                               )}
//                             </div>
//                           </td>
//                         </tr>
//                       );
//                     })
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }









// import React, { useState, useMemo } from "react";
// // import axios from "axios";
// import { CSVLink } from "react-csv";
// import {
//   BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
// } from "recharts";
// import { motion } from "framer-motion";

// // Toxicity threshold
// const TOXIC_THRESH = 0.6;

// // Format decimal to %
// function formatPct(v) {
//   return (v).toFixed(1);
// }

// export default function ReelAnalyzer() {
//   const [reelUrl, setReelUrl] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [comments, setComments] = useState([]);
//   const [avgToxicity, setAvgToxicity] = useState(null);
//   const [error, setError] = useState("");
//   const [search, setSearch] = useState("");
//   const [hideToxic, setHideToxic] = useState(false);
//   const [sortKey, setSortKey] = useState("toxicity");
//   const [sortDir, setSortDir] = useState("desc");

//   const analyzeReel = async () => {
//     setError("");
//     setLoading(true);
//     try {
//       if (!reelUrl || !reelUrl.includes("instagram.com")) {
//         setError("Enter a valid Instagram Reel URL.");
//         setLoading(false);
//         return;
//       }

//       const res = await axios.post("http://localhost:5000/api/analyze", { reelUrl });
//       const resComments = (res.data.comments || []).map((c) => ({
//         id: c.id ?? c._id ?? c.igCommentId ?? "",
//         username: c.username ?? "unknown_user",
//         text: c.text ?? "",
//         // Ensure toxicity is 0-1
//         toxicity: typeof c.toxicity === "number"
//           ? Math.max(0, Math.min(1, c.toxicity))
//           : 0,
//         hidden: !!c.hidden,
//       }));

//       setComments(resComments);
//       setAvgToxicity(res.data.avgToxicity ?? 0);
//     } catch (err) {
//       console.error("Error analyzing reel:", err);
//       setError(err.response?.data?.error || err.message || "Analysis failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const visibleComments = useMemo(() => {
//     let arr = comments.filter(c => !(hideToxic && c.toxicity > TOXIC_THRESH) && !c.hidden);
//     if (search) {
//       const s = search.toLowerCase();
//       arr = arr.filter(c => c.text.toLowerCase().includes(s) || c.username.toLowerCase().includes(s) || c.id.includes(s));
//     }
//     arr.sort((a, b) => {
//       let v = sortKey === "username" ? a.username.localeCompare(b.username) : a.toxicity - b.toxicity;
//       return sortDir === "asc" ? v : -v;
//     });
//     return arr;
//   }, [comments, hideToxic, search, sortKey, sortDir]);

//   // Histogram: fixed for 0-1 range
//   const histData = useMemo(() => {
//     const buckets = [0, 0, 0, 0, 0]; // 5 buckets: 0–0.2, 0.2–0.4, etc.
//     comments.forEach(c => {
//       const t = Math.max(0, Math.min(1, c.toxicity || 0));
//       const idx = t === 1 ? 4 : Math.floor(t * 5);
//       buckets[idx] += 1;
//     });
//     return [
//       { name: "0–0.2", count: buckets[0] },
//       { name: "0.2–0.4", count: buckets[1] },
//       { name: "0.4–0.6", count: buckets[2] },
//       { name: "0.6–0.8", count: buckets[3] },
//       { name: "0.8–1.0", count: buckets[4] },
//     ];
//   }, [comments]);

//   const pieData = useMemo(() => {
//     const toxic = comments.filter(c => c.toxicity > TOXIC_THRESH).length;
//     const clean = comments.length - toxic;
//     return [
//       { name: "Clean", value: clean },
//       { name: "Toxic", value: toxic },
//     ];
//   }, [comments]);

//   const csvData = useMemo(() => visibleComments.map(c => ({
//     id: c.id, username: c.username, text: c.text, toxicity: c.toxicity
//   })), [visibleComments]);

//   const toggleHideComment = (id) => {
//     setComments(prev => prev.map(c => c.id === id ? { ...c, hidden: !c.hidden } : c));
//   };

//   const copyToClipboard = async (text) => {
//     await navigator.clipboard.writeText(text);
//   };

//   return (
//     <div className="font-poppins">
//     <div className="font-poppins bg-blue-900 min-h-screen p-10 text-white">
//       <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
//         <h1 className="text-5xl font-extrabold mb-6 text-center bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 drop-shadow-lg">
//           🎥 Instagram Reel Toxicity Dashboard
//         </h1>
//       </motion.div>

//       <div className="max-w-5xl mx-auto space-y-6">
//         {/* Input + Buttons */}
//         <div className="bg-blue-800/80 p-5 rounded-2xl shadow-lg flex items-center gap-4">
//           <input
//             className="w-3/4 bg-blue-700 text-white p-3 rounded-md outline-none placeholder-blue-200"
//             placeholder="Paste Instagram reel URL"
//             value={reelUrl}
//             onChange={(e) => setReelUrl(e.target.value)}
//           />
//           <button
//             onClick={analyzeReel}
//             disabled={loading}
//             className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg font-semibold text-white"
//           >
//             {loading ? "Analyzing..." : "Analyze"}
//           </button>
//           <button
//             onClick={() => { setReelUrl(""); setComments([]); setAvgToxicity(null); setError(""); }}
//             className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold text-white"
//           >
//             Clear
//           </button>
//           {error && <div className="mt-2 text-red-400">{error}</div>}
//         </div>

//         {/* Charts */}
//         <div className="bg-blue-800/50 backdrop-blur-xl p-5 rounded-2xl shadow">
//           <div className="flex items-center justify-between mb-2">
//             <h3 className="text-sm text-blue-200">Toxicity Distribution</h3>
//             <div className="text-xs text-blue-100">0–1 range</div>
//           </div>
//           <div style={{ width: "100%", height: 160 }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart data={histData}>
//                 <XAxis dataKey="name" stroke="#ccc" />
//                 <YAxis allowDecimals={false} />
//                 <Tooltip />
//                 <Bar dataKey="count">
//                   {histData.map((entry, idx) => {
//                     const tMin = idx * 0.2;
//                     const isToxic = tMin >= TOXIC_THRESH;
//                     return <Cell key={`cell-${idx}`} fill={isToxic ? "#f87171" : "#3b82f6"} />;
//                   })}
//                 </Bar>
//               </BarChart>
//             </ResponsiveContainer>
//           </div>

//           <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
//             <div style={{ width: "100%", height: 200 }}>
//               <ResponsiveContainer>
//                 <PieChart>
//                   <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={36} outerRadius={60} label>
//                     <Cell key="c1" fill="#22c55e" />
//                     <Cell key="c2" fill="#ef4444" />
//                   </Pie>
//                   <Legend verticalAlign="bottom" height={24} />
//                 </PieChart>
//               </ResponsiveContainer>
//             </div>
//             <div className="p-3 bg-blue-700/70 rounded-lg">
//               <div className="text-xs text-blue-200">Top insights</div>
//               <div className="mt-2 text-sm space-y-1">
//                 <div>Comments total: <strong>{comments.length}</strong></div>
//                 <div>Toxic comments: <strong>{pieData[1].value}</strong></div>
//                 <div>Clean comments: <strong>{pieData[0].value}</strong></div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Table */}
//         <div className="bg-blue-800/50 backdrop-blur-xl p-5 rounded-2xl shadow-lg">
//           <h2 className="text-lg font-semibold text-cyan-300 mb-3">Comment Analysis</h2>

//           {/* CSV Download */}
//           <div className="flex justify-end mb-2">
//             <CSVLink
//               data={csvData}
//               filename="comments.csv"
//               className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white font-semibold text-sm"
//             >
//               Download CSV
//             </CSVLink>
//           </div>

//           <div className="overflow-x-auto rounded-xl border border-blue-600/30">
//             <table className="min-w-full border-collapse text-sm text-blue-100 font-sans">
//               <thead>
//                 <tr className="bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 text-white text-center">
//                   <th className="px-4 py-3 border border-blue-700/30">ID</th>
//                   <th className="px-4 py-3 border border-blue-700/30">User</th>
//                   <th className="px-4 py-3 border border-blue-700/30">Comment</th>
//                   <th className="px-4 py-3 border border-blue-700/30">Toxicity</th>
//                   <th className="px-4 py-3 border border-blue-700/30">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {visibleComments.length === 0 && (
//                   <tr>
//                     <td colSpan={5} className="p-6 text-center text-blue-200 italic">
//                       No comments to show.
//                     </td>
//                   </tr>
//                 )}
//                 {visibleComments.map((c) => {
//                   const isToxic = c.toxicity > TOXIC_THRESH;
//                   return (
//                     <tr key={c.id} className={`transition-all duration-200 ${isToxic ? "bg-red-950/30" : "hover:bg-blue-900/30"}`}>
//                       <td className="border border-blue-700/30 px-3 py-3">{c.id}</td>
//                       <td className="border border-blue-700/30 px-3 py-3">{c.username}</td>
//                       <td className="border border-blue-700/30 px-3 py-3 max-w-xl break-words text-left">{c.text}</td>
//                       <td className="border border-blue-700/30 px-3 py-3">
//                         <div className="flex items-center justify-center gap-3">
//                           <div className="w-28 bg-blue-900 h-2 rounded overflow-hidden">
//                             <div style={{ width: `${c.toxicity }` }} className={`h-full ${isToxic ? "bg-red-500" : "bg-cyan-400"}`} />
//                           </div>
//                           <span className={`text-xs font-semibold ${isToxic ? "text-red-400" : "text-cyan-200"}`}>
//                             {formatPct(c.toxicity)}
//                           </span>
//                         </div>
//                       </td>
//                       <td className="border border-blue-700/30 px-3 py-3">
//                         <div className="flex items-center justify-center gap-2">
//                           <button onClick={() => copyToClipboard(c.id)} className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded-lg text-xs">Copy ID</button>
//                           <button onClick={() => toggleHideComment(c.id)} className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded-lg text-xs">{c.hidden ? "Unhide" : "Hide"}</button>
//                           {isToxic && <span className="text-xs px-2 py-1 bg-red-600/80 rounded-lg text-white">Toxic</span>}
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>

//           {/* Average Toxicity + Hide Toxic */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
//             <div className="bg-blue-700/60 backdrop-blur-xl p-5 rounded-2xl shadow">
//               <h3 className="text-sm text-blue-200">Average Toxicity</h3>
//               <div className="mt-3 flex items-baseline gap-3">
//                 <div className="text-3xl font-bold text-white">
//                   {avgToxicity !== null ? formatPct(avgToxicity) : "--"}
//                 </div>
//                 <div className="text-sm text-blue-200">{reelUrl || "Paste URL and analyze"}</div>
//               </div>
//               <div className="mt-4">
//                 <div className="text-xs text-blue-200 mb-2">Hide Toxic (&gt; {TOXIC_THRESH})</div>
//                 <label className="inline-flex items-center">
//                   <input type="checkbox" checked={hideToxic} onChange={e => setHideToxic(e.target.checked)} className="mr-2 accent-cyan-500" />
//                   <span className="text-sm text-blue-200">Hide toxic comments</span>
//                 </label>
//               </div>
//             </div>
//           </div>
//         </div>

//       </div>
//     </div>
//     </div>
//   );
// }








// import React, { useState, useMemo } from "react";
// import axios from "axios";
// import { CSVLink } from "react-csv";
// import {
//   BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
// } from "recharts";
// import { motion } from "framer-motion";

// const TOXIC_THRESH = 0.6;
// function formatPct(v) {
//   return (v * 100).toFixed(1) + "%";
// }

// export default function ReelAnalyzer() {
//   const [reelUrl, setReelUrl] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [comments, setComments] = useState([]);
//   const [avgToxicity, setAvgToxicity] = useState(null);
//   const [error, setError] = useState("");
//   const [search, setSearch] = useState("");
//   const [hideToxic, setHideToxic] = useState(false);
//   const [sortKey, setSortKey] = useState("toxicity");
//   const [sortDir, setSortDir] = useState("desc");

//   const analyzeReel = async () => {
//     setError("");
//     setLoading(true);
//     try {
//       if (!reelUrl || !reelUrl.includes("instagram.com")) {
//         setError("Enter a valid Instagram Reel URL.");
//         setLoading(false);
//         return;
//       }

//       const res = await axios.post("http://localhost:5000/api/analyze", { reelUrl });
//       const resComments = (res.data.comments || []).map((c) => ({
//         id: c.id ?? c._id ?? c.igCommentId ?? "",
//         username: c.username ?? "unknown_user",
//         text: c.text ?? "",
//         toxicity: typeof c.toxicity === "number" ? c.toxicity : (typeof c.overallToxicity === "number" ? c.overallToxicity : 0),
//         hidden: !!c.hidden,
//       }));

//       setComments(resComments);
//       setAvgToxicity(res.data.avgToxicity ?? 0);
//     } catch (err) {
//       console.error("Error analyzing reel:", err);
//       setError(err.response?.data?.error || err.message || "Analysis failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const visibleComments = useMemo(() => {
//     let arr = comments.filter(c => !(hideToxic && c.toxicity > TOXIC_THRESH) && !c.hidden);
//     if (search) {
//       const s = search.toLowerCase();
//       arr = arr.filter(c => c.text.toLowerCase().includes(s) || c.username.toLowerCase().includes(s) || c.id.includes(s));
//     }
//     arr.sort((a, b) => {
//       let v = sortKey === "username" ? a.username.localeCompare(b.username) : a.toxicity - b.toxicity;
//       return sortDir === "asc" ? v : -v;
//     });
//     return arr;
//   }, [comments, hideToxic, search, sortKey, sortDir]);

//   const histData = useMemo(() => {
//     const buckets = [0, 0, 0, 0, 0];
//     comments.forEach(c => {
//       const t = Math.max(0, Math.min(1, (c.toxicity || 0) / 100));
//       const idx = Math.min(4, Math.floor(t * 5));
//       buckets[idx] += 1;
//     });
//     return [
//       { name: "0–0.2", count: buckets[0] },
//       { name: "0.2–0.4", count: buckets[1] },
//       { name: "0.4–0.6", count: buckets[2] },
//       { name: "0.6–0.8", count: buckets[3] },
//       { name: "0.8–1.0", count: buckets[4] },
//     ];
//   }, [comments]);

//   const pieData = useMemo(() => {
//     const toxic = comments.filter(c => c.toxicity > TOXIC_THRESH).length;
//     const clean = comments.length - toxic;
//     return [
//       { name: "Clean", value: clean },
//       { name: "Toxic", value: toxic },
//     ];
//   }, [comments]);

//   const csvData = useMemo(() => visibleComments.map(c => ({
//     id: c.id, username: c.username, text: c.text, toxicity: c.toxicity
//   })), [visibleComments]);

//   const toggleHideComment = (id) => {
//     setComments(prev => prev.map(c => c.id === id ? { ...c, hidden: !c.hidden } : c));
//   };

//   const copyToClipboard = async (text) => {
//     await navigator.clipboard.writeText(text);
//   };

//   return (
//     <div className="bg-blue-900 min-h-screen p-10 text-white">
//       <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
//         <h1 className="text-5xl font-extrabold mb-6 text-center bg-clip-text  bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 drop-shadow-lg">
//           🎥 Instagram Reel Toxicity Dashboard
//         </h1>
//       </motion.div>

//       <div className="max-w-5xl mx-auto space-y-6">
//         <div className="bg-blue-800/80 p-5 rounded-2xl shadow-lg">
//           <div className="flex items-center gap-4">
//             <input
//               className="w-3/4 bg-blue-700 text-white p-3 rounded-md outline-none placeholder-blue-200"
//               placeholder="Paste Instagram reel URL"
//               value={reelUrl}
//               onChange={(e) => setReelUrl(e.target.value)}
//             />
//             <button
//               onClick={analyzeReel}
//               disabled={loading}
//               className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg font-semibold text-white"
//             >
//               {loading ? "Analyzing..." : "Analyze"}
//             </button>
//             <button
//               onClick={() => { setReelUrl(""); setComments([]); setAvgToxicity(null); setError(""); }}
//               className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold text-white"
//             >
//               Clear
//             </button>
//           </div>
//           {error && <div className="mt-2 text-red-400">{error}</div>}
//         </div>

//         {/* Charts */}
//         <div className="md:col-span-2 bg-blue-800/50 backdrop-blur-xl p-5 rounded-2xl shadow">
//           <div className="flex items-center justify-between mb-2">
//             <h3 className="text-sm text-blue-200">Toxicity Distribution</h3>
//             <div className="text-xs text-blue-100">0–1 range</div>
//           </div>
//           <div style={{ width: "100%", height: 160 }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart data={histData}>
//                 <XAxis dataKey="name" stroke="#ccc" />
//                 <YAxis allowDecimals={false} />
//                 <Tooltip />
//                 <Bar dataKey="count">
//                   {histData.map((entry, idx) => (
//                     <Cell
//                       key={`cell-${idx}`}
//                       fill={entry.name.startsWith("0.6") ? "#f87171" : "#3b82f6"}
//                     />
//                   ))}
//                 </Bar>
//               </BarChart>
//             </ResponsiveContainer>
//           </div>

//           <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
//             <div style={{ width: "100%", height: 200 }}>
//               <ResponsiveContainer>
//                 <PieChart>
//                   <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={36} outerRadius={60} label>
//                     <Cell key="c1" fill="#22c55e" />
//                     <Cell key="c2" fill="#ef4444" />
//                   </Pie>
//                   <Legend verticalAlign="bottom" height={24} />
//                 </PieChart>
//               </ResponsiveContainer>
//             </div>

//             <div className="p-3 bg-blue-700/70 rounded-lg">
//               <div className="text-xs text-blue-200">Top insights</div>
//               <div className="mt-2 text-sm space-y-1">
//                 <div>Comments total: <strong>{comments.length}</strong></div>
//                 <div>Toxic comments: <strong>{pieData[1].value}</strong></div>
//                 <div>Clean comments: <strong>{pieData[0].value}</strong></div>
//               </div>
//             </div>
//           </div>
          
//         </div>

//         {/* Table */}
//         <div className="bg-blue-800/50 backdrop-blur-xl p-5 rounded-2xl shadow-lg">
//           <h2 className="text-lg font-semibold text-cyan-300 mb-3">Comment Analysis</h2>
//           <div className="flex justify-end mb-2">
//     <CSVLink
//       data={csvData}
//       filename="comments.csv"
//       className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white font-semibold text-sm"
//     >
//       Download CSV
//     </CSVLink>
//   </div>
//           <div className="overflow-x-auto rounded-xl border border-blue-600/30">
//             <table className="min-w-full border-collapse text-sm text-blue-100">
//               <thead>
//                 <tr className="bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 text-white text-center">
//                   <th className="px-4 py-3 border border-blue-700/30">ID</th>
//                   <th className="px-4 py-3 border border-blue-700/30">User</th>
//                   <th className="px-4 py-3 border border-blue-700/30">Comment</th>
//                   <th className="px-4 py-3 border border-blue-700/30">Toxicity</th>
//                   <th className="px-4 py-3 border border-blue-700/30">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {visibleComments.length === 0 && (
//                   <tr>
//                     <td colSpan={5} className="p-6 text-center text-blue-200 italic">
//                       No comments to show.
//                     </td>
//                   </tr>
//                 )}
//                 {visibleComments.map((c) => {
//                   const isToxic = c.toxicity > TOXIC_THRESH;
//                   return (
//                     <tr
//                       key={c.id}
//                       className={`transition-all duration-200 ${
//                         isToxic ? "bg-red-950/30" : "hover:bg-blue-900/30"
//                       }`}
//                     >
//                       <td className="border border-blue-700/30 px-3 py-3">{c.id}</td>
//                       <td className="border border-blue-700/30 px-3 py-3">{c.username}</td>
//                       <td className="border border-blue-700/30 px-3 py-3 max-w-xl break-words text-left">{c.text}</td>
//                       <td className="border border-blue-700/30 px-3 py-3">
//                         <div className="flex items-center justify-center gap-3">
//                           <div className="w-28 bg-blue-900 h-2 rounded overflow-hidden">
//                             <div
//                               style={{ width: `${Math.min(100, c.toxicity * 100)}%` }}
//                               className={`h-full ${isToxic ? "bg-red-500" : "bg-cyan-400"}`}
//                             />
//                           </div>
//                           <span
//                             className={`text-xs font-semibold ${
//                               isToxic ? "text-red-400" : "text-cyan-200"
//                             }`}
//                           >
//                             {formatPct(c.toxicity)}
//                           </span>
//                         </div>
//                       </td>
//                       <td className="border border-blue-700/30 px-3 py-3">
//                         <div className="flex items-center justify-center gap-2">
//                           <button
//                             onClick={() => copyToClipboard(c.id)}
//                             className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded-lg text-xs"
//                           >
//                             Copy ID
//                           </button>
//                           <button
//                             onClick={() => toggleHideComment(c.id)}
//                             className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded-lg text-xs"
//                           >
//                             {c.hidden ? "Unhide" : "Hide"}
//                           </button>
//                           {isToxic && (
//                             <span className="text-xs px-2 py-1 bg-red-600/80 rounded-lg text-white">
//                               Toxic
//                             </span>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>

//           {/* Summary + Charts */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
//             <div className="bg-blue-700/60 backdrop-blur-xl p-5 rounded-2xl shadow">
//               <h3 className="text-sm text-blue-200">Average Toxicity</h3>
//               <div className="mt-3 flex items-baseline gap-3">
//                 <div className="text-3xl font-bold text-white">
//                   {avgToxicity !== null ? formatPct(avgToxicity) : "--"}
//                 </div>
//                 <div className="text-sm text-blue-200">{reelUrl || "Paste URL and analyze"}</div>
//               </div>
//               <div className="mt-4">
//                 <div className="text-xs text-blue-200 mb-2">Hide Toxic (&gt; {TOXIC_THRESH})</div>
//                 <label className="inline-flex items-center">
//                   <input
//                     type="checkbox"
//                     checked={hideToxic}
//                     onChange={e => setHideToxic(e.target.checked)}
//                     className="mr-2 accent-cyan-500"
//                   />
//                   <span className="text-sm text-blue-200">Hide toxic comments</span>
//                 </label>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }










// import React, { useState, useMemo } from "react";
// import axios from "axios";
// import { CSVLink } from "react-csv";
// import {
//   BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
// } from "recharts";
// import { motion } from "framer-motion";

// const TOXIC_THRESH = 0.6;

// function formatPct(v) {
//   return (v * 100).toFixed(1) + "%";
// }

// export default function ReelAnalyzer() {
//   const [reelUrl, setReelUrl] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [comments, setComments] = useState([]); // {id, username, text, toxicity, hidden:false}
//   const [avgToxicity, setAvgToxicity] = useState(null);
//   const [error, setError] = useState("");
//   const [search, setSearch] = useState("");
//   const [hideToxic, setHideToxic] = useState(false);
//   const [sortKey, setSortKey] = useState("toxicity"); // 'toxicity'|'username'
//   const [sortDir, setSortDir] = useState("desc"); // 'asc'|'desc'

//   const analyzeReel = async () => {
//     setError("");
//     setLoading(true);
//     try {
//       if (!reelUrl || !reelUrl.includes("instagram.com")) {
//         setError("Enter a valid Instagram Reel URL.");
//         setLoading(false);
//         return;
//       }

//       // Send full URL — backend extracts shortcode
//       const res = await axios.post("http://localhost:5000/api/analyze", { reelUrl });
//       const resComments = (res.data.comments || []).map((c) => ({
//         id: c.id ?? c._id ?? c.igCommentId ?? "",
//         username: c.username ?? "unknown_user",
//         text: c.text ?? "",
//         toxicity: typeof c.toxicity === "number" ? c.toxicity : (typeof c.overallToxicity === "number" ? c.overallToxicity : 0),
//         hidden: !!c.hidden,
//       }));

//       setComments(resComments);
//       setAvgToxicity(res.data.avgToxicity ?? 0);
//     } catch (err) {
//       console.error("Error analyzing reel:", err);
//       setError(err.response?.data?.error || err.message || "Analysis failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Derived data for charts & table
//   const visibleComments = useMemo(() => {
//     let arr = comments.filter(c => !(hideToxic && c.toxicity > TOXIC_THRESH) && !c.hidden);
//     if (search) {
//       const s = search.toLowerCase();
//       arr = arr.filter(c => c.text.toLowerCase().includes(s) || c.username.toLowerCase().includes(s) || c.id.includes(s));
//     }
//     arr = arr.slice(); // copy for sorting
//     arr.sort((a,b) => {
//       let v;
//       if (sortKey === "username") {
//         v = a.username.localeCompare(b.username);
//       } else {
//         v = a.toxicity - b.toxicity;
//       }
//       return sortDir === "asc" ? v : -v;
//     });
//     return arr;
//   }, [comments, hideToxic, search, sortKey, sortDir]);

//   const histData = useMemo(() => {
//     // buckets: 0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0
//     const buckets = [0,0,0,0,0];
//     comments.forEach(c => {
//       const t = Math.max(0, Math.min(1, c.toxicity || 0));
//       const idx = Math.min(4, Math.floor(t * 5));
//       buckets[idx] += 1;
//     });
//     return [
//       { name: "0-0.2", count: buckets[0] },
//       { name: "0.2-0.4", count: buckets[1] },
//       { name: "0.4-0.6", count: buckets[2] },
//       { name: "0.6-0.8", count: buckets[3] },
//       { name: "0.8-1.0", count: buckets[4] },
//     ];
//   }, [comments]);

//   const pieData = useMemo(() => {
//     const toxic = comments.filter(c => c.toxicity > TOXIC_THRESH).length;
//     const clean = comments.length - toxic;
//     return [
//       { name: "Clean", value: clean },
//       { name: "Toxic", value: toxic },
//     ];
//   }, [comments]);

//   // CSV rows (visible rows)
//   const csvData = useMemo(() => visibleComments.map(c => ({
//     id: c.id,
//     username: c.username,
//     text: c.text,
//     toxicity: c.toxicity
//   })), [visibleComments]);

//   const toggleHideComment = (id) => {
//     setComments(prev => prev.map(c => c.id === id ? { ...c, hidden: !c.hidden } : c));
//   };

//   const copyToClipboard = async (text) => {
//     try {
//       await navigator.clipboard.writeText(text);
//       // small visual feedback (could be toast); using console for simplicity
//       console.log("Copied:", text);
//     } catch (e) {
//       console.error("Copy failed", e);
//     }
//   };

//   const clearResults = () => {
//     setComments([]);
//     setAvgToxicity(null);
//     setCaptionPlaceholder();
//   };

//   // small caption generation
//   const caption = comments.length ? `${comments.length} comments analyzed` : "";

//   return (
//     <div className="min-h-screen p-10 bg-gradient-to-br from-gray-950 via-black to-slate-900 text-white">
//   <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
//     <h1 className="text-5xl font-extrabold bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 mb-6 text-center">
//       🎥 Instagram Reel Toxicity Dashboard
//     </h1>
//   </motion.div>


//       <div className="max-w-4xl mx-auto space-y-6">
//         {/* Input card */}
//         <div className="bg-gray-900 p-5 rounded-2xl shadow-lg">
//           <div className="flex gap-3 items-center">
//             <input
//               className="flex-1 bg-gray-800 text-white p-3 rounded-md outline-none w-64"
//               placeholder="Paste Instagram reel URL (e.g. https://www.instagram.com/reel/DPiVwr1k5Ky/)"
//               value={reelUrl}
//               onChange={(e) => setReelUrl(e.target.value)}
//             />
//             <button
//               onClick={analyzeReel}
//               disabled={loading}
//               className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold"
//             >
//               {loading ? "Analyzing..." : "Analyze"}
//             </button>
//             <button
//               onClick={() => { setReelUrl(""); setComments([]); setAvgToxicity(null); setError(""); }}
//               className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg"
//             >
//               Clear
//             </button>
//           </div>
//           {error && <div className="mt-2 text-amber-400">{error}</div>}
//         </div>

//         {/* Summary + charts */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div className="md:col-span-1 bg-gray-900 p-4 rounded-xl shadow">
//             <h3 className="text-sm text-gray-300">Average Toxicity</h3>
//             <div className="mt-3 flex items-baseline gap-3">
//               <div className="text-3xl font-bold text-white">{avgToxicity !== null ? formatPct(avgToxicity) : "--"}</div>
//               <div className="text-sm text-gray-400">{caption || "Paste URL and analyze"}</div>
//             </div>
//             <div className="mt-4">;
//               <div className="text-xs text-gray-400 mb-2">Hide Toxic ( &gt; {TOXIC_THRESH})</div>
//               <label className="inline-flex items-center">
//                 <input type="checkbox" checked={hideToxic} onChange={e => setHideToxic(e.target.checked)} className="mr-2" />
//                 <span className="text-sm text-gray-300">Hide toxic comments</span>
//               </label>
//             </div>
//           </div>

//           <div className="md:col-span-2 bg-gray-900 p-4 rounded-xl shadow">
//             <div className="flex items-center justify-between">
//               <h3 className="text-sm text-gray-300">Toxicity Distribution</h3>
//               <div className="text-xs text-gray-400">Buckets (0–1)</div>
//             </div>
//             <div style={{ width: "100%", height: 160 }} className="mt-2">
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={histData}>
//                   <XAxis dataKey="name" stroke="#9CA3AF" />
//                   <YAxis allowDecimals={false} />
//                   <Tooltip />
//                   <Bar dataKey="count">
//                     {histData.map((entry, idx) => (
//                       <Cell key={`cell-${idx}`} fill={entry.name.startsWith("0.6") ? "#ff4d4f" : "#7c3aed"} />
//                     ))}
//                   </Bar>
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>

//             <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
//               <div style={{ width: "100%", height: 200 }}>
//                 <ResponsiveContainer>
//                   <PieChart>
//                     <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={36} outerRadius={60} label>
//                       <Cell key="c1" fill="#22c55e" />
//                       <Cell key="c2" fill="#ef4444" />
//                     </Pie>
//                     <Legend verticalAlign="bottom" height={24} />
//                   </PieChart>
//                 </ResponsiveContainer>
//               </div>

//               <div className="p-3 bg-gray-800 rounded">
//                 <div className="text-xs text-gray-400">Top insights</div>
//                 <div className="mt-2 text-sm">
//                   <div>Comments total: <strong>{comments.length}</strong></div>
//                   <div>Toxic comments: <strong>{pieData[1].value}</strong></div>
//                   <div>Clean comments: <strong>{pieData[0].value}</strong></div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Controls + CSV */}
//         <div className="flex  justify-between gap-3 ">
//           <div className="flex  gap-5">
//             <input value={search} onChange={e => setSearch(e.target.value)} className="p-2 rounded bg-gray-800 text-sm w-64" placeholder="Search comment / username / id" />
//             <select value={sortKey} onChange={e => setSortKey(e.target.value)} className="p-2 rounded bg-gray-800 text-sm">
//               <option value="toxicity">Sort by toxicity</option>
//               <option value="username">Sort by username</option>
//             </select>
//             <button className="p-2 rounded bg-gray-800 text-sm" onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}>
//               {sortDir === "asc" ? "Asc" : "Desc"}
//             </button>
//           </div>

//           <div className="flex items-center gap-2">
//             <CSVLink data={csvData} filename={"reel_comments.csv"} className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm font-semibold">Download CSV</CSVLink>
//           </div>
//         </div>

//         {/* Comments table */}
//         <div className="bg-gray-900 p-4 rounded-xl shadow">
//           <div className="overflow-x-auto">
//             <table className="min-w-full text-left divide-y divide-gray-700 border border-gray-700 border-collapse border-rounded">
//               <thead>
//                 <tr className="text-xs text-gray-400">
//                   <th className="px-3 py-2">ID</th>
//                   <th className="px-3 py-2">User</th>
//                   <th className="px-3 py-2">Comment</th>
//                   <th className="px-3 py-2">Toxicity</th>
//                   <th className="px-3 py-2">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-800">
//                 {visibleComments.length === 0 && (
//                   <tr><td colSpan={5} className="p-4 text-sm text-gray-400">No comments to show.</td></tr>
//                 )}
//                 {visibleComments.map((c) => {
//                   const isToxic = c.toxicity > TOXIC_THRESH;
//                   return (
//                     <tr key={c.id} className={`${isToxic ? "bg-red-950/20" : "hover:bg-gray-800/50"}`}>
//                       <td className=" border border-gray-700 px-3 py-3 text-sm">{c.id}</td>
//                       <td className=" border border-gray-700 px-3 py-3 text-sm">{c.username}</td>
//                       <td className=" border border-gray-700 px-3 py-3 text-sm break-words max-w-xl">{c.text}</td>
//                       <td className=" border border-gray-700 px-3 py-3 text-sm">
//                         <div className="flex items-center gap-3">
//                           <div className="w-36">
//                             <div className="relative h-3 bg-gray-800 rounded overflow-hidden">
//                               <div style={{ width: `${Math.min(100, c.toxicity * 100)}%` }} className={`h-full ${isToxic ? "bg-red-500" : "bg-emerald-400"}`} />
//                             </div>
//                           </div>
//                           <div className="text-xs text-gray-300 w-12">{formatPct(c.toxicity)}</div>
//                         </div>
//                       </td>
//                       <td className="px-3 py-3">
//                         <div className="flex gap-2">
//                           <button onClick={() => copyToClipboard(c.id)} className="px-2 py-1 bg-gray-800 rounded text-xs">Copy ID</button>
//                           <button onClick={() => toggleHideComment(c.id)} className="px-2 py-1 bg-gray-800 rounded text-xs">
//                             {c.hidden ? "Unhide" : "Hide"}
//                           </button>
//                           {isToxic && <span className="text-xs px-2 py-1 rounded bg-red-600 text-white">Toxic</span>}
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </div>

//       </div>
//     </div>
//   );
// }






// import React, { useState } from "react";
// import axios from "axios";
// import { CSVLink } from "react-csv";
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
// import { motion } from "framer-motion";

// const ReelAnalyzer = () => {
//   const [reelUrl, setReelUrl] = useState("");
//   const [caption, setCaption] = useState("");
//   const [toxicityScore, setToxicityScore] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [data, setData] = useState([]);
//   const [error, setError] = useState("");


//   const analyzeReel = async () => {
//     try {
//       setLoading(true);
//       setError("");

//       // Step 1: Get media ID from URL
//       const reelCode = reelUrl.match(/\/reel\/([^/?]+)/)?.[1];
//       if (!reelCode) {
//         alert("Invalid Instagram Reel URL!");
//         return;
//       }

//       // Step 2: Send media ID to backend for comment analysis
//       const res = await axios.post("http://localhost:5000/api/analyze", {
//         reelUrl, // send full URL
//       });

//       // Step 3: Display results
//       const avgToxicity = res.data.avgToxicity || 0;
//       setToxicityScore(avgToxicity);
//       setCaption(`Analyzed ${res.data.comments?.length || 0} comments`);
//       setData([{ name: "Toxicity", value: avgToxicity * 100 }]);

//     } catch (err) {
//       console.error("Error analyzing reel:", err);
//       setError("Error analyzing reel. Check console for details.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex flex-col items-center py-10 px-4">
//       <motion.h1
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="text-4xl font-bold mb-8 text-purple-400"
//       >
//         🎥 Instagram Reel Analyzer
//       </motion.h1>

//       <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-2xl shadow-lg">
//         <input
//           type="text"
//           placeholder="Paste Instagram Reel URL..."
//           value={reelUrl}
//           onChange={(e) => setReelUrl(e.target.value)}
//           className="w-full p-3 rounded-md text-black mb-4"
//         />

//         <button
//           onClick={analyzeReel}
//           disabled={loading}
//           className="w-full bg-purple-600 hover:bg-purple-700 transition font-semibold py-2 rounded-lg"
//         >
//           {loading ? "Analyzing..." : "Analyze Reel"}
//         </button>

//         {loading && (
//           <motion.div
//             initial={{ width: "0%" }}
//             animate={{ width: "100%" }}
//             transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
//             className="mt-4 h-2 bg-purple-500 rounded-full"
//           />
//         )}

//         {error && <p className="text-red-400 mt-4">{error}</p>}

//         {caption && (
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 bg-gray-700 p-4 rounded-xl">
//             <h2 className="font-semibold text-lg text-purple-300 mb-2">📝 Summary:</h2>
//             <p className="text-gray-200">{caption}</p>
//           </motion.div>
//         )}

//         {toxicityScore !== null && (
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
//             <h2 className="font-semibold text-lg mb-3 text-purple-300">
//               🔥 Avg Toxicity: {toxicityScore.toFixed(2)}
//             </h2>

//             <ResponsiveContainer width="100%" height={200}>
//               <BarChart data={data}>
//                 <XAxis dataKey="name" stroke="#ccc" />
//                 <YAxis />
//                 <Tooltip />
//                 <Bar dataKey="value" fill={toxicityScore > 0.6 ? "#ff4d4f" : "#4ade80"} />
//               </BarChart>
//             </ResponsiveContainer>

//             <div className="flex justify-between items-center mt-4">
//               <CSVLink
//                 data={[{ caption, toxicityScore }]}
//                 filename={"reel_analysis.csv"}
//                 className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold"
//               >
//                 📥 Download Report
//               </CSVLink>

//               <p className="text-gray-400 text-sm">
//                 {toxicityScore > 0.6
//                   ? "⚠️ High Toxicity - Consider Hiding Comments"
//                   : "✅ Looks Clean"}
//               </p>
//             </div>
//           </motion.div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ReelAnalyzer;
