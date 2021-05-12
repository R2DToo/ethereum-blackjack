// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";

contract Blackjack is ChainlinkClient {
    
    string public checker;
    uint256 public currentGameId = 0;
    uint256 public lastGameId;
    address payable public admin;
    mapping(uint256 => Game) public games;
    
    bytes32 private jobId = "b7285d4859da4b289c7861db971baf0a";
    uint256 private fee = 0.1 * 10 ** 18;
    
    struct Game {
        uint256 id;
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
    
    constructor() public {
        setPublicChainlinkToken();
        setChainlinkOracle(address(0xAA1DC356dc4B18f30C347798FD5379F3D77ABC5b));
        admin = msg.sender;
    }
    
    function newGame() public {
        Game memory _newGame;
        _newGame.id = currentGameId;
        _newGame.player = msg.sender;
        _newGame.whos_turn = Player.Player;
        _newGame.winner = Winner.Unknown;
        _newGame.oracle_req_id = shuffleNewDeck();
        
        games[currentGameId] = _newGame;
        
        lastGameId = currentGameId;
        currentGameId = currentGameId + 1;
    }
    
    function shuffleNewDeck() internal returns (bytes32 requestId) {
        Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.fulfillShuffleNewDeck.selector);
        
        request.add("get", "https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1");
        request.add("path", "deck_id");
        
        return sendChainlinkRequest(request, fee);
    }
    
    function fulfillShuffleNewDeck(bytes32 _requestId, bytes32 _volume) public recordChainlinkFulfillment(_requestId) {
        if (games[lastGameId].oracle_req_id == _requestId) {
            games[lastGameId].deck_id = bytes32ToString(_volume);
            games[lastGameId].oracle_req_id = drawPlayerCard();
        } else {
            for (uint256 i = 0; i <= currentGameId; i++) {
                if (games[i].oracle_req_id == _requestId) {
                    games[i].deck_id = bytes32ToString(_volume);
                    games[i].oracle_req_id = drawPlayerCard();
                }
            }
        }
    }
    
    function drawPlayerCard() internal returns (bytes32 requestId) {
        Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.fulfillDrawPlayerCard.selector);
        string memory urlBase = string("https://deckofcardsapi.com/api/deck/");
        string memory urlEnd = string("/draw/?count=1");
        bytes memory url = abi.encodePacked(urlBase, games[lastGameId].deck_id, urlEnd);
        checker = string(url);
        request.add("get", string(url));
        request.add("path", "cards.0.code");
        
        return sendChainlinkRequest(request, fee);
    }
    
    function fulfillDrawPlayerCard(bytes32 _requestId, bytes32 _volume) public recordChainlinkFulfillment(_requestId) {
        if (games[lastGameId].oracle_req_id == _requestId) {
            string memory valueByte = substring(bytes32ToString(_volume), 0, 1);
            games[lastGameId].player_cards[games[lastGameId].playerCardCount] = Card(bytes32ToString(_volume), valueStringToValueUint(valueByte));
            games[lastGameId].playerCardCount = games[lastGameId].playerCardCount + 1;
            if (games[lastGameId].dealerCardCount < uint8(2)) {
                games[lastGameId].oracle_req_id = drawDealerCard();
            }
        } else {
            for (uint256 i = 0; i <= currentGameId; i++) {
                if (games[i].oracle_req_id == _requestId) {
                    string memory valueByte = substring(bytes32ToString(_volume), 0, 1);
                    games[i].player_cards[games[i].playerCardCount] = Card(bytes32ToString(_volume), valueStringToValueUint(valueByte));
                    games[i].playerCardCount = games[i].playerCardCount + 1;
                    if (games[i].dealerCardCount < uint8(2)) {
                        games[i].oracle_req_id = drawDealerCard();
                    }
                }
            }
        }
    }
    
    function drawDealerCard() internal returns (bytes32 requestId) {
        Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.fulfillDrawDealerCard.selector);
        string memory urlBase = string("https://deckofcardsapi.com/api/deck/");
        string memory urlEnd = string("/draw/?count=1");
        bytes memory url = abi.encodePacked(urlBase, games[lastGameId].deck_id, urlEnd);
        
        request.add("get", string(url));
        request.add("path", "cards.0.code");
        
        return sendChainlinkRequest(request, fee);
    }
    
    function fulfillDrawDealerCard(bytes32 _requestId, bytes32 _volume) public recordChainlinkFulfillment(_requestId) {
        if (games[lastGameId].oracle_req_id == _requestId) {
            string memory valueByte = substring(bytes32ToString(_volume), 0, 1);
            games[lastGameId].dealer_cards[games[lastGameId].dealerCardCount] = Card(bytes32ToString(_volume), valueStringToValueUint(valueByte));
            games[lastGameId].dealerCardCount = games[lastGameId].dealerCardCount + 1;
            if (games[lastGameId].playerCardCount < uint8(2)) {
                games[lastGameId].oracle_req_id = drawPlayerCard();
            } else {
                checkBlackjack(lastGameId);
            }
        } else {
            for (uint256 i = 0; i <= currentGameId; i++) {
                if (games[i].oracle_req_id == _requestId) {
                    string memory valueByte = substring(bytes32ToString(_volume), 0, 1);
                    games[i].dealer_cards[games[i].dealerCardCount] = Card(bytes32ToString(_volume), valueStringToValueUint(valueByte));
                    games[i].dealerCardCount = games[i].dealerCardCount + 1;
                    if (games[i].playerCardCount < uint8(2)) {
                        games[i].oracle_req_id = drawPlayerCard();
                    } else {
                        checkBlackjack(i);
                    }
                }
            }
        }
    }
    
    function playerHit(uint256 gameIndex) external {
        require(games[gameIndex].winner == Winner.Unknown, "The winner has already been determined");
        require(games[gameIndex].whos_turn == Player.Player, "It's not your turn");
        require(games[gameIndex].playerCardCount < uint8(11), "You have reached the card limit");
        require(getTotalHandValue(gameIndex, Player.Player) != uint8(21), "You already have blackjack");
        require(getTotalHandValue(gameIndex, Player.Player) < uint8(21), "You have bust");
        Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.fulfillPlayerHit.selector);
        string memory urlBase = string("https://deckofcardsapi.com/api/deck/");
        string memory urlEnd = string("/draw/?count=1");
        bytes memory url = abi.encodePacked(urlBase, games[gameIndex].deck_id, urlEnd);
        
        request.add("get", string(url));
        request.add("path", "cards.0.code");
        
        games[gameIndex].oracle_req_id = sendChainlinkRequest(request, fee);
    }
    
    function fulfillPlayerHit(bytes32 _requestId, bytes32 _volume) public recordChainlinkFulfillment(_requestId) {
        if (games[lastGameId].oracle_req_id == _requestId) {
            string memory valueByte = substring(bytes32ToString(_volume), 0, 1);
            games[lastGameId].player_cards[games[lastGameId].playerCardCount] = Card(bytes32ToString(_volume), valueStringToValueUint(valueByte));
            games[lastGameId].playerCardCount = games[lastGameId].playerCardCount + 1;
            if (getTotalHandValue(lastGameId, Player.Player) > uint8(21) || games[lastGameId].playerCardCount >= uint8(11))  {
                games[lastGameId].whos_turn = Player.Dealer;
                if (getTotalHandValue(lastGameId, Player.Dealer) < 17) {
                    dealerHit(lastGameId);
                } else {
                    evaluateHands(lastGameId);
                }
            }
        } else {
            for (uint256 i = 0; i <= currentGameId; i++) {
                if (games[i].oracle_req_id == _requestId) {
                    string memory valueByte = substring(bytes32ToString(_volume), 0, 1);
                    games[i].player_cards[games[i].playerCardCount] = Card(bytes32ToString(_volume), valueStringToValueUint(valueByte));
                    games[i].playerCardCount = games[i].playerCardCount + 1;
                    if (getTotalHandValue(i, Player.Player) > uint8(21) || games[i].playerCardCount >= uint8(11))  {
                        games[i].whos_turn = Player.Dealer;
                        if (getTotalHandValue(i, Player.Dealer) < 17) {
                            dealerHit(i);
                        } else {
                            evaluateHands(i);
                        }
                    }
                }
            }
        }
    }
    
    function playerStand(uint256 gameIndex) external {
        require(games[gameIndex].winner == Winner.Unknown, "The winner has already been determined");
        require(games[gameIndex].whos_turn == Player.Player, "It's not your turn");
        require(games[gameIndex].playerCardCount < uint8(11), "You have reached the card limit");
        require(getTotalHandValue(gameIndex, Player.Player) != uint8(21), "You already have blackjack");
        require(getTotalHandValue(gameIndex, Player.Player) < uint8(21), "You have bust");
        games[gameIndex].whos_turn = Player.Dealer;
        if (getTotalHandValue(gameIndex, Player.Dealer) < 17) {
            dealerHit(gameIndex);
        } else {
            evaluateHands(gameIndex);
        }
    }
    
    function playerSurrender(uint256 gameIndex) external {
        require(games[gameIndex].winner == Winner.Unknown, "The winner has already been determined");
        require(games[gameIndex].whos_turn == Player.Player, "It's not your turn");
        require(games[gameIndex].playerCardCount < uint8(11), "You have reached the card limit");
        require(getTotalHandValue(gameIndex, Player.Player) != uint8(21), "You already have blackjack");
        require(getTotalHandValue(gameIndex, Player.Player) < uint8(21), "You have bust");
        games[gameIndex].winner = Winner.Dealer;
    }
    
    function dealerHit(uint256 gameIndex) internal {
        require(games[gameIndex].winner == Winner.Unknown, "The winner has already been determined");
        require(games[gameIndex].whos_turn == Player.Dealer, "It's not your turn");
        require(games[gameIndex].dealerCardCount < uint8(11), "You have reached the card limit");
        require(getTotalHandValue(gameIndex, Player.Dealer) != uint8(21), "You already have blackjack");
        require(getTotalHandValue(gameIndex, Player.Dealer) < uint8(21), "You have bust");
        Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.fulfillDealerHit.selector);
        string memory urlBase = string("https://deckofcardsapi.com/api/deck/");
        string memory urlEnd = string("/draw/?count=1");
        bytes memory url = abi.encodePacked(urlBase, games[gameIndex].deck_id, urlEnd);
        
        request.add("get", string(url));
        request.add("path", "cards.0.code");
        
        games[gameIndex].oracle_req_id = sendChainlinkRequest(request, fee);
    }
    
    function fulfillDealerHit(bytes32 _requestId, bytes32 _volume) public recordChainlinkFulfillment(_requestId) {
        if (games[lastGameId].oracle_req_id == _requestId) {
            string memory valueByte = substring(bytes32ToString(_volume), 0, 1);
            games[lastGameId].dealer_cards[games[lastGameId].dealerCardCount] = Card(bytes32ToString(_volume), valueStringToValueUint(valueByte));
            games[lastGameId].dealerCardCount = games[lastGameId].dealerCardCount + 1;
            checkBlackjack(lastGameId);
            if (games[lastGameId].dealerCardCount < 11 && getTotalHandValue(lastGameId, Player.Dealer) < uint8(17)) {
                dealerHit(lastGameId);
            } else {
                evaluateHands(lastGameId);
            }
        } else {
            for (uint256 i = 0; i <= currentGameId; i++) {
                if (games[i].oracle_req_id == _requestId) {
                    string memory valueByte = substring(bytes32ToString(_volume), 0, 1);
                    games[i].dealer_cards[games[i].dealerCardCount] = Card(bytes32ToString(_volume), valueStringToValueUint(valueByte));
                    games[i].dealerCardCount = games[i].dealerCardCount + 1;
                    checkBlackjack(i);
                    if (games[i].dealerCardCount < 11 && getTotalHandValue(i, Player.Dealer) < uint8(17)) {
                        dealerHit(i);
                    } else {
                        evaluateHands(i);
                    }
                }
            }
        }
    }
    
    function evaluateHands(uint256 gameIndex) internal {
        uint8 playerCardValueTotal = 0;
        uint8 dealerCardValueTotal = 0;
        for(uint8 i = 0; i < games[gameIndex].playerCardCount; i++) {
            playerCardValueTotal = playerCardValueTotal + games[gameIndex].player_cards[i].value;
        }
        for(uint8 i = 0; i < games[gameIndex].dealerCardCount; i++) {
            dealerCardValueTotal = dealerCardValueTotal + games[gameIndex].dealer_cards[i].value;
        }
        if (playerCardValueTotal > uint8(21) && dealerCardValueTotal > uint8(21)) {
            games[gameIndex].winner = Winner.Tie;
        } else if (playerCardValueTotal > uint8(21)) {
            games[gameIndex].winner = Winner.Dealer;
        } else if (dealerCardValueTotal > uint8(21)) {
            games[gameIndex].winner = Winner.Player;
        } else if (playerCardValueTotal > dealerCardValueTotal) {
            games[gameIndex].winner = Winner.Player;
        } else if (playerCardValueTotal < dealerCardValueTotal) {
            games[gameIndex].winner = Winner.Dealer;
        } else if (playerCardValueTotal == dealerCardValueTotal) {
            games[gameIndex].winner = Winner.Tie;
        } else {
            games[gameIndex].winner = Winner.Unknown;
        }
    } 
    
    function getTotalHandValue(uint256 gameIndex, Player player) public view returns (uint8) {
        uint8 handTotal = 0;
        if (player == Player.Player) {
            for(uint8 i = 0; i < games[gameIndex].playerCardCount; i++) {
                handTotal = handTotal + games[gameIndex].player_cards[i].value;
            }
        } else if (player == Player.Dealer) {
            for(uint8 i = 0; i < games[gameIndex].dealerCardCount; i++) {
                handTotal = handTotal + games[gameIndex].dealer_cards[i].value;
            }
        }
        return handTotal;
    }
    
    function checkBlackjack(uint256 gameIndex) internal {
        uint8 playerCardValueTotal = 0;
        uint8 dealerCardValueTotal = 0;
        for(uint8 i = 0; i < games[gameIndex].playerCardCount; i++) {
            playerCardValueTotal = playerCardValueTotal + games[gameIndex].player_cards[i].value;
        }
        for(uint8 i = 0; i < games[gameIndex].dealerCardCount; i++) {
            dealerCardValueTotal = dealerCardValueTotal + games[gameIndex].dealer_cards[i].value;
        }
        if (playerCardValueTotal == uint8(21) && dealerCardValueTotal == uint8(21)) {
            games[gameIndex].winner = Winner.Tie;
        } else if (playerCardValueTotal == uint8(21)) {
            games[gameIndex].winner = Winner.Player;
        } else if (dealerCardValueTotal == uint8(21)) {
            games[gameIndex].winner = Winner.Dealer;
        } else {
            games[gameIndex].winner = Winner.Unknown;
        }
    }
    
    function getPlayerCards(uint256 gameIndex, uint8 cardIndex) public view returns (Card memory) {
        return games[gameIndex].player_cards[cardIndex];
    }
    
    function getDealerCards(uint256 gameIndex, uint8 cardIndex) public view returns (Card memory) {
        return games[gameIndex].dealer_cards[cardIndex];
    }
    
    function valueStringToValueUint(string memory _value) internal pure returns (uint8) {
        if (equals(_value, string("J")) || equals(_value, string("Q")) || equals(_value, string("K")) || equals(_value, string("0"))) {
            _value = "10";
        } else if (equals(_value, string("A"))) {
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