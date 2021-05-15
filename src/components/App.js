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
    deck_id: '',
    player_cards: [],
    dealer_cards: []
  });

  const [loading, setLoading] = useState({
    status: true,
    message: "Starting up..."
  });

  const[buttons, setButtons] = useState({
    new: true,
  });

  useEffect(() => {
    const mount = async () => {
      await loadWeb3();
      await loadBlockchainData();
      setLoading(currentState => ({
        ...currentState,
        status: false
      }));
    };
    mount();
  }, []);

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

  const loadBlockchainData = async () => {
    const web3 = window.web3;
    const networkId = await web3.eth.net.getId();

    if(networkId!==42){
      window.alert('Please switch network to Kovan and refresh the page');
    }
    const contract_abi = BlackJackABI.abi;
    const contract_address = '0xA4fB8BEBE84e056072A4143CAd36596F932A00E1';

    const contract = new web3.eth.Contract(contract_abi, contract_address);
    const accounts = await web3.eth.getAccounts();
    const balance = await web3.eth.getBalance(accounts[0]);
    const maxBet = await web3.eth.getBalance(contract_address);

    setWeb3State(currentState => ({
      ...currentState,
      contract: contract,
      account: accounts[0],
      balance: balance,
      maxBet: maxBet
    }));
  }

  const newGame = async () => {
    var id = await web3State.contract.methods.currentGameId().call();
    setGame(currentGameState => ({
      ...currentGameState,
      id: id
    }));

    await web3State.contract.methods.newGame().send({
      from: web3State.account
    })
    .on('sent', (payload) => {
      console.log("==========sent==========");
      setLoading(currentState => ({
        ...currentState,
        status: true,
        message: "Shuffling a new deck..."
      }));
    })
    .on('transactionHash', (hash) => {
      console.log("==========transactionHash==========");
      console.log(`https://kovan.etherscan.io/tx/${hash}`);
    })
    .on('receipt', (receipt) => {
      console.log("==========receipt==========");
      console.log(receipt);
    })
    .on('confirmation', async (confirmation, receipt, latestHash) => {
      if (confirmation < 1) {
        console.log("==========confirmation==========");
        console.log(confirmation);

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

    console.log("game_id: " + game.id + " - var_id: " + id);
    await web3State.contract.events.NewGameDealt({filter: {game_id: id}})
    .on('data', (event) => {
      console.log("newGameDealt, game id: " + game.id + " - var id: " + id);
      console.log(event.returnValues);
      if (event.returnValues.game_id === id) {
        console.log("passed if");
        console.log(event.returnValues);
        setGame(currentState => ({
          ...currentState,
          deck_id: event.returnValues.deck_id,
          player_cards: [
            {
              code: event.returnValues.player_card_1.code,
              value: event.returnValues.player_card_1.value
            },
            {
              code: event.returnValues.player_card_2.code,
              value: event.returnValues.player_card_2.value
            }
          ],
          dealer_cards: [
            {
              code: event.returnValues.dealer_card_1.code,
              value: event.returnValues.dealer_card_1.value
            },
            {
              code: event.returnValues.dealer_card_2.code,
              value: event.returnValues.dealer_card_2.value
            }
          ]
        }));
        setLoading(currentState => ({
          ...currentState,
          status: false
        }));
        switchButtons(["hit", "stand", "surrender"]);
      }
    });

    await web3State.contract.events.NewDealerCardDealt({filter: {game_id: id}})
    .on('data', (event) => {
      console.log("newDealerCardEvent");
      console.log(event.returnValues);
      console.log("game_id: " + game.id);
      if (event.returnValues.game_id === id) {
        console.log("if passed");
        setGame(currentState => ({
          ...currentState,
          dealer_cards: [...currentState.dealer_cards, {
            code: event.returnValues.dealer_card.code,
            value: event.returnValues.dealer_card.value
          }]
        }));
      }
    });
  }

  const playerHit = async () => {
    console.log("game_id: " + game.id);
    await web3State.contract.methods.playerHit(game.id).send({
      from: web3State.account
    })
    .on('sent', (payload) => {
      console.log("==========sent==========");
      setLoading(currentState => ({
        ...currentState,
        status: true,
        message: "Hit me..."
      }));
    })
    .on('transactionHash', (hash) => {
      console.log("==========transactionHash==========");
      console.log(`https://kovan.etherscan.io/tx/${hash}`);
    })
    .on('receipt', (receipt) => {
      console.log("==========receipt==========");
      console.log(receipt);
    })
    .on('confirmation', (confirmation, receipt, latestHash) => {
      if (confirmation < 1) {
        console.log("==========confirmation==========");
        console.log(confirmation);
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


    await web3State.contract.events.NewPlayerCardDealt({filter: {game_id: game.id}})
    .on('data', (event) => {
      console.log("newPlayerCardEvent");
      console.log(event.returnValues);
      console.log("game_id: " + game.id);
      if (event.returnValues.game_id === game.id) {
        setGame(currentState => ({
          ...currentState,
          player_cards: [...currentState.player_cards, {
            code: event.returnValues.player_card.code,
            value: event.returnValues.player_card.value
          }]
        }));
        setLoading(currentState => ({
          ...currentState,
          status: false
        }));
      }
    });
  }

  const playerStand = async () => {
    console.log("game_id: " + game.id);
    await web3State.contract.methods.playerStand(game.id).send({
      from: web3State.account
    })
    .on('sent', (payload) => {
      console.log("==========sent==========");
      setLoading(currentState => ({
        ...currentState,
        status: true,
        message: "Stand. Passing turn..."
      }));
    })
    .on('transactionHash', (hash) => {
      console.log("==========transactionHash==========");
      console.log(`https://kovan.etherscan.io/tx/${hash}`);
    })
    .on('receipt', (receipt) => {
      console.log("==========receipt==========");
      console.log(receipt);
    })
    .on('confirmation', (confirmation, receipt, latestHash) => {
      console.log(confirmation);
      if (confirmation < 1) {
        console.log("==========confirmation==========");
        console.log(confirmation);
        setLoading(currentState => ({
          ...currentState,
          status: false
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
      {loading.status && <Loading message={loading.message} />}
      <Main
        newGame={newGame}
        playerHit={playerHit}
        playerStand={playerStand}
        game={game}
        buttons={buttons}
      />
    </div>
  );
}

export default App;
