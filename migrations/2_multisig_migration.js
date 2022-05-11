const MultiSig = artifacts.require("MultiSig");

module.exports = async (deployer) => {
    const [alice, bob, paul] = await web3.eth.getAccounts();
    deployer.deploy(MultiSig, [alice, bob], 2);
}