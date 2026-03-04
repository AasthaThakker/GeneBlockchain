const { spawn } = require('child_process');

console.log('🚀 Starting Hardhat node...');

// Start Hardhat node with WebSocket enabled
const hardhat = spawn('npx', ['hardhat', 'node', '--hostname', '127.0.0.1', '--port', '8545'], {
    stdio: 'inherit',
    shell: true
});

hardhat.stdout.on('data', (data) => {
    console.log(`[Hardhat] ${data.toString()}`);
});

hardhat.stderr.on('data', (data) => {
    console.error(`[Hardhat] ${data.toString()}`);
});

hardhat.on('close', (code) => {
    console.log(`[Hardhat] Process exited with code: ${code}`);
});

hardhat.on('error', (error) => {
    console.error(`[Hardhat] Failed to start: ${error.message}`);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Hardhat node...');
    hardhat.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down Hardhat node...');
    hardhat.kill('SIGTERM');
});
