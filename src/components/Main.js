import { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Accordion from 'react-bootstrap/Accordion';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Image from 'react-bootstrap/Image';
import Row from 'react-bootstrap/Row';
import GameButtons from './GameButtons';
import customCardBacking from './images/customCardBacking.png';

const Main = ({ web3State, loadingStatus, setLoading, setToasts, game, setGame }) => {
  var lastPlayerEventLength, lastDealerEventLength = 0;
  var playerEventIntervalId, dealerEventIntervalId, gameWonIntervalId = 0;

  const[buttons, setButtons] = useState({
    new: true,
  });

  const [winner, setWinner] = useState({
    chosen: false,
    name: ""
  });

  var latestBlock = 25166816;

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
      setToasts(currentState => [...currentState, `https://kovan.etherscan.io/tx/${hash}`]);
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
        console.log("Game ID: " + id);
        //console.log(receipt);
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
        lastPlayerEventLength = 0;
        lastDealerEventLength = 0;
        playerEventIntervalId = setInterval(() => checkForPlayerCards(id), 6000);
        dealerEventIntervalId = setInterval(() => checkForDealerCards(id), 6000);
        gameWonIntervalId = setInterval(() => checkGameWon(id), 6000);
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



  const checkForPlayerCards = async (id) => {
    console.log("check player cards");
    await web3State.contract.getPastEvents("NewPlayerCardDealt", {
      filter: {game_id: id},
      fromBlock: latestBlock
    },
      (error, events) => {
        if (error) {
          console.log(error);
        } else if (events) {
          //console.log("NewPlayerCardDealt Past Events")
          //console.log(events);
          if (events.length > lastPlayerEventLength) {
            console.log(events);
            lastPlayerEventLength++;
            setGame(currentState => ({
              ...currentState,
              player_cards: [...currentState.player_cards, {
                code: events[events.length - 1].returnValues.player_card.code,
                value: events[events.length - 1].returnValues.player_card.value
              }]
            }));
            if (events.length <= 2) {
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
        }
      }
    );
  }

  const checkForDealerCards = async (id) => {
    console.log("check dealer cards");
    await web3State.contract.getPastEvents("NewDealerCardDealt", {
      filter: {game_id: id},
      fromBlock: latestBlock
    },
      (error, events) => {
        if (error) {
          console.log(error);
        } else if (events) {
          //console.log("NewDealerCardDealt Past Events")
          //console.log(events);
          if (events.length > lastDealerEventLength) {
            console.log(events);
            lastDealerEventLength++;
            setGame(currentState => ({
              ...currentState,
              dealer_cards: [...currentState.dealer_cards, {
                code: events[events.length - 1].returnValues.dealer_card.code,
                value: events[events.length - 1].returnValues.dealer_card.value
              }]
            }));
            if (events.length < 2) {
              setLoading(currentState => ({
                ...currentState,
                percentage: currentState.percentage + 20
              }));
            } else if (events.length === 2) {
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
        }
      }
    );
  }

  const checkGameWon = async (id) => {
    await web3State.contract.getPastEvents("GameWon", {
      filter: {game_id: id},
      fromBlock: latestBlock
    },
      (error, events) => {
        if (error) {
          console.log(error);
        } else if (typeof events[0] !== "undefined") {
          let winnerString = "";
          if (events[0].returnValues.winner === "0") winnerString = "Dealer";
          if (events[0].returnValues.winner === "1") winnerString = "Player";
          if (events[0].returnValues.winner === "2") winnerString = "Tie";
          clearInterval(playerEventIntervalId);
          clearInterval(dealerEventIntervalId);
          clearInterval(gameWonIntervalId);
          checkForPlayerCards();
          checkForDealerCards();
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
      }
    );
  }

  const playerHit = async () => {
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
      setToasts(currentState => [...currentState, `https://kovan.etherscan.io/tx/${hash}`]);
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
      setToasts(currentState => [...currentState, `https://kovan.etherscan.io/tx/${hash}`]);
      setLoading(currentState => ({
        ...currentState,
        status: true,
        message: "Dealer's turn now. Waiting for their move...",
        percentage: 20
      }));
    })
    .once('receipt', (receipt) => {
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
      setToasts(currentState => [...currentState, `https://kovan.etherscan.io/tx/${hash}`]);
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
      console.log("==========error==========");
      console.log(error);
      setLoading(currentState => ({
        ...currentState,
        status: false
      }));
    });
  }

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
      setToasts(currentState => [...currentState, `https://kovan.etherscan.io/tx/${hash}`]);
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
    clearInterval(playerEventIntervalId);
    clearInterval(dealerEventIntervalId);
    clearInterval(gameWonIntervalId);
    setGame({
      id: 0,
      player_cards: [],
      dealer_cards: []
    });
    setToasts([]);
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
    <Container>
      <Card style={{ height: "75vh" }} className="mx-auto my-3 w-100">
        <Card.Body>
          <div className="d-flex align-items-start flex-column h-100">
            <div className="mb-auto w-100 text-center">
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
                return <Image key={`dealer_img_${index}`} src={src} alt={`Dealer card ${index}`} fluid className="card_pictures"/>
              })}
            </div>
            <div className="w-100">
              {winner.chosen && <Alert variant="success">
                <h4>The winner is determined to be ....... {winner.name}!</h4>
              </Alert>}
            </div>
            <div className="mt-auto w-100 text-center">
              {game.player_cards.map((value, index) => {
                return <Image key={`player_img_${index}`} src={`https://deckofcardsapi.com/static/img/${value.code}.png`} alt={`Player card ${index}`} fluid className="card_pictures"/>
              })}
            </div>
          </div>

        </Card.Body>
        <Card.Footer>
          <Col>
            <Row>
              <Col md={2}>
                <h5>Your Balance: {(web3State.playerBalance / 10 ** 18).toFixed(4)}</h5>
                <br/>
                <br/>
                <h5>Dealer Balance: {(web3State.dealerBalance / 10 ** 18).toFixed(4)}</h5>
              </Col>
              <Col>
                <GameButtons
                  newGame={newGame}
                  playerHit={playerHit}
                  playerStand={playerStand}
                  playerSurrender={playerSurrender}
                  resetGame={resetGame}
                  buttons={buttons}
                  loadingStatus={loadingStatus}
                />
              </Col>
            </Row>
          </Col>
        </Card.Footer>
      </Card>
      {/* <Accordion className="mt-5 w-50">
        <Card>
          <Card.Header>
            <Accordion.Toggle as={Button} variant="link" eventKey="0">
              Debug Menu
            </Accordion.Toggle>
          </Card.Header>
          <Accordion.Collapse eventKey="0">
            <Card.Body>
              <p>{game.id}</p>
              {game.dealer_cards.map((value, index) => {
                return <p key={`dealer_p_${index}`}>Dealer {index}: {value.code} = {value.value}</p>
              })}
              {game.player_cards.map((value, index) => {
                return <p key={`player_p_${index}`}>Player {index}: {value.code} = {value.value}</p>
              })}
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      </Accordion> */}
      <Button variant="dark" size="large" id="withdraw_button" onClick={withdraw}><h4>Withdraw Winnings</h4></Button>
    </Container>
  );
}

export default Main;