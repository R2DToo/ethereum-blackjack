import customCardBacking from './customCardBacking.png';

const Main = ({newGame, playerHit, playerStand, playerSurrender, resetGame, game, buttons, winner}) => {
  return (
    <>
      <div className="card mx-auto m-3" style={{width: "90%"}}>
        <div className="card-body">
          <div id="game_area" className="pb-3">
            <div id="dealer_hand">
              {game.dealer_cards.map((value, index) => {
                let src = "";
                if (game.dealer_cards.length === 2 && !winner.chosen) {
                  if (index === 1) {
                    src=customCardBacking
                  } else {
                    src=`https://deckofcardsapi.com/static/img/${value.code}.png`
                  }
                } else {
                  src=`https://deckofcardsapi.com/static/img/${value.code}.png`
                }
                return <img key={`dealer_img_${index}`} src={src} alt="" />
              })}
            </div>
            <div id="player_hand">
              {game.player_cards.map((value, index) => {
                return <img key={`player_img_${index}`} src={`https://deckofcardsapi.com/static/img/${value.code}.png`} alt="" />
              })}
            </div>
          </div>
          {winner.chosen && <div className="alert alert-success" role="alert">
            <h4>The winner is determined to be ....... {winner.name}!</h4>
          </div>}
          {buttons.new && <button
            type="button"
            className="btn btn-primary mx-1"
            id="btn_new_game"
            onClick={() => {
              newGame();
            }}
          >
            New Game
          </button>}
          {buttons.hit && <button
            type="button"
            className="btn btn-primary mx-1"
            onClick={() => {
              playerHit();
            }}
          >
            Hit
          </button>}
          {buttons.stand && <button
            type="button"
            className="btn btn-primary mx-1"
            onClick={() => {
              playerStand();
            }}
          >
            Stand
          </button>}
          {buttons.double && <button type="button" className="btn btn-primary mx-1">Double</button>}
          {buttons.split && <button type="button" className="btn btn-primary mx-1">Split</button>}
          {buttons.surrender && <button
            type="button"
            className="btn btn-primary mx-1"
            onClick={() => {
              playerSurrender();
            }}
          >
            Surrender
          </button>}
          {buttons.reset && <button
            type="button"
            className="btn btn-primary mx-1"
            onClick={() => {
              resetGame();
            }}
          >
            Reset
          </button>}
        </div>
      </div>
      <button className="btn btn-primary mx-auto" type="button" data-bs-toggle="collapse" data-bs-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample">
        Debug Values
      </button>
      <div className="collapse" id="collapseExample">
        <div className="card card-body">
          <p>{game.id}</p>
          {game.dealer_cards.map((value, index) => {
            return <p key={`dealer_p_${index}`}>Dealer {index}: {value.code} = {value.value}</p>
          })}
          {game.player_cards.map((value, index) => {
            return <p key={`player_p_${index}`}>Player {index}: {value.code} = {value.value}</p>
          })}
        </div>
      </div>
    </>
  );
}

export default Main;