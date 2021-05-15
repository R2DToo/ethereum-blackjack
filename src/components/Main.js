import customCardBacking from './customCardBacking.png';

const Main = ({newGame, playerHit, playerStand, game, buttons}) => {
  return (
    <div className="card mx-auto" style={{width: "90%"}}>
      <div className="card-body">
        <div id="game_area">
          <div id="dealer_hand">
            {game.dealer_cards.map((value, index) => {
              let src = "";
              if (game.dealer_cards.length === 2) {
                if (index === 1) {
                  src=customCardBacking
                } else {
                  src=`https://deckofcardsapi.com/static/img/${value.code}.png`
                }
              } else {
                src=`https://deckofcardsapi.com/static/img/${value.code}.png`
              }
              return <img key={`dealer_${index}`} src={src} alt="" />
            })}
          </div>
          <div id="player_hand">
            {game.player_cards.map((value, index) => {
              return <img key={`player_${index}`} src={`https://deckofcardsapi.com/static/img/${value.code}.png`} alt="" />
            })}
          </div>
        </div>
        <p>{game.id} - {game.deck_id}</p>
        {game.dealer_cards.map((value, index) => {
          return <p>Dealer {index}: {value.code} = {value.value}</p>
        })}
        {game.player_cards.map((value, index) => {
          return <p>Player {index}: {value.code} = {value.value}</p>
        })}
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
        {buttons.surrender && <button type="button" className="btn btn-primary mx-1">Surrender</button>}
      </div>
    </div>
  );
}

export default Main;