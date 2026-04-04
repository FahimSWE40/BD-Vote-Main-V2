require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    baseSepolia: {
      url: "https://sepolia.base.org",
      chainId: 84532,
      accounts: ["0x0e0a867e2f5cafd41f16135a828c5a7a1692a9a419cd19ec0f1eccd6023914b7"],
    },
  },
};
