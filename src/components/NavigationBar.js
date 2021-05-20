import Navbar from 'react-bootstrap/Navbar';

const NavigationBar = ({account}) => {
  return (
    <Navbar bg="dark" variant="dark" expand="sm">
      <Navbar.Brand href="/">♥♣Blackjack♠♦</Navbar.Brand>
      <Navbar.Toggle />
      <Navbar.Collapse className="justify-content-end">
        <Navbar.Text>Hello, {account}</Navbar.Text>
      </Navbar.Collapse>
    </Navbar>

  );
}

export default NavigationBar;