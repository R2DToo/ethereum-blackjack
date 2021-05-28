// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "https://github.com/smartcontractkit/chainlink/blob/develop/evm-contracts/src/v0.6/VRFConsumerBase.sol";

contract Blackjack2 is VRFConsumerBase {

    uint256 public checker;
    uint128 private currentGameId = 0;
    uint128 private lastGameId;
    mapping(uint256 => Game) public games;
    address payable private admin;

    bytes32 internal keyHash;
    uint256 internal fee;
    address constant VRFC_ADDRESS = 0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9;
    address constant LINK_ADDRESS = 0xa36085F69e2889c224210F603D836748e7dC0088;
    uint256 constant USER_SEED = 456513215649823187987;

    string[] private CARD_CODES = ["AH", "AD", "AC", "AS", "2H", "2D", "2C", "2S", "3H", "3D", "3C", "3S", "4H", "4D", "4C", "4S", "5H", "5D", "5C", "5S", "6H", "6D", "6C", "6S", "7H", "7D", "7C", "7S", "8H", "8D", "8C", "8S", "9H", "9D", "9C", "9S", "0H", "0D", "0C", "0S", "JH", "JD", "JC", "JS", "QH", "QD", "QC", "QS", "KH", "KD", "KC", "KS"];


    struct Game {
        uint128 id;
        address payable player;
        uint256 bet;
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

    event NewGame (
        uint128 indexed game_id,
        address indexed player
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

    event Received(
        address indexed sender,
        uint256 amount
    );

    event Withdraw(
        address admin,
        uint256 amount
    );

    constructor() VRFConsumerBase(VRFC_ADDRESS, LINK_ADDRESS) public {
        keyHash = 0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4;
        fee = 0.1 * 10 ** 18; // 0.1 LINK
        admin = msg.sender;
    }

    function newGame() public {
        require(LINK.balanceOf(address(this)) >= (fee * 4), "Not enough LINK - fill contract with faucet");
        Game memory _newGame;
        _newGame.id = currentGameId;
        lastGameId = currentGameId;
        currentGameId = currentGameId + 1;
        _newGame.player = msg.sender;
        _newGame.whos_turn = Player.Player;
        _newGame.winner = Winner.Unknown;
        _newGame.oracle_req_id = drawCardRequest(USER_SEED);

        emit NewGame(_newGame.id, _newGame.player);

        games[lastGameId] = _newGame;
    }

    function drawCardRequest(uint256 userProvidedSeed) internal returns (bytes32) {
        return requestRandomness(keyHash, fee, userProvidedSeed);
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        checker = randomness;
        if (games[lastGameId].oracle_req_id == requestId) {
            addCardToHand(lastGameId, CARD_CODES[randomness.mod(52)]);
        } else {
            for (uint128 i = 0; i < currentGameId; i++) {
                if (games[i].oracle_req_id == requestId) {
                    addCardToHand(i, CARD_CODES[randomness.mod(52)]);
                }
            }
        }
    }

    function addCardToHand(uint128 gameIndex, string memory cardCode) internal {
        string memory valueString = substring(cardCode, 0, 1);
        if (games[gameIndex].whos_turn == Player.Player) {
            games[gameIndex].player_cards[games[gameIndex].playerCardCount] = Card(cardCode, valueStringToValueUint(valueString));
            emit NewPlayerCardDealt(games[gameIndex].id, games[gameIndex].player_cards[games[gameIndex].playerCardCount]);
            games[gameIndex].playerCardCount = games[gameIndex].playerCardCount + 1;
            if (games[gameIndex].playerCardCount <= 2) {
                games[gameIndex].whos_turn = Player.Dealer;
                games[gameIndex].oracle_req_id = drawCardRequest(USER_SEED);
            } else if (getTotalHandValue(gameIndex, Player.Player) >= 21) {
                evaluateHands(gameIndex);
            } else if (games[gameIndex].playerCardCount >= 11) {
                if (getTotalHandValue(gameIndex, Player.Dealer) < 17) {
                    games[gameIndex].whos_turn = Player.Dealer;
                    games[gameIndex].oracle_req_id = drawCardRequest(USER_SEED);
                } else {
                    evaluateHands(gameIndex);
                }
            }
        } else if (games[gameIndex].whos_turn == Player.Dealer) {
            games[gameIndex].dealer_cards[games[gameIndex].dealerCardCount] = Card(cardCode, valueStringToValueUint(valueString));
            emit NewDealerCardDealt(games[gameIndex].id, games[gameIndex].dealer_cards[games[gameIndex].dealerCardCount]);
            games[gameIndex].dealerCardCount = games[gameIndex].dealerCardCount + 1;
            if (games[gameIndex].dealerCardCount < 2) {
                games[gameIndex].whos_turn = Player.Player;
                games[gameIndex].oracle_req_id = drawCardRequest(USER_SEED);
            } else if (games[gameIndex].dealerCardCount == 2) {
                games[gameIndex].whos_turn = Player.Player;
                checkBlackjack(gameIndex);
            } else if (games[gameIndex].dealerCardCount < 11 && getTotalHandValue(gameIndex, Player.Dealer) < 17) {
                games[gameIndex].oracle_req_id = drawCardRequest(USER_SEED);
            } else {
                evaluateHands(gameIndex);
            }
        }
    }

    function playerHit(uint128 gameIndex) external {
        require(games[gameIndex].winner == Winner.Unknown, "The winner has already been determined");
        require(games[gameIndex].whos_turn == Player.Player, "It's not your turn");
        require(games[gameIndex].playerCardCount >= 2 && games[gameIndex].dealerCardCount >= 2, "Starting cards have not been dealt yet");
        require(games[gameIndex].playerCardCount < 11, "You have reached the card limit");
        require(getTotalHandValue(gameIndex, Player.Player) != 21, "You already have blackjack");
        require(getTotalHandValue(gameIndex, Player.Player) < 21, "You have bust");
        games[gameIndex].oracle_req_id = drawCardRequest(USER_SEED);
    }

    function playerStand(uint128 gameIndex) external {
        require(games[gameIndex].winner == Winner.Unknown, "The winner has already been determined");
        require(games[gameIndex].whos_turn == Player.Player, "It's not your turn");
        require(games[gameIndex].playerCardCount >= 2 && games[gameIndex].dealerCardCount >= 2, "Starting cards have not been dealt yet");
        require(games[gameIndex].playerCardCount < 11, "You have reached the card limit");
        require(getTotalHandValue(gameIndex, Player.Player) != 21, "You already have blackjack");
        require(getTotalHandValue(gameIndex, Player.Player) < 21, "You have bust");
        if (getTotalHandValue(gameIndex, Player.Dealer) < 17) {
            games[gameIndex].whos_turn = Player.Dealer;
            games[gameIndex].oracle_req_id = drawCardRequest(USER_SEED);
        } else {
            evaluateHands(gameIndex);
        }
    }

    function playerSurrender(uint128 gameIndex) external {
        require(games[gameIndex].winner == Winner.Unknown, "The winner has already been determined");
        require(games[gameIndex].whos_turn == Player.Player, "It's not your turn");
        require(games[gameIndex].playerCardCount >= 2 && games[gameIndex].dealerCardCount >= 2, "Starting cards have not been dealt yet");
        require(games[gameIndex].playerCardCount < 11, "You have reached the card limit");
        require(getTotalHandValue(gameIndex, Player.Player) != 21, "You already have blackjack");
        require(getTotalHandValue(gameIndex, Player.Player) < 21, "You have bust");
        games[gameIndex].winner = Winner.Dealer;
        emit GameWon(games[gameIndex].id, games[gameIndex].winner);
    }

    function getCode(uint128 gameIndex, Player player, uint8 cardIndex) public view returns (string memory) {
        if (player == Player.Player) {
            return games[gameIndex].player_cards[cardIndex].code;
        } else if (player == Player.Dealer) {
            return games[gameIndex].dealer_cards[cardIndex].code;
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
        if (playerCardValueTotal > 21) {
            games[gameIndex].winner = Winner.Dealer;
        } else if (dealerCardValueTotal > 21) {
            games[gameIndex].winner = Winner.Player;
        } else if (playerCardValueTotal == 21 && dealerCardValueTotal == 21) {
            games[gameIndex].winner = Winner.Tie;
        } else if (playerCardValueTotal == 21) {
            games[gameIndex].winner = Winner.Player;
        } else if (dealerCardValueTotal == 21) {
            games[gameIndex].winner = Winner.Dealer;
        } else if (playerCardValueTotal == dealerCardValueTotal) {
            games[gameIndex].winner = Winner.Tie;
        } else if (playerCardValueTotal > dealerCardValueTotal) {
            games[gameIndex].winner = Winner.Player;
        } else if (dealerCardValueTotal > playerCardValueTotal) {
            games[gameIndex].winner = Winner.Dealer;
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
        return uint8(stringToUint(_value));
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

    function stringToUint(string memory s) internal pure returns (uint result) {
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