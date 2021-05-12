import { useState } from 'react';
import Web3 from 'web3';
import Navbar from './Navbar';
import Main from './Main';
import BlackJackABI from '../contracts/BlackjackABI.json';

const App = () => {
  const componentDidMount = async () => {
    await loadWeb3();
    await loadBlockchainData();
  }


  const loadBlockchainData = async () => {
    const web3 = window.web3;
    const networkId = await web3.eth.net.getId();

    if(networkId!==42){
      window.alert('Please switch network to Kovan and refresh the page');
    }
    const contract_abi = BlackJackABI.abi;
    const contract_address = '0xeEBc41Cfe47021E264BdA259E504c94f107d7e0D';

    const contract = new web3.eth.Contract(contract_abi, contract_address);
    web3State.contract = contract;

    const accounts = await web3.eth.getAccounts();
    web3State.account = accounts[0];

    const balance = await web3.eth.getBalance(web3State.account);
    web3State.balance = balance;

    const maxBet = await web3.eth.getBalance(contract_address);
    web3State.maxBet = maxBet;
    setWeb3State(web3State);
  }

  const loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
  }

  const newGame = async () => {
    console.log("newGame");
    console.log(web3State.balance);
    console.log(web3State.account);
  }

  componentDidMount();

  const [web3State, setWeb3State] = useState({
    contract: '',
    account: '',
    balance: '',
    maxBet: ''
  });

  return (
    <div className="App">
      <Navbar
        account={web3State.account}
      />
      <Main
        newGame={newGame}
      />
    </div>
  );
}

export default App;
