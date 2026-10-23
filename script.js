const form = document.getElementById("search-form");
const input = document.getElementById("city-input");
const messageEl = document.getElementById("message");
const recentEl = document.getElementById("recent");
const locationBtn = document.getElementById("location-btn");

let recent = JSON.parse(localStorage.getItem("recentCities")) || [];

function describeWeather(code) {
  if (code === 0)  return { text: "Clear sky",    icon: "☀️", theme: "sunny" };
  if (code <= 3)   return { text: "Cloudy",       icon: "⛅️", theme: "cloudy" };
  if (code <= 48)  return { text: "Fog",          icon: "🌫️", theme: "cloudy" };
  if (code <= 67)  return { text: "Rain",         icon: "🌧️", theme: "rainy" };
  if (code <= 77)  return { text: "Snow",         icon: "❄️", theme: "snowy" };
  if (code <= 82)  return { text: "Rain showers", icon: "🌦️", theme: "rainy" };
  return { text: "Thunderstorm", icon: "⛈️", theme: "stormy" };
}

function saveRecent(city) {
  recent = recent.filter(function (c) { return c !== city; });
  recent.unshift(city);
  recent = recent.slice(0, 5);
  localStorage.setItem("recentCities", JSON.stringify(recent));
  renderRecent();
}

function renderRecent() {
  recentEl.innerHTML = "";

  recent.forEach(function (city) {
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.textContent = city;
    btn.addEventListener("click", function () {
      searchCity(city);
    });
    recentEl.appendChild(btn);
  });
}

async function getWeather(lat, lon, placeName) {
  const url =
    "https://api.open-meteo.com/v1/forecast?latitude=" + lat +
    "&longitude=" + lon +
    "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,apparent_temperature,weather_code";

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Weather data nahi mila");
  }

  const data = await res.json();
  const c = data.current;
  const info = describeWeather(c.weather_code);

  document.getElementById("place").textContent = placeName;
  document.getElementById("icon").textContent = info.icon;
  document.getElementById("temp").textContent = Math.round(c.temperature_2m) + "°C";
  document.getElementById("desc").textContent = info.text;
  document.getElementById("feels").textContent = "Feels like: " + Math.round(c.apparent_temperature) + "°C";
  document.getElementById("humidity").textContent = "Humidity: " + c.relative_humidity_2m + "%";
  document.getElementById("wind").textContent = "Wind: " + c.wind_speed_10m + " km/h";

  document.body.className = info.theme;
}

async function searchCity(name) {
  messageEl.textContent = "Loading...";

  try {
    const url =
      "https://geocoding-api.open-meteo.com/v1/search?name=" +
      encodeURIComponent(name) +
      "&count=1";

    const res = await fetch(url);
    const data = await res.json();

    if (!data.results) {
      throw new Error("City not found");
    }

    const place = data.results[0];
    await getWeather(place.latitude, place.longitude, place.name + ", " + place.country);

    saveRecent(place.name);
    messageEl.textContent = "";
  } catch (err) {
    messageEl.textContent = "⚠️ " + err.message;
  }
}

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const name = input.value.trim();

  if (name === "") {
    messageEl.textContent = "Pehle city ka naam likho.";
    return;
  }

  searchCity(name);
});

// 📍 button: browser se user ki location lena
locationBtn.addEventListener("click", function () {
  if (!navigator.geolocation) {
    messageEl.textContent = "Aapka browser location support nahi karta.";
    return;
  }

  messageEl.textContent = "Location dhoondh raha hoon...";

  navigator.geolocation.getCurrentPosition(
    async function (pos) {
      try {
        await getWeather(pos.coords.latitude, pos.coords.longitude, "Your location");
        messageEl.textContent = "";
      } catch (err) {
        messageEl.textContent = "⚠️ " + err.message;
      }
    },
    function () {
      messageEl.textContent = "⚠️ Location ki permission nahi mili.";
    }
  );
});

renderRecent();