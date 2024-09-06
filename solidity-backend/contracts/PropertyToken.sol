// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "hardhat/console.sol";

contract PropertyNFT is ERC721 {
    uint256 public _maxSupply = 100;
    uint256 public _unitPrice;
    address public _deadAddr = 0x000000000000000000000000000000000000dEaD;
    address public _devAddr = 0x830a582E30073E1EFed0a1FFEAb9390b5D6C2BE3;
    string public tokenImageUrl;
    address public deployer_;
    mapping(address => bool) public isRented;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 unitPrice_,
        string memory tokenImageUrl_,
        address deployer,
        address tokenOwner
    ) ERC721(name_, symbol_) {
        _unitPrice = unitPrice_; // original price / _maxSupply
        tokenImageUrl = tokenImageUrl_;
        deployer_ = deployer;

        for (uint256 i = 0; i < _maxSupply; i++) {
            _mint(tokenOwner, i);
        }
        isRented[address(this)] = false;
    }

    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory data) internal override {
        super._safeTransfer(from, to, tokenId, data);
        PropertyDeployer(deployer_).tokenTransfer(from, to, tokenId);
    }

    function toggleRent(bool setRented) public returns (bool) {
        require(msg.sender == _devAddr, "Only dev can rent this asset");
        isRented[address(this)] = setRented;
        PropertyDeployer(deployer_).isPropertyRented(setRented);
        return true;
    }

    function tokenURI(uint256) public view override returns (string memory) {
        return tokenImageUrl;
    }

    function selfDestruct() public {
        for (uint256 i = 0; i < _maxSupply; i++) {
            uint256 tokenId = i;
            require(ownerOf(tokenId) == msg.sender, "You must own all tokens to perform this action");
            ERC721(address(this)).safeTransferFrom(ownerOf(tokenId), _deadAddr, tokenId);
        }
        PropertyDeployer(deployer_).tokenDestroyed();
    }

    function distributeRent() public payable {
        uint256 rentToSend = msg.value / _maxSupply;
        for (uint256 i = 0; i < _maxSupply; i++) {
            uint256 tokenId = i;
            (bool success, ) = payable(ownerOf(tokenId)).call{value: rentToSend}("");
            require(success, "Failed to send ETH");
        }
        PropertyDeployer(deployer_).tokenRentPaid(rentToSend);
    }

    struct Auction {
        address seller;
        address highestBidder;
        uint256 highestBid;
        uint256 endTime;
        bool ended;
    }

    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => bool) public instantBuyEnabled;

    function createAuction(uint256 tokenId, uint256 duration) external {
        require(ownerOf(tokenId) == msg.sender, "You must own this token to perform this action");
        require(!instantBuyEnabled[tokenId], "You cannot create auction when instant buy is enabled");

        uint256 endTime = block.timestamp + duration;
        auctions[tokenId] = Auction({
            seller: msg.sender,
            highestBidder: msg.sender,
            highestBid: _unitPrice,
            endTime: endTime,
            ended: false
        });
        PropertyDeployer(deployer_).auctionCreated(tokenId, msg.sender, duration);
    }

    function placeBid(uint256 tokenId) external payable {
        Auction storage auction = auctions[tokenId];
        require(!auction.ended, "Auction has ended");
        require(msg.sender != auction.seller, "Seller cannot place bid");
        require(block.timestamp < auction.endTime, "Auction has expired");
        require(msg.value > auction.highestBid, "Bid must be higher than current highest bid");

        if (auction.highestBidder != auction.seller) {
            (bool success, ) = auction.highestBidder.call{value: auction.highestBid}("");
            require(success, "Failed to return funds to previous highest bidder");
        }

        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;

        PropertyDeployer(deployer_).bidPlaced(tokenId, msg.sender, msg.value);
    }

    function finalizeAuction(uint256 tokenId) external {
        Auction storage auction = auctions[tokenId];
        require(!auction.ended, "Auction already finalized");
        require(block.timestamp >= auction.endTime, "Auction has not ended yet");

        auction.ended = true;
        if (auction.highestBidder != auction.seller) {
            (bool success, ) = auction.seller.call{value: auction.highestBid}("");
            require(success, "Failed to transfer funds to seller");
            ERC721(address(this)).safeTransferFrom(ownerOf(tokenId), auction.highestBidder, tokenId);
        }
        PropertyDeployer(deployer_).auctionFinalized(tokenId, auction.seller, auction.highestBidder, auction.highestBid);
        delete auctions[tokenId];
    }

    function enableInstantBuy(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "You must own this token to perform this action");
        require(auctions[tokenId].seller == address(0), "Auction already in progress");
        instantBuyEnabled[tokenId] = true;
    }

    function instantBuy(uint256 tokenId) external payable {
        require(instantBuyEnabled[tokenId], "Instant buy is not enabled for this token");
        require(msg.value >= _unitPrice, "Insufficient payment amount");

        ERC721(address(this)).safeTransferFrom(ownerOf(tokenId), msg.sender, tokenId);
        instantBuyEnabled[tokenId] = false;
        PropertyDeployer(deployer_).instantBuy(tokenId, msg.sender, msg.value);
    }
}
