const MultiSigFactory = artifacts.require("MultiSigFactory");

module.exports = (deployer) => {
    deployer.deploy(MultiSigFactory);
}