document.addEventListener("DOMContentLoaded", () => {
  const statusDiv = document.getElementById("status");
  const weatherDiv = document.getElementById("weather");
  const suggestionsDiv = document.getElementById("suggestions");

  const observer = new MutationObserver(() => {
    document.querySelectorAll('.place-card').forEach(card => {
      card.setAttribute('role', 'link');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', card.querySelector('h3')?.textContent || 'Activity suggestion');


      card.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
        card.click();
        }
      });
    });
  });

  observer.observe(document.getElementById('suggestions'), { childList: true, subtree: true });

  document.addEventListener("keydown", (e) => {
    if (e.shiftKey && e.key.toLowerCase() === "t") {
      const panel = document.getElementById("testWeather");
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    }
  });

  document.getElementById("getActivities").addEventListener("click", () => {
    statusDiv.textContent = "Getting location...";
    navigator.geolocation.getCurrentPosition(async pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      statusDiv.textContent = "Fetching weather...";
      try {
        // ✅ Call your Express backend, not the external API directly
        const weatherResp = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
        const weatherData = await weatherResp.json();

        if (!weatherData.main) {
          statusDiv.textContent = "❌ Unexpected weather response.";
          console.log(weatherData);
          return;
        }

        const temp = weatherData.main.temp;
        const condition = weatherData.weather?.[0]?.main || "Unknown";

      

        weatherDiv.innerHTML = `
          ✅ Weather received:<br>
          Temperature: ${temp}°C<br>
          Condition: ${condition}
        `;

        // 🌤️ Add a recommendation message
        let recommendation = "";

        if (condition.toLowerCase().includes("rain")) {
          recommendation = "🌧️ Due to rainy weather, indoor activities are recommended.";
        } else if (temp > 30) {
          recommendation = "🔥 Due to extreme heat, indoor activities are recommended.";
        } else if (temp < 10) {
          recommendation = "❄️ Due to extreme cold, indoor activities are recommended.";
        } else {
          recommendation = "🌤️ The weather is great outside today, so outdoor activities are recommended!";
        }

        weatherDiv.innerHTML += `<br><br><strong>${recommendation}</strong>`;

        updateBackground(temp, condition);
        updateWeatherEffects(temp, condition);

        const rainChance = condition.toLowerCase().includes("rain") ? 80 : 20;
        const type = classifyWeather(temp, rainChance);

        statusDiv.textContent = `Weather suggests ${type} activities...`;
        const placesResp = await fetch(`/api/places?lat=${lat}&lon=${lon}&type=${type}`);
        const { type: returnedType, places } = await placesResp.json();

        statusDiv.textContent = "";
        renderSuggestions(places, returnedType);

      } catch (err) {
        console.error("Error fetching data:", err);
        statusDiv.textContent = "❌ Error fetching data. Check console for details.";
      }
    });
  });
});

function classifyWeather(temp, rainChance) {
  if (rainChance > 50 || temp < 10 || temp > 30) return "indoor";
  return "outdoor";
}

function updateBackground(temp, condition) {
  const body = document.body;
  body.className = ""; // Reset any previous styles

  const lowerCondition = condition.toLowerCase();

  // Temperature-based classes
  if (lowerCondition.includes("rain") || lowerCondition.includes("storm")) {
    body.classList.add("rainy");
  } else if (temp > 30) {
    body.classList.add("hot");
  } else if (temp < 10) {
    body.classList.add("cold");
  } else {
    // 🌤️ Mild weather: use default background (no class)
    return;
  }
}

function updateWeatherEffects(temp, condition) {
  const effectContainer = document.getElementById("weather-effect");
  effectContainer.innerHTML = ""; // clear old effects

  const lowerCondition = condition.toLowerCase();

  if (lowerCondition.includes("rain") || lowerCondition.includes("storm")) {
    // ☔ Create raindrops
    for (let i = 0; i < 60; i++) {
      const drop = document.createElement("div");
      drop.classList.add("raindrop");
      drop.style.left = Math.random() * 100 + "vw";
      drop.style.animationDuration = 0.5 + Math.random() * 0.7 + "s";
      drop.style.animationDelay = Math.random() * 2 + "s";
      effectContainer.appendChild(drop);
    }
  } else if (temp < 10) {
    // ❄️ Create snowflakes
    for (let i = 0; i < 40; i++) {
      const flake = document.createElement("div");
      flake.classList.add("snowflake");
      flake.textContent = "❄";
      flake.style.left = Math.random() * 100 + "vw";
      flake.style.fontSize = 10 + Math.random() * 14 + "px";
      flake.style.animationDuration = 5 + Math.random() * 5 + "s";
      flake.style.animationDelay = Math.random() * 3 + "s";
      effectContainer.appendChild(flake);
    }
  } else if (temp > 30) {
    // 🔥 Heat haze shimmer
    const shimmer = document.createElement("div");
    shimmer.classList.add("heatwave");
    effectContainer.appendChild(shimmer);
  }
}

