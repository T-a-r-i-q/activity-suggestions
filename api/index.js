const express = require("express");
const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch(...args));
const dotenv = require("dotenv");
dotenv.config({ path: '.env.local' });

const app = express();
const port = process.env.PORT || 3000;

// ✅ DEBUG: Check env vars
console.log("🔑 WEATHER_API_KEY:", process.env.WEATHER_API_KEY ? "Loaded ✅" : "❌ Missing");
console.log("🔑 GOOGLE_PLACES_API_KEY:", process.env.GOOGLE_PLACES_API_KEY ? "Loaded ✅" : "❌ Missing");

app.use(express.static("public"));

// --- Weather endpoint ---
app.get("/api/weather", async (req, res) => {
  const { lat, lon } = req.query;

  try {
    const weatherResp = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}&units=metric`
    );

    const data = await weatherResp.json();
    res.json(data);
  } catch (err) {
    console.error("Weather API error:", err);
    res.status(500).json({ error: "Failed to fetch weather" });
  }
});

// --- Places endpoint ---
app.get("/api/places", async (req, res) => {
  const { lat, lon, type } = req.query;

  const outdoorKeywords = ["park", "beach", "hiking", "campground"];
  const indoorKeywords = ["escape room", "arcade", "museum", "cinema", "snooker"];

  const keywords = type === "outdoor" ? outdoorKeywords : indoorKeywords;

  try {
    const fetches = keywords.map(keyword =>
      fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=7000&keyword=${encodeURIComponent(keyword)}&key=${process.env.GOOGLE_PLACES_API_KEY}`
      ).then(r => r.json())
    );

    const results = await Promise.all(fetches);

    // Combine and remove duplicates
    const allPlaces = results.flatMap(r => r.results);
    const uniquePlaces = Array.from(
      new Map(allPlaces.map(p => [p.place_id, p])).values()
    );

    // Shuffle slightly and limit to 5-10
    const finalPlaces = uniquePlaces.sort(() => 0.5 - Math.random()).slice(0, 8);

    res.json({ type, places: finalPlaces });
  } catch (err) {
    console.error("Places API error:", err);
    res.status(500).json({ error: "Failed to fetch places" });
  }
});

// --- Proxy for Place Photos ---
app.get("/api/photo", async (req, res) => {
  const { ref } = req.query;

  if (!ref) {
    return res.status(400).json({ error: "Missing photo reference" });
  }

  try {
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${ref}&key=${process.env.GOOGLE_PLACES_API_KEY}`;

    const photoResp = await fetch(photoUrl);

    if (!photoResp.ok) {
      throw new Error(`Google Photo API error: ${photoResp.status}`);
    }

    // Stream the image data directly back to the client
    res.setHeader("Content-Type", photoResp.headers.get("content-type"));
    photoResp.body.pipe(res);
  } catch (err) {
    console.error("Photo API error:", err);
    res.status(500).json({ error: "Failed to fetch photo" });
  }
});

// ✅ Start server
module.exports = app;