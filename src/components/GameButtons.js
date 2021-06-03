import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import pokerChipPrimary from './images/pokerchip-primary.png';
import pokerChipComplementary from './images/pokerchip-complementary.png';
import pokerChipAnalogous0 from './images/pokerchip-analogous0.png';
import pokerChipAnalogous1 from './images/pokerchip-analogous1.png';
import pokerChipTriadic0 from './images/pokerchip-triadic0.png';
import pokerChipTriadic1 from './images/pokerchip-triadic1.png';

const GameButtons = ({newGame, playerHit, playerStand, playerDouble, playerSurrender, resetGame, buttons, loadingStatus}) => {
  const [bet, setBet] = useState("0");

  return (
    <>
      {buttons.new && <Row md={{cols:6}} xs={{cols:3}} className="justify-content-center">
        <Col className="chip_pictures">
          <label>
            <input type="radio" name="chip_bet" value="100000000000000" onClick={(e) => setBet(e.target.value)} defaultChecked={bet==="100000000000000"?true:false} disabled={loadingStatus?true:false}/>
            <Image src={pokerChipTriadic0} fluid roundedCircle/>
          </label>
        </Col>
        <Col className="chip_pictures">
          <label>
            <input type="radio" name="chip_bet" value="1000000000000000" onClick={(e) => setBet(e.target.value)} defaultChecked={bet==="1000000000000000"?true:false} disabled={loadingStatus?true:false}/>
            <Image src={pokerChipComplementary} fluid roundedCircle/>
          </label>
        </Col>
        <Col className="chip_pictures">
          <label>
            <input type="radio" name="chip_bet" value="5000000000000000" onClick={(e) => setBet(e.target.value)} defaultChecked={bet==="5000000000000000"?true:false} disabled={loadingStatus?true:false}/>
            <Image src={pokerChipPrimary} fluid roundedCircle/>
          </label>
        </Col>
        <Col className="chip_pictures">
          <label>
            <input type="radio" name="chip_bet" value="10000000000000000" onClick={(e) => setBet(e.target.value)} defaultChecked={bet==="10000000000000000"?true:false} disabled={loadingStatus?true:false}/>
            <Image src={pokerChipAnalogous0} fluid roundedCircle/>
          </label>
        </Col>
        <Col className="chip_pictures">
          <label>
            <input type="radio" name="chip_bet" value="50000000000000000" onClick={(e) => setBet(e.target.value)} defaultChecked={bet==="50000000000000000"?true:false} disabled={loadingStatus?true:false}/>
            <Image src={pokerChipAnalogous1} fluid roundedCircle/>
          </label>
        </Col>
        <Col className="chip_pictures">
          <label>
            <input type="radio" name="chip_bet" value="100000000000000000" onClick={(e) => setBet(e.target.value)} defaultChecked={bet==="100000000000000000"?true:false} disabled={loadingStatus?true:false}/>
            <Image src={pokerChipTriadic1} fluid roundedCircle/>
          </label>
        </Col>
      </Row>}
      <Row className={buttons.new?"mt-3":""}>
        {buttons.new && <Col xs={12}><Button
          type="button"
          variant="primary"
          size="lg"
          block
          onClick={() => {
            newGame(bet);
          }}
          disabled={bet<=0||loadingStatus?true:false}
        >
          New Game
        </Button></Col>}
        {buttons.hit && <Col lg={true} md={6} xs={12}><Button
          type="button"
          variant="primary"
          className="mr-2"
          size="lg"
          block
          onClick={() => {
            playerHit();
          }}
          disabled={loadingStatus?true:false}
        >
          Hit
        </Button></Col>}
        {buttons.stand && <Col lg={true} md={6} xs={12}><Button
          type="button"
          variant="primary"
          className="mr-2"
          size="lg"
          block
          onClick={() => {
            playerStand();
          }}
          disabled={loadingStatus?true:false}
        >
          Stand
        </Button></Col>}
        {buttons.double && <Col lg={true} md={6} xs={12}><Button
          type="button"
          variant="primary"
          className="mr-2"
          size="lg"
          block
          onClick={() => {
            playerDouble(bet);
          }}
          disabled={loadingStatus?true:false}
        >
          Double
        </Button></Col>}
        {buttons.split && <Col lg={true} md={6} xs={12}><Button
          type="button"
          variant="primary"
          className="mr-2"
          size="lg"
          block
          disabled={loadingStatus?true:false}
        >
          Split
        </Button></Col>}
        {buttons.surrender && <Col lg={true} md={6} xs={12}><Button
          type="button"
          variant="primary"
          className="mr-2"
          size="lg"
          block
          onClick={() => {
            playerSurrender();
          }}
          disabled={loadingStatus?true:false}
        >
          Surrender
        </Button></Col>}
        {buttons.reset && <Col xs={12}><Button
          type="button"
          variant="primary"
          size="lg"
          block
          onClick={() => {
            resetGame();
          }}
          disabled={loadingStatus?true:false}
        >
          Reset
        </Button></Col>}
      </Row>
    </>
  );
}

export default GameButtons;