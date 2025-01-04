import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import 'dotenv/config'

const app = express();

const API_KEY = process.env.API_KEY; 
const PORT = 3000;


let alert = "NO DATA";
let TEMPERATURE = 0;
let RAINFALL = 0;
let HUMIDITY = 0;
let WIND_SPEED = 0;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.render("body.ejs");
});

app.post("/information", async (req, res) => {
    const City_Name = req.body["city-name"] // req.body["city-name"];
    console.log(City_Name);

    try {
        // Make the axios request
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${City_Name}&appid=${API_KEY}&units=metric`);
        const data = response.data;
        console.log('Weather Data:', data);

        
        TEMPERATURE = data.main?.temp || 0; 
        RAINFALL = (data.rain && data.rain['1h']) || 0; 
        HUMIDITY = data.main?.humidity || 0; 
        WIND_SPEED = data.wind?.speed || 0; 

        console.log(`Temperature: ${TEMPERATURE}°C`);
        console.log(`Rainfall: ${RAINFALL}mm`);
        console.log(`Humidity: ${HUMIDITY}%`);
        console.log(`Wind Speed: ${WIND_SPEED} m/s`);

        // Flash flood logic
        const isHeavyRain = RAINFALL > 50; // 50mm/hour
        const isThunderstorm = data.weather?.[0]?.description.toLowerCase().includes('thunderstorm');
        const isHeavyWeather = data.weather?.[0]?.description.toLowerCase().includes('heavy rain');

        if (isHeavyRain || isThunderstorm || isHeavyWeather) {
            console.log(`⚠️ Flash flood alert for ${City_Name}!`);
            console.log(`Rainfall in the last hour: ${RAINFALL}mm`);
            console.log(`Weather: ${data.weather?.[0]?.description || 'No description'}`);
            alert = "⚠️ Flash flood alert for your area!";
        } else {
            console.log(`✅ No flash flood risk detected for ${City_Name}.`);
            alert = "✅ No flash flood risk detected for your area!";
        }

        // Render results after processing the weather data
        res.render("results.ejs", {
            alert: alert,
            temp: TEMPERATURE,
            rain: RAINFALL,
            wind: WIND_SPEED,
            humid: HUMIDITY,
        });

    } catch (error) {
        console.error('Error fetching weather data:', error.message);
        res.status(500).json({ error: 'Error fetching weather data' });
    }
});

app.post("/location", async (req, res) => {
  const { latitude, longitude } = req.body;  // Get lat and lon from the form submission

  try {
    // Make the axios request
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`);
    const data = response.data;
    console.log('Weather Data:', data);

    // Extract relevant data into variables
    TEMPERATURE = data.main?.temp || 0; // Temperature in Celsius
    RAINFALL = (data.rain && data.rain['1h']) || 0; // Rainfall in mm (last hour)
    HUMIDITY = data.main?.humidity || 0; // Humidity in percentage
    WIND_SPEED = data.wind?.speed || 0; // Wind speed in m/s

    // Flash flood logic
    const isHeavyRain = RAINFALL > 50; // 50mm/hour
    const isThunderstorm = data.weather?.[0]?.description.toLowerCase().includes('thunderstorm');
    const isHeavyWeather = data.weather?.[0]?.description.toLowerCase().includes('heavy rain');

    if (isHeavyRain || isThunderstorm || isHeavyWeather) {
      alert = "⚠️ Flash flood alert for your area!";
    } else {
      alert = "✅ No flash flood risk detected for your area!";
    }

    // Render results after processing the weather data
    res.render("results.ejs", {
      alert: alert,
      temp: TEMPERATURE,
      rain: RAINFALL,
      wind: WIND_SPEED,
      humid: HUMIDITY,
    });

  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    res.status(500).json({ error: 'Error fetching weather data' });
  }
});



app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});
