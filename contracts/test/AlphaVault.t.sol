// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/TestUSDC.sol";
import "../src/AlphaVault.sol";

contract AlphaVaultTest is Test {
    TestUSDC usdc;
    AlphaVault vault;
    address deployer = address(this);
    address forwarder = address(0xF0);
    address investor = address(0x1);

    function setUp() public {
        usdc = new TestUSDC();
        vault = new AlphaVault(IERC20(address(usdc)), forwarder);
    }

    // --- TestUSDC ---

    function test_USDCDecimals() public view {
        assertEq(usdc.decimals(), 6);
    }

    function test_USDCFaucet() public {
        vm.prank(investor);
        usdc.faucet(1000e6);
        assertEq(usdc.balanceOf(investor), 1000e6);
    }

    function test_USDCFaucetMaxLimit() public {
        vm.prank(investor);
        vm.expectRevert("Max 1000 USDC per faucet");
        usdc.faucet(1001e6);
    }

    function test_USDCOwnerMint() public {
        usdc.mint(investor, 1_000_000e6);
        assertEq(usdc.balanceOf(investor), 1_000_000e6);
    }

    // --- AlphaVault Deposit/Withdraw ---

    function test_Deposit() public {
        usdc.mint(investor, 10_000e6);
        vm.startPrank(investor);
        usdc.approve(address(vault), 10_000e6);
        uint256 shares = vault.deposit(10_000e6, investor);
        vm.stopPrank();

        assertGt(shares, 0);
        assertEq(vault.balanceOf(investor), shares);
        assertEq(usdc.balanceOf(address(vault)), 10_000e6);
    }

    function test_Withdraw() public {
        usdc.mint(investor, 10_000e6);
        vm.startPrank(investor);
        usdc.approve(address(vault), 10_000e6);
        uint256 shares = vault.deposit(10_000e6, investor);
        vault.redeem(shares, investor, investor);
        vm.stopPrank();

        assertEq(vault.balanceOf(investor), 0);
        assertEq(usdc.balanceOf(investor), 10_000e6);
    }

    // --- totalAssets ---

    function test_TotalAssetsUsesNAVWhenSet() public {
        usdc.mint(investor, 10_000e6);
        vm.startPrank(investor);
        usdc.approve(address(vault), 10_000e6);
        vault.deposit(10_000e6, investor);
        vm.stopPrank();

        // Before NAV update, totalAssets = balance
        assertEq(vault.totalAssets(), 10_000e6);

        // Update NAV via forwarder
        bytes memory report = abi.encode(
            uint8(2), "ETH/USD", uint256(0), uint256(3000e6), uint256(80), uint256(12_000e6)
        );
        vm.prank(forwarder);
        vault.onReport("", report);

        assertEq(vault.totalAssets(), 12_000e6);
    }

    // --- onReport ---

    function test_OnReportRecordsTrade() public {
        bytes memory report = abi.encode(
            uint8(0), "ETH/USD", uint256(5000e6), uint256(3000e6), uint256(85), uint256(10_000e6)
        );

        vm.prank(forwarder);
        vault.onReport("", report);

        assertEq(vault.getTradeCount(), 1);
        assertEq(vault.currentNAV(), 10_000e6);
    }

    function test_OnReportOnlyForwarder() public {
        bytes memory report = abi.encode(
            uint8(0), "ETH/USD", uint256(5000e6), uint256(3000e6), uint256(85), uint256(10_000e6)
        );

        vm.prank(investor);
        vm.expectRevert("AlphaVault: caller is not forwarder");
        vault.onReport("", report);
    }

    function test_OnReportEmitsEvents() public {
        bytes memory report = abi.encode(
            uint8(0), "ETH/USD", uint256(5000e6), uint256(3000e6), uint256(85), uint256(10_000e6)
        );

        vm.expectEmit(true, true, true, true);
        emit AlphaVault.TradeExecuted(0, "ETH/USD", 5000e6, 3000e6, 85);

        vm.expectEmit(true, true, true, true);
        emit AlphaVault.NAVUpdated(0, 10_000e6);

        vm.prank(forwarder);
        vault.onReport("", report);
    }

    // --- getRecentTrades ---

    function test_GetRecentTrades() public {
        vm.startPrank(forwarder);
        for (uint256 i = 0; i < 5; i++) {
            bytes memory report = abi.encode(
                uint8(0), "ETH/USD", uint256(1000e6 * (i + 1)), uint256(3000e6), uint256(80 + i), uint256(10_000e6 + i * 1000e6)
            );
            vault.onReport("", report);
        }
        vm.stopPrank();

        AlphaVault.Trade[] memory recent = vault.getRecentTrades(3);
        assertEq(recent.length, 3);
        assertEq(recent[0].amount, 3000e6);
        assertEq(recent[2].amount, 5000e6);
    }

    function test_GetRecentTradesMoreThanExist() public {
        vm.prank(forwarder);
        vault.onReport("", abi.encode(uint8(0), "ETH/USD", uint256(1000e6), uint256(3000e6), uint256(85), uint256(10_000e6)));

        AlphaVault.Trade[] memory recent = vault.getRecentTrades(10);
        assertEq(recent.length, 1);
    }

    // --- getSharePrice ---

    function test_SharePriceDefaultsTo1e18() public view {
        assertEq(vault.getSharePrice(), 1e18);
    }

    function test_SharePriceAfterDeposit() public {
        usdc.mint(investor, 10_000e6);
        vm.startPrank(investor);
        usdc.approve(address(vault), 10_000e6);
        vault.deposit(10_000e6, investor);
        vm.stopPrank();

        assertEq(vault.getSharePrice(), 1e18);
    }

    // --- setKeystoneForwarder ---

    function test_SetKeystoneForwarder() public {
        address newForwarder = address(0xF1);
        vault.setKeystoneForwarder(newForwarder);
        assertEq(vault.keystoneForwarder(), newForwarder);
    }

    function test_SetKeystoneForwarderOnlyOwner() public {
        vm.prank(investor);
        vm.expectRevert();
        vault.setKeystoneForwarder(address(0xF1));
    }
}
