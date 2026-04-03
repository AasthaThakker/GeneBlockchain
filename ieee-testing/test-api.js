const testAPI = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/mongodb-explorer');
    const data = await response.json();
    
    console.log('API Response Status:', response.status);
    console.log('Success:', data.success);
    console.log('Block Number:', data.blockNumber);
    console.log('Total Records:', data.stats?.totalRecords);
    console.log('Total Consents:', data.stats?.totalConsents);
    console.log('Blocks Count:', data.blocks?.length);
    console.log('Records Count:', data.records?.length);
    console.log('Events Count:', data.events?.length);
    
    // Show sample data
    if (data.records && data.records.length > 0) {
      console.log('\nSample Record:');
      console.log('PID:', data.records[0].pid);
      console.log('Function:', data.records[0].functionName);
      console.log('Gas Used:', data.records[0].gasUsed);
    }
    
    if (data.events && data.events.length > 0) {
      console.log('\nSample Event:');
      console.log('Event Name:', data.events[0].name);
      console.log('Block Number:', data.events[0].blockNumber);
    }
    
  } catch (error) {
    console.error('API Test Error:', error);
  }
};

testAPI();
