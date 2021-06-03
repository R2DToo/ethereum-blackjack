import Button from 'react-bootstrap/Button';
import Navbar from 'react-bootstrap/Navbar';

const NavigationBar = ({account, loadBlockchainData}) => {
  return (
    <Navbar bg="dark" variant="dark" expand="md">
      <Navbar.Brand href="/">♥♣Blackjack♠♦</Navbar.Brand>
      <Navbar.Toggle />
      <Navbar.Collapse className="justify-content-end">
        {account ?
          <Navbar.Text>Hello, {account}</Navbar.Text> :
          <Button variant="success" onClick={async () => {await loadBlockchainData}}>Connect Wallet</Button>
        }
      </Navbar.Collapse>
    </Navbar>

  );
}

export default NavigationBar;