pragma solidity 0.8.13;

import "./Token.sol";

contract Defi {

  //Token initialization
  Token private token;

  //Ethereum balance
  mapping(address => uint) public ethBal;
  //Beginning of interest
  mapping(address => uint) public interestStart;
  mapping(address => uint) public collateralEth;
  //Deposit status
  mapping(address => bool) public isDeposited;
  //Loan status
  mapping(address => bool) public isLoaned;

  event Deposit(address indexed user, uint etherAmount, uint timeStart);
  event Withdraw(address indexed user, uint etherAmount, uint depositTime, uint interest);
  event Borrow(address indexed user, uint collateralEthAmount, uint borrowedTokenAmount);
  event PayOff(address indexed user, uint fee);

  //Deployed token
  constructor(Token _token) public {
    token = _token;
  }

  //Deposit ETH
  function deposit() payable public {
    //One deposit at a time
    require(isDeposited[msg.sender] == false, 'ERROR. A DEPOSIT IS ALREADY ACTIVE');
    //Minimum eth deposit
    //1e16 WEI
    require(msg.value>=1e16, 'ERROR. PLEASE ENTER A MINIMUM OF 0.01ETH');

    //Update eth balance 
    ethBal[msg.sender] = ethBal[msg.sender] + msg.value;
    //Update beginning of interest
    interestStart[msg.sender] = interestStart[msg.sender] + block.timestamp;

    //Return deposit transaction information
    isDeposited[msg.sender] = true;
    emit Deposit(msg.sender, msg.value, block.timestamp);
  }

  function withdraw() public {
    //Can only withdraw if previous deposits exist
    require(isDeposited[msg.sender]==true, 'ERROR. NO DEPOSITS HAVE OCCURRED');
    //Event
    uint userBalance = ethBal[msg.sender];

    //Time since initial deposit
    uint depositTime = block.timestamp - interestStart[msg.sender];

    //5e15(5% of 0.01 ETH) / 31 536 000 (seconds in 1 year)
    uint interestPerSecond = 15854896 * (ethBal[msg.sender] / 1e16);
    uint interest = interestPerSecond * depositTime;

    //Withdraw funds
    payable(msg.sender).transfer(ethBal[msg.sender]);
    //Plus interest
    token.mint(msg.sender, interest);

    //Reset deposit
    interestStart[msg.sender] = 0;
    ethBal[msg.sender] = 0;
    isDeposited[msg.sender] = false;

    emit Withdraw(msg.sender, userBalance, depositTime, interest);
  }

  //function borrow() payable public {}

  //function payOff() public {}
}