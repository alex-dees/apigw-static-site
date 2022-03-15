setInterval(() => {
    const now = new Date();
    document.getElementById('moment').innerHTML = 
        `${now.toDateString()} ${now.toLocaleTimeString()}`;
}, 1000)