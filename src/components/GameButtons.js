import Button from 'react-bootstrap/Button';

const GameButtons = ({newGame, playerHit, playerStand, playerSurrender, resetGame, buttons}) => {
  return (
    <>
      {buttons.new && <Button
        type="button"
        variant="primary"
        className="mr-2"
        onClick={() => {
          newGame();
        }}
      >
        New Game
      </Button>}
      {buttons.hit && <Button
        type="button"
        variant="primary"
        className="mr-2"
        onClick={() => {
          playerHit();
        }}
      >
        Hit
      </Button>}
      {buttons.stand && <Button
        type="button"
        variant="primary"
        className="mr-2"
        onClick={() => {
          playerStand();
        }}
      >
        Stand
      </Button>}
      {buttons.double && <Button
        type="button"
        variant="primary"
        className="mr-2"
      >
        Double
      </Button>}
      {buttons.split && <Button
        type="button"
        variant="primary"
        className="mr-2"
      >
        Split
      </Button>}
      {buttons.surrender && <Button
        type="button"
        variant="primary"
        className="mr-2"
        onClick={() => {
          playerSurrender();
        }}
      >
        Surrender
      </Button>}
      {buttons.reset && <Button
        type="button"
        variant="primary"
        className="mr-2"
        onClick={() => {
          resetGame();
        }}
      >
        Reset
      </Button>}
    </>
  );
}

export default GameButtons;