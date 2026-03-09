// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AlphaVault is ERC4626, Ownable {
    struct Trade {
        uint8 action; // 0=BUY, 1=SELL, 2=HOLD
        string tokenPair;
        uint256 amount;
        uint256 price;
        uint256 confidence;
        uint256 timestamp;
    }

    uint256 public currentNAV;
    uint256 public lastNAVUpdate;
    address public keystoneForwarder;
    Trade[] public trades;

    event TradeExecuted(
        uint8 action,
        string tokenPair,
        uint256 amount,
        uint256 price,
        uint256 confidence
    );
    event NAVUpdated(uint256 oldNAV, uint256 newNAV);

    modifier onlyForwarder() {
        require(
            msg.sender == keystoneForwarder,
            "AlphaVault: caller is not forwarder"
        );
        _;
    }

    constructor(
        IERC20 _asset,
        address _keystoneForwarder
    )
        ERC4626(_asset)
        ERC20("Alpha Street Shares", "ALPHA")
        Ownable(msg.sender)
    {
        keystoneForwarder = _keystoneForwarder;
    }

    function setKeystoneForwarder(address _forwarder) external onlyOwner {
        keystoneForwarder = _forwarder;
    }

    function totalAssets() public view override returns (uint256) {
        if (currentNAV > 0) {
            return currentNAV;
        }
        return IERC20(asset()).balanceOf(address(this));
    }

    function onReport(bytes calldata, bytes calldata report) external onlyForwarder {
        (
            uint8 action,
            string memory tokenPair,
            uint256 amount,
            uint256 price,
            uint256 confidence,
            uint256 newNAV
        ) = abi.decode(report, (uint8, string, uint256, uint256, uint256, uint256));

        _recordTrade(action, tokenPair, amount, price, confidence);
        _updateNAV(newNAV);
    }

    function _recordTrade(
        uint8 action,
        string memory tokenPair,
        uint256 amount,
        uint256 price,
        uint256 confidence
    ) internal {
        trades.push(
            Trade({
                action: action,
                tokenPair: tokenPair,
                amount: amount,
                price: price,
                confidence: confidence,
                timestamp: block.timestamp
            })
        );
        emit TradeExecuted(action, tokenPair, amount, price, confidence);
    }

    function _updateNAV(uint256 newNAV) internal {
        uint256 oldNAV = currentNAV;
        currentNAV = newNAV;
        lastNAVUpdate = block.timestamp;
        emit NAVUpdated(oldNAV, newNAV);
    }

    function getTradeCount() external view returns (uint256) {
        return trades.length;
    }

    function getRecentTrades(
        uint256 count
    ) external view returns (Trade[] memory) {
        uint256 len = trades.length;
        if (count > len) count = len;
        Trade[] memory recent = new Trade[](count);
        for (uint256 i = 0; i < count; i++) {
            recent[i] = trades[len - count + i];
        }
        return recent;
    }

    function getSharePrice() external view returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0) return 1e18;
        return (totalAssets() * 1e18) / supply;
    }
}
