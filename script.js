const cityInput = document.getElementById('cityInput');
const countryInput = document.getElementById('countryInput');
const searchBtn = document.getElementById('searchBtn');

const weatherInfo = document.getElementById('weatherInfo');
const cityName = document.getElementById('cityName');
const temperature = document.getElementById('temperature');
const weatherCondition = document.getElementById('weatherCondition');
const windSpeed = document.getElementById('windSpeed');
const latitude = document.getElementById('latitude');
const longitude = document.getElementById('longitude');
const message = document.getElementById('message');

// Expanded Weather Code Mapping (Open-Meteo WMO Codes)
const weatherCodes = {
    0: 'Clear Sky ☀️',
    1: 'Mainly Clear 🌤️',
    2: 'Partly Cloudy ⛅',
    3: 'Overcast ☁️',
    45: 'Foggy 🌫️',
    48: 'Depositing Rime Fog 🌫️',
    51: 'Light Drizzle 🌧️',
    53: 'Moderate Drizzle 🌧️',
    55: 'Dense Drizzle 🌧️',
    61: 'Slight Rain 🌧️',
    63: 'Moderate Rain 🌧️',
    65: 'Heavy Rain 🌧️',
    71: 'Slight Snowfall ❄️',
    73: 'Moderate Snowfall ❄️',
    75: 'Heavy Snowfall ❄️',
    80: 'Rain Showers 🌦️',
    81: 'Moderate Rain Showers 🌦️',
    82: 'Violent Rain Showers ⛈️',
    95: 'Thunderstorm ⛈️',
    96: 'Thunderstorm with Hail ⛈️',
    99: 'Heavy Thunderstorm ⛈️'
};

async function getWeather() {
    const city = cityInput.value.trim();
    const countryFilter = countryInput.value.trim().toLowerCase();

    if (!city) {
        message.innerText = 'Please enter a city name!';
        weatherInfo.classList.add('hidden');
        return;
    }

    message.innerText = 'Fetching weather...';

    try {
        // Step 1: Safe API query using encodeURIComponent
        const searchQuery = encodeURIComponent(city);
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${searchQuery}&count=10&language=en&format=json`);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            message.innerText = 'City not found! Please check spelling.';
            weatherInfo.classList.add('hidden');
            return;
        }

        // Step 2: Match result with country if country is specified
        let location = geoData.results[0];

        if (countryFilter) {
            const matchedLocation = geoData.results.find(res => {
                const cName = (res.country || '').toLowerCase();
                const cCode = (res.country_code || '').toLowerCase();
                return cName.includes(countryFilter) || cCode === countryFilter;
            });

            if (matchedLocation) {
                location = matchedLocation;
            }
        }

        const lat = location.latitude;
        const lon = location.longitude;
        const country = location.country ? location.country : '';

        // Step 3: Fetch Live Weather Data using Lat & Lon
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const weatherData = await weatherResponse.json();

        const current = weatherData.current_weather;

        // Step 4: Display Data
        cityName.innerText = country ? `${location.name}, ${country}` : location.name;
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
        console.error('Weather Fetch Error:', error);
        message.innerText = 'Error loading weather data. Try again!';
        weatherInfo.classList.add('hidden');
    }
}

// Event Listeners
searchBtn.addEventListener('click', getWeather);

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') getWeather();
});

countryInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') getWeather();
});