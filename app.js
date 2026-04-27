const weatherLookup = {
    0: { desc: "Clear Sky", icon: "☀️" },
    1: { desc: "Mainly Clear", icon: "🌤️" },
    2: { desc: "Partly Cloudy", icon: "⛅" },
    3: { desc: "Overcast", icon: "☁️" },
    45: { desc: "Fog", icon: "🌫️" },
    48: { desc: "Rime Fog", icon: "🌫️" },
    51: { desc: "Light Drizzle", icon: "🌦️" },
    61: { desc: "Slight Rain", icon: "🌧️" },
    63: { desc: "Moderate Rain", icon: "🌧️" },
    80: { desc: "Rain Showers", icon: "🌦️" },
    95: { desc: "Thunderstorm", icon: "⛈️" }
};

let debounceTimer;

// Debounce Search
document.getElementById('cityInput').addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();
    debounceTimer = setTimeout(() => {
        if (query.length >= 2) executeSearch(query);
        else if (query.length > 0) document.getElementById('validation-msg').innerText = "Minimum 2 characters required.";
    }, 500);
});

document.getElementById('searchBtn').addEventListener('click', () => {
    executeSearch(document.getElementById('cityInput').value.trim());
});

async function executeSearch(city) {
    if (!city || city.length < 2) {
        document.getElementById('validation-msg').innerText = "Please enter at least 2 characters.";
        return;
    }
    
    setLoadingState(true);
    hideError();

    // AbortController Timeout (10s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`, { signal: controller.signal });
        
        if (!geoRes.ok) throw new Error(`HTTP Error: ${geoRes.status}`);
        
        const geoData = await geoRes.json();
        clearTimeout(timeoutId);

        if (!geoData.results || geoData.results.length === 0) {
            displayError("City not found.");
            setLoadingState(false);
            return;
        }

        const { latitude, longitude, name, timezone } = geoData.results[0];
        await fetchWeatherDetails(latitude, longitude, name, timezone);

    } catch (err) {
        displayError(err.name === 'AbortError' ? "Request timed out after 10s" : err.message);
        setLoadingState(false);
    }
}

async function fetchWeatherDetails(lat, lon, cityName, timezone) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
        const response = await fetch(url);
        const data = await response.json();

        updateDashboard(cityName, data);
        
        // jQuery AJAX for Local Time
        $.getJSON(`https://worldtimeapi.org/api/timezone/${timezone}`)
            .done(function(timeData) {
                const time = new Date(timeData.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                $('#local-time').text(`Local Time: ${time}`);
            })
            .fail(function() {
                $('#local-time').text(`Local Time: ${new Date().toLocaleTimeString()} (System)`);
            })
            .always(function() {
                console.log(`Time request completed at: ${new Date().toISOString()}`);
            });

    } catch (err) {
        displayError("Failed to fetch weather details.");
    }
}

function updateDashboard(city, data) {
    setLoadingState(false);
    const current = data.current_weather;
    const lookup = weatherLookup[current.weathercode] || { desc: "Cloudy", icon: "☁️" };

    document.getElementById('city-name').innerText = city;
    document.getElementById('temp').innerText = current.temperature;
    document.getElementById('weather-status').innerText = `${lookup.icon} ${lookup.desc}`;
    document.getElementById('humidity').innerText = data.hourly.relativehumidity_2m[0];
    document.getElementById('wind').innerText = current.windspeed;

    // 7-Day Forecast Cards
    const container = document.getElementById('forecast-container');
    container.innerHTML = '';
    for (let i = 0; i < 7; i++) {
        const dayCode = data.daily.weathercode[i];
        const dayLookup = weatherLookup[dayCode] || { icon: "☁️" };
        container.innerHTML += `
            <div class="forecast-card card">
                <div style="font-size:0.8em; margin-bottom:5px; color:#666;">Day ${i+1}</div>
                <div style="font-size:1.8em; margin: 10px 0;">${dayLookup.icon}</div>
                <div style="font-weight:bold;">${Math.round(data.daily.temperature_2m_max[i])}°</div>
                <div style="color:#888; font-size:0.85em;">${Math.round(data.daily.temperature_2m_min[i])}°</div>
            </div>
        `;
    }
}

function setLoadingState(isLoading) {
    const elements = document.querySelectorAll('#current-card, .forecast-card');
    elements.forEach(el => isLoading ? el.classList.add('skeleton') : el.classList.remove('skeleton'));
}

function displayError(msg) {
    const banner = document.getElementById('error-banner');
    banner.style.display = 'block';
    document.getElementById('error-text').innerText = msg;
}

function hideError() {
    document.getElementById('error-banner').style.display = 'none';
    document.getElementById('validation-msg').innerText = "";
}

// Initial View Setup
window.onload = () => {
    const container = document.getElementById('forecast-container');
    for(let i=0; i<7; i++) {
        container.innerHTML += '<div class="forecast-card card skeleton" style="height:120px;"></div>';
    }
    setLoadingState(false);
};