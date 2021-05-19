import { useState, useEffect } from 'react';
import Web3 from 'web3';
import Navbar from './Navbar';
import Main from './Main';
import Loading from './Loading';
import BlackJackABI from '../contracts/BlackjackABI.json';

const App = () => {
  const [web3State, setWeb3State] = useState({
    contract: '',
    account: '',
    balance: 0,
    maxBet: 0
  });

  const [game, setGame] = useState({
    id: 0,
    player_cards: [],
    dealer_cards: []
  });

  const [loading, setLoading] = useState({
    status: true,
    message: "Starting up...",
    percentage: 50
  });

  const[buttons, setButtons] = useState({
    new: true,
  });

  const [winner, setWinner] = useState({
    chosen: false,
    name: ""
  });

  var latestBlock = 24918400;

  useEffect(() => {
    const mount = async () => {
      await loadBlockchainData();
      setLoading(currentState => ({
        ...currentState,
        status: false
      }));
    };
    mount();
  }, []);

  const loadBlockchainData = async () => {
    if (typeof window.ethereum !== "undefined") {
      const web3 = new Web3(window.ethereum);
      const networkId = await web3.eth.net.getId();
      console.log("networkId: " + networkId);
      if(networkId!==42){
        window.alert('Please switch network to Kovan and refresh the page');
      }
      const contract_abi = BlackJackABI.abi;
      const contract_address = '0x654096146C3684219Dbb8FbABB730d4d6905b3E2';

      const contract = new web3.eth.Contract(contract_abi, contract_address);
      const accounts = await web3.eth.getAccounts();
      if (typeof accounts[0] !== "undefined") {
        const balance = await web3.eth.getBalance(accounts[0]);
        const maxBet = await web3.eth.getBalance(contract_address);
        setWeb3State(currentState => ({
          ...currentState,
          contract: contract,
          account: accounts[0],
          balance: balance,
          maxBet: maxBet
        }));
      } else {
        window.alert("Please login to Metamask first");
      }
    } else {
      window.alert("Metamask wallet not detected. Please install and try again");
    }
  }

  const newGame = async () => {
    var id = 0;
    setLoading(currentState => ({
      ...currentState,
      status: true,
      message: "Shuffling a new deck...",
      percentage: 20
    }));

    await web3State.contract.methods.newGame().send({
      from: web3State.account
    })
    .once('sent', (payload) => {
      setLoading(currentState => ({
        ...currentState,
        percentage: currentState.percentage + 20
      }));
    })
    .once('transactionHash', (hash) => {
      console.log(`https://kovan.etherscan.io/tx/${hash}`);
      setLoading(currentState => ({
        ...currentState,
        percentage: currentState.percentage + 20
      }));
    })
    .once('confirmation', async (confirmation, receipt, latestHash) => {
      setLoading(currentState => ({
        ...currentState,
        percentage: currentState.percentage + 20
      }));
    })
    .once('receipt', (receipt) => {
      if (receipt.events.NewGame.returnValues.player === web3State.account) {
        id = receipt.events.NewGame.returnValues.game_id;
        latestBlock = receipt.blockNumber;
        setGame(currentState => ({
          ...currentState,
          id: id
        }));
        setLoading(currentState => ({
          ...currentState,
          message: "Dealer is drawing the starting cards...",
          percentage: 20
        }));
      }
    })
    .on('error', (error) => {
      console.log("==========error==========");
      console.log(error);
      setLoading(currentState => ({
        ...currentState,
        status: false
      }));
    });

    var previousPlayerCardCodes = [];
    await web3State.contract.events.NewPlayerCardDealt({filter: {game_id: id}, fromBlock: latestBlock})
    .on('data', (event) => {
      if (event.returnValues.game_id === id && !previousPlayerCardCodes.includes(event.returnValues.player_card.code)) {
        previousPlayerCardCodes.push(event.returnValues.player_card.code);
        setGame(currentState => ({
          ...currentState,
          player_cards: [...currentState.player_cards, {
            code: event.returnValues.player_card.code,
            value: event.returnValues.player_card.value
          }]
        }));
        if (previousPlayerCardCodes.length <= 2) {
          setLoading(currentState => ({
            ...currentState,
            percentage: currentState.percentage + 20
          }));
        } else {
          setLoading(currentState => ({
            ...currentState,
            status: false
          }));
        }
      }
    });

    var previousDealerCardCodes = [];
    await web3State.contract.events.NewDealerCardDealt({filter: {game_id: id}, fromBlock: latestBlock})
    .on('data', (event) => {
      if (event.returnValues.game_id === id && !previousDealerCardCodes.includes(event.returnValues.dealer_card.code)) {
        previousDealerCardCodes.push(event.returnValues.dealer_card.code);
        setGame(currentState => ({
          ...currentState,
          dealer_cards: [...currentState.dealer_cards, {
            code: event.returnValues.dealer_card.code,
            value: event.returnValues.dealer_card.value
          }]
        }));
        if (previousDealerCardCodes.length < 2) {
          setLoading(currentState => ({
            ...currentState,
            percentage: currentState.percentage + 20
          }));
        } else if (previousDealerCardCodes.length === 2) {
          switchButtons(["hit", "stand", "surrender"]);
          setLoading(currentState => ({
            ...currentState,
            status: false
          }));
        } else {
          setLoading(currentState => ({
            ...currentState,
            percentage: currentState.percentage + 10
          }));
        }
      }
    });

    await web3State.contract.events.GameWon({filter: {game_id: id}, fromBlock: latestBlock})
    .once('data', (event) => {
      if (event.returnValues.game_id === id) {
        let winnerString = "";
        if (event.returnValues.winner === "0") winnerString = "Dealer";
        if (event.returnValues.winner === "1") winnerString = "Player";
        if (event.returnValues.winner === "2") winnerString = "Tie";
        setWinner(currentState => ({
          ...currentState,
          chosen: true,
          name: winnerString
        }));
        setLoading(currentState => ({
          ...currentState,
          status: false,
          message: "",
          percentage: 100
        }));
        switchButtons(["reset"]);
      }
    })
  }

  const playerHit = async () => {
    setLoading(currentState => ({
      ...currentState,
      status: true,
      message: "Hit me...",
      percentage: 10
    }));
    await web3State.contract.methods.playerHitRequest(game.id).send({
      from: web3State.account
    })
    .once('sent', (payload) => {
      setLoading(currentState => ({
        ...currentState,
        percentage: currentState.percentage + 10
      }));
    })
    .once('transactionHash', (hash) => {
      console.log(`https://kovan.etherscan.io/tx/${hash}`);
      setLoading(currentState => ({
        ...currentState,
        percentage: currentState.percentage + 20
      }));
    })
    .once('confirmation', (confirmation, receipt, latestHash) => {
      setLoading(currentState => ({
        ...currentState,
        percentage: currentState.percentage + 20
      }));
    })
    .once('receipt', (receipt) => {
      latestBlock = receipt.blockNumber;
      setLoading(currentState => ({
        ...currentState,
        percentage: currentState.percentage + 20
      }));
    })
    .on('error', (error) => {
      console.log("==========error==========");
      console.log(error);
      setLoading(currentState => ({
        ...currentState,
        status: false
      }));
    });
  }

  const playerStand = async () => {
    setLoading(currentState => ({
      ...currentState,
      status: true,
      message: "Stand. Passing turn...",
      percentage: 40
    }));
    await web3State.contract.methods.playerStand(game.id).send({
      from: web3State.account
    })
    .once('sent', (payload) => {
      setLoading(currentState => ({
        ...currentState,
        percentage: currentState.percentage + 40
      }));
    })
    .once('transactionHash', (hash) => {
      console.log(`https://kovan.etherscan.io/tx/${hash}`);
      setLoading(currentState => ({
        ...currentState,
        status: true,
        message: "Dealer's turn now. Waiting for their move...",
        percentage: 10
      }));
    })
    .once('receipt', (receipt) => {
      latestBlock = receipt.blockNumber;
    })
    .on('error', (error) => {
      console.log("==========error==========");
      console.log(error);
      setLoading(currentState => ({
        ...currentState,
        status: false
      }));
    });
  }

  const playerSurrender = async () => {
    setLoading(currentState => ({
      ...currentState,
      status: true,
      message: "You have surrendered...",
      percentage: 20
    }));
    await web3State.contract.methods.playerSurrender(game.id).send({
      from: web3State.account
    })
    .once('sent', (payload) => {
      setLoading(currentState => ({
        ...currentState,
        percentage: currentState.percentage + 20
      }));
    })
    .once('transactionHash', (hash) => {
      console.log(`https://kovan.etherscan.io/tx/${hash}`);
      setLoading(currentState => ({
        ...currentState,
        percentage: currentState.percentage + 20
      }));
    })
    .once('confirmation', (confirmation, receipt, latestHash) => {
      setLoading(currentState => ({
        ...currentState,
        percentage: currentState.percentage + 20
      }));
    })
    .once('receipt', (receipt) => {
      latestBlock = receipt.blockNumber;
      setLoading(currentState => ({
        ...currentState,
        percentage: currentState.percentage + 20
      }));
    })
    .on('error', (error) => {
      console.log("==========error==========");
      console.log(error);
      setLoading(currentState => ({
        ...currentState,
        status: false
      }));
    });
  }

  const resetGame = () => {
    setGame({
      id: 0,
      player_cards: [],
      dealer_cards: []
    });
    setWinner(currentState => ({
      ...currentState,
      chosen: false,
      name: ""
    }));
    setLoading(currentState => ({
      ...currentState,
      status: false
    }));
    switchButtons(["new"]);
  }

  const switchButtons = (buttonsArray) => {
    var newButtons = {};
    for(let i = 0; i < buttonsArray.length; i++) {
      newButtons[buttonsArray[i]] = true;
    }
    setButtons(newButtons);
  }

  return (
    <div className="App">
      <Navbar
        account={web3State.account}
      />
      {loading.status && <Loading message={loading.message} percentage={loading.percentage} />}
      {web3State.account !== '' && <Main
        newGame={newGame}
        playerHit={playerHit}
        playerStand={playerStand}
        playerSurrender={playerSurrender}
        resetGame={resetGame}
        game={game}
        buttons={buttons}
        winner={winner}
      />}
    </div>
  );
}

export default App;
