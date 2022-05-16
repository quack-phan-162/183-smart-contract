//import { tokens, ether, ETHER_ADDRESS, EVM_REVERT, wait } from './helpers'

const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'
 const EVM_REVERT = 'VM Exception while processing \'revert\' transaction'
 const ether = n => {
  return new web3.utils.BN(
    web3.utils.toWei(n.toString(), 'ether')
  )
}

//^ Ether
 const tokens = n => ether(n)
 const wait = s => {
  const milliseconds = s * 1000
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}


const Token = artifacts.require('./Token')
const DecentralizedFinances = artifacts.require('./Defi')

require('chai')
  .use(require('chai-as-promised'))
  .should()


contract('Defi', ([deployer, user]) => {
  let Defi, token
  const interestPerSecond = 15854896 //5% for minimum deposit (0.01 ETH)

  beforeEach(async () => {
    token = await Token.new()
    Defi = await DecentralizedFinances.new(token.address)
    await token.passMinterRole(Defi.address, {from: deployer})
  })

  describe('Testing Token Smart Contract...', () => {
    describe('Success', () => {
      it('Testing Token Name: 183DecentralizedFinances', async () => {
        expect(await token.name()).to.be.eq('183DecentralizedFinances')
      })

      it('Testing Token Symbol: 183Defi', async () => {
        expect(await token.symbol()).to.be.eq('183Defi')
      })

      it('Testing Token Initial Total Supply: 0', async () => {
        expect(Number(await token.totalSupply())).to.eq(0)
      })

      it('Testing Defi role: minter', async () => {
        expect(await token.minter()).to.eq(Defi.address)
      })
    })

    describe('Fail', () => {
      it('Passing minter role should fail', async () => {
        await token.passMinterRole(user, {from: deployer}).should.be.rejectedWith(EVM_REVERT)
      })

      it('Unauthorized users minting tokens should fail', async () => {
        await token.mint(user, '1', {from: deployer}).should.be.rejectedWith(EVM_REVERT)
    })
  })
})

  describe('Testing Defi deposit...', () => {
    let balance

    describe('Success', () => {
      beforeEach(async () => {
        await Defi.deposit({value: 10**16, from: user}) //0.01 ETH
      })

      it('Account balance should increase', async () => {
        expect(Number(await Defi.ethBal(user))).to.eq(10**16)
      })

      it('Deposit time should be greater than 0', async () => {
        expect(Number(await Defi.interestStart(user))).to.be.above(0)
      })

      it('User\'s deposit status should be true', async () => {
        expect(await Defi.isDeposited(user)).to.eq(true)
      })
    })

    describe('Fail', () => {
      it('Depositing should fail if too small', async () => {
        await Defi.deposit({value: 10**15, from: user}).should.be.rejectedWith(EVM_REVERT) // < 0.01 ETH
      })
    })
  })

  describe('Testing Defi withdraw...', () => {
    let balance

    describe('Success', () => {

      beforeEach(async () => {
        await Defi.deposit({value: 10**16, from: user}) //0.01 ETH

        //Interest accruing
        await wait(2)

        balance = await web3.eth.getBalance(user)
        await Defi.withdraw({from: user})
      })

      it('Account balances should decrease', async () => {
        expect(Number(await web3.eth.getBalance(Defi.address))).to.eq(0)
        expect(Number(await Defi.etherBalanceOf(user))).to.eq(0)
      })

      it('User should get ether back', async () => {
        expect(Number(await web3.eth.getBalance(user))).to.be.above(Number(balance))
      })

      it('User should get interest', async () => {
        balance = Number(await token.balanceOf(user))
        expect(balance).to.be.above(0)
        expect(balance%interestPerSecond).to.eq(0)
        expect(balance).to.be.below(interestPerSecond*4)
      })

      it('User deposit data should reset', async () => {
        expect(Number(await Defi.depositStart(user))).to.eq(0)
        expect(Number(await Defi.etherBalanceOf(user))).to.eq(0)
        expect(await Defi.isDeposited(user)).to.eq(false)
      })
    })

    describe('Fail', () => {
      it('Withdraw should fail if too small', async () =>{
        await Defi.deposit({value: 10**16, from: user}) //0.01 ETH
        //Interest accruing
        await wait(2)
        //Incorrect user
        await Defi.withdraw({from: deployer}).should.be.rejectedWith(EVM_REVERT) 
      })
    })
  })

  describe('Testing Defi loan...', () => {

    describe('Success', () => {
      beforeEach(async () => {
        await Defi.loan({value: 10**16, from: user}) //0.01 ETH
      })

      it('Token total supply should increase', async () => {
        expect(Number(await token.totalSupply())).to.eq(5*(10**15)) //10**16/2
      })

      it('User balance should increase', async () => {
        expect(Number(await token.balanceOf(user))).to.eq(5*(10**15)) //10**16/2
      })

      it('Collateral should increase', async () => {
        expect(Number(await Defi.collateralEth(user))).to.eq(10**16) //0.01 ETH
      })

      it('User\'s loan status should be true', async () => {
        expect(await Defi.isLoaned(user)).to.eq(true)
      })
    })

    describe('Fail', () => {
      it('Loan should fail if too small', async () => {
        await Defi.loan({value: 10**15, from: user}).should.be.rejectedWith(EVM_REVERT) //0.01 ETH
      })
    })
  })

  describe('Testing Defi payOff...', () => {

    describe('Success', () => {
      beforeEach(async () => {
        await Defi.loan({value: 10**16, from: user}) //0.01 ETH
        await token.approve(Defi.address, (5*(10**15)).toString(), {from: user})
        await Defi.payOff({from: user})
      })

      it('User\'s token balance should be 0', async () => {
        expect(Number(await token.balanceOf(user))).to.eq(0)
      })

      it('Defi ETH balance should get fee', async () => {
        expect(Number(await web3.eth.getBalance(Defi.address))).to.eq(5**15) //5% of 0.01 ETH
      })

      it('User\'s loan data should reset', async () => {
        expect(Number(await Defi.collateralEth(user))).to.eq(0)
        expect(await Defi.isLoaned(user)).to.eq(false)
      })
    })

    describe('Fail', () => {
      it('Paying off should fail if too small', async () =>{
        await Defi.loan({value: 10**16, from: user}) //0.01 ETH
        await token.approve(Defi.address, (5*(10**15)).toString(), {from: user})
        await Defi.payOff({from: deployer}).should.be.rejectedWith(EVM_REVERT) //wrong user
      })
    })
  })
})