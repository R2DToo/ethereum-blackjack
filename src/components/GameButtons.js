import Button from 'react-bootstrap/Button';

const GameButtons = ({newGame, playerHit, playerStand, playerSurrender, resetGame, buttons}) => {
  return (
    <div className="d-flex justify-content-center">
      {buttons.new && <Button
        type="button"
        variant="primary"
        className="mr-2 mt-0"
        size="lg"
        block
        onClick={() => {
          newGame();
        }}
      >
        New Game
      </Button>}
      {buttons.hit && <Button
        type="button"
        variant="primary"
        className="mr-2 mt-0"
        size="lg"
        block
        onClick={() => {
          playerHit();
        }}
      >
        Hit
      </Button>}
      {buttons.stand && <Button
        type="button"
        variant="primary"
        className="mr-2 mt-0"
        size="lg"
        block
        onClick={() => {
          playerStand();
        }}
      >
        Stand
      </Button>}
      {buttons.double && <Button
        type="button"
        variant="primary"
        className="mr-2 mt-0"
        size="lg"
        block
      >
        Double
      </Button>}
      {buttons.split && <Button
        type="button"
        variant="primary"
        className="mr-2 mt-0"
        size="lg"
        block
      >
        Split
      </Button>}
      {buttons.surrender && <Button
        type="button"
        variant="primary"
        className="mr-2 mt-0"
        size="lg"
        block
        onClick={() => {
          playerSurrender();
        }}
      >
        Surrender
      </Button>}
      {buttons.reset && <Button
        type="button"
        variant="primary"
        className="mr-2 mt-0"
        size="lg"
        block
        onClick={() => {
          resetGame();
        }}
      >
        Reset
      </Button>}
    </div>
  );
}

export default GameButtons;