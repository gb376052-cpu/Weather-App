const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');

const weatherInfo = document.getElementById('weatherInfo');
const cityName = document.getElementById('cityName');
const temperature = document.getElementById('temperature');
const weatherCondition = document.getElementById('weatherCondition');
const windSpeed = document.getElementById('windSpeed');
const latitude = document.getElementById('latitude');
const longitude = document.getElementById('longitude');
const message = document.getElementById('message');

// Weather Code to Text Mapping
const weatherCodes = {
    0: 'Clear Sky ☀️',
    1: 'Mainly Clear 🌤️',
    2: 'Partly Cloudy ⛅',
    3: 'Overcast ☁️',
    45: 'Foggy 🌫️',
    51: 'Light Drizzle 🌧️',
    61: 'Rainy 🌧️',
    71: 'Snowfall ❄️',
    95: 'Thunderstorm ⛈️'
};

async function getWeather() {
    const city = cityInput.value.trim();

    if (!city) {
        message.innerText = 'Please enter a city name!';
        weatherInfo.classList.add('hidden');
        return;
    }

    message.innerText = 'Fetching weather...';
    
    try {
        // Step 1: Fetch Latitude & Longitude from City Name
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            message.innerText = 'City not found! Please check spelling.';
            weatherInfo.classList.add('hidden');
            return;
        }

        const location = geoData.results[0];
        const lat = location.latitude;
        const lon = location.longitude;
        const country = location.country ? location.country : '';

        // Step 2: Fetch Live Weather Data using Lat & Lon
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const weatherData = await weatherResponse.json();

        const current = weatherData.current_weather;

        // Step 3: Display Data
        cityName.innerText = `${location.name}, ${country}`;
        temperature.innerText = Math.round(current.temperature);
        windSpeed.innerText = `${current.windspeed} km/h`;
        latitude.innerText = lat.toFixed(2);
        longitude.innerText = lon.toFixed(2);

        // Map Weather Code to Readable Condition
        const conditionText = weatherCodes[current.weathercode] || 'Cloudy ⛅';
        weatherCondition.innerText = conditionText;

        // Show Info Card
        message.innerText = '';
        weatherInfo.classList.remove('hidden');

    } catch (error) {
        message.innerText = 'Error loading weather data. Try again!';
        weatherInfo.classList.add('hidden');
    }
}

// Event Listeners
searchBtn.addEventListener('click', getWeather);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        getWeather();
    }
});