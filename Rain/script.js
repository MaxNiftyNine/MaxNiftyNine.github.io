window.addEventListener('load', () => {
    const locationElement = document.getElementById('location');
    const timeElement = document.getElementById('time');
  
    // Get user's location
    fetch('https://ipapi.co/json/')
      .then(response => response.json())
      .then(data => {
        const location = `${data.city}, ${data.region}, ${data.country_name}`;
        locationElement.textContent = `Your location: ${location}`;
  
        // Call function to get rain end time
        getRainEndTime(data.latitude, data.longitude)
          .then(time => {
            timeElement.textContent = `Rain is expected to end in ${time} minutes`;
          })
          .catch(error => {
            console.error('Error:', error);
            timeElement.textContent = 'Unable to retrieve rain end time.';
          });
      })
      .catch(error => {
        console.error('Error:', error);
        locationElement.textContent = 'Unable to retrieve your location.';
      });
  
      function getRainEndTime(latitude, longitude) {
        const apiKey = 'ff452e71fb79a4a611a9dc79a3e58f49';
        const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&exclude=current,daily,alerts&appid=${apiKey}`;
      
        return fetch(url)
          .then(response => response.json())
          .then(data => {
            // Find the first instance where the rain stops (precipitation intensity is 0)
            const rainEnd = data.minutely.find(item => {
              return item.precipitation === 0;
            });
      
            if (rainEnd) {
              // Calculate the time difference in minutes between now and the rain end time
              const currentTime = new Date();
              const endTime = new Date(rainEnd.dt * 1000);
              const timeDifference = (endTime - currentTime) / (1000 * 60);
      
              return Math.round(timeDifference);
            } else {
              throw new Error('Unable to determine the rain end time.');
            }
          });
      }
      
  });
  