const Token = artifacts.require("Token");
const Defi  = artifacts.require("Defi");

module.exports = async function (deployer) {
  //Deploy token
  await deployer.deploy(Token);

  //Token initialization
  const token = await Token.deployed();

  //Minting
  await deployer.deploy(Defi, token.address);

  //Defi initialization
  const defi = await Defi.deployed();

  //Defi becomes minter
  await token.passMinterRole(Defi.address);
};
