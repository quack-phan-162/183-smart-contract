pragma solidity 0.8.13;

//ERC-20 Token Standard for ETH Tokens
import "./ERC20Standard/ERC20.sol";

//All tokens abide by ERC 20 Standards
contract Token is ERC20{

    //Person who mints tokens
    address public minter;

    //Everytime minter is changed, it must be logged for transparency
    event MinterChanged(address indexed from, address to);

    //Initialize token
    constructor() public payable ERC20("Decentralized Finances", "183Defi"){
        minter = msg.sender;
    }

    //Mint function to create tokens
    function mint(address account, uint256 amount) public{
        //Only minter can mint tokens
        require(msg.sender == minter, 'ERROR. MINTER ROLE IS REQUIRED TO MINT TOKENS');
        _mint(account,amount); 
    }

    //Pass role of minter to Defi
    //Hence, decentralized finances
    function passMinterRole(address Defi) public returns (bool){
        require(msg.sender == minter, 'ERROR. MINTER ROLE IS REQUIRED TO CHANGE MINTER ROLE');
        minter = Defi;

        emit MinterChanged(msg.sender, Defi);
        return true;
    }

}
