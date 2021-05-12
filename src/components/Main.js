const Main = ({newGame}) => {
  return (
    <div className="card mx-auto" style={{width: "90%"}}>
      <div className="card-body">
        <div id="game_area">

        </div>
        <div className="button-group">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              newGame();
          }}>
            New Game
            </button>
        </div>
        <div id="game_buttons" style={{display: "none"}}>
          <button type="button" className="btn btn-primary">Hit</button>
          <button type="button" className="btn btn-primary">Stand</button>
          <button type="button" className="btn btn-primary">Double</button>
          <button type="button" className="btn btn-primary">Split</button>
          <button type="button" className="btn btn-primary">Surrender</button>
        </div>
      </div>
    </div>
  );
}

export default Main;