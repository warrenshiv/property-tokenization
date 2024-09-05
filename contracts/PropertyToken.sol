// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PropertyToken is ERC20, Ownable {

    uint256 public propertyIdCounter;

    // Mapping from property ID to its token
    mapping(uint256 => address) public propertyTokens;

    event PropertyTokenized(uint256 indexed propertyId, string propertyDetails);

    constructor() ERC20("FractionalPropertyToken", "FPT") {}

    // Function to tokenize a property
    function tokenizeProperty(string memory _propertyDetails, uint256 _totalSupply) public onlyOwner {
        uint256 propertyId = propertyIdCounter++;
        _mint(msg.sender, _totalSupply);  // Mint fractional tokens for the property
        propertyTokens[propertyId] = msg.sender;  // Assign property to token creator

        emit PropertyTokenized(propertyId, _propertyDetails);
    }

    // Get the owner of a specific property by ID
    function ownerOfProperty(uint256 _propertyId) public view returns (address) {
        return propertyTokens[_propertyId];
    }

}
