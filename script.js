const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const locBtn = document.getElementById("loc-btn");
const unitToggleBtn = document.getElementById("unit-toggle");
const recentCitiesContainer = document.getElementById("recent-cities");

let currentUnit = "metric"; // metric = °C, imperial = °F
let lastSearchedCity = "Delhi";

// Event Listeners
searchBtn.addEventListener("click", () => {
    let city = cityInput.value.trim();
    if (city) fetchWeatherByCity(city);
});

cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        let city = cityInput.value.trim();
        if (city) fetchWeatherByCity(city);
    }
});

locBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherByCoords(lat, lon);
            },
            (error) => {
                alert("Location permission denied or unavailable.");
            }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
    }
});

unitToggleBtn.addEventListener("click", () => {
    currentUnit = currentUnit === "metric" ? "imperial" : "metric";
    unitToggleBtn.innerText = currentUnit === "metric" ? "°C" : "°F";
    fetchWeatherByCity(lastSearchedCity);
});

// Fetch Weather by City Name using wttr.in (No API Key Required)
async function fetchWeatherByCity(city) {
    try {
        const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
        if (!response.ok) throw new Error("City not found");
        const data = await response.json();
        
        lastSearchedCity = city;
        updateUI(data, city);
        saveRecentCity(city);
    } catch (error) {
        alert("Error: City not found or network issue.");
    }
}

// Fetch Weather by Coordinates
async function fetchWeatherByCoords(lat, lon) {
    try {
        const response = await fetch(`https://wttr.in/${lat},${lon}?format=j1`);
        const data = await response.json();
        const cityName = data.nearest_area[0].areaName[0].value;
        
        lastSearchedCity = cityName;
        updateUI(data, cityName);
        saveRecentCity(cityName);
    } catch (error) {
        alert("Unable to fetch weather for current location.");
    }
}

// Update UI Function
function updateUI(data, cityName) {
    const current = data.current_condition[0];
    const area = data.nearest_area ? data.nearest_area[0].areaName[0].value : cityName;
    const country = data.nearest_area ? data.nearest_area[0].country[0].value : "";

    document.getElementById("city-name").innerText = `${area}, ${country}`;
    
    const d = new Date();
    document.getElementById("date-time").innerText = d.toLocaleString('en-US', { 
        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    let temp, feelsLike, windSpeed;
    if (currentUnit === "metric") {
        temp = `${current.temp_C}°C`;
        feelsLike = `${current.FeelsLikeC}°C`;
        windSpeed = `${current.windspeedKmph} km/h`;
    } else {
        temp = `${current.temp_F}°F`;
        feelsLike = `${current.FeelsLikeF}°F`;
        windSpeed = `${current.windspeedMiles} mph`;
    }

    document.getElementById("temperature").innerText = temp;
    document.getElementById("weather-description").innerText = current.weatherDesc[0].value;
    
    // Simple weather icon mapping based on text
    const descLower = current.weatherDesc[0].value.toLowerCase();
    let iconCode = "01d";
    if (descLower.includes("rain")) iconCode = "10d";
    else if (descLower.includes("cloud")) iconCode = "03d";
    else if (descLower.includes("snow")) iconCode = "13d";
    
    document.getElementById("weather-icon").src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    
    document.getElementById("feels-like").innerText = feelsLike;
    document.getElementById("humidity").innerText = `${current.humidity}%`;
    document.getElementById("wind-speed").innerText = windSpeed;
    document.getElementById("pressure").innerText = `${current.pressure} hPa`;

    // Update 5-day forecast UI using wttr.in weather forecast array
    updateForecastUI(data.weather);
    
    cityInput.value = "";
}

// Update 5-Day Forecast
function updateForecastUI(weatherList) {
    const forecastContainer = document.getElementById("forecast-container");
    forecastContainer.innerHTML = "";

    weatherList.forEach((dayData, index) => {
        if(index >= 5) return; // 5 days max
        
        const dateObj = new Date(dayData.date);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

        let tempVal = currentUnit === "metric" ? `${dayData.avgtempC}°C` : `${dayData.avgtempF}°F`;
        let desc = dayData.hourly[4].weatherDesc[0].value.toLowerCase();
        let iconCode = "01d";
        if (desc.includes("rain")) iconCode = "10d";
        else if (desc.includes("cloud")) iconCode = "03d";

        const card = document.createElement("div");
        card.classList.add("forecast-card");
        card.innerHTML = `
            <p>${dayName}</p>
            <img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="icon">
            <h4>${tempVal}</h4>
        `;
        forecastContainer.appendChild(card);
    });
}

// LocalStorage for Recent Cities
function saveRecentCity(city) {
    let cities = JSON.parse(localStorage.getItem("recentCities")) || [];
    if (!cities.includes(city)) {
        if (cities.length >= 4) cities.pop();
        cities.unshift(city);
        localStorage.setItem("recentCities", JSON.stringify(cities));
    }
    renderRecentCities();
}

function renderRecentCities() {
    let cities = JSON.parse(localStorage.getItem("recentCities")) || [];
    recentCitiesContainer.innerHTML = "";
    cities.forEach(city => {
        const pill = document.createElement("span");
        pill.classList.add("city-pill");
        pill.innerText = city;
        pill.addEventListener("click", () => fetchWeatherByCity(city));
        recentCitiesContainer.appendChild(pill);
    });
}

// Initial Load
renderRecentCities();
fetchWeatherByCity("Delhi");