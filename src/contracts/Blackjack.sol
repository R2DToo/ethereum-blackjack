// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";

contract Blackjack is ChainlinkClient {

    uint128 private currentGameId = 0;
    uint128 private lastGameId;
    mapping(uint256 => Game) public games;
    address payable private admin;

    bytes32 constant jobId = "b7285d4859da4b289c7861db971baf0a";
    uint256 constant fee = 0.1 * 10 ** 18;

    struct Game {
        uint128 id;
        string deck_id;
        address payable player;
        bytes32 oracle_req_id;
        mapping(uint8 => Card) player_cards;
        mapping(uint8 => Card) dealer_cards;
        uint8 playerCardCount;
        uint8 dealerCardCount;
        Player whos_turn;
        Winner winner;
    }

    struct Card {
        string code;
        uint8 value;
    }

    enum Player { Dealer, Player }

    enum Winner { Dealer, Player, Tie, Unknown }

    event NewGameDealt (
        uint128 indexed game_id,
        address indexed player,
        Card player_card_1,
        Card player_card_2,
        Card dealer_card_1,
        Card dealer_card_2
    );

    event NewPlayerCardDealt (
        uint128 indexed game_id,
        Card player_card
    );

    event NewDealerCardDealt (
        uint128 indexed game_id,
        Card dealer_card
    );

    event GameWon (
        uint128 indexed game_id,
        Winner winner
    );

    constructor() public {
        setPublicChainlinkToken();
        setChainlinkOracle(address(0xAA1DC356dc4B18f30C347798FD5379F3D77ABC5b));
        admin = msg.sender;
    }

    function newGame() public {
        Game memory _newGame;
        _newGame.id = currentGameId;
        lastGameId = currentGameId;
        currentGameId = currentGameId + 1;
        _newGame.player = msg.sender;
        _newGame.whos_turn = Player.Player;
        _newGame.winner = Winner.Unknown;
        _newGame.oracle_req_id = shuffleNewDeckRequest();

        games[lastGameId] = _newGame;
    }

    function shuffleNewDeckRequest() internal returns (bytes32 requestId) {
        Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.shuffleNewDeckResponse.selector);

        request.add("get", "https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1");
        request.add("path", "deck_id");

        return sendChainlinkRequest(request, fee);
    }

    function shuffleNewDeckResponse(bytes32 _requestId, bytes32 _volume) public recordChainlinkFulfillment(_requestId) {
        if (games[lastGameId].oracle_req_id == _requestId) {
            shuffleNewDeck(lastGameId, _volume);
        } else {
            for (uint128 i = 0; i < currentGameId; i++) {
                if (games[i].oracle_req_id == _requestId) {
                    shuffleNewDeck(i, _volume);
                }
            }
        }
    }

    function shuffleNewDeck(uint128 gameIndex, bytes32 response) internal {
        games[gameIndex].deck_id = bytes32ToString(response);
        games[gameIndex].oracle_req_id = drawPlayerCardRequest(gameIndex);
    }

    function drawPlayerCardRequest(uint128 gameIndex) internal returns (bytes32 requestId) {
        Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.drawPlayerCardResponse.selector);
        string memory urlBase = "https://deckofcardsapi.com/api/deck/";
        string memory urlEnd = "/draw/?count=1";
        bytes memory url = abi.encodePacked(urlBase, games[gameIndex].deck_id, urlEnd);

        request.add("get", string(url));
        request.add("path", "cards.0.code");

        return sendChainlinkRequest(request, fee);
    }

    function drawPlayerCardResponse(bytes32 _requestId, bytes32 _volume) public recordChainlinkFulfillment(_requestId) {
        if (games[lastGameId].oracle_req_id == _requestId) {
            drawPlayerCard(lastGameId, _volume);
        } else {
            for (uint128 i = 0; i < currentGameId; i++) {
                if (games[i].oracle_req_id == _requestId) {
                    drawPlayerCard(i, _volume);
                }
            }
        }
    }

    function drawPlayerCard(uint128 gameIndex, bytes32 response) internal {
        string memory valueByte = substring(bytes32ToString(response), 0, 1);
        games[gameIndex].player_cards[games[gameIndex].playerCardCount] = Card(bytes32ToString(response), valueStringToValueUint(valueByte));
        games[gameIndex].playerCardCount = games[gameIndex].playerCardCount + 1;
        if (games[gameIndex].dealerCardCount < 2) {
            games[gameIndex].oracle_req_id = drawDealerCardRequest(gameIndex);
        }
    }

    function drawDealerCardRequest(uint128 gameIndex) internal returns (bytes32 requestId) {
        Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.drawDealerCardResponse.selector);
        string memory urlBase = "https://deckofcardsapi.com/api/deck/";
        string memory urlEnd = "/draw/?count=1";
        bytes memory url = abi.encodePacked(urlBase, games[gameIndex].deck_id, urlEnd);

        request.add("get", string(url));
        request.add("path", "cards.0.code");

        return sendChainlinkRequest(request, fee);
    }

    function drawDealerCardResponse(bytes32 _requestId, bytes32 _volume) public recordChainlinkFulfillment(_requestId) {
        if (games[lastGameId].oracle_req_id == _requestId) {
            drawDealerCard(lastGameId, _volume);
        } else {
            for (uint128 i = 0; i < currentGameId; i++) {
                if (games[i].oracle_req_id == _requestId) {
                    drawDealerCard(i, _volume);
                }
            }
        }
    }

    function drawDealerCard(uint128 gameIndex, bytes32 response) internal {
        string memory valueByte = substring(bytes32ToString(response), 0, 1);
        games[gameIndex].dealer_cards[games[gameIndex].dealerCardCount] = Card(bytes32ToString(response), valueStringToValueUint(valueByte));
        games[gameIndex].dealerCardCount = games[gameIndex].dealerCardCount + 1;
        if (games[gameIndex].playerCardCount < 2) {
            games[gameIndex].oracle_req_id = drawPlayerCardRequest(gameIndex);
        } else {
            emit NewGameDealt(
                games[gameIndex].id,
                games[gameIndex].player,
                games[gameIndex].player_cards[0],
                games[gameIndex].player_cards[1],
                games[gameIndex].dealer_cards[0],
                games[gameIndex].dealer_cards[1]
            );
            checkBlackjack(gameIndex);
        }
    }

    function playerHitRequest(uint128 gameIndex) external {
        require(games[gameIndex].winner == Winner.Unknown, "The winner has already been determined");
        require(games[gameIndex].whos_turn == Player.Player, "It's not your turn");
        require(games[gameIndex].playerCardCount < 11, "You have reached the card limit");
        require(getTotalHandValue(gameIndex, Player.Player) != 21, "You already have blackjack");
        require(getTotalHandValue(gameIndex, Player.Player) < 21, "You have bust");
        Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.playerHitResponse.selector);
        string memory urlBase = "https://deckofcardsapi.com/api/deck/";
        string memory urlEnd = "/draw/?count=1";
        bytes memory url = abi.encodePacked(urlBase, games[gameIndex].deck_id, urlEnd);

        request.add("get", string(url));
        request.add("path", "cards.0.code");

        games[gameIndex].oracle_req_id = sendChainlinkRequest(request, fee);
    }

    function playerHitResponse(bytes32 _requestId, bytes32 _volume) public recordChainlinkFulfillment(_requestId) {
        if (games[lastGameId].oracle_req_id == _requestId) {
            playerHit(lastGameId, _volume);
        } else {
            for (uint128 i = 0; i < currentGameId; i++) {
                if (games[i].oracle_req_id == _requestId) {
                    playerHit(i, _volume);
                }
            }
        }
    }

    function playerHit(uint128 gameIndex, bytes32 response) internal {
        string memory valueByte = substring(bytes32ToString(response), 0, 1);
        games[gameIndex].player_cards[games[gameIndex].playerCardCount] = Card(bytes32ToString(response), valueStringToValueUint(valueByte));

        emit NewPlayerCardDealt(games[gameIndex].id, games[gameIndex].player_cards[games[gameIndex].playerCardCount]);

        games[gameIndex].playerCardCount = games[gameIndex].playerCardCount + 1;
        if (getTotalHandValue(gameIndex, Player.Player) > 21) {
            games[gameIndex].whos_turn = Player.Dealer;
            evaluateHands(gameIndex);
        } else if (games[gameIndex].playerCardCount >= 11 || (getTotalHandValue(gameIndex, Player.Player) == 21)) {
            games[gameIndex].whos_turn = Player.Dealer;
            if (getTotalHandValue(gameIndex, Player.Dealer) < 17) {
                dealerHitRequest(gameIndex);
            } else {
                evaluateHands(gameIndex);
            }
        }
    }

    function playerStand(uint128 gameIndex) external {
        require(games[gameIndex].winner == Winner.Unknown, "The winner has already been determined");
        require(games[gameIndex].whos_turn == Player.Player, "It's not your turn");
        require(games[gameIndex].playerCardCount < 11, "You have reached the card limit");
        require(getTotalHandValue(gameIndex, Player.Player) != 21, "You already have blackjack");
        require(getTotalHandValue(gameIndex, Player.Player) < 21, "You have bust");
        games[gameIndex].whos_turn = Player.Dealer;
        if (getTotalHandValue(gameIndex, Player.Dealer) < 17) {
            dealerHitRequest(gameIndex);
        } else {
            evaluateHands(gameIndex);
        }
    }

    function playerSurrender(uint128 gameIndex) external {
        require(games[gameIndex].winner == Winner.Unknown, "The winner has already been determined");
        require(games[gameIndex].whos_turn == Player.Player, "It's not your turn");
        require(games[gameIndex].playerCardCount < 11, "You have reached the card limit");
        require(getTotalHandValue(gameIndex, Player.Player) != 21, "You already have blackjack");
        require(getTotalHandValue(gameIndex, Player.Player) < 21, "You have bust");
        games[gameIndex].winner = Winner.Dealer;
        emit GameWon(games[gameIndex].id, games[gameIndex].winner);
    }

    function dealerHitRequest(uint128 gameIndex) internal {
        require(games[gameIndex].winner == Winner.Unknown, "The winner has already been determined");
        require(games[gameIndex].whos_turn == Player.Dealer, "It's not your turn");
        require(games[gameIndex].dealerCardCount < 11, "You have reached the card limit");
        require(getTotalHandValue(gameIndex, Player.Dealer) != 21, "You already have blackjack");
        require(getTotalHandValue(gameIndex, Player.Dealer) < 21, "You have bust");
        Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.dealerHitResponse.selector);
        string memory urlBase = "https://deckofcardsapi.com/api/deck/";
        string memory urlEnd = "/draw/?count=1";
        bytes memory url = abi.encodePacked(urlBase, games[gameIndex].deck_id, urlEnd);

        request.add("get", string(url));
        request.add("path", "cards.0.code");

        games[gameIndex].oracle_req_id = sendChainlinkRequest(request, fee);
    }

    function dealerHitResponse(bytes32 _requestId, bytes32 _volume) public recordChainlinkFulfillment(_requestId) {
        if (games[lastGameId].oracle_req_id == _requestId) {
            dealerHit(lastGameId, _volume);
        } else {
            for (uint128 i = 0; i < currentGameId; i++) {
                if (games[i].oracle_req_id == _requestId) {
                    dealerHit(i, _volume);
                }
            }
        }
    }

    function dealerHit(uint128 gameIndex, bytes32 response) internal {
        string memory valueByte = substring(bytes32ToString(response), 0, 1);
        games[gameIndex].dealer_cards[games[gameIndex].dealerCardCount] = Card(bytes32ToString(response), valueStringToValueUint(valueByte));

        emit NewDealerCardDealt(games[gameIndex].id, games[gameIndex].dealer_cards[games[gameIndex].dealerCardCount]);

        games[gameIndex].dealerCardCount = games[gameIndex].dealerCardCount + 1;
        checkBlackjack(gameIndex);
        if (games[gameIndex].dealerCardCount < 11 && getTotalHandValue(gameIndex, Player.Dealer) < 17) {
            dealerHitRequest(gameIndex);
        } else {
            evaluateHands(gameIndex);
        }
    }

    function getTotalHandValue(uint128 gameIndex, Player player) internal returns (uint8) {
        uint8 handTotal = 0;
        uint8 newHandTotal = 0;
        if (player == Player.Player) {
            for(uint8 i = 0; i < games[gameIndex].playerCardCount; i++) {
                handTotal = handTotal + games[gameIndex].player_cards[i].value;
            }
            if (handTotal > 21) {
                for(uint8 i = 0; i < games[gameIndex].playerCardCount; i++) {
                    if (equals(substring(games[gameIndex].player_cards[i].code, 0, 1), "A")) {
                        games[gameIndex].player_cards[i].value = uint8(1);
                        newHandTotal = newHandTotal + 1;
                    } else {
                        newHandTotal = newHandTotal + games[gameIndex].player_cards[i].value;
                    }
                }
                handTotal = newHandTotal;
            }
        } else if (player == Player.Dealer) {
            for(uint8 i = 0; i < games[gameIndex].dealerCardCount; i++) {
                handTotal = handTotal + games[gameIndex].dealer_cards[i].value;
            }
            if (handTotal >= 17 && handTotal != 21) {
                for(uint8 i = 0; i < games[gameIndex].dealerCardCount; i++) {
                    if (equals(substring(games[gameIndex].dealer_cards[i].code, 0, 1), "A")) {
                        games[gameIndex].dealer_cards[i].value = uint8(1);
                        newHandTotal = newHandTotal + 1;
                    } else {
                        newHandTotal = newHandTotal + games[gameIndex].dealer_cards[i].value;
                    }
                }
                handTotal = newHandTotal;
            }
        }
        return handTotal;
    }

    function checkBlackjack(uint128 gameIndex) internal {
        uint8 playerCardValueTotal = getTotalHandValue(gameIndex, Player.Player);
        uint8 dealerCardValueTotal = getTotalHandValue(gameIndex, Player.Dealer);
        if (playerCardValueTotal == 21 && dealerCardValueTotal == 21) {
            games[gameIndex].winner = Winner.Tie;
        } else if (playerCardValueTotal == 21) {
            games[gameIndex].winner = Winner.Player;
        } else if (dealerCardValueTotal == 21) {
            games[gameIndex].winner = Winner.Dealer;
        } else {
            games[gameIndex].winner = Winner.Unknown;
        }
        if (games[gameIndex].winner != Winner.Unknown) {
            emit GameWon(games[gameIndex].id, games[gameIndex].winner);
        }
    }

    function evaluateHands(uint128 gameIndex) internal {
        uint8 playerCardValueTotal = getTotalHandValue(gameIndex, Player.Player);
        uint8 dealerCardValueTotal = getTotalHandValue(gameIndex, Player.Dealer);
        if (playerCardValueTotal > 21 && dealerCardValueTotal > 21) {
            games[gameIndex].winner = Winner.Tie;
        } else if (playerCardValueTotal > 21 && dealerCardValueTotal <= 21) {
            games[gameIndex].winner = Winner.Dealer;
        } else if (dealerCardValueTotal > 21 && playerCardValueTotal <= 21) {
            games[gameIndex].winner = Winner.Player;
        } else if (playerCardValueTotal > dealerCardValueTotal) {
            games[gameIndex].winner = Winner.Player;
        } else if (playerCardValueTotal < dealerCardValueTotal) {
            games[gameIndex].winner = Winner.Dealer;
        } else if (playerCardValueTotal == dealerCardValueTotal) {
            games[gameIndex].winner = Winner.Tie;
        }
        if (games[gameIndex].winner != Winner.Unknown) {
            emit GameWon(games[gameIndex].id, games[gameIndex].winner);
        }
    }

    function valueStringToValueUint(string memory _value) internal pure returns (uint8) {
        if (equals(_value, "J") || equals(_value, "Q") || equals(_value, "K") || equals(_value, "0")) {
            _value = "10";
        } else if (equals(_value, "A")) {
            _value = "11";
        }
        return stringToUint(_value);
    }

    function bytes32ToString(bytes32 _bytes32) internal pure returns (string memory) {
        uint8 i = 0;
        while(i < 32 && _bytes32[i] != 0) {
            i++;
        }
        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }

    function stringToBytes32(string memory source) internal pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly { // solhint-disable-line no-inline-assembly
            result := mload(add(source, 32))
        }
    }

    function stringToUint(string memory s) internal pure returns (uint8 result) {
        bytes memory b = bytes(s);
        uint i;
        result = 0;
        for (i = 0; i < b.length; i++) {
            uint8 c = uint8(b[i]);
            if (c >= 48 && c <= 57) {
                result = result * 10 + (c - 48);
            }
        }
    }

    function substring(string memory str, uint startIndex, uint endIndex) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(endIndex-startIndex);
        for(uint i = startIndex; i < endIndex; i++) {
            result[i-startIndex] = strBytes[i];
        }
        return string(result);
    }

    function equals(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
}