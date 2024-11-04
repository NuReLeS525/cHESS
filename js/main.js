
(function () {

  let boardSquaresArray = [];
  let isWhiteTurn = true;
  let whiteKingSquare = "e1";
  let blackKingSquare = "e8";

  const squares = document.getElementsByClassName('square');
  const pieces = document.getElementsByClassName('piece');
  let piecesImages = document.getElementsByTagName('img');

  setupBoardSquares();
  setupPieces();
  fillBoardSquaresArray();

  function deepCopyArray(array) {
    let arrayCopy = array.map(element => {
      return { ...element }
    });
    return arrayCopy;
  }

  function fillBoardSquaresArray() {
    const boardSquares = document.getElementsByClassName("square");
    for (let i = 0; i < boardSquares.length; i++) {
      let row = 8 - Math.floor(i / 8);
      let column = String.fromCharCode(97 + (i % 8));
      let square = boardSquares[i];
      square.id = column + row;
      let color = "";
      let pieceType = "";
      let pieceId = "";

      if (square.querySelector(".piece")) {
        color = square.querySelector(".piece").getAttribute("color");
        pieceType = square.querySelector(".piece").classList[1];
        pieceId = square.querySelector(".piece").id;
      }
      else {
        color = "blank";
        pieceType = "blank";
        pieceId = "blank";
      }
      let arrayElement = {
        squareId: square.id,
        pieceColor: color,
        pieceType: pieceType,
        pieceId: pieceId
      };
      boardSquaresArray.push(arrayElement);
    }
  }

  function updateBoardSquaresArray(currentSquareId, destinationSquareId, boardSquaresArray) {
    let currentSquare = boardSquaresArray.find(
      (element) => element.squareId === currentSquareId
    );
    let destinationSquareElement = boardSquaresArray.find(
      (element) => element.squareId === destinationSquareId
    );

    let pieceColor = currentSquare.pieceColor;
    let pieceType = currentSquare.pieceType;
    let pieceId = currentSquare.pieceId;

    destinationSquareElement.pieceColor = pieceColor;
    destinationSquareElement.pieceType = pieceType;
    destinationSquareElement.pieceId = pieceId; // а почему это вдруг id фигуры переходит на поле легального хода сам по себе?
    currentSquare.pieceColor = "blank";
    currentSquare.pieceType = "blank";
    currentSquare.pieceId = "blank";
  }

  function setupBoardSquares() {
    for (let i = 0; i < squares.length; i++) {
      squares[i].addEventListener("dragover", allowDrop);
      squares[i].addEventListener("drop", drop);
      let row = 8 - Math.floor(i / 8);
      let column = String.fromCharCode(97 + (i % 8));
      let square = squares[i];
      square.id = column + row;
    }
  }

  function setupPieces() {
    for (let i = 0; i < pieces.length; i++) {
      pieces[i].addEventListener("click", drag);
      pieces[i].addEventListener("dragstart", drag);
      pieces[i].setAttribute("draggable", true);
      pieces[i].id = pieces[i].className.split(" ")[1] + pieces[i].parentElement.id;
    }
    for (let i = 0; i < piecesImages.length; i++) {
      piecesImages[i].setAttribute("draggable", false);
    }
  }

  // Drag'n'Drop

  function allowDrop(ev) {
    ev.preventDefault();
  }

  function drag(ev) {
    const piece = ev.target;
    const pieceColor = piece.getAttribute("color");
    const pieceType = piece.classList[1];
    const pieceId = piece.id;

    if ((isWhiteTurn && pieceColor == "white") || (!isWhiteTurn && pieceColor == "black")) {
      const startingSquareId = piece.parentNode.id;

      ev.dataTransfer.setData("text", piece.id + "|" + startingSquareId);
      const pieceObject = { pieceColor: pieceColor, pieceType: pieceType, pieceId: pieceId };
      let legalSquares = getPossibleMoves(startingSquareId, pieceObject, boardSquaresArray);
      let legalSquaresJson = JSON.stringify(legalSquares);
      ev.dataTransfer.setData("application/json", legalSquaresJson);

      if (pieceType == "king") {
        console.log(legalSquares);  
      }
    }
  }

  function drop(ev) {
    ev.preventDefault();
    let data = ev.dataTransfer.getData("text");
    let [pieceId, startingSquareId] = data.split("|");
    const legalSquaresJson = ev.dataTransfer.getData("application/json");
    if (legalSquaresJson.length == 0) return;
    let legalSquares = JSON.parse(legalSquaresJson);

    const piece = document.getElementById(pieceId);
    const pieceColor = piece.getAttribute("color");
    const pieceType = piece.classList[1];
    const destinationSquare = ev.currentTarget;
    let destinationSquareId = destinationSquare.id;
    legalSquares = isMoveValidAgainstCheck(legalSquares, startingSquareId, pieceColor, pieceType);

    if (pieceType == "king") {
      let isCheck = isKingInCheck(destinationSquareId, pieceColor, boardSquaresArray);
      console.log("king's destination:", destinationSquareId); // так как при отпускании короля на запретном поле ф-ция isKingCheck дает true, в return ничего не идет и drop не срабатывает
      console.log(legalSquares);
      if (isCheck) return;
      isWhiteTurn ? (whiteKingSquare = destinationSquareId) : (blackKingSquare = destinationSquareId);
    }

    let squareContent = getPieceAtSquare(destinationSquareId, boardSquaresArray);

    if ((squareContent.pieceColor == "blank") && (legalSquares.includes(destinationSquareId))) {
      destinationSquare.appendChild(piece);
      isWhiteTurn = !isWhiteTurn;
      updateBoardSquaresArray(startingSquareId, destinationSquareId, boardSquaresArray);
      checkForCheckMate();
      return;
    }
    if ((squareContent.pieceColor != "blank") && (legalSquares.includes(destinationSquareId))) {
      while (destinationSquare.firstChild) {
        destinationSquare.removeChild(destinationSquare.firstChild);
      }
      destinationSquare.appendChild(piece);
      isWhiteTurn = !isWhiteTurn;
      updateBoardSquaresArray(startingSquareId, destinationSquareId, boardSquaresArray);
      checkForCheckMate();
      return;
    }
  }

  // PIECES

  function getPossibleMoves(startingSquareId, piece, boardSquaresArray) {
    const pieceColor = piece.pieceColor;
    const pieceType = piece.pieceType;
    let legalSquares = [];

    if (pieceType == "pawn") {
      legalSquares = getPawnMoves(startingSquareId, pieceColor, boardSquaresArray);
      return legalSquares;
    }
    if (pieceType == "knight") {
      legalSquares = getKnightMoves(startingSquareId, pieceColor, boardSquaresArray);
      return legalSquares;
    }
    if (pieceType == "rook") {
      legalSquares = getRookMoves(startingSquareId, pieceColor, boardSquaresArray);
      return legalSquares;
    }
    if (pieceType == "bishop") {
      legalSquares = getBishopMoves(startingSquareId, pieceColor, boardSquaresArray);
      return legalSquares;
    }
    if (pieceType == "queen") {
      legalSquares = getQueenMoves(startingSquareId, pieceColor, boardSquaresArray);
      return legalSquares;
    }
    if (pieceType == "king") {
      legalSquares = getKingMoves(startingSquareId, pieceColor, boardSquaresArray);
      return legalSquares;
    }
  }

  function getPieceAtSquare(squareId, boardSquaresArray) {
    let currentSquare = boardSquaresArray.find((element) => element.squareId === squareId);
    const color = currentSquare.pieceColor;
    const pieceType = currentSquare.pieceType;
    const pieceId = currentSquare.pieceId;
    return { pieceColor: color, pieceType: pieceType, pieceId: pieceId };
  }

  // PAWN

  function getPawnMoves(startingSquareId, pieceColor, boardSquaresArray) {
    let diagonalSquares = checkPawnDiagonalCaptures(startingSquareId, pieceColor, boardSquaresArray);
    let forwardSquares = checkPawnForwardMoves(startingSquareId, pieceColor, boardSquaresArray);
    let legalSquares = [...diagonalSquares, ...forwardSquares];
    return legalSquares;
  }

  function checkPawnDiagonalCaptures(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentFile = file;
    let currentRank = rankNumber;
    let currentSquareId = currentFile + currentRank;
    let legalSquares = [];
    const direction = pieceColor == "white" ? 1 : -1;

    currentRank += direction;
    for (let i = -1; i <= 1; i += 2) {
      currentFile = String.fromCharCode(file.charCodeAt(0) + i);
      if (currentFile >= "a" && currentFile <= "h") {
        currentSquareId = currentFile + currentRank;
        let currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);

        const squareContent = currentSquare.pieceColor;
        if (squareContent != "blank" && squareContent != pieceColor)
          legalSquares.push(currentSquareId);
      }
    }
    return legalSquares;
  }

  function checkPawnForwardMoves(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentFile = file;
    let currentRank = rankNumber;
    let currentSquareId = currentFile + currentRank
    let legalSquares = [];
    const direction = pieceColor == "white" ? 1 : -1;
    currentRank += direction;

    currentSquareId = currentFile + currentRank;
    let currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);
    let squareContent = currentSquare.pieceColor;
    if (squareContent != "blank") {
      return legalSquares;
    }
    legalSquares.push(currentSquareId);
    if (rankNumber != 2 && rankNumber != 7) return legalSquares;

    currentRank += direction;
    currentSquareId = currentFile + currentRank;

    currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);
    squareContent = currentSquare.pieceColor;

    if (squareContent != "blank") {
      return legalSquares;
    }
    legalSquares.push(currentSquareId);
    return legalSquares;
  }

  // KNIGHT

  function getKnightMoves(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charCodeAt(0) - 97;
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentFile = file;
    let currentRank = rankNumber;
    let legalSquares = [];

    const moves = [
      [-2, 1], [-1, 2], [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1]
    ];
    moves.forEach((move) => {
      currentFile = file + move[0];
      currentRank = rankNumber + move[1];
      if (currentFile >= 0 && currentFile <= 7 && currentRank > 0 && currentRank <= 8) {
        let currentSquareId = String.fromCharCode(currentFile + 97) + currentRank;
        let currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);
        let squareContent = currentSquare.pieceColor;

        if (squareContent != "blank" && squareContent == pieceColor) {
          return legalSquares;
        }
        legalSquares.push(String.fromCharCode(currentFile + 97) + currentRank);
      }
    });
    return legalSquares;
  }

  // ROOK

  function getRookMoves(startingSquareId, pieceColor, boardSquaresArray) {
    let moveToEightRankSquares = moveToEightRank(startingSquareId, pieceColor, boardSquaresArray);
    let moveToFirstRankSquares = moveToFirstRank(startingSquareId, pieceColor, boardSquaresArray);
    let moveToAFileSquares = moveToAFile(startingSquareId, pieceColor, boardSquaresArray);
    let moveToHFileSquares = moveToHFile(startingSquareId, pieceColor, boardSquaresArray);

    let legalSquares = [...moveToEightRankSquares, ...moveToFirstRankSquares, ...moveToAFileSquares, ...moveToHFileSquares];

    return legalSquares;

  }

  function moveToEightRank(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentRank = rankNumber;
    let legalSquares = [];

    while (currentRank != 8) {
      currentRank++;
      let currentSquareId = file + currentRank;
      let currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);
      let squareContent = currentSquare.pieceColor;
      if (squareContent != "blank" && squareContent == pieceColor)
        return legalSquares;
      legalSquares.push(currentSquareId);
      if (squareContent != "blank" && squareContent != pieceColor)
        return legalSquares;
    }
    return legalSquares;
  }

  function moveToFirstRank(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentRank = rankNumber;
    let legalSquares = [];

    while (currentRank != 1) {
      currentRank--;
      let currentSquareId = file + currentRank;
      let currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);
      let squareContent = currentSquare.pieceColor;

      if (squareContent != "blank" && squareContent == pieceColor)
        return legalSquares;
      legalSquares.push(currentSquareId);
      if (squareContent != "blank" && squareContent != pieceColor)
        return legalSquares;
    }
    return legalSquares;
  }

  function moveToAFile(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentFile = file;
    let legalSquares = [];
    while (currentFile != "a") {
      currentFile = String.fromCharCode(currentFile.charCodeAt(currentFile.length - 1) - 1);
      let currentSquareId = currentFile + rank;
      let currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);
      let squareContent = currentSquare.pieceColor;
      if (squareContent != "blank" && squareContent == pieceColor)
        return legalSquares;
      legalSquares.push(currentSquareId);
      if (squareContent != "blank" && squareContent != pieceColor)
        return legalSquares;
    }
    return legalSquares;
  }

  function moveToHFile(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentFile = file;
    let legalSquares = [];
    while (currentFile != "h") {
      currentFile = String.fromCharCode(currentFile.charCodeAt(currentFile.length - 1) + 1);
      let currentSquareId = currentFile + rank;
      let currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);
      let squareContent = currentSquare.pieceColor;
      if (squareContent != "blank" && squareContent == pieceColor)
        return legalSquares;
      legalSquares.push(currentSquareId);
      if (squareContent != "blank" && squareContent != pieceColor)
        return legalSquares;
    }
    return legalSquares;
  }

  // BISHIOP

  function getBishopMoves(startingSquareId, pieceColor, boardSquaresArray) {
    let moveToEightRankAFileSquares = moveToEightRankAFile(startingSquareId, pieceColor, boardSquaresArray);
    let moveToEightRankHFileSquares = moveToEightRankHFile(startingSquareId, pieceColor, boardSquaresArray);
    let moveToFirstRankAFileSquares = moveToFirstRankAFile(startingSquareId, pieceColor, boardSquaresArray);
    let moveToFirstRankHFileSquares = moveToFirstRankHFile(startingSquareId, pieceColor, boardSquaresArray);

    let legalSquares = [...moveToEightRankAFileSquares, ...moveToEightRankHFileSquares, ...moveToFirstRankAFileSquares, ...moveToFirstRankHFileSquares];
    return legalSquares;
  }

  function moveToEightRankAFile(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentFile = file;
    let currentRank = rankNumber;
    let legalSquares = [];

    while (!(currentFile == "a" || currentRank == 8)) {
      currentFile = String.fromCharCode(currentFile.charCodeAt(currentFile.length - 1) - 1);
      currentRank++;
      let currentSquareId = currentFile + currentRank;
      let currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);
      let squareContent = currentSquare.pieceColor;

      if (squareContent != "blank" && squareContent == pieceColor)
        return legalSquares;
      legalSquares.push(currentSquareId);
      if (squareContent != "blank" && squareContent != pieceColor)
        return legalSquares;
    }
    return legalSquares;
  }

  function moveToEightRankHFile(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentFile = file;
    let currentRank = rankNumber;
    let legalSquares = [];

    while (!(currentFile == "h" || currentRank == 8)) {
      currentFile = String.fromCharCode(currentFile.charCodeAt(currentFile.length - 1) + 1);
      currentRank++;
      let currentSquareId = currentFile + currentRank;
      let currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);
      let squareContent = currentSquare.pieceColor;

      if (squareContent != "blank" && squareContent == pieceColor)
        return legalSquares;
      legalSquares.push(currentSquareId);
      if (squareContent != "blank" && squareContent != pieceColor)
        return legalSquares;
    }
    return legalSquares;
  }

  function moveToFirstRankAFile(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);  // check this
    let currentFile = file;
    let currentRank = rankNumber;
    let legalSquares = [];

    while (!(currentFile == "a" || currentRank == 1)) {
      currentFile = String.fromCharCode(currentFile.charCodeAt(currentFile.length - 1) - 1);
      currentRank--;
      let currentSquareId = currentFile + currentRank;
      let currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);
      let squareContent = currentSquare.pieceColor;

      if (squareContent != "blank" && squareContent == pieceColor)
        return legalSquares;
      legalSquares.push(currentSquareId);
      if (squareContent != "blank" && squareContent != pieceColor)
        return legalSquares;
    }
    return legalSquares;
  }

  function moveToFirstRankHFile(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charAt(0);
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentFile = file;
    let currentRank = rankNumber;
    let legalSquares = [];

    while (!(currentFile == "h" || currentRank == 1)) {
      currentFile = String.fromCharCode(currentFile.charCodeAt(currentFile.length - 1) + 1);
      currentRank--;
      let currentSquareId = currentFile + currentRank;
      let currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);
      let squareContent = currentSquare.pieceColor;

      if (squareContent != "blank" && squareContent == pieceColor)
        return legalSquares;
      legalSquares.push(currentSquareId);
      if (squareContent != "blank" && squareContent != pieceColor)
        return legalSquares;
    }
    return legalSquares;
  }

  // QUEEN

  function getQueenMoves(startingSquareId, pieceColor, boardSquaresArray) {
    let bishopMoves = getBishopMoves(startingSquareId, pieceColor, boardSquaresArray);
    let rookMoves = getRookMoves(startingSquareId, pieceColor, boardSquaresArray);

    let legalSquares = [...bishopMoves, ...rookMoves];
    return legalSquares;
  }

  // KING

  function getKingMoves(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charCodeAt(0) - 97;
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentFile = file;
    let currentRank = rankNumber;
    let legalSquares = [];

    const moves = [
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 0],
      [-1, 1],
      [-1, -1],
      [1, 0],
    ];
    moves.forEach((move) => {
      currentFile = file + move[0];
      currentRank = rankNumber + move[1];
      if (currentFile >= 0 && currentFile <= 7 && currentRank > 0 && currentRank <= 8) {
        let currentSquareId = String.fromCharCode(currentFile + 97) + currentRank;
        let currentSquare = boardSquaresArray.find((element) => element.squareId === currentSquareId);
        let squareContent = currentSquare.pieceColor;

        if (squareContent != "blank" && squareContent == pieceColor)
          return legalSquares;
        legalSquares.push(String.fromCharCode(currentFile + 97) + currentRank);
      }
    });
    return legalSquares;
  }

  // CHECK AND MATE

  function isKingInCheck(squareId, pieceColor, boardSquaresArray) {
    let legalSquares = getRookMoves(squareId, pieceColor, boardSquaresArray);
    for (let squareId of legalSquares) {
      let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
      if (
        (pieceProperties.pieceType == "rook" ||
          pieceProperties.pieceType == "queen") &&
        pieceColor != pieceProperties.pieceColor
      ) return true;
    }
    legalSquares = getBishopMoves(squareId, pieceColor, boardSquaresArray);
    for (let squareId of legalSquares) {
      let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
      if (
        (pieceProperties.pieceType == "bishop" ||
          pieceProperties.pieceType == "queen") &&
        pieceColor != pieceProperties.pieceColor
      ) return true;
    }
    legalSquares = checkPawnDiagonalCaptures(squareId, pieceColor, boardSquaresArray);
    for (let squareId of legalSquares) {
      let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
      if (
        (pieceProperties.pieceType == "pawn") &&
        pieceColor != pieceProperties.pieceColor
      ) return true;
    }
    legalSquares = getKnightMoves(squareId, pieceColor, boardSquaresArray);
    for (let squareId of legalSquares) {
      let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
      if (
        (pieceProperties.pieceType == "knight") &&
        pieceColor != pieceProperties.pieceColor
      ) return true;
    }
    legalSquares = getRookMoves(squareId, pieceColor, boardSquaresArray);
    for (let squareId of legalSquares) {
      let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
      if (
        (pieceProperties.pieceType == "king") &&
        pieceColor != pieceProperties.pieceColor
      ) return false;
    }
    return false;
  }


  // function getAllPossibleMoves(squaresArray, color) { // находит абсолютно все возможные ходы фигур за одну сторону
  //   return squaresArray
  //     .filter((square) => square.pieceColor === color).
  //     flatMap((square) => {
  //       const { pieceColor, pieceType, pieceId } = getPieceAtSquare(square.squareId, squaresArray);
  //       if (pieceId === "blank") return [];
  //       let squaresArrayCopy = deepCopyArray(squaresArray);
  //       const pieceObject = { pieceColor: pieceColor, pieceType: pieceType, pieceId: pieceId }
  //       let legalSquares = getPossibleMoves(square.squareId, pieceObject, squaresArrayCopy);
  //       legalSquares = isMoveValidAgainstCheck(legalSquares, square.squareId, pieceColor, pieceType);
  //       console.log('square:', square.squareId);
  //       console.log('piece:', pieceColor, pieceType);
  //       console.log('not legal Squares:', legalSquares);
  //       return legalSquares;
  //     })
  // }

  // function checkForCheckmate() {
  //   let kingSquare = isWhiteTurn ? whiteKingSquare : blackKingSquare;
  //   let pieceColor = isWhiteTurn ? "white" : "black";
  //   let boardSquaresArrayCopy = deepCopyArray(boardSquaresArray);
  //   let kingIsCheck = isKingInCheck(kingSquare, pieceColor, boardSquaresArrayCopy);
  //   if (!kingIsCheck) return; // проверка на мат
  //   console.log('CHECK!!!');
  //   let possibleMoves = getAllPossibleMoves(boardSquaresArrayCopy, pieceColor); // внутри считаются все возможные ходы за стороны === legalSquares
  //   console.log('still are:', possibleMoves); // здесь выводятся только реально возможные ходы
  //   if (possibleMoves.length > 0) return;
  //   console.log("possibleMoves < 0:", possibleMoves);
  //   let message = "";
  //   isWhiteTurn ? (message = "Black Wins!") : (message = "White Wins!");
  //   showAlert(message);
  // }

  function checkForCheckMate() {
    let kingSqaure=isWhiteTurn  ? whiteKingSquare: blackKingSquare;
    let pieceColor=isWhiteTurn  ? "white": "black";
    let boardSquaresArrayCopy = deepCopyArray(boardSquaresArray);
    let kingIsCheck=isKingInCheck(kingSqaure,pieceColor,boardSquaresArrayCopy);
    
    if(!kingIsCheck) return;
    let possibleMoves=getAllPossibleMoves(boardSquaresArrayCopy,pieceColor);
    if(possibleMoves.length>0) return;
    let message="";
    isWhiteTurn  ? (message="Black Wins") : (message="White Wins");
    showAlert(message);
  }


  // function getAllPossibleMoves(squaresArray, color) {
  //   let possibleMoves = []
  //   squaresArray.forEach((square) => {
  //     const piece = getPieceAtSquare(square.squareId, squaresArray);
  //     if (piece.pieceId === "blank" || piece.pieceColor != color) return [];
  //     let squaresArrayCopy = deepCopyArray(squaresArray);
  //     possibleMoves = getPossibleMoves(square.squareId, piece, squaresArrayCopy);
  //     if (piece.pieceType == "king") {
  //       console.log(possibleMoves);
  //     }
  //     possibleMoves = isMoveValidAgainstCheck(possibleMoves, square.squareId, square.pieceColor, square.pieceType)
  //   })
  //   console.log(possibleMoves);
  //   return possibleMoves;
  // }

  function getAllPossibleMoves(squaresArray, color) {
    return squaresArray
      .filter((square) => square.pieceColor === color)
      .flatMap((square) => {
        const { pieceColor,pieceType,pieceId } = getPieceAtSquare(square.squareId,squaresArray);
        if (pieceId === "blank") return [];
  
        //const piece = document.getElementById(pieceId);
        let squaresArrayCopy = deepCopyArray(squaresArray);
        const pieceObject ={pieceColor:pieceColor,pieceType:pieceType,pieceId:pieceId}
  
        let legalSquares = getPossibleMoves(
          square.squareId,
          pieceObject,
          squaresArrayCopy
        );
        legalSquares = isMoveValidAgainstCheck(
          legalSquares,
          square.squareId,
          pieceColor,
          pieceType
        );
  
        return legalSquares;
      });
  }

  function isMoveValidAgainstCheck(legalSquares,startingSquareId,pieceColor,pieceType){
    let kingSquare = isWhiteTurn  ? whiteKingSquare : blackKingSquare;
    let boardSquaresArrayCopy = deepCopyArray(boardSquaresArray);
    legalSquaresCopy =legalSquares.slice();
    legalSquaresCopy.forEach((element) => {
      let destinationId = element;
      //boardSquaresArrayCopy.length=0;
      boardSquaresArrayCopy = deepCopyArray(boardSquaresArray);
      updateBoardSquaresArray(
        startingSquareId,
        destinationId,
        boardSquaresArrayCopy
      );
      
      if (pieceType != "king" && isKingInCheck(kingSquare, pieceColor, boardSquaresArrayCopy)) {
        legalSquares = legalSquares.filter((item) => item !== destinationId);
      }
      
      if (pieceType == "king" && isKingInCheck(destinationId, pieceColor, boardSquaresArrayCopy)) {
        legalSquares = legalSquares.filter((item) => item !== destinationId);
      }
  
    });
    return legalSquares;
  }



  function showAlert(message) {
    console.log('ALERT');
    const alert = document.getElementById("alert");
    alert.innerHTML = message;
    alert.style.display = "block";
    setTimeout(function () {
      alert.style.display = "none";
    }, 3000);
  }

})();
