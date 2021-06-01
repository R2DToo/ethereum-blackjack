import { useState, useEffect } from 'react';
import Web3 from 'web3';
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
    id: 0,
    player_cards: [],
    dealer_cards: []
  });

  const [toasts, setToasts] = useState([]);

  const [loading, setLoading] = useState({
    status: true,
    message: "Connecting to your Metamask Wallet...",
    percentage: 50
  });

  useEffect(() => {
    const mount = async () => {
      await loadBlockchainData();
    };
    mount();
  }, []);

  const contract_address = '0xd8F15941B36bBf3f0D580692671B048947f10A75';

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
        window.alert("Please login to Metamask first");
      }
    } else {
      window.alert("Metamask wallet not detected. Please install and try again");
    }
    setLoading(currentState => ({
      ...currentState,
      status: false
    }));
  }

  useEffect(() => {
    const getBalance = async () => {
      if (web3Instance !== "") {
        const accounts = await web3Instance.eth.getAccounts();
        const playerBalance = await web3Instance.eth.getBalance(accounts[0]);
        const dealerBalance = await web3Instance.eth.getBalance(contract_address);
        setWeb3State(currentState => ({
          ...currentState,
          playerBalance: playerBalance,
          dealerBalance: dealerBalance
        }));
      }
    };
    getBalance();
  }, [game, web3Instance])

  return (
    <div className="App">
      <NavigationBar
        account={web3State.account}
        loadBlockchainData={loadBlockchainData}
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
