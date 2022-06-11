const MultiSigFactory = artifacts.require("MultiSigFactory");

contract("MultisigFactory", (accounts) => {
    const [alice, bob, paul] = accounts;
    let instance;
    beforeEach(async() => {
        instance = await MultiSigFactory.new();
    });
    it("should deploy the multisig factory contract", async() => {
        assert(instance, "Contract has been deployed successfully ");
    });
    it("should create a multiSig instance", async() => {
        await instance.createMultiSigWallet([alice, bob], 2);
    });
    it("should return number of multisigs", async() => {
        await instance.createMultiSigWallet([alice, bob],2, {from:alice});
        assert.equal(await instance.getDeployedMultiSigCount(), 1);
    });
    it("should have the correct creator", async() => {
        await instance.createMultiSigWallet([alice, bob], 2, {from: alice});
        const creator = await instance.creator(0);
        assert.equal(creator, alice);
    });
    it("should return one multiSig", async() => {
        await instance.createMultiSigWallet([alice, bob], 2, {from: alice});
        const multiSig = await instance.multiSigs(0);
        assert(multiSig !== "0x0000000000000000000000000000000000000000");
    })
})