const fetch = require('node-fetch');
const fs = require('fs');

async function getWeather(location, days = 3) {
    const apiKey = '32804b24a847407391c53709241010';
    const apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${location}&days=${days}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.error) {
            document.getElementById('weatherData').innerHTML = `<p>Error: ${data.error.message}</p>`;
        } else {
            displayWeather(data);
            displayForecast(data);
            displayClothingRecommendation(data);
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
        document.getElementById('weatherData').innerHTML = `<p>Error fetching data. Please try again later.</p>`;
    }
}

function displayWeather(data) {
    const weatherHtml = `
        <h3>Weather in ${data.location.name}, ${data.location.country}</h3>
        <p>Local Time: ${data.location.localtime}</p>
        <p>Current Temperature: ${data.current.temp_c}°C</p>
        <p>Feels Like: ${data.current.feelslike_c}°C</p>
        <p>Condition: ${data.current.condition.text}</p>
        <img src="https:${data.current.condition.icon}" alt="Weather Icon">
        <p>Wind Speed: ${data.current.wind_kph} kph</p>
        <p>Humidity: ${data.current.humidity}%</p>
        <p>Sunrise: ${data.forecast.forecastday[0].astro.sunrise}</p>
        <p>Sunset: ${data.forecast.forecastday[0].astro.sunset}</p>
    `;
    document.getElementById('weatherData').innerHTML = weatherHtml;
}

function displayForecast(data) {
    const forecastHtml = data.forecast.forecastday.map(day => {
        return `
            <div>
                <h4>${day.date}</h4>
                <p>Max Temp: ${day.day.maxtemp_c}°C</p>
                <p>Min Temp: ${day.day.mintemp_c}°C</p>
                <p>Condition: ${day.day.condition.text}</p>
                <img src="https:${day.day.condition.icon}" alt="Weather Icon">
            </div>
        `;
    }).join('');

    document.getElementById('forecastData').innerHTML = `
        <h3>3-Day Forecast</h3>
        ${forecastHtml}
    `;
}

function displayClothingRecommendation(data) {
    const temperature = data.current.temp_c;
    let clothingRecommendation = '';

    if (temperature < 10) {
        clothingRecommendation = 'Warm winter clothing, such as a heavy coat, scarf, and gloves.';
    } else if (temperature >= 10 && temperature < 20) {
        clothingRecommendation = 'Light jacket or sweater.';
    } else if (temperature >= 20 && temperature < 30) {
        clothingRecommendation = 'Light, breathable clothing.';
    } else {
        clothingRecommendation = 'Light, airy clothing.';
    }

    document.getElementById('clothingRecommendation').innerHTML = `
        <h3>Clothing Recommendation</h3>
        <p>${clothingRecommendation}</p>
    `;
}

document.getElementById('locationForm')?.addEventListener('submit', function (event) {
    event.preventDefault();
    const location = document.getElementById('locationInput')?.value.trim();
    if (location) {
        getWeather(location);
    } else {
        alert('Please enter a location.');
    }
});

let itineraryItems = [];
let editingIndex = null;
let originalIndices = []; // New array to track original indices

loadItineraryFromFile();

document.getElementById('itineraryForm')?.addEventListener('submit', function (event) {
    event.preventDefault();
    const activity = document.getElementById('activityInput')?.value.trim();
    const location = document.getElementById('locationInput')?.value.trim();
    const date = document.getElementById('dateInput')?.value;
    const time = document.getElementById('timeInput')?.value;

    if (editingIndex !== null) {
        // Update the existing item
        itineraryItems[editingIndex] = { location, activity, date, time };
        editingIndex = null; // Reset editing index after updating
    } else {
        // Add new item
        addActivity(location, activity, date, time);
    }
    saveItineraryToFile(); // Save to file
    updateItineraryList(itineraryItems); // Update the displayed list
});

// Function to add new activities
function addActivity(location, activity, date, time) {
    let valid = true; 
    clearErrorMessages();
    if (!location) {
        showError('locationInput', 'Please fill in this section.');
        valid = false;
    }
    if (!activity) {
        showError('activityInput', 'Please fill in this section.');
        valid = false;
    }
    if (!date) {
        showError('dateInput', 'Please fill in this section.');
        valid = false;
    }
    if (!time) {
        showError('timeInput', 'Please fill in this section.');
        valid = false;
    }

    if (valid) {
        // Only add if valid, don't replace the list
        itineraryItems.push({ location, activity, date, time });
        clearInputFields(); // Clear input fields after adding
    }
}

document.getElementById('searchButton').addEventListener('click', function () {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredItems = itineraryItems.filter(item =>
        item.activity.toLowerCase().includes(searchTerm) ||
        item.location.toLowerCase().includes(searchTerm)
    );
    updateItineraryList(filteredItems); // Display the filtered items
});

// Clear button functionality
document.getElementById('clearButton')?.addEventListener('click', function () {
    clearInputFields();
    clearSearchField(); // Clear the search input field
    updateItineraryList([]); // Clear the itinerary list display
    itineraryItems = []; // Optionally clear the itinerary items array
});

function clearInputFields() {
    document.getElementById('activityInput').value = '';
    document.getElementById('locationInput').value = '';
    document.getElementById('dateInput').value = '';
    document.getElementById('timeInput').value = '';
}

// Function to clear the search input field
function clearSearchField() {
    document.getElementById('searchInput').value = ''; // Clear the search input field
}

// Function to update the itinerary list and store original indices
function updateItineraryList(items = []) {
    const itineraryList = document.getElementById('itineraryList');
    itineraryList.innerHTML = ''; 

    // Clear the original indices array
    originalIndices = []; 

    items.forEach((item, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${item.activity} in ${item.location} on ${item.date} at ${item.time}`;

        // Store original index of the item
        originalIndices.push(itineraryItems.indexOf(item)); // Store the original index

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.onclick = () => {
            editActivity(originalIndices[index]); // Use the original index
        };

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => {
            deleteActivity(originalIndices[index]); // Use the original index
        };

        listItem.appendChild(editButton);
        listItem.appendChild(deleteButton);
        itineraryList.appendChild(listItem);
    });
}

function deleteActivity(index) {
    itineraryItems.splice(index, 1);
    saveItineraryToFile(); 
    updateItineraryList(itineraryItems); // Update with the current items
}

function editActivity(index) {
    const item = itineraryItems[index];
    document.getElementById('locationInput').value = item.location;
    document.getElementById('activityInput').value = item.activity;
    document.getElementById('dateInput').value = item.date;
    document.getElementById('timeInput').value = item.time;
    editingIndex = index; // Set the editing index to the selected item
}

function clearErrorMessages() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach((element) => {
        element.remove();
    });
}

function showError(inputId, message) {
    const inputField = document.getElementById(inputId);
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.style.color = 'red';
    errorMessage.textContent = message;
    inputField.parentNode.insertBefore(errorMessage, inputField.nextSibling);
}

function saveItineraryToFile() {
    const itineraryContent = itineraryItems.map(item => {
        return `Activity: ${item.activity}, Location: ${item.location}, Date: ${item.date}, Time: ${item.time}`;
    }).join('\n');

    fs.writeFile('itinerary.txt', itineraryContent, (err) => {
        if (err) {
            console.error('Error writing to file:', err);
        } else {
            console.log('Itinerary saved successfully!');
        }
    });
}

function loadItineraryFromFile() {
    fs.readFile('itinerary.txt', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading from file:', err);
            return;
        }

        const lines = data.split('\n');
        itineraryItems = lines.map(line => {
            const parts = line.split(', ');
            return {
                activity: parts[0].split(': ')[1],
                location: parts[1].split(': ')[1],
                date: parts[2].split(': ')[1],
                time: parts[3].split(': ')[1],
            };
        });
        updateItineraryList(itineraryItems); // Update list with loaded items
    });
}
