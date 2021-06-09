import { useState, useRef } from 'react';
import useInterval from './useInterval';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Image from 'react-bootstrap/Image';
import Row from 'react-bootstrap/Row';
import GameButtons from './GameButtons';
import customCardBacking from './images/customCardBacking.png';

const Main = ({ web3State, loadingStatus, setLoading, setToasts, game, setGame }) => {
  const[buttons, setButtons] = useState({
    new: true,
  });

  const [winner, setWinner] = useState({
    chosen: false,
    background: "",
    message: ""
  });

  const [count, setCount] = useState(0);

  const [latestBlock, setLatestBlock] = useState(25204335);

  const inputRef = useRef();

  useInterval(() => checkForPlayerCards(), game.id!==-1&&winner.chosen===false?6000:null);
  useInterval(() => checkForDealerCards(), game.id!==-1&&winner.chosen===false?6000:null);
  useInterval(() => checkGameWon(), game.id!==-1&&winner.chosen===false?6000:null);

  const newGame = async (bet) => {
    if (bet <= 0) return;
    if (bet % 2 !== 0) return;
    var id = 0;
    setLoading(currentState => ({
      ...currentState,
      status: true,
      message: "Shuffling a new deck...",
      percentage: 20
    }));

    await web3State.contract.methods.newGame().send({
      from: web3State.account,
      value: bet
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
    .once('confirmation', async (confirmation, receipt, latestHash) => {
      setLoading(currentState => ({
        ...currentState,
        percentage: currentState.percentage + 20
      }));
    })
    .once('receipt', (receipt) => {
      if (receipt.events.NewGame.returnValues.player === web3State.account) {
        id = receipt.events.NewGame.returnValues.game_id;
        setLatestBlock(receipt.blockNumber);
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
      console.log("ERROR with New Game transaction. See below");
      console.log(error);
      setLoading(currentState => ({
        ...currentState,
        status: false
      }));
    });
  }



  const checkForPlayerCards = async () => {
    await web3State.contract.getPastEvents("NewPlayerCardDealt", {
      filter: {game_id: game.id},
      fromBlock: latestBlock
    },
      (error, events) => {
        if (error) {
          console.log("ERROR while checking for player cards. See below");
          console.log(error);
        } else if (events) {
          if (events.length > game.playerCardCount) {
            setGame(currentState => ({
              ...currentState,
              player_cards: [...currentState.player_cards, {
                code: events[events.length - 1].returnValues.player_card.code,
                value: events[events.length - 1].returnValues.player_card.value
              }],
              playerCardCount: currentState.playerCardCount + 1
            }));
            let total = getPlayersTotal(events);
            if (events.length <= 2) {
              setLoading(currentState => ({
                ...currentState,
                percentage: currentState.percentage + 20
              }));
            } else if (game.doubleDown || total === 21) {
              setLoading(currentState => ({
                ...currentState,
                message: "Dealer's turn now. Waiting for their move...",
                percentage: 20
              }));
            } else {
              setLoading(currentState => ({
                ...currentState,
                status: false
              }));
            }
          }
        }
      }
    );
  }

  const checkForDealerCards = async () => {
    await web3State.contract.getPastEvents("NewDealerCardDealt", {
      filter: {game_id: game.id},
      fromBlock: latestBlock
    },
      (error, events) => {
        if (error) {
          console.log("ERROR while checking for dealer cards. See below");
          console.log(error);
        } else if (events) {
          if (events.length > game.dealerCardCount) {
            setGame(currentState => ({
              ...currentState,
              dealer_cards: [...currentState.dealer_cards, {
                code: events[events.length - 1].returnValues.dealer_card.code,
                value: events[events.length - 1].returnValues.dealer_card.value
              }],
              dealerCardCount: currentState.dealerCardCount + 1
            }));
            if (events.length < 2) {
              setLoading(currentState => ({
                ...currentState,
                percentage: currentState.percentage + 20
              }));
            } else if (events.length === 2 && !winner.chosen) {
              switchButtons(["hit", "stand", "double", "surrender"]);
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
        }
      }
    );
  }

  const checkGameWon = async () => {
    await web3State.contract.getPastEvents("GameWon", {
      filter: {game_id: game.id},
      fromBlock: latestBlock
    },
      (error, events) => {
        if (error) {
          console.log("ERROR while checking for the game win event. See below");
          console.log(error);
        } else if (typeof events[0] !== "undefined") {
          let message = "";
          let background = "";
          let payout = parseInt(events[0].returnValues.payout);
          payout = (payout / 10 ** 18).toFixed(4)
          switch (events[0].returnValues.winner) {
            case "0":
              message = "The Dealer won this round";
              background = "bg-danger";
              break;
            case "1":
              message = `You won!! ${payout} ETH 🎉 Withdraw from the navbar when your done 🔝`;
              background = "bg-success";
              break;
            case "2":
              message = "This round is a tie";
              background = "bg-warning";
              break;
            default:
              break;
          }
          setWinner(currentState => ({
            ...currentState,
            chosen: true,
            message: message,
            background: background
          }));
          setLoading(currentState => ({
            ...currentState,
            status: false,
            message: "",
            percentage: 100
          }));
          switchButtons(["reset"]);
        }
      }
    );
  }

  const playerHit = async () => {
    //console.log("playerHit GAME: ", game);
    setLoading(currentState => ({
      ...currentState,
      status: true,
      message: "Hit me...",
      percentage: 10
    }));
    await web3State.contract.methods.playerHit(game.id).send({
      from: web3State.account
    })
    .once('sent', (payload) => {
      setLoading(currentState => ({
        ...currentState,
        percentage: currentState.percentage + 10
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
        percentage: currentState.percentage + 20
      }));
    })
    .once('receipt', (receipt) => {
      setLoading(currentState => ({
        ...currentState,
        percentage: currentState.percentage + 20
      }));
      if (!winner.chosen && buttons.double) {
        switchButtons(["hit", "stand", "surrender"]);
      }
    })
    .on('error', (error) => {
      console.log("ERROR with Hit transaction. See below");
      console.log(error);
      setLoading(currentState => ({
        ...currentState,
        status: false
      }));
    });
  }

  const playerStand = async () => {
    //console.log("playerStand GAME: ", game);
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
      setToasts(currentState => [
        ...currentState,
        {link: `https://kovan.etherscan.io/tx/${hash}`, timer: 0}
      ]);
      setLoading(currentState => ({
        ...currentState,
        status: true,
        message: "Dealer's turn now. Waiting for their move...",
        percentage: 20
      }));
    })
    .once('receipt', (receipt) => {
      if (!winner.chosen && buttons.double) {
        switchButtons(["hit", "stand", "surrender"]);
      }
    })
    .on('error', (error) => {
      console.log("ERROR with Stand transaction. See below");
      console.log(error);
      setLoading(currentState => ({
        ...currentState,
        status: false
      }));
    });
  }

  const playerDouble = async (bet) => {
    setLoading(currentState => ({
      ...currentState,
      status: true,
      message: "Doubling down...",
      percentage: 10
    }));
    await web3State.contract.methods.playerDouble(game.id).send({
      from: web3State.account,
      value: bet
    })
    .once('sent', (payload) => {
      setLoading(currentState => ({
        ...currentState,
        percentage: currentState.percentage + 10
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
      setGame(currentState => ({
        ...currentState,
        doubleDown: true
      }));
      setLoading(currentState => ({
        ...currentState,
        percentage: currentState.percentage + 20
      }));
    })
    .once('receipt', (receipt) => {
      setLoading(currentState => ({
        ...currentState,
        percentage: currentState.percentage + 20
      }));
      if (!winner.chosen && buttons.double) {
        switchButtons(["hit", "stand", "surrender"]);
      }
    })
    .on('error', (error) => {
      console.log("ERROR with Double transaction. See below");
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
        percentage: currentState.percentage + 20
      }));
    })
    .once('receipt', (receipt) => {
      setLoading(currentState => ({
        ...currentState,
        percentage: currentState.percentage + 20
      }));
    })
    .on('error', (error) => {
      console.log("ERROR with Surrender transaction. See below");
      console.log(error);
      setLoading(currentState => ({
        ...currentState,
        status: false
      }));
    });
  }

  //This method allows the admin to withdraw funds from the contract. HOWEVER there are checks in place to prevent the removal of user winnings.
  //This means the admin CAN NOT withdraw funds that are higher than the dealer balance minus totalPendingPayouts.
  //Please refer to the contract to see how this works. Located in src/contracts/Blackjack.sol
  const adminWithdraw = async (amount) => {
    await web3State.contract.methods.withdrawEth(amount).send({
      from: web3State.account
    })
    .once('sent', (payload) => {

    })
    .once('transactionHash', (hash) => {
      setToasts(currentState => [
        ...currentState,
        {link: `https://kovan.etherscan.io/tx/${hash}`, timer: 0}
      ]);
    })
    .once('confirmation', (confirmation, receipt, latestHash) => {
      inputRef.value = 0;
    })
    .once('receipt', (receipt) => {

    })
    .on('error', (error) => {
      console.log("ERROR with Admin Withdraw transaction. See below");
      console.log(error);
      setLoading(currentState => ({
        ...currentState,
        status: false
      }));
    });
  }

  const resetGame = () => {
    setGame({
      id: -1,
      player_cards: [],
      dealer_cards: [],
      playerCardCount: 0,
      dealerCardCount: 0,
      doubleDown: false
    });
    setToasts([]);
    setWinner(currentState => ({
      ...currentState,
      chosen: false,
      background: "",
      message: ""
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

  const getPlayersTotal = (events) => {
    let total = 0;
    let aceCount = 0;
    for(let i = 0; i < events.length; i++) {
      total += parseInt(events[i].returnValues.player_card.value);
      let firstCodeChar = events[i].returnValues.player_card.code.substring(0, 1);
      if (firstCodeChar === "A") {
        aceCount++;
      }
    }
    //If there are aces and the total will bust => convert aces from value of 11, to value of 1
    while(total > 21 && aceCount > 0) {
      total -= 10;
      aceCount --;
    }
    return total;
  }

  return (
    <Container>
      <Card className="my-3 w-100">
        <Card.Header className={winner.chosen&&`${winner.background}`}>
          <Row>
            <Col>
              <h5 onClick={() => count<5?setCount(current => current + 1):setCount(0)}>Dealer Balance: ETH {(web3State.dealerBalance / 10 ** 18).toFixed(4)}</h5>
            </Col>
            <Col>
              <h5>Your Balance: ETH {(web3State.playerBalance / 10 ** 18).toFixed(4)}</h5>
            </Col>
          </Row>
          {count===5 && <Row><Col sm={6} xs={12}>
            <Form>
              <Form.Group controlId="formGroupWei">
                <Form.Label className="font-weight-bold">Admin Withdraw</Form.Label>
                <Form.Control ref={inputRef} type="number" placeholder="Amount in WEI" step="100000000000000"/>
                <Form.Text className="text-muted">Ex. 1 ETH = 1000000000000000000 WEI</Form.Text>
              </Form.Group>
              <Button variant="primary" onClick={() => adminWithdraw(inputRef.current.value)}>Submit</Button>
            </Form>
          </Col></Row>}
          {winner.chosen && <Row><Col>
            <h4 className="m-0 text-center">{winner.message}</h4>
          </Col></Row>}
        </Card.Header>
        <Card.Body style={{minHeight:"400px", maxHeight: "400px", height: "400px"}}>
          <Container className="h-100">
            <Row className="justify-content-center align-items-start mb-xs-3 h-50">
              <div className="card_row">
                {game.dealer_cards.map((value, index) => {
                  let src = "";
                  if (game.dealer_cards.length === 2 && !winner.chosen) {
                    if (index === 1) {
                      src=customCardBacking
                    } else {
                      src=`https://deckofcardsapi.com/static/img/${value.code}.png`
                    }
                  } else {
                    src=`https://deckofcardsapi.com/static/img/${value.code}.png`
                  }
                  return (
                    <Image
                      key={`dealer_card_col_${index}`}
                      src={src}
                      alt={`Dealer card ${index}`}
                      className="playing_card"
                    />
                  )
                })}
              </div>
            </Row>
            <Row className="justify-content-center align-items-end mt-xs-3 h-50">
              <div className="card_row">
                {game.player_cards.map((value, index) => {
                  return (
                    <Image
                      key={`player_card_col_${index}`}
                      src={`https://deckofcardsapi.com/static/img/${value.code}.png`}
                      alt={`Player card ${index}`}
                      className="playing_card"
                    />
                  )
                })}
              </div>
            </Row>
          </Container>
        </Card.Body>
        <Card.Footer>
          <GameButtons
            newGame={newGame}
            playerHit={playerHit}
            playerStand={playerStand}
            playerDouble={playerDouble}
            playerSurrender={playerSurrender}
            resetGame={resetGame}
            buttons={buttons}
            loadingStatus={loadingStatus}
          />
        </Card.Footer>
      </Card>
    </Container>
  );
}

export default Main;