import Alert from 'react-bootstrap/Alert';
import Accordion from 'react-bootstrap/Accordion';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Image from 'react-bootstrap/Image';
import customCardBacking from './customCardBacking.png';
import GameButtons from './GameButtons';

const Main = ({newGame, playerHit, playerStand, playerSurrender, resetGame, game, buttons, winner}) => {
  return (
    <>
      <Card style={{ width: "90%"}} className="mx-auto my-3">
        <Card.Body>
          <div id="game_area" className="pb-3">
            <div>
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
                return <Image key={`dealer_img_${index}`} src={src} alt={`Dealer card ${index}`} />
              })}
            </div>
            <div>
              {game.player_cards.map((value, index) => {
                return <Image key={`player_img_${index}`} src={`https://deckofcardsapi.com/static/img/${value.code}.png`} alt={`Player card ${index}`} />
              })}
            </div>
          </div>
          {winner.chosen && <Alert variant="success">
            <h4>The winner is determined to be ....... {winner.name}!</h4>
          </Alert>}
          <GameButtons
            newGame={newGame}
            playerHit={playerHit}
            playerStand={playerStand}
            playerSurrender={playerSurrender}
            resetGame={resetGame}
            buttons={buttons}
          />
        </Card.Body>
      </Card>
      <Accordion className="mt-5 w-50">
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
      </Accordion>
    </>
  );
}

export default Main;