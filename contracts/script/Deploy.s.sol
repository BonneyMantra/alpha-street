// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/TestUSDC.sol";
import "../src/AlphaVault.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Use deployer as temporary forwarder (will be updated after CRE registration)
        address keystoneForwarder = deployer;

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy TestUSDC
        TestUSDC usdc = new TestUSDC();

        // 2. Mint 1,000,000 USDC to deployer
        usdc.mint(deployer, 1_000_000 * 10 ** 6);

        // 3. Deploy AlphaVault
        AlphaVault vault = new AlphaVault(IERC20(address(usdc)), keystoneForwarder);

        vm.stopBroadcast();

        // Log addresses
        console.log("TestUSDC deployed at:", address(usdc));
        console.log("AlphaVault deployed at:", address(vault));
        console.log("Deployer:", deployer);
        console.log("Deployer USDC balance:", usdc.balanceOf(deployer));
    }
}
