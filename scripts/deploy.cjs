const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const BDVote = await hre.ethers.getContractFactory("BDVote");
  console.log("Deploying BDVote...");
  const bdVote = await BDVote.deploy();
  await bdVote.waitForDeployment();

  const address = await bdVote.getAddress();
  console.log("BDVote deployed to:", address);

  // Update .env with the contract address
  const envPath = path.join(__dirname, "..", ".env");
  let envContent = fs.readFileSync(envPath, "utf8");

  if (envContent.includes("VITE_BD_VOTE_CONTRACT_ADDRESS=")) {
    envContent = envContent.replace(
      /VITE_BD_VOTE_CONTRACT_ADDRESS=.*/,
      `VITE_BD_VOTE_CONTRACT_ADDRESS=${address}`
    );
  } else if (envContent.includes("#VITE_BD_VOTE_CONTRACT_ADDRESS=")) {
    envContent = envContent.replace(
      /#VITE_BD_VOTE_CONTRACT_ADDRESS=.*/,
      `VITE_BD_VOTE_CONTRACT_ADDRESS=${address}`
    );
  } else {
    envContent += `\nVITE_BD_VOTE_CONTRACT_ADDRESS=${address}\n`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log(".env updated with contract address:", address);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
