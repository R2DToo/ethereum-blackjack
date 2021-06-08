import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';

const NavigationBar = ({account, withdraw}) => {
  const [showModal, setShowModal] = useState(false);

  const handleShow = () => setShowModal(true);
  const handleClose = () => setShowModal(false);

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Navbar.Brand href="/">♥♣Blackjack♠♦</Navbar.Brand>
        <Navbar.Brand href="https://github.com/R2DToo/ethereum-blackjack" target="_blank" rel="noopener noreferrer">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-github" viewBox="0 0 16 16">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
        </svg>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar" style={{backgroundColor: "theme-color('primary')"}}/>
        <Navbar.Collapse id="responsive-navbar" className="justify-content-end">
          <Button className="nav-link my-1 mr-1" onClick={handleShow}>Rules/Information</Button>
          {account && <Button className="nav-link my-1 mr-1" onClick={withdraw} style={{backgroundColor: "#7b64ed"}} variant="dark">🎉 Withdraw Winnings 💲</Button>}
          {account && <Navbar.Text>
            <p id="account_greeting">Hello, {account}</p>
          </Navbar.Text>}
        </Navbar.Collapse>
      </Navbar>
      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Nav variant="pills" defaultActiveKey="information">
            <Nav.Item>
              <Nav.Link href="#information" eventKey="information">Information</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link href="#how_to_play" eventKey="how_to_play">How To Play</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link href="#rules" eventKey="rules">Rules</Nav.Link>
            </Nav.Item>
          </Nav>
        </Modal.Header>
        <Modal.Body>
          <section id="information">
            <h3>Information</h3>
            <p>You will need a <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer">MetaMask</a> wallet installed and set to the Kovan Test Network</p>
            <p>Testing ETH is required to make bets and can be gathered in 2 ways</p>
            <ul>
              <li>If you have a GitHub account then proceed to the <a href="https://faucet.kovan.network/" target="_blank" rel="noopener noreferrer">Kovan Faucet</a></li>
              <li>If you do not have or wish to setup a GitHub account please fill out the <a href="https://stillroutley.dev/#contact" target="_blank" rel="noopener noreferrer">Contact Me</a> Form
              and provide your MetaMask Account Address in the message slot. The address will look similar to this: 0xE336471F8fq06277f082E46F0G0C2e29AkeaP61A<br/>
              <small>This option will take more time as it is manually done by myself. If possible, use the faucet for a quicker experience :)</small></li>
            </ul>
          </section>

          <section id="how_to_play">
            <h3>How To Play</h3>
            <ol>
              <li>To start the game, click on the chip with the amount of ETH you wish to bet and then click the New Game button.</li>
              <li>A new transaction will pop up from your MetaMask wallet which allows you to confirm the transaction and check the gas being used.</li>
              <li>Once the transaction is confirmed, 2 cards will be dealt to you and the dealer.<p><small>This may take up to a minute</small></p></li>
              <li>
                When the cards have been dealt to both you and the dealer, you will have 4 options
                <ul>
                  <li>Hit (Ask for another card)</li>
                  <li>Stand (Pass turn to the dealer)</li>
                  <li>Double (Double initial bet and receive one card, then the turn is passed to the dealer)</li>
                  <li>Surrender (Give up, lose your initial bet and the dealer wins)</li>
                </ul>
              </li>
              <li>The goal is to get a higher total than the dealer, without going over 21.</li>
              <li>
                Once you have won atleast one game, the 🎉 Withdraw Winnings 💲 button in the navigation bar will allow you to take out the ETH you won.
                <p className="font-weight-bold">It is important you remember this button as it is the only way to receive the ETH you won.</p>
              </li>
            </ol>
          </section>

          <section id="rules">
            <h3>Rules</h3>
            <a href="https://en.wikipedia.org/wiki/Blackjack#Rules" target="_blank" rel="noopener noreferrer">General Rules</a>
            <h5>House Rules</h5>
            <ul>
              <li>If either the dealer or player receives a total of 21 in the first 2 cards, that party wins immediately. <p>(This is refered to as a natural blackjack)</p></li>
              <li>If the player gets a total of 21 after the first 2 cards, the dealer will take their turn to try and match it.</li>
              <li>Dealer does not hit on a "soft" 17</li>
              <li>
                Payouts
                <ul>
                  <li>Natural Blackjack 2:3</li>
                  <li>Player Wins 1:1</li>
                </ul>
              </li>
            </ul>
          </section>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default NavigationBar;