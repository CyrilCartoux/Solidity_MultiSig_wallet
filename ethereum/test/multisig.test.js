const MultiSig = artifacts.require("MultiSig");
const assert = require("assert");
const truffleAssert = require('truffle-assertions');

contract("MulsiSig", (accounts) => {
    const [alice, bob, paul] = accounts;
    let instance;
    beforeEach(async () => {
        instance = await MultiSig.new([alice, bob], 2);
    });
    it("should deploy the contract", async () => {
        assert(instance, "Contract has been deployed successfully");
    });
    it("number of confirmations required should be 2", async () => {
        assert.equal(await instance.numConfirmationsRequired(), 2);
    });
    it("should be able to receive ether", async () => {
        const initalBalance = await web3.eth.getBalance(instance.address);
        await instance.sendTransaction({
            from: alice,
            value: web3.utils.toWei("1", "ether")
        });
        const newBalance = await web3.eth.getBalance(instance.address);
        const difference = newBalance - initalBalance;
        assert(difference >= web3.utils.toWei("1", "ether"))
    });
    it("should be able to submit a transaction", async () => {
        await instance.submitTransaction(paul, web3.utils.toWei("0.5", "ether"), '0x6162636400000000000000000000000000000000000000000000000000000000', {
            from: alice
        });
        assert.equal(await instance.getTransactionCount(), 1);
    });
    it("should be able to confirm a transaction", async () => {
        await instance.submitTransaction(paul, web3.utils.toWei("0.5", "ether"), '0x6162636400000000000000000000000000000000000000000000000000000000', {
            from: alice
        });
        await instance.confirmTransaction(0, {
            from: alice
        });
        assert(await instance.isConfirmed(0, alice));
    });
    it("should be able to revoke a confirmation", async () => {
        await instance.submitTransaction(paul, web3.utils.toWei("0.5", "ether"), '0x6162636400000000000000000000000000000000000000000000000000000000', {
            from: alice
        });
        await instance.confirmTransaction(0, {
            from: alice
        });
        await instance.revokeConfirmation(0);
        assert.equal(await instance.isConfirmed(0, alice), false);
    });
    it("should be able to execute a transaction", async () => {
        const initialPaulBalance = await web3.eth.getBalance(paul);
        await instance.sendTransaction({
            from: alice,
            value: web3.utils.toWei("1", "ether")
        });
        await instance.submitTransaction(paul, web3.utils.toWei("0.5", "ether"), '0x6162636400000000000000000000000000000000000000000000000000000000', {
            from: alice
        });
        await instance.confirmTransaction(0, {
            from: alice
        });
        await instance.confirmTransaction(0, {
            from: bob
        });
        await instance.executeTransaction(0, {
            from: alice
        });
        const finalPaulBalance = await web3.eth.getBalance(paul);
        const difference = finalPaulBalance - initialPaulBalance;
        assert.equal(difference, web3.utils.toWei("0.5", "ether"));
    });
    it("should return the owners", async () => {
        const owners = await instance.getOwners();
        assert.equal(owners.length, 2);
        assert.equal(owners[0], alice);
        assert.equal(owners[1], bob);
    });

    // ACCESS CONTROL
    it("only owner should be able to submit a transaction", async () => {
        try {
            await instance.submitTransaction(paul, web3.utils.toWei("0.5", "ether"), '0x6162636400000000000000000000000000000000000000000000000000000000', {
                from: paul
            })
            assert(false);
        } catch (error) {
            assert(error);
        }
    });
    it("only owner can execute a transaction", async () => {
        await instance.submitTransaction(paul, web3.utils.toWei("0.5", "ether"), '0x6162636400000000000000000000000000000000000000000000000000000000', {
            from: alice
        });
        try {
            await instance.confirmTransaction(0, {
                from: paul
            })
            assert(false)
        } catch (error) {
            assert(error)
        }
    });
    it("only owner can execute a transaction", async () => {
        await instance.submitTransaction(paul, web3.utils.toWei("0.5", "ether"), '0x6162636400000000000000000000000000000000000000000000000000000000', {
            from: alice
        });
        await instance.confirmTransaction(0, {
            from: alice
        });
        await instance.confirmTransaction(0, {
            from: bob
        });
        try {
            await instance.executeTransaction(0, {
                from: paul
            });
            assert(false)
        } catch (error) {
            assert(error)
        }
    });
    it("only owner can revoke a transaction", async () => {
        await instance.submitTransaction(paul, web3.utils.toWei("0.5", "ether"), '0x6162636400000000000000000000000000000000000000000000000000000000', {
            from: alice
        });
        await instance.confirmTransaction(0, {
            from: alice
        });
        await instance.confirmTransaction(0, {
            from: bob
        });
        try {
            await instance.revokeConfirmation(0, {
                from: paul
            });
            assert(false)
        } catch (error) {
            assert(error)
        }
    })

    // CONFIRMING TRANSACTIONS
    it("cannot confirm a transaction that does not exists", async () => {
        await instance.submitTransaction(paul, web3.utils.toWei("0.5", "ether"), '0x6162636400000000000000000000000000000000000000000000000000000000', {
            from: alice
        });
        try {
            await instance.confirmTransaction(1, {
                from: alice
            });
            assert(false)
        } catch (error) {
            assert(error)
        }
    });
    it("cannot confirm a transaction that is already confirmed", async () => {
        await instance.submitTransaction(paul, web3.utils.toWei("0.5", "ether"), '0x6162636400000000000000000000000000000000000000000000000000000000', {
            from: alice
        });
        await instance.confirmTransaction(0, {
            from: alice
        });
        await instance.confirmTransaction(0, {
            from: bob
        });
        try {
            await instance.confirmTransaction(0, {
                from: alice
            });
            assert(false)
        } catch (error) {
            assert(error)
        }
    });
    it("cannot confirm a transaction that is already executed", async () => {
        await instance.sendTransaction({
            from: alice,
            value: web3.utils.toWei("1", "ether")
        });
        await instance.submitTransaction(paul, web3.utils.toWei("0.5", "ether"), '0x6162636400000000000000000000000000000000000000000000000000000000', {
            from: alice
        });
        await instance.confirmTransaction(0, {
            from: alice
        });
        await instance.confirmTransaction(0, {
            from: bob
        });
        await instance.executeTransaction(0, {
            from: alice
        });
        try {
            await instance.confirmTransaction(0, {
                from: alice
            });
            assert(false)
        } catch (error) {
            assert(error)
        }
    });
    // EXECUTING TRANSACTIONS
    it("cannot execute a transaction that does not exists", async () => {
        try {
            await instance.executeTransaction(0, {
                from: alice
            });
            assert(false)
        } catch (error) {
            assert(error)
        }
    });
    it("cannot execute a transaction that is already executed", async () => {
        await instance.sendTransaction({
            from: alice,
            value: web3.utils.toWei("1", "ether")
        });
        await instance.submitTransaction(paul, web3.utils.toWei("0.5", "ether"), '0x6162636400000000000000000000000000000000000000000000000000000000', {
            from: alice
        });
        await instance.confirmTransaction(0, {
            from: alice
        });
        await instance.confirmTransaction(0, {
            from: bob
        });
        await instance.executeTransaction(0, {
            from: alice
        });
        try {
            await instance.executeTransaction(0, {
                from: alice
            });
            assert(false)
        } catch (error) {
            assert(error)
        }
    });
    // REVOKING TRANSACTIONS
    it("cannot revoke transaction that does not exists", async () => {
        try {
            await instance.revokeConfirmation(0, {
                from: alice
            });
            assert(false)
        } catch (error) {
            assert(error)
        }
    });
    it("cannot revoke transaction that is already executed", async () => {
        await instance.sendTransaction({
            from: alice,
            value: web3.utils.toWei("1", "ether")
        });
        await instance.submitTransaction(paul, web3.utils.toWei("0.5", "ether"), '0x6162636400000000000000000000000000000000000000000000000000000000', {
            from: alice
        });
        await instance.confirmTransaction(0, {
            from: alice
        });
        await instance.confirmTransaction(0, {
            from: bob
        });
        await instance.executeTransaction(0, {
            from: alice
        });
        try {
            await instance.revokeConfirmation(0, {
                from: alice
            });
            assert(false)
        } catch (error) {
            assert(error)
        }
    });

    // EVENTS
    it("should emit an event when submit transaction", async () => {
        await instance.sendTransaction({
            from: alice,
            value: web3.utils.toWei("1", "ether")
        });
        const txSubmit = await instance.submitTransaction(paul, web3.utils.toWei("0.5", "ether"), '0x6162636400000000000000000000000000000000000000000000000000000000', {
            from: alice
        });
        truffleAssert.eventEmitted(txSubmit, 'SubmitTransaction', (event) => {
            return (event.to === paul);
        })
        const txConfirm = await instance.confirmTransaction(0, {
            from: alice
        });
        truffleAssert.eventEmitted(txConfirm, "ConfirmTransaction", (event) => {
            return (event.owner === alice)
        })
        await instance.confirmTransaction(0, {
            from: bob
        });
        const txExecute = await instance.executeTransaction(0, {
            from: alice
        });
        truffleAssert.eventEmitted(txExecute, "ExecuteTransaction", (event) => {
            return (event.owner === alice)
        })
    })
    it("should emit an event when revoke confirmation", async () => {
        await instance.sendTransaction({
            from: alice,
            value: web3.utils.toWei("1", "ether")
        });
        await instance.submitTransaction(paul, web3.utils.toWei("0.5", "ether"), '0x6162636400000000000000000000000000000000000000000000000000000000', {
            from: alice
        });
        await instance.confirmTransaction(0, {
            from: alice
        });
        const tx = await instance.revokeConfirmation(0);
        truffleAssert.eventEmitted(tx, "RevokeConfirmation", (event) => {
            return (event.owner === alice)
        })
    })

})