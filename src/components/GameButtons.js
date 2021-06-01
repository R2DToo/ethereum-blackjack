import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image';
import Row from 'react-bootstrap/Row';
import pokerChipPrimary from './images/pokerchip-primary.png';
import pokerChipComplementary from './images/pokerchip-complementary.png';
import pokerChipAnalogous0 from './images/pokerchip-analogous0.png';
import pokerChipAnalogous1 from './images/pokerchip-analogous1.png';
import pokerChipTriadic0 from './images/pokerchip-triadic0.png';
import pokerChipTriadic1 from './images/pokerchip-triadic1.png';

const GameButtons = ({newGame, playerHit, playerStand, playerSurrender, resetGame, buttons, loadingStatus}) => {
  const [bet, setBet] = useState(0);

  return (
    <>
      {buttons.new && <Row>
        <div className="text-center">
          <label>
            <input type="radio" name="chip_bet" value="100000000000000" onClick={(e) => setBet(e.target.value)} checked={bet==="100000000000000"?true:false}/>
            <Image src={pokerChipTriadic0} fluid roundedCircle className="chip_pictures mx-2"/>
          </label>
          <label>
            <input type="radio" name="chip_bet" value="1000000000000000" onClick={(e) => setBet(e.target.value)} checked={bet==="1000000000000000"?true:false}/>
            <Image src={pokerChipComplementary} fluid roundedCircle className="chip_pictures mx-2"/>
          </label>
          <label>
            <input type="radio" name="chip_bet" value="5000000000000000" onClick={(e) => setBet(e.target.value)} checked={bet==="5000000000000000"?true:false}/>
            <Image src={pokerChipPrimary} fluid roundedCircle className="chip_pictures mx-2"/>
          </label>
          <label>
            <input type="radio" name="chip_bet" value="10000000000000000" onClick={(e) => setBet(e.target.value)} checked={bet==="10000000000000000"?true:false}/>
            <Image src={pokerChipAnalogous0} fluid roundedCircle className="chip_pictures mx-2"/>
          </label>
          <label>
            <input type="radio" name="chip_bet" value="50000000000000000" onClick={(e) => setBet(e.target.value)} checked={bet==="50000000000000000"?true:false}/>
            <Image src={pokerChipAnalogous1} fluid roundedCircle className="chip_pictures mx-2"/>
          </label>
          <label>
            <input type="radio" name="chip_bet" value="100000000000000000" onClick={(e) => setBet(e.target.value)} checked={bet==="100000000000000000"?true:false}/>
            <Image src={pokerChipTriadic1} fluid roundedCircle className="chip_pictures mx-2"/>
          </label>
        </div>
      </Row>}
      <Row>
        <div className="d-flex justify-content-center w-100 mt-3">
          {buttons.new && <Button
            type="button"
            variant="primary"
            className="mt-0"
            size="lg"
            block
            onClick={() => {
              newGame(bet);
            }}
            disabled={bet<=0||loadingStatus?true:false}
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
            disabled={loadingStatus?true:false}
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
            disabled={loadingStatus?true:false}
          >
            Stand
          </Button>}
          {buttons.double && <Button
            type="button"
            variant="primary"
            className="mr-2 mt-0"
            size="lg"
            block
            disabled={loadingStatus?true:false}
          >
            Double
          </Button>}
          {buttons.split && <Button
            type="button"
            variant="primary"
            className="mr-2 mt-0"
            size="lg"
            block
            disabled={loadingStatus?true:false}
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
            disabled={loadingStatus?true:false}
          >
            Surrender
          </Button>}
          {buttons.reset && <Button
            type="button"
            variant="primary"
            className="mt-0"
            size="lg"
            block
            onClick={() => {
              resetGame();
            }}
            disabled={loadingStatus?true:false}
          >
            Reset
          </Button>}
        </div>
      </Row>
    </>
  );
}

export default GameButtons;