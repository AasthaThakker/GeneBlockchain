const http = require('http');

const pid = 'PID-8ce919';
http.get(`http://localhost:3000/api/consents?pid=${pid}`, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            const parsedData = JSON.parse(rawData);
            console.log(`Total Consents: ${parsedData.data.length}`);
            parsedData.data.forEach((c, i) => {
                console.log(`[${i}] ID: ${c.consentId} | Status: ${c.status} | PID: ${c.pid}`);
            });
        } catch (e) {
            console.error(rawData);
            console.error(e.message);
        }
    });
}).on('error', (e) => {
    console.error(`Error: ${e.message}`);
});
