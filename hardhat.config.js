require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        localhost: {
            url: "http://127.0.0.1:8545",
        },
        ganache: {
            url: process.env.GANACHE_URL,
            accounts: [process.env.PRIVATE_KEY],
        },
    },
    paths: {
        sources: "./contracts",
        artifacts: "./artifacts",
        cache: "./cache",
    },
    gasReporter: {
        enabled: true,
        currency: "USD",
        gasPrice: 20,
        showTimeSpent: true,
        showMethodSig: true,
    },
};
