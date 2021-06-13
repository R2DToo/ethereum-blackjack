import { useState, useEffect } from 'react';
import Web3 from 'web3';
import Web3Modal from 'web3modal';
import Authereum from "authereum";
import Fortmatic from "fortmatic";
import Portis from "@portis/web3";
import Torus from "@toruslabs/torus-embed";
import WalletConnectProvider from "@walletconnect/web3-provider";
import NavigationBar from './NavigationBar';
import Main from './Main';
import Loading from './Loading';
import Toasts from './Toasts';
import BlackJackABI from '../contracts/BlackjackABI.json';

const App = () => {
  const [web3State, setWeb3State] = useState({
    contract: '',
    account: '',
    playerBalance: 0,
    dealerBalance: 0
  });

  const [web3Instance, setWeb3Instance] = useState("");

  const [game, setGame] = useState({
    id: -1,
    player_cards: [],
    dealer_cards: [],
    playerCardCount: 0,
    dealerCardCount: 0,
    doubleDown: false
  });

  const [toasts, setToasts] = useState([]);

  const [loading, setLoading] = useState({
    status: false,
    message: "Connecting to your Metamask Wallet...",
    percentage: 50
  });

  useEffect(() => {
    const tryConnect = async () => {
      connectToProvider();
      //await loadBlockchainData();
    };
    tryConnect();
  }, []);

  const contract_address = '0x7486CEFCD9BE24D14949bDe46f72BB0d9458Ccd7';

  const connectToProvider = async () => {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider, // required
        options: {
          infuraId: "INFURA_ID" // required
        }
      },
      authereum: {
        package: Authereum // required
      },
      fortmatic: {
        package: Fortmatic, // required
        options: {
          key: "pk_test_7F6ED4CD12FEACF3" // required - https://dashboard.fortmatic.com/
        }
      },
      torus: {
        package: Torus // required
      },
      portis: {
        package: Portis, // required
        options: {
          id: "ee5461c7-5dc9-4a83-b9df-54bc98cd5580" // required - https://dashboard.portis.io/
        }
      }
    };
    const web3Modal = new Web3Modal({
      network: "kovan",
      providerOptions
    });
    const provider = await web3Modal.connect();

    const web3 = new Web3(provider);
    setWeb3Instance(web3);
    await web3.eth.requestAccounts();
    const networkId = await web3.eth.net.getId();
    if(networkId!==42){
      window.alert('Please switch network to Kovan and refresh the page');
    }
    const contract_abi = BlackJackABI.abi;

    const contract = new web3.eth.Contract(contract_abi, contract_address);
    const accounts = await web3.eth.getAccounts();
    if (typeof accounts[0] !== "undefined") {
      const playerBalance = await web3.eth.getBalance(accounts[0]);
      const dealerBalance = await web3.eth.getBalance(contract_address);
      setWeb3State(currentState => ({
        ...currentState,
        contract: contract,
        account: accounts[0],
        playerBalance: playerBalance,
        dealerBalance: dealerBalance
      }));
    } else {
      setLoading(currentState => ({
        ...currentState,
        status: false
      }));
      window.alert("Please login to Metamask first");
    }
  }

  const loadBlockchainData = async () => {
    if (typeof window.ethereum !== "undefined") {
      const web3 = new Web3(window.ethereum);
      setWeb3Instance(web3);
      await web3.eth.requestAccounts();
      const networkId = await web3.eth.net.getId();
      if(networkId!==42){
        window.alert('Please switch network to Kovan and refresh the page');
      }
      const contract_abi = BlackJackABI.abi;

      const contract = new web3.eth.Contract(contract_abi, contract_address);
      const accounts = await web3.eth.getAccounts();
      if (typeof accounts[0] !== "undefined") {
        const playerBalance = await web3.eth.getBalance(accounts[0]);
        const dealerBalance = await web3.eth.getBalance(contract_address);
        setWeb3State(currentState => ({
          ...currentState,
          contract: contract,
          account: accounts[0],
          playerBalance: playerBalance,
          dealerBalance: dealerBalance
        }));
      } else {
        setLoading(currentState => ({
          ...currentState,
          status: false
        }));
        window.alert("Please login to Metamask first");
      }
    } else {
      setLoading(currentState => ({
        ...currentState,
        status: false
      }));
      window.alert("Metamask wallet not detected. Please install and try again");
    }
    setLoading(currentState => ({
      ...currentState,
      status: false
    }));
  }

  useEffect(() => {
    const getBalance = async () => {
      try {
        if (web3State.account !== "") {
          const accounts = await web3Instance.eth.getAccounts();
          const playerBalance = await web3Instance.eth.getBalance(accounts[0]);
          const dealerBalance = await web3Instance.eth.getBalance(contract_address);
          setWeb3State(currentState => ({
            ...currentState,
            playerBalance: playerBalance,
            dealerBalance: dealerBalance
          }));
        }
      } catch {}
    };
    getBalance();
  }, [game, web3Instance, web3State])

  const withdraw = async () => {
    setLoading(currentState => ({
      ...currentState,
      status: true,
      message: "Requesting a withdraw of winnings...",
      percentage: 20
    }));
    await web3State.contract.methods.withdrawPayout().send({
      from: web3State.account
    })
    .once('sent', (payload) => {
      setLoading(currentState => ({
        ...currentState,
        percentage: currentState.percentage + 20
      }));
    })
    .once('transactionHash', (hash) => {
      setToasts(currentState => [
        ...currentState,
        {link: `https://kovan.etherscan.io/tx/${hash}`, timer: 0}
      ]);
      setLoading(currentState => ({
        ...currentState,
        percentage: currentState.percentage + 20
      }));
    })
    .once('confirmation', (confirmation, receipt, latestHash) => {
      setLoading(currentState => ({
        ...currentState,
        status: false
      }));
    })
    .once('receipt', (receipt) => {
      setLoading(currentState => ({
        ...currentState,
        percentage: currentState.percentage + 20
      }));
      console.log("Withdraw receipt: ", receipt);
    })
    .on('error', (error) => {
      console.log("ERROR with Withdraw transaction. See below");
      console.log(error);
      setLoading(currentState => ({
        ...currentState,
        status: false
      }));
    });
  }

  return (
    <div className="App">
      <NavigationBar
        account={web3State.account}
        withdraw={withdraw}
        connect={connectToProvider}
      />
      {loading.status && <Loading message={loading.message} percentage={loading.percentage} />}
      {web3State.account !== '' && <Main
        web3State={web3State}
        loadingStatus={loading.status}
        setLoading={setLoading}
        setToasts={setToasts}
        game={game}
        setGame={setGame}
      />}
      <Toasts
        toasts={toasts}
        setToasts={setToasts}
      />
    </div>
  );
}

export default App;