function simulateWeather(temp, condition) {
  const weatherDiv = document.getElementById("weather");
  const statusDiv = document.getElementById("status");

  weatherDiv.innerHTML = `
    ✅ Simulated weather:<br>
    Temperature: ${temp}°C<br>
    Condition: ${condition}
  `;

  // Add recommendation line
  let recommendation = "";
  if (condition.toLowerCase().includes("rain")) {
    recommendation = "🌧️ Due to rainy weather, indoor activities are recommended.";
  } else if (temp > 30) {
    recommendation = "🔥 Due to extreme heat, indoor activities are recommended.";
  } else if (temp < 10) {
    recommendation = "❄️ Due to extreme cold, indoor activities are recommended.";
  } else {
    recommendation = "🌤️ The weather is great outside today, so outdoor activities are recommended!";
  }

  weatherDiv.innerHTML += `<br><br><strong>${recommendation}</strong>`;

  // Update visuals
  updateBackground(temp, condition);
  updateWeatherEffects(temp, condition);

  statusDiv.textContent = "✅ Simulation complete.";

    // 🧭 Get user location
  if (!navigator.geolocation) {
    statusDiv.textContent = "❌ Geolocation not supported.";
    return;
  }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      // 🧩 Classify simulated weather
      const rainChance = condition.toLowerCase().includes("rain") ? 100 : 0;
      const weatherType = classifyWeather(temp, rainChance);

      // 🗺️ Fetch simulated activity suggestions
      statusDiv.textContent = "🔍 Fetching simulated activity suggestions...";

      try {
        const placesResp = await fetch(
          `/api/places?lat=${lat}&lon=${lon}&type=${weatherType}`
        );
        const { type: returnedType, places } = await placesResp.json();

        statusDiv.textContent = "";
        renderSuggestions(places, returnedType);
      } catch (err) {
        console.error(err);
        statusDiv.textContent = "❌ Failed to fetch simulated suggestions.";
      }
    });
}

function renderSuggestions(data, type) {
  const container = document.getElementById("suggestions");
  container.innerHTML = ""; // clear previous suggestions

  const title = document.createElement("h2");
  title.textContent = type === "indoor" ? "☂️ Indoor Activities" : "☀️ Outdoor Activities";
  container.appendChild(title);

  if (!data || data.length === 0) {
    const none = document.createElement("p");
    none.textContent = "No activities found nearby.";
    container.appendChild(none);
    return;
  }

  const places = data.slice(0, 6);

  places.forEach((item) => {
    const mapsUrl = item.place_id
      ? `https://www.google.com/maps/search/?api=1&query_place_id=${item.place_id}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name + " " + (item.vicinity || ""))}`;

    const card = document.createElement("a");
    card.href = mapsUrl;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.classList.add("place-card");
    card.title = "Open in Google Maps"; // 🧭 Tooltip text

    const photoUrl = item.photos?.[0]
      ? `/api/photo?ref=${item.photos[0].photo_reference}`
      : "images/placeholder.png";

    const img = document.createElement("img");
    img.src = photoUrl;
    img.alt = item.name;

    const name = document.createElement("h3");
    name.textContent = item.name;

    const rating = document.createElement("p");
    if (item.rating) {
      const stars = "⭐".repeat(Math.round(item.rating));
      rating.textContent = `${stars} (${item.rating.toFixed(1)} from ${item.user_ratings_total || 0} reviews)`;
    } else {
      rating.textContent = "No rating available";
    }

    const address = document.createElement("p");
    address.textContent = item.vicinity || "Address unavailable";

    const open = document.createElement("p");
    if (item.opening_hours) {
      open.textContent = item.opening_hours.open_now ? "🟢 Open now" : "🔴 Closed";
    }

    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(rating);
    card.appendChild(address);
    if (item.opening_hours) card.appendChild(open);
    container.appendChild(card);
  });
}


