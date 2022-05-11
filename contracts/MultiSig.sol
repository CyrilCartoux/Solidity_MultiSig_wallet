// SPDX-License-Identifier: 6ssou 
// 02/05/2022  0xBbfaa2fb032296a1619a56f5440bd89770456697
pragma solidity ^0.8.0;

contract MultiSig {

    event Deposit(address indexed sender, uint amount, uint balance);
    event SubmitTransaction(
        address indexed owner,
        uint indexed txIndex,
        address indexed to,
        uint value,
        bytes data
    );
    event ConfirmTransaction(address indexed owner, uint indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint indexed txIndex);

     struct Transaction {
        address to;
        uint value;
        uint numConfirmations;
        bytes data;
        bool executed;
    }

    address[] public owners;
    Transaction[] public transactions;
    mapping(address => bool) public isOwner;
    // txIndex => address => bool 
    mapping(uint => mapping(address => bool)) public isConfirmed;
    uint public numConfirmationsRequired;

    modifier onlyOwner() {
        require(isOwner[msg.sender]);
        _;
    }
    modifier notConfirmed(uint _txIndex) {
        require(!isConfirmed[_txIndex][msg.sender], "Transaction already confirmed");
        _;
    }
    modifier txExists(uint _txIndex) {
        require(_txIndex < transactions.length, "Transaction doesn't exists");
        _;
    }
    modifier notExecuted(uint _txIndex) {
        require(!transactions[_txIndex].executed, "Already executed");
        _;
    }

    constructor(address[] memory _owners, uint _numConfirmationsRequired) {
       require(_owners.length > 0, "owners required");
        require(
            _numConfirmationsRequired > 0 &&
                _numConfirmationsRequired <= _owners.length,
            "invalid number of required confirmations"
        );
        uint ownerLength = _owners.length;
        for (uint i = 0; i < ownerLength; i++) {
            address owner = _owners[i];

            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        numConfirmationsRequired = _numConfirmationsRequired;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function submitTransaction(
        address _to,
        uint _value,
        bytes memory _data
    ) public onlyOwner {
        uint index = transactions.length;
        transactions.push(Transaction(_to, _value, 0, _data, false));
        emit SubmitTransaction(msg.sender, index, _to, _value, _data);
    }

    function confirmTransaction(uint _txIndex) 
        public 
        onlyOwner
        notConfirmed(_txIndex)  
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];
        transaction.numConfirmations++;
        isConfirmed[_txIndex][msg.sender] = true;
        emit ConfirmTransaction(msg.sender, _txIndex);
    }

    function executeTransaction(uint _txIndex) 
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];
        require(transaction.numConfirmations >= numConfirmationsRequired, "Not enough confirmations");

        transaction.executed = true;
        (bool sent, ) = transaction.to.call{value: transaction.value}('');
        require(sent, "Something went wrong executing transaction");
        emit ExecuteTransaction(msg.sender,_txIndex);
    }

    function revokeConfirmation(uint _txIndex)
        public
        onlyOwner
        txExists(_txIndex)    
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];
        transaction.numConfirmations--;
        isConfirmed[_txIndex][msg.sender] = false;
        emit RevokeConfirmation(msg.sender, _txIndex);
    }

    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() public view returns (uint) {
        return transactions.length;
    }

    function getTransaction(uint _txIndex)
        public
        view
        returns (
            address to,
            uint value,
            bytes memory data,
            bool executed,
            uint numConfirmations
        )
    {
        Transaction storage transaction = transactions[_txIndex];
        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations
        );
    }
}