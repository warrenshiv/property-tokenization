const hre = require("hardhat");

async function main() {
    // Get the contract factory
    const PropertyToken = await hre.ethers.getContractFactory("PropertyToken");

    // Deploy the contract
    const propertyToken = await PropertyToken.deploy();

    await propertyToken.deployed();

    console.log("PropertyToken deployed to:", propertyToken.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
