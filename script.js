const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const locBtn = document.getElementById("loc-btn");
const unitToggleBtn = document.getElementById("unit-toggle");
const recentCitiesContainer = document.getElementById("recent-cities");

let currentUnit = "metric"; // metric = °C, imperial = °F
let lastSearchedCity = "Delhi";

// ==================== EVENT LISTENERS ====================
searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city) fetchWeatherByCity(city);
});

cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const city = cityInput.value.trim();
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
            () => {
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

// ==================== SEARCH SPINNER HELPER ====================
function toggleSearchLoading(isLoading) {
    const searchIcon = searchBtn.querySelector("i");
    if (isLoading) {
        searchIcon.className = "fa-solid fa-spinner";
        searchBtn.disabled = true;
    } else {
        searchIcon.className = "fa-solid fa-magnifying-glass";
        searchBtn.disabled = false;
    }
}

// ==================== FETCH FUNCTIONS ====================

async function fetchWeatherByCity(city) {
    try {
        toggleSearchLoading(true); // Start spinner animation

        const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
        const contentType = response.headers.get("content-type");
        
        if (!response.ok || !contentType || !contentType.includes("application/json")) {
            throw new Error("City not found");
        }

        const data = await response.json();
        
        // Slight delay for smooth searching experience
        setTimeout(() => {
            lastSearchedCity = city;
            updateUI(data, city);
            saveRecentCity(city);
            toggleSearchLoading(false); // Stop spinner
        }, 800);

    } catch (error) {
        console.error(error);
        toggleSearchLoading(false);
        alert("City not found! Please check the spelling and try again.");
    }
}

async function fetchWeatherByCoords(lat, lon) {
    try {
        toggleSearchLoading(true);

        const response = await fetch(`https://wttr.in/${lat},${lon}?format=j1`);
        const contentType = response.headers.get("content-type");
        if (!response.ok || !contentType || !contentType.includes("application/json")) {
            throw new Error("Location data unavailable");
        }

        const data = await response.json();
        const cityName = data.nearest_area?.[0]?.areaName?.[0]?.value || "Current Location";
        
        setTimeout(() => {
            lastSearchedCity = cityName;
            updateUI(data, cityName);
            saveRecentCity(cityName);
            toggleSearchLoading(false);
        }, 800);

    } catch (error) {
        console.error(error);
        toggleSearchLoading(false);
        alert("Unable to fetch weather for your current location.");
    }
}

// ==================== UI UPDATERS & ANIMATIONS ====================

function updateUI(data, cityName) {
    // Trigger Pop-In Animation on Main & Forecast Containers
    const weatherMain = document.getElementById("weather-main");
    const forecastSection = document.querySelector(".forecast-section");

    weatherMain.classList.remove("animate-pop");
    forecastSection.classList.remove("animate-pop");
    void weatherMain.offsetWidth; // Trigger browser reflow
    weatherMain.classList.add("animate-pop");
    forecastSection.classList.add("animate-pop");

    // Data Binding
    const current = data.current_condition[0];
    const area = data.nearest_area ? data.nearest_area[0].areaName[0].value : cityName;
    const country = data.nearest_area ? data.nearest_area[0].country[0].value : "";

    document.getElementById("city-name").innerText = `${area}${country ? ", " + country : ""}`;
    
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
    
    // Weather Icon Mapping
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

    // Render 3-Day Forecast
    if (data.weather) {
        updateForecastUI(data.weather);
    }
    
    cityInput.value = "";
}

// Update 3-Day Forecast Cards
function updateForecastUI(weatherList) {
    const forecastContainer = document.getElementById("forecast-container");
    forecastContainer.innerHTML = "";

    weatherList.forEach((dayData, index) => {
        if(index >= 3) return; // Strictly restricted to 3 days
        
        const dateObj = new Date(dayData.date);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

        let tempVal = currentUnit === "metric" ? `${dayData.avgtempC}°C` : `${dayData.avgtempF}°F`;
        let desc = dayData.hourly && dayData.hourly[4] ? dayData.hourly[4].weatherDesc[0].value.toLowerCase() : "";
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

// ==================== LOCALSTORAGE RECENT CITIES ====================

function saveRecentCity(city) {
    let cities = JSON.parse(localStorage.getItem("recentCities")) || [];
    // Capitalize first letter neatly for pills
    city = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
    
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

// Initial App Execution
renderRecentCities();
fetchWeatherByCity("Delhi");
