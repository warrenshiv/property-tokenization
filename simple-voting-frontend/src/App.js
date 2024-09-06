import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";

// ABI from the Lock contract artifact
const abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_unlockTime",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "when",
        type: "uint256",
      },
    ],
    name: "Withdrawal",
    type: "event",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address payable",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "unlockTime",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// Deployed contract address (replace with the actual deployed contract address)
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [unlockTime, setUnlockTime] = useState(null);
  const [owner, setOwner] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Connect to the wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const _provider = new ethers.BrowserProvider(window.ethereum);
        await _provider.send("eth_requestAccounts", []); // Request account access

        const _signer = _provider.getSigner();
        setProvider(_provider);
        setSigner(_signer);

        // Initialize contract for write operations
        const _contract = new ethers.Contract(contractAddress, abi, _signer);
        setContract(_contract);

        console.log("Connected to wallet");
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    } else {
      alert("Please install MetaMask to use this dApp!");
    }
  };

  // Fetch the unlock time and owner from the contract (read-only)
  const fetchContractData = async () => {
    if (provider) {
      try {
        // Create a read-only contract instance using the provider
        const _contract = new ethers.Contract(contractAddress, abi, provider);

        const _unlockTime = await _contract.unlockTime();
        setUnlockTime(_unlockTime.toString());

        const _owner = await _contract.owner();
        setOwner(_owner);
      } catch (error) {
        console.error("Failed to fetch contract data:", error);
      }
    }
  };

  // Call the `withdraw` function on the contract (write)
  const withdraw = async () => {
    if (contract) {
      try {
        setIsLoading(true); // Set loading state
        const tx = await contract.withdraw();
        await tx.wait(); // Wait for transaction to be confirmed
        console.log("Withdrawal successful");
      } catch (error) {
        console.error("Error during withdrawal:", error);
      } finally {
        setIsLoading(false); // Reset loading state
      }
    }
  };

  // Fetch contract data once provider is set
  useEffect(() => {
    if (provider) {
      fetchContractData();
    }
  }, [provider]);

  return (
    <div className="App">
      <h1>Lock Contract</h1>
      {signer ? (
        <div>
          <p>Unlock Time: {unlockTime}</p>
          <p>Owner: {owner}</p>
          <button onClick={withdraw} disabled={isLoading}>
            {isLoading ? "Withdrawing..." : "Withdraw"}
          </button>
        </div>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
    </div>
  );
}

export default App;
