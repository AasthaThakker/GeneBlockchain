require('dotenv').config();

async function checkMFS() {
    try {
        console.log('🧪 Checking IPFS MFS status...');
        const apiUrl = (process.env.IPFS_API_URL || 'http://127.0.0.1:5001').replace(/\/$/, '') + '/api/v0';

        // List files in /
        console.log(`Listing root MFS directory...`);
        const res = await fetch(`${apiUrl}/files/ls?arg=/&long=true`, { method: 'POST' });

        if (res.ok) {
            const data = await res.json();
            console.log('✅ MFS Root contents:', JSON.stringify(data, null, 2));

            // If /gen-share exists, list it
            if (data.Entries && data.Entries.some(e => e.Name === 'gen-share')) {
                console.log(`Listing /gen-share...`);
                const res2 = await fetch(`${apiUrl}/files/ls?arg=/gen-share&long=true`, { method: 'POST' });
                if (res2.ok) {
                    const data2 = await res2.json();
                    console.log('✅ /gen-share contents:', JSON.stringify(data2, null, 2));
                }
            } else {
                console.log('ℹ️ /gen-share directory not found in MFS root.');
            }
        } else {
            const err = await res.text();
            console.log('❌ Failed to list MFS root:', err);
        }

    } catch (error) {
        console.error('❌ MFS check failed:', error.message);
    }
}

checkMFS();
