import express from "express";
import axios from "axios";
import { spawn } from "child_process";

const router = express.Router();

router.post("/", async (req, res) => {
  const { url, nextToken } = req.body; // optional pagination token
  if (!url) return res.status(400).json({ error: "URL required" });

  try {
    let comments = [];
    let newNextToken = null;

    // ---------- INSTAGRAM HANDLER ----------
    // ---------- INSTAGRAM HANDLER ----------
if (url.includes("instagram.com")) {
  const match =
    url.match(/\/reel\/([a-zA-Z0-9_-]+)/) ||
    url.match(/\/p\/([a-zA-Z0-9_-]+)/) ||
    url.match(/\/tv\/([a-zA-Z0-9_-]+)/);

  if (!match) return res.status(400).json({ error: "Invalid Instagram URL" });
  const shortcode = match[1];

  console.log("📸 Fetching Instagram comments for:", shortcode);

  const params = nextToken
    ? { code: shortcode, pagination_token: nextToken }
    : { code: shortcode };

  const response = await axios.get(
    "https://instagram-social.p.rapidapi.com/api/v1/instagram/comments",
    {
      params,
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": "instagram-social.p.rapidapi.com",
      },
    }
  );

  const commentsData = response.data?.body || [];
  newNextToken = response.data.meta?.pagination_token || null; // ✅ assign, not redeclare

  comments = commentsData.map((c) => ({
    id: c.pk,
    text: c.text,
    username: c.user?.username || "unknown_user",
  }));

  console.log(`Fetched ${comments.length} IG comments.`);
  console.log("Next pagination token:", newNextToken);
}


    // ---------- YOUTUBE HANDLER ----------
    else if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})(?:[?&].*)?$/);
      if (!match) return res.status(400).json({ error: "Invalid YouTube URL" });

      const videoId = match[1];
      console.log("▶️ Fetching YouTube comments for:", videoId);

      const response = await axios.get("https://yt-api.p.rapidapi.com/comments", {
        params: nextToken ? { id: videoId, token: nextToken } : { id: videoId },
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": "yt-api.p.rapidapi.com",
        },
      });

      const commentsData = response.data?.data || [];
      comments = commentsData.map((item) => ({
        id: item.commentId || Math.random().toString(36).substring(7),
        username: item.authorText || "unknown_user",
        text: item.textDisplay || "",
      }));

      newNextToken = response.data?.continuation || null;
      console.log(`Fetched ${comments.length} YT comments.`);
    }

    // ---------- FACEBOOK HANDLER ----------
    else if (url.includes("facebook.com")) {
      console.log("📘 Fetching Facebook comments for:", url);

      const response = await axios.get(
        "https://facebook-scraper-api4.p.rapidapi.com/get_facebook_post_comments_details",
        {
          params: { link: url },
          headers: {
            "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
            "X-RapidAPI-Host": "facebook-scraper-api4.p.rapidapi.com",
          },
        }
      );

      const commentsData = response.data?.data?.comments || [];
      comments = commentsData.map((c) => ({
        id: c.comment_id || c.id || Math.random().toString(36).substring(7),
        text: c.comment_text || c.text || "",
        username: c.author?.name || c.user_name || "unknown_user",
      }));

      newNextToken = null; // FB API doesn’t support pagination
      console.log(`Fetched ${comments.length} FB comments.`);
    }

    // ---------- UNSUPPORTED ----------
    else {
      return res.status(400).json({ error: "Unsupported URL type" });
    }

    if (comments.length === 0)
      return res.json({ comments: [], avgToxicity: 0, nextToken: newNextToken });

    // ---------- 🧹 REMOVE EMOJIS ----------
    comments = comments.map((c) => ({
      ...c,
      text: c.text.replace(
        /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD00-\uDDFF])/g,
        ""
      ).trim(),
    }));

    // ---------- TOXICITY MODEL ----------
    const python = spawn("python", ["./ml/toxicity_model.py"]);
    const input = JSON.stringify({ comments: comments.map((c) => c.text) });

    let result = "";
    python.stdin.write(input);
    python.stdin.end();

    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (data) => {
      console.error("🐍 Python error:", data.toString());
    });

    python.on("close", () => {
      try {
        const parsed = JSON.parse(result);
        const commentsWithToxicity = comments.map((c, i) => ({
          ...c,
          toxicity: parsed.scores[i],
        }));

        res.json({
          comments: commentsWithToxicity,
          avgToxicity: parsed.avgToxicity,
          nextToken: newNextToken, // ✅ frontend can use this for "Load More"
        });
      } catch (err) {
        console.error("❌ Error parsing Python output:", err);
        res.status(500).json({ error: "Failed to parse toxicity data" });
      }
    });
  } catch (err) {
    console.error("🔥 Error fetching comments:", err.message);
    res.status(500).json({ error: "Error fetching comments" });
  }
});

