pragma solidity 0.8.13;

import "./Token.sol";

contract Defi {

  //Token initialization
  Token private token;

  //Ethereum balance
  mapping(address => uint) public ethBal;
  //Beginning of interest
  mapping(address => uint) public interestStart;
  //Collateral for loan
  mapping(address => uint) public collateralEth;
  //Deposit status
  mapping(address => bool) public isDeposited;
  //Loan status
  mapping(address => bool) public isLoaned;

  event Deposit(address indexed user, uint ethAmount, uint timeStart);
  event Withdraw(address indexed user, uint ethAmount, uint depositTime, uint interest);
  event Loan(address indexed user, uint collateralEthAmount, uint loanedAmount);
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

  //Withdraw ETH
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

    //Return withdraw transaction information
    emit Withdraw(msg.sender, userBalance, depositTime, interest);
  }

  //Loan ETH
  function loan() payable public {
    //One loan at a time
    require(isLoaned[msg.sender] == false, 'ERROR. A LOAN IS ALREADY ACTIVE');
    //Minimum collateral
    //1e16 WEI
    require(msg.value>=1e16, 'ERROR. PLEASE ENTER A MINIMUM OF 0.01ETH');

    //User cannot access collateral until loan is paid off
    collateralEth[msg.sender] = collateralEth[msg.sender] + msg.value;

    //Tokens minted (50%)
    uint loanTokens = collateralEth[msg.sender] / 2;

    //Loan token to user from mint
    token.mint(msg.sender, loanTokens);

    //Return loan transaction information
    isLoaned[msg.sender] = true;
    emit Loan(msg.sender, collateralEth[msg.sender], loanTokens);
  }

  //Payoff loaned ETH
  function payOff() public {
    //Loan must be active to pay off
    require(isLoaned[msg.sender] == true, 'ERROR. A LOAN IS NOT ACTIVE');
    //Defi must approve transfer
    require(token.transferFrom(msg.sender, address(this), collateralEth[msg.sender]/2), 'ERROR. TOKENS NOT RETRIEVABLE');
    
    //5% fee
    uint fee = collateralEth[msg.sender]/5;

    //User's collateral minus fee
    payable(msg.sender).transfer(collateralEth[msg.sender]-fee);

    //Reset loan
    collateralEth[msg.sender] = 0;
    isLoaned[msg.sender] = false;

    //Return payoff transaction information
    emit PayOff(msg.sender, fee);
  }
}
