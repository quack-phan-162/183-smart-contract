import { Tabs, Tab } from 'react-bootstrap'
import Defi from '../build/contracts/Defi.json'
import React, { Component } from 'react';
import Token from '../build/contracts/Token.json'
import defi from '../bank-flat.png';
import Web3 from 'web3';

class App extends Component {

  async componentWillMount() {
    await this.loadBlockchainData(this.props.dispatch)
  }

  async loadBlockchainData(dispatch) {
    if(typeof window.ethereum!=='undefined'){  //have Metamask?
        const web3 = new Web3(window.ethereum) //turn web3 connection into variable
        const netId = await web3.eth.net.getId() //which network ID to connect
        const accounts = await web3.eth.getAccounts() //which account to use
  
        if(typeof accounts[0] !=='undefined'){ //account exists
          const balance = await web3.eth.getBalance(accounts[0]) //get balance
          this.setState({account: accounts[0], balance: balance, web3: web3}) //add to session's state
        } else {
          window.alert('Please login with MetaMask') //need account to work
        }
  
        try { //new contracts
          const token = new web3.eth.Contract(Token.abi, Token.networks[netId].address) //get token abi + addr
          const defi = new web3.eth.Contract(Defi.abi, Defi.networks[netId].address) //get bank abi + addr
          const DefiAddress = Defi.networks[netId].address
          this.setState({token: token, defi: defi, DefiAddress: DefiAddress}) //add to session's state
        } catch (e) {
          console.log('Error ', e, 'occured.')
          window.alert('Contracts not yet deployed.')
        }
  
      } else {//no metamask?
        window.alert('For this smart contract, please have Metamask installed.')
      }

  }


  constructor(props) {
    super(props)
    this.state = {
      web3: 'undefined',
      account: '',
      token: null,
      defi: null,
      balance: 0,
      DefiAddr: null
    }
  }

  
  render() {
    return (
      <div className='text-monospace'>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
        <img src={defi} className="App-logo" alt="logo" height="32"/>
          <b>DEFI</b>
        </nav>
        <div className="container-fluid mt-5 text-center">
        <br></br>
          <h1>183-Defi System</h1>
          <h2>{this.state.account}</h2>
          <br></br>
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
              <Tabs defaultActiveKey="profile" id="uncontrolled-tab-example">
              

                <Tab eventKey="deposit" title="Deposit">
                  <div>
                  <br></br>
                    How much do you want to deposit?
                    <br></br>
                    (min. amount is 0.01 ETH)
                    <br></br>
                    (1 deposit is possible at the time)
                    <br></br>
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      let amount = this.depositAmount.value
                      amount = amount * 10**18 //convert to wei
                      this.deposit(amount)
                    }}>
                      <div className='form-group mr-sm-2'>
                      <br></br>
                        <input
                          id='depositAmount'
                          step="0.01"
                          type='number'
                          ref={(input) => { this.depositAmount = input }}
                          className="form-control form-control-md"
                          placeholder='amount...'
                          required />
                      </div>
                      <button type='submit' className='btn btn-primary'>DEPOSIT</button>
                    </form>
                  </div>
                </Tab>


                <Tab eventKey="withdraw" title="Withdraw">
                  <br></br>
                    Do you want to withdraw + take interest?
                    <br></br>
                    <br></br>
                  <div>
                    <button type='submit' className='btn btn-primary' onClick={(e) => this.withdraw(e)}>WITHDRAW</button>
                  </div>
                </Tab>


                {/* <Tab eventKey="borrow" title="Borrow">
                  <div>
                  <br></br>
                    Do you want to borrow tokens?
                    <br></br>
                    (You'll get 50% of collateral, in Tokens)
                    <br></br>
                    Type collateral amount (in ETH)
                    <br></br>
                    <br></br>
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      let amount = this.borrowAmount.value
                      amount = amount * 10 **18 //convert to wei
                      this.borrow(amount)
                    }}>
                      <div className='form-group mr-sm-2'>
                        <input
                          id='borrowAmount'
                          step="0.01"
                          type='number'
                          ref={(input) => { this.borrowAmount = input }}
                          className="form-control form-control-md"
                          placeholder='amount...'
                          required />
                      </div>
                      <button type='submit' className='btn btn-primary'>BORROW</button>
                    </form>
                  </div>
                </Tab> */}


                {/* <Tab eventKey="payOff" title="Payoff">
                  <div>
                  <br></br>
                    Do you want to payoff the loan?
                    <br></br>
                    (You'll receive your collateral - fee)
                    <br></br>
                    <br></br>
                    <button type='submit' className='btn btn-primary' onClick={(e) => this.payOff(e)}>PAYOFF</button>
                  </div>
                </Tab> */}


              </Tabs>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
