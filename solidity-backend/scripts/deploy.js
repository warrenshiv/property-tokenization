const hre = require("hardhat");

async function main() {
  // Get the contract factory
  const SimpleVoting = await hre.ethers.getContractFactory("SimpleVoting");

  // Deploy the contract
  const simpleVoting = await SimpleVoting.deploy();

  // Wait for the contract to be mined
  await simpleVoting.waitForDeployment();

  // Log the contract address
  console.log("SimpleVoting deployed to:", simpleVoting.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
