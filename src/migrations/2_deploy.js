const Token = artifacts.require("Token");
const Defi  = artifacts.require("Defi");

module.exports = async function (deployer) {
  await deployer.deploy(Token);
};
