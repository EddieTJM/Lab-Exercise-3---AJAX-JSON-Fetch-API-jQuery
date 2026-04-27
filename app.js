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