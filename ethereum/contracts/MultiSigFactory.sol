// SPDX-License-Identifier: 6ssou
import "./MultiSig.sol";
// 0xD47Bc32A186Db5Bb09E3312CA32DCf27F1ce3b6A - 12/06/2022
pragma solidity ^0.8.0;

contract MultiSigFactory {

    event MultiSigCreated(address[] owners, address creator);

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
        emit MultiSigCreated(_owners, creator[multiSigId]);
        multiSigId++;
    }
    function getDeployedMultiSigCount() public view returns(uint) {
        return multiSigId;
    }
}
