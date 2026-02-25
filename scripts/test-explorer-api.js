const http = require('http');

http.get(`http://localhost:3000/api/blockchain-explorer`, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            const parsedData = JSON.parse(rawData);
            console.log(`Success: ${parsedData.success}`);
            console.log(`Current Block: ${parsedData.blockNumber}`);
            console.log(`Chain ID: ${parsedData.chainId}`);
            console.log(`Network Name: ${parsedData.networkName}`);
            console.log(`Stats Count: ${Object.keys(parsedData.stats).length}`);
        } catch (e) {
            console.error(rawData.substring(0, 500));
            console.error(e.message);
        }
    });
}).on('error', (e) => {
    console.error(`Error: ${e.message}`);
});
