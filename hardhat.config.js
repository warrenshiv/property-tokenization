require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    // Configuration for Hardhat's built-in local network
    hardhat: {
      localhost: {
        url: "http://localhost:8545",
      },
    },

    // Configuration for Ethereum mainnet using Alchemy
    mainnet: {
      url: process.env.ALCHEMY_API_URL, // Load Alchemy Mainnet URL from .env file
      accounts: [`0x${process.env.PRIVATE_KEY}`], // Load private key from .env file
      gasPrice: 50000000000, // Optional: Set a specific gas price (50 Gwei), adjust if needed
    },
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY, // Load Etherscan API key from .env file
  },
};
