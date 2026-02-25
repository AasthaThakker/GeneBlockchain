async function testListFiles() {
    try {
        console.log('🧪 Testing /api/ipfs/files API...');

        // Test with LAB-001
        const labId = 'LAB-001';
        const response = await fetch(`http://localhost:3000/api/ipfs/files?labId=${labId}`);

        console.log('📋 Response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Success! Found files:', data.data.length);
            if (data.data.length > 0) {
                console.log('🔍 First file sample:', JSON.stringify(data.data[0], null, 2));
            }
        } else {
            const error = await response.text();
            console.log('❌ Failed:', error);
        }
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testListFiles();
