const Navbar = ({account}) => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <a className="navbar-brand mb-0 h1" href="/">♥♣Blackjack♠♦</a>
        <span className="navbar-text">Hello, {account}</span>
      </div>
    </nav>
  );
}

export default Navbar;