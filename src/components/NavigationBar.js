import Button from 'react-bootstrap/Button';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';

const NavigationBar = ({account, loadBlockchainData, withdraw}) => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Navbar.Brand href="/">♥♣Blackjack♠♦</Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar" style={{backgroundColor: "theme-color('primary')"}}/>
      <Navbar.Collapse id="responsive-navbar" className="justify-content-end">
        <Button className="nav-link my-1 mr-1" block>Rules</Button>
        {account && <Button className="nav-link my-1 mr-1" block onClick={withdraw} style={{backgroundColor: "#7b64ed"}} variant="dark">🎉 Withdraw Winnings 💲</Button>}
        {account && <Navbar.Text>
          <p id="account_greeting">Hello, {account}</p>
        </Navbar.Text>}
      </Navbar.Collapse>
    </Navbar>

  );
}

export default NavigationBar;