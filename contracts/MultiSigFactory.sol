// SPDX-License-Identifier: 6ssou
import "./MultiSig.sol";
pragma solidity ^0.8.0;

contract MultiSigFactory {

    uint multiSigId;
    // mapping of creator by multisig wallet
    mapping(uint => address) public creator;
    // mapping of multisig wallets
    mapping(uint => MultiSig) public multiSigs;
    // mapping of owners of a multisig wallet
    mapping(uint => address[]) public owners;


    function createMultiSigWallet(address[] memory _owners, uint _numConfirmationRequired) public {
        multiSigs[multiSigId] = new MultiSig(_owners, _numConfirmationRequired);
        creator[multiSigId] = address(msg.sender);
        multiSigId++;
    }
    function getDeployedMultiSigCount() public view returns(uint) {
        return multiSigId;
    }
}