export default router;
























// import express from "express";
// import axios from "axios";
// import { spawn } from "child_process";

// const router = express.Router();

// router.post("/", async (req, res) => {
//   const { url } = req.body;
//   if (!url) return res.status(400).json({ error: "URL required" });

//   try {
//     let comments = [];

//     // ---------- INSTAGRAM HANDLER ----------
//     if (url.includes("instagram.com")) {
//       const match = url.match(/\/reel\/([a-zA-Z0-9_-]+)/) || url.match(/\/p\/([a-zA-Z0-9_-]+)/) || url.match(/\/tv\/([a-zA-Z0-9_-]+)/);
//       if (!match) return res.status(400).json({ error: "Invalid Instagram URL" });
//       const shortcode = match[1];

//       console.log("Fetching Instagram comments for:", shortcode);

//       const response = await axios.get(
//         "https://instagram-social.p.rapidapi.com/api/v1/instagram/comments",
//         {
//           params: { code: shortcode },
//           headers: {
//             "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
//             "X-RapidAPI-Host": "instagram-social.p.rapidapi.com",
//           },
//         }
//       );

//       const commentsData = response.data.body || [];
//       comments = commentsData.map((c) => ({
//         id: c.pk,
//         text: c.text,
//         username: c.user?.username || "unknown_user",
//       }));
//     }

//     // ---------- YOUTUBE HANDLER ----------
//     else if (url.includes("youtube.com") || url.includes("youtu.be")) {
//       const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})(?:[?&].*)?$/);
//       if (!match) return res.status(400).json({ error: "Invalid YouTube URL" });
//       const videoId = match[1];

//       console.log("Fetching YouTube comments for:", videoId);

//       const response = await axios.get("https://yt-api.p.rapidapi.com/comments", {
//         params: { id: videoId },
//         headers: {
//           "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
//           "X-RapidAPI-Host": "yt-api.p.rapidapi.com",
//         },
//       });

//       const commentsData = response.data?.data || [];
//       comments = commentsData.map((item) => ({
//         id: item.commentId || Math.random().toString(36).substring(7),
//         username: item.authorText || "unknown_user",
//         text: item.textDisplay || "",
//       }));
//       console.log("Sample YT comment:", comments[0]);
//     }

//     // ---------- FACEBOOK HANDLER ----------
//     else if (url.includes("facebook.com")) {
//   console.log("Fetching Facebook comments for:", url);

//   const response = await axios.get(
//     "https://facebook-scraper-api4.p.rapidapi.com/get_facebook_post_comments_details",
//     {
//       params: { link: url }, // use 'link' not 'url'
//       headers: {
//         "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
//         "X-RapidAPI-Host": "facebook-scraper-api4.p.rapidapi.com",
//       },
//     }
//   );


//       if (!response.data) {
//         console.error("Facebook API returned no data:", response.status);
//         return res
//           .status(500)
//           .json({ error: "No data returned from Facebook API" });
//       }

//       const commentsData = response.data?.data?.comments || [];
//       comments = commentsData.map((c) => ({
//         id: c.comment_id || c.id || Math.random().toString(36).substring(7),
//         text: c.comment_text || c.text || "",
//         username: c.author?.name || c.user_name || "unknown_user",
//       }));

//       console.log("Sample FB comment:", comments[0]);
//     }

//     // ---------- UNSUPPORTED ----------
//     else {
//       return res.status(400).json({ error: "Unsupported URL type" });
//     }

//     console.log(`Fetched ${comments.length} comments.`);

//     if (comments.length === 0)
//       return res.json({ comments: [], avgToxicity: 0 });

//     // ---------- TOXICITY MODEL ----------
//     const python = spawn("python", ["./ml/toxicity_model.py"]);
//     const input = JSON.stringify({ comments: comments.map((c) => c.text) });

//     let result = "";
//     python.stdin.write(input);
//     python.stdin.end();

//     python.stdout.on("data", (data) => {
//       result += data.toString();
//     });

//     python.stderr.on("data", (data) => {
//       console.error("Python error:", data.toString());
//     });

//     python.on("close", () => {
//       try {
//         const parsed = JSON.parse(result);

//         const commentsWithToxicity = comments.map((c, i) => ({
//           ...c,
//           toxicity: parsed.scores[i],
//         }));

//         res.json({
//           comments: commentsWithToxicity,
//           avgToxicity: parsed.avgToxicity,
//         });
//       } catch (err) {
//         console.error("Error parsing Python output:", err);
//         res.status(500).json({ error: "Failed to parse toxicity data" });
//       }
//     });
//   } catch (err) {
//     console.error("Error fetching comments:", err.message);
//     res.status(500).json({ error: "Error fetching comments" });
//   }
// });

// export default router;














// import express from "express";
// import axios from "axios";
// import { spawn } from "child_process";

// const router = express.Router();

// router.post("/", async (req, res) => {
//   const { url } = req.body;
//   if (!url) return res.status(400).json({ error: "URL required" });

//   try {
//     let comments = [];

//     // ---------- INSTAGRAM HANDLER ----------
//     if (url.includes("instagram.com/reel")) {
//       const match = url.match(/\/reel\/([a-zA-Z0-9_-]+)/);
//       if (!match) return res.status(400).json({ error: "Invalid Reel URL" });
//       const shortcode = match[1];

//       console.log("Fetching Instagram comments for:", shortcode);

//       const response = await axios.get(
//         "https://instagram-social.p.rapidapi.com/api/v1/instagram/comments",
//         {
//           params: { code: shortcode },
//           headers: {
//             "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
//             "X-RapidAPI-Host": "instagram-social.p.rapidapi.com",
//           },
//         }
//       );

//       const commentsData = response.data.body || [];
//       comments = commentsData.map((c) => ({
//         id: c.pk,
//         text: c.text,
//         username: c.user?.username || "unknown_user",
//       }));
//     }

//     // ---------- YOUTUBE HANDLER ----------
//     else if (url.includes("youtube.com") || url.includes("youtu.be")) {
//       const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})(?:[?&].*)?$/);
//       if (!match) return res.status(400).json({ error: "Invalid YouTube URL" });
//       const videoId = match[1];

//       console.log("Fetching YouTube comments for:", videoId);

//       const response = await axios.get("https://yt-api.p.rapidapi.com/comments", {
//         params: { id: videoId },
//         headers: {
//           "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
//           "X-RapidAPI-Host": "yt-api.p.rapidapi.com",
//         },
//       });

//       const commentsData = response.data?.data || [];
//       comments = commentsData.map((item) => ({
//         id: item.commentId || Math.random().toString(36).substring(7),
//         username: item.authorText || "unknown_user",
//         text: item.textDisplay || "",
//       }));
//       console.log("Sample YT comment:", comments[0]);
//     }

//     // ---------- FACEBOOK HANDLER ----------
//     else if (url.includes("facebook.com")) {
//       // Match post ID (supports https://www.facebook.com/{page}/posts/{postId}/{share})
//       // if (!url) return res.status(400).json({ error: "Invalid Facebook Post URL" });
//       // const postId = match[0];

//       console.log("Fetching Facebook comments for:", url);

//       const response = await axios.get(
//         "https://facebook-scraper-api4.p.rapidapi.com/comments",
//         {
//           params: { url }, // some APIs use "url" or "post_url"
//           headers: {
//             "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
//             "X-RapidAPI-Host": "facebook-scraper-api4.p.rapidapi.com",
//           },
//         }
//       );

//       const commentsData = response.data?.comments || response.data || [];
//       comments = commentsData.map((c) => ({
//         id: c.comment_id || Math.random().toString(36).substring(7),
//         text: c.comment_text || c.text || "",
//         username: c.name || c.user || "unknown_user",
//       }));

//       console.log("Sample FB comment:", comments[0]);
//     }

//     // ---------- UNSUPPORTED ----------
//     else {
//       return res.status(400).json({ error: "Unsupported URL type" });
//     }

//     console.log(`Fetched ${comments.length} comments.`);

//     if (comments.length === 0)
//       return res.json({ comments: [], avgToxicity: 0 });

//     // ---------- TOXICITY MODEL ----------
//     const python = spawn("python", ["./ml/toxicity_model.py"]);
//     const input = JSON.stringify({ comments: comments.map((c) => c.text) });

//     let result = "";
//     python.stdin.write(input);
//     python.stdin.end();

//     python.stdout.on("data", (data) => {
//       result += data.toString();
//     });

//     python.stderr.on("data", (data) => {
//       console.error("Python error:", data.toString());
//     });

//     python.on("close", () => {
//       try {
//         const parsed = JSON.parse(result);

//         const commentsWithToxicity = comments.map((c, i) => ({
//           ...c,
//           toxicity: parsed.scores[i],
//         }));

//         res.json({
//           comments: commentsWithToxicity,
//           avgToxicity: parsed.avgToxicity,
//         });
//       } catch (err) {
//         console.error("Error parsing Python output:", err);
//         res.status(500).json({ error: "Failed to parse toxicity data" });
//       }
//     });
//   } catch (err) {
//     console.error("Error fetching comments:", err.message);
//     res.status(500).json({ error: "Error fetching comments" });
//   }
// });

// export default router;




















// import express from "express";
// import axios from "axios";
// import { spawn } from "child_process";

// const router = express.Router();

// router.post("/", async (req, res) => {
//   const { url } = req.body;
//   if (!url) return res.status(400).json({ error: "URL required" });

//   try {
//     let comments = [];

//     // Detect platform
//     if (url.includes("instagram.com/reel")) {
//       // ---------- INSTAGRAM REEL HANDLER ----------
//       const match = url.match(/\/reel\/([a-zA-Z0-9_-]+)/);
//       if (!match) return res.status(400).json({ error: "Invalid Reel URL" });
//       const shortcode = match[1];

//       console.log("Fetching Instagram comments for:", shortcode);

//       const response = await axios.get(
//         "https://instagram-social.p.rapidapi.com/api/v1/instagram/comments",
//         {
//           params: { code: shortcode },
//           headers: {
//             "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
//             "X-RapidAPI-Host": "instagram-social.p.rapidapi.com",
//           },
//         }
//       );

//       const commentsData = response.data.body || [];
//       comments = commentsData.map((c) => ({
//         id: c.pk,
//         text: c.text,
//         username: c.user?.username || "unknown_user",
//       }));
//     } 
    
//     else if (url.includes("youtube.com") || url.includes("youtu.be")) {
//       // ---------- YOUTUBE VIDEO HANDLER ----------
//       const match =
//         url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})(?:[?&].*)?$/);
//       if (!match) return res.status(400).json({ error: "Invalid YouTube URL" });
//       const videoId = match[1];

//       console.log("Fetching YouTube comments for:", videoId);

//       const response = await axios.get("https://yt-api.p.rapidapi.com/comments", {
//         params: { id: videoId },
//         headers: {
//           "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
//           "X-RapidAPI-Host": "yt-api.p.rapidapi.com",
//         },
//       });

//       const commentsData = response.data?.data || [];
//       comments = commentsData.map((item) => ({
//         id: item.commentId || Math.random().toString(36).substring(7),
//         username: item.authorText || "unknown_user",
//         text: item.textDisplay || "",

//       }));
//       console.log("Sample YT comment:", comments[0]);

//     } 
    
//     else {
//       return res.status(400).json({ error: "Unsupported URL type" });
//     }

//     console.log(`Fetched ${comments.length} comments.`);

//     if (comments.length === 0)
//       return res.json({ comments: [], avgToxicity: 0 });

//     // ---------- TOXICITY MODEL ----------
//     const python = spawn("python", ["./ml/toxicity_model.py"]);
//     const input = JSON.stringify({ comments: comments.map((c) => c.text) });

//     let result = "";
//     python.stdin.write(input);
//     python.stdin.end();

//     python.stdout.on("data", (data) => {
//       result += data.toString();
//     });

//     python.stderr.on("data", (data) => {
//       console.error("Python error:", data.toString());
//     });

//     python.on("close", () => {
//       try {
//         const parsed = JSON.parse(result);

//         const commentsWithToxicity = comments.map((c, i) => ({
//           ...c,
//           toxicity: parsed.scores[i],
//         }));

//         res.json({
//           comments: commentsWithToxicity,
//           avgToxicity: parsed.avgToxicity,
//         });
//       } catch (err) {
//         console.error("Error parsing Python output:", err);
//         res.status(500).json({ error: "Failed to parse toxicity data" });
//       }
//     });
//   } catch (err) {
//     console.error("Error fetching comments:", err.message);
//     res.status(500).json({ error: "Error fetching comments" });
//   }
// });

// export default router;



















// import express from "express";
// import axios from "axios";
// import { spawn } from "child_process";

// const router = express.Router();

// router.post("/", async (req, res) => {


//   let { reelUrl } = req.body;
//   if (!reelUrl) return res.status(400).json({ error: "Reel URL required" });

//   try {
//     const match = reelUrl.match(/\/reel\/([a-zA-Z0-9_-]+)/);
//     if (!match) return res.status(400).json({ error: "Invalid Reel URL" });
//     const shortcode = match[1];

//     console.log("Fetching comments for reel shortcode:", shortcode);

//     const response = await axios.get(
//       "https://instagram-social.p.rapidapi.com/api/v1/instagram/comments",
//       {
//         params: { code: shortcode },
//         headers: {
//           "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
//           "X-RapidAPI-Host": "instagram-social.p.rapidapi.com",
//         },
//       }
//     );



//     const commentsData = response.data.body || [];
//     const comments = commentsData.map((c) => ({
//       id: c.pk,
//       text: c.text,
//       username: c.user?.username || "unknown_user",
//     }));

//     console.log(`Fetched ${comments.length} comments.`);

//     if (comments.length === 0)
//       return res.json({ comments: [], avgToxicity: 0 });

//     const python = spawn("python", ["./ml/toxicity_model.py"]);
//     const input = JSON.stringify({ comments: comments.map((c) => c.text) });

//     let result = "";
//     python.stdin.write(input);
//     python.stdin.end();

//     python.stdout.on("data", (data) => {
//       result += data.toString();
//     });

//     python.stderr.on("data", (data) => {
//       console.error("Python error:", data.toString());
//     });

//     python.on("close", () => {
//       try {
//         const parsed = JSON.parse(result);

    
//         const commentsWithToxicity = comments.map((c, i) => ({
//           ...c,
//           toxicity: parsed.scores[i],
//         }));

//         res.json({
//           comments: commentsWithToxicity,
//           avgToxicity: parsed.avgToxicity,
//         });
//       } catch (err) {
//         console.error("Error parsing Python output:", err);
//         res.status(500).json({ error: "Failed to parse toxicity data" });
//       }
//     });
//   } catch (err) {
//     console.error("Error fetching comments:", err.message);
//     res.status(500).json({ error: "Error fetching comments" });
//   }
// });

// export default router;

















  // const { reelUrl } = req.body;
  // if (!reelUrl) return res.status(400).json({ error: "Reel URL required" });

  // try {
  //   console.log("Fetching comments for reel:", reelUrl);

  //   // Fetch comments
  //   const response = await axios.get(
  //     "https://instagram-social.p.rapidapi.com/api/v1/instagram/comments",
  //     {
  //       params: { code: reelUrl },
  //       headers: {
  //         "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
  //         "X-RapidAPI-Host": "instagram-social.p.rapidapi.com",
  //       },
  //     }
  //   );












// import express from "express";
// import axios from "axios";
// import { spawn } from "child_process";

// const router = express.Router();

// router.post("/", async (req, res) => {
//   const { reelUrl } = req.body;
//   if (!reelUrl) return res.status(400).json({ error: "Reel URL required" });

//   try {
//     console.log("Fetching comments for reel:", reelUrl);

//     // Fetch comments from RapidAPI
//     const response = await axios.get(
//       "https://instagram-social.p.rapidapi.com/api/v1/instagram/comments",
//       {
//         params: { code: reelUrl },
//         headers: {
//           "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
//           "X-RapidAPI-Host": "instagram-social.p.rapidapi.com",
//         },
//       }
//     );

//     // Correct extraction for this API
//     const commentsData = response.data.body || []; // body contains array of comments
//     const comments = commentsData.map((c) => ({
//       id: c.pk,
//       text: c.text,
//       username: c.user?.username || "unknown_user",
//     }));

//     console.log(`Fetched ${comments.length} comments.`);

//     if (comments.length === 0)
//       return res.json({ comments: [], avgToxicity: 0 });

//     //  Send comments to Python toxicity model
//     const python = spawn("python", ["./ml/toxicity_model.py"]);
//     const input = JSON.stringify({ comments: comments.map((c) => c.text) });

//     let result = "";
//     python.stdin.write(input);
//     python.stdin.end();

//     python.stdout.on("data", (data) => {
//       result += data.toString();
//     });

//     python.stderr.on("data", (data) => {
//       console.error("Python error:", data.toString());
//     });

//     python.on("close", () => {
//       try {
//         const parsed = JSON.parse(result);
//         // Send both comments + avgToxicity back
//         res.json({ comments, avgToxicity: parsed.avgToxicity });
//       } catch (err) {
//         console.error("Error parsing Python output:", err);
//         res.status(500).json({ error: "Failed to parse toxicity data" });
//       }
//     });
//   } catch (err) {
//     console.error("Error fetching comments:", err.message);
//     res.status(500).json({ error: "Error fetching comments" });
//   }
// });

// export default router;










// import express from "express";
// import axios from "axios";
// const router = express.Router();
// router.post("/", async (req, res) => {
//   const { reelUrl } = req.body;
//   // expects Instagram shortcode like "DESoQn4RgAl"
//   if (!reelUrl) return res.status(400).json({ error: "Reel URL required" });
//   try {
//     console.log("Fetching comments for reel:", reelUrl);
//     const response = await axios.get("https://instagram-social.p.rapidapi.com/api/v1/instagram/comments", {
//       params: { code: reelUrl },
//       // shortcode from Instagram URL
//       headers: {
//         "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
//         "X-RapidAPI-Host": "instagram-social.p.rapidapi.com",
//       },
      

//     });
//     console.log("Raw API response:", response.data);
//    const commentsData = response.data.body || []; // <-- body, not comments
// const comments = commentsData.map((c) => ({
//   _id: c.pk,
//   text: c.text,
//   username: c.user?.username || "unknown_user",
// }));

// console.log(`Fetched ${comments.length} comments.`);
// res.json({ comments });
//   }
//   catch (err) {
//     console.error("Error fetching comments:", err.message);
//     res.status(500).json({ error: "Error fetching comments" });
//   }
// });

// export default router;


