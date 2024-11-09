(function () {

  let boardSquaresArray = [];
  let moves = [];
  const castlingSquares = ["g1", "g8", "c1", "c8"];
  let isWhiteTurn = true;
  let enPassantSquare = "blank";
  const squares = document.getElementsByClassName('square');
  const pieces = document.getElementsByClassName('piece');
  let piecesImages = document.getElementsByTagName('img');
  const board = document.getElementById("board");
  let allowMovement = true;

  setupBoardSquares();
  setupPieces();
  fillBoardSquaresArray();

  function makeMove(startingSquareId, destinationSquareId, pieceType, pieceColor, captured, promotedTo = "blank") {
    moves.push({
      from: startingSquareId,
      to: destinationSquareId,
      pieceType: pieceType,
      pieceColor: pieceColor,
      captured: captured,
      promotedTo: promotedTo
    })
  }

  // function generateFEN(boardSquare) {
  //   let fen = "";
  //   let rank = 8;
  //   while (rank >= 1) {
  //     for (let file = "a"; file <= "h"; file = String.fromCharCode(file.charCodeAt(0) + 1)) {
  //       const square = boardSquare.find((element) => element.squareId === `${file}}${rank}`);
  //       if (square && square.pieceType) {
  //         let pieceNotation = "";
  //         switch (square.pieceType) {
  //           case "pawn":
  //             pieceNotation = "p";
  //             break;
  //           case "bishiop":
  //             pieceNotation = "b";
  //             break;
  //         }
  //       }
  //     }
  //   }
  // }

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

  function updateBoardSquaresArray(currentSquareId, destinationSquareId, boardSquaresArray, promotionOption = "blank") {
    let currentSquare = boardSquaresArray.find(
      (element) => element.squareId === currentSquareId
    );
    let destinationSquareElement = boardSquaresArray.find(
      (element) => element.squareId === destinationSquareId
    );

    let pieceColor = currentSquare.pieceColor;
    let pieceType = promotionOption == "blank" ? currentSquare.pieceType : promotionOption;
    let pieceId = promotionOption == "blank" ? currentSquare.pieceId : promotionOption + currentSquare.pieceId;

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

  function performCastling(piece, pieceColor, startingSquareId, destinationSquareId, boardSquaresArray) {
    let rookId, rookDestinationSquareId, checkSquareId;
    if (destinationSquareId == "g1") {
      rookId = "rookh1";
      rookDestinationSquareId = "f1";
      checkSquareId = "f1";
    }
    else if (destinationSquareId == "c1") {
      rookId = "rooka1";
      rookDestinationSquareId = "d1";
      checkSquareId = "d1";
    }
    else if (destinationSquareId == "g8") {
      rookId = "rookh8";
      rookDestinationSquareId = "f8";
      checkSquareId = "f8";
    }
    else if (destinationSquareId == "c8") {
      rookId = "rooka8";
      rookDestinationSquareId = "d8";
      checkSquareId = "d8";
    }
    if (isKingInCheck(checkSquareId, pieceColor, boardSquaresArray)) return;
    let rook = document.getElementById(rookId);
    let rookDestinationSquare = document.getElementById(rookDestinationSquareId);
    rookDestinationSquare.appendChild(rook);
    updateBoardSquaresArray(
      rook.id.slice(-2),
      rookDestinationSquare.id,
      boardSquaresArray
    );
    const destinationSquare = document.getElementById(destinationSquareId);
    destinationSquare.appendChild(piece);
    isWhiteTurn = !isWhiteTurn;
    updateBoardSquaresArray(
      startingSquareId,
      destinationSquareId,
      boardSquaresArray
    );
    let captured = false;
    makeMove(startingSquareId, destinationSquareId, "king", pieceColor, captured);
    checkForEndGame();
    return;
  }

  function performEnPassant(piece, pieceColor, startingSquareId, destinationSquareId) {
    console.log('performance');
    let file = destinationSquareId[0];
    let rank = parseInt(destinationSquareId[1]);
    rank += (pieceColor === "white") ? -1 : 1;
    let squareBehindId = file + rank;
    const squareBehindElement = document.getElementById(squareBehindId);
    console.log(squareBehindElement);
    while (squareBehindElement.firstChild) {
      squareBehindElement.removeChild(squareBehindElement.firstChild);
      let squareBehind = boardSquaresArray.find(
        (element) => element.squareId === squareBehindId
      );
      squareBehind.pieceColor = "blank";
      squareBehind.pieceType = "blank";
      squareBehind.pieceId = "blank";

      const destinationSquare = document.getElementById(destinationSquareId);
      destinationSquare.appendChild(piece);
      isWhiteTurn = !isWhiteTurn;
      updateBoardSquaresArray(startingSquareId, destinationSquareId, boardSquaresArray);
      let captured = true;
      makeMove(startingSquareId, destinationSquareId, "pawn", pieceColor, captured);
      checkForEndGame();
      return;
    }
  }

  function displayPromotionChoices(pieceId, pieceColor, startingSquareId, destinationSquareId, captured) {
    let file = destinationSquareId[0];
    let rank = parseInt(destinationSquareId[1]);
    let rank1 = (pieceColor === "white") ? rank - 1 : rank + 1;
    let rank2 = (pieceColor === "white") ? rank - 2 : rank + 2;
    let rank3 = (pieceColor === "white") ? rank - 3 : rank + 3;

    let squareBehindId1 = file + rank1;
    let squareBehindId2 = file + rank2;
    let squareBehindId3 = file + rank3;

    const destinationSquare = document.getElementById(destinationSquareId);
    const squareBehind1 = document.getElementById(squareBehindId1);
    const squareBehind2 = document.getElementById(squareBehindId2);
    const squareBehind3 = document.getElementById(squareBehindId3);

    let piece1 = createChessPiece("queen", pieceColor, "promotionOption");
    let piece2 = createChessPiece("knight", pieceColor, "promotionOption");
    let piece3 = createChessPiece("rook", pieceColor, "promotionOption");
    let piece4 = createChessPiece("bishop", pieceColor, "promotionOption");

    destinationSquare.appendChild(piece1);
    squareBehind1.appendChild(piece2);
    squareBehind2.appendChild(piece3);
    squareBehind3.appendChild(piece4);

    let promotionOptions = document.getElementsByClassName("promotionOption");
    for (let i = 0; i < promotionOptions.length; i++) {
      let pieceType = promotionOptions[i].classList[1];
      promotionOptions[i].addEventListener("click", function () {
        performPromotion(pieceId, pieceType, pieceColor, startingSquareId, destinationSquareId, captured);
      })
    }
  }

  function performPromotion(pieceId, pieceType, pieceColor, startingSquareId, destinationSquareId, captured) {
    clearPromotionOptions();
    promotionPiece = pieceType;
    piece = createChessPiece(pieceType, pieceColor, "piece");

    piece.addEventListener("dragstart", drag);
    piece.setAttribute("draggable", true);
    piece.firstChild.setAttribute("draggable", false);
    piece.id = pieceType + pieceId;

    const startingSquare = document.getElementById(startingSquareId);
    while (startingSquare.firstChild) {
      startingSquare.removeChild(startingSquare.firstChild);
    }
    const destinationSquare = document.getElementById(destinationSquareId);

    if (captured)
      while (destinationSquare.firstChild) {
        destinationSquare.removeChild(destinationSquare.firstChild);
      }
    destinationSquare.appendChild(piece);
    isWhiteTurn = !isWhiteTurn;
    updateBoardSquaresArray(startingSquareId, destinationSquareId, boardSquaresArray, pieceType);
    makeMove(startingSquareId, destinationSquareId, pieceType, pieceColor, captured,);
    checkForEndGame();
    return;
  }

  function createChessPiece(pieceType, color, pieceClass) {
    let pieceName = pieceType.slice(0) + "-" + color.slice(0) + ".png";
    let pieceDiv = document.createElement("div");
    pieceDiv.className = `${pieceClass} ${pieceType}`;
    pieceDiv.setAttribute("color", color);
    let img = document.createElement("img");
    img.src = "../figures/" + pieceName;
    img.alt = pieceType;
    pieceDiv.appendChild(img);
    return pieceDiv;
  }

  board.addEventListener("click", clearPromotionOptions);

  function clearPromotionOptions() {
    for (let i = 0; i < squares.length; i++) {
      let style = getComputedStyle(squares[i]);
      let backgroundColor = style.background;
      // let rgbaColor = backgroundColor.replace("0.5)", "1)");
      // squares[i].style.backgroundColor = rgbaColor;
      // squares[i].style.opacity = 1;
    }
    let elementsToRemove = board.querySelectorAll(".promotionOption");
    elementsToRemove.forEach(function (element) {
      element.parentElement.removeChild(element);
    })
    allowMovement = true;
  }

  function updateBoardSquaresOpacity() {
    console.log('square');
    console.log(board);
    console.log(board.length);
    console.log(board[0]);
    for (let i = 0; i < board.length; i++) {
      // if (board[i].classList.contains('.promotionOption')) {

      // }
      console.log('square');
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
    if (!allowMovement) return;
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
      let isCheck = isKingInCheck(destinationSquareId, pieceColor, boardSquaresArray); // так как при отпускании короля на запретном поле ф-ция isKingCheck дает true, в return ничего не идет и drop не срабатывает
      if (isCheck) return;
    }

    let squareContent = getPieceAtSquare(destinationSquareId, boardSquaresArray);

    if ((squareContent.pieceColor == "blank") && (legalSquares.includes(destinationSquareId))) { // ход на пустое поле
      let isCheck = false;
      if (pieceType == "king") {
        isCheck = isKingInCheck(startingSquareId, pieceColor, boardSquaresArray);
      }


      if (pieceType == "king" && !kingHasMoved(pieceColor) && castlingSquares.includes(destinationSquareId) && !isCheck) {
        performCastling(piece, pieceColor, startingSquareId, destinationSquareId, boardSquaresArray);
        return;
      }
      if (pieceType == "king" && !kingHasMoved(pieceColor) && castlingSquares.includes(destinationSquareId) && isCheck) return; // Рокироваться под шахом нельзя

      if (pieceType == "pawn" && enPassantSquare == destinationSquareId) {
        console.log('enPassant drop');
        performEnPassant(piece, pieceColor, startingSquareId, destinationSquareId);
        enPassantSquare = "blank";
        return;
      }

      if (pieceType == "pawn" && (destinationSquareId.charAt(1) == 8 || destinationSquareId.charAt(1) == 1)) {
        allowMovement = false;
        displayPromotionChoices(pieceId, pieceColor, startingSquareId, destinationSquareId, false);
        updateBoardSquaresOpacity();
        return;
      }

      destinationSquare.appendChild(piece);
      isWhiteTurn = !isWhiteTurn;
      updateBoardSquaresArray(startingSquareId, destinationSquareId, boardSquaresArray);

      let captured = false;
      makeMove(startingSquareId, destinationSquareId, pieceType, pieceColor, captured);

      checkForEndGame();
      return;
    }



    if ((squareContent.pieceColor != "blank") && (legalSquares.includes(destinationSquareId))) { // Взятие фигуры

      if (pieceType == "pawn" && (destinationSquareId.charAt(1) == 8 || destinationSquareId.charAt(1) == 1)) {
        allowMovement = false;
        displayPromotionChoices(pieceId, pieceColor, startingSquareId, destinationSquareId, true);
        updateBoardSquaresOpacity();
        return;
      }

      while (destinationSquare.firstChild) {
        destinationSquare.removeChild(destinationSquare.firstChild);
      }
      destinationSquare.appendChild(piece);
      isWhiteTurn = !isWhiteTurn;
      updateBoardSquaresArray(startingSquareId, destinationSquareId, boardSquaresArray);

      let captured = true;
      makeMove(startingSquareId, destinationSquareId, pieceType, pieceColor, captured);

      checkForEndGame();
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


    if (pieceType == "duck") {
      legalSquares = getDuckMoves(startingSquareId, pieceColor, boardSquaresArray);
      return legalSquares;
    }
    if (pieceType == "amazon") {
      legalSquares = getAmazonMoves(startingSquareId, pieceColor, boardSquaresArray);
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

  // DUCK

  function getDuckMoves(startingSquareId, pieceColor, boardSquaresArray) {
    const file = startingSquareId.charCodeAt(0) - 97;
    const rank = startingSquareId.charAt(1);
    const rankNumber = parseInt(rank);
    let currentFile = file;
    let currentRank = rankNumber;
    let legalSquares = [];

    let moves = [];
    if (pieceColor == "white") {
      moves = [
        [0, 2],
        [1, 1],
        [2, 0],
        // [1, -1],
        [-2, 0],
        [-1, -1],
        // [0, -2],
        [-1, 1],
      ];
    }
    else {
      moves = [
        [0, 2],
        [1, 1],
        // [2, 0],
        [1, -1],
        [-2, 0],
        [-1, -1],
        [0, -2],
        // [-1, 1],
      ];
    }
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

  // AMAZON

  function getAmazonMoves(startingSquareId, pieceColor, boardSquaresArray) {
    let queenMoves = getQueenMoves(startingSquareId, pieceColor, boardSquaresArray);
    let knightMoves = getKnightMoves(startingSquareId, pieceColor, boardSquaresArray);

    legalSquares = [...queenMoves, ...knightMoves];
    return legalSquares;
  }

  // PAWN

  function getPawnMoves(startingSquareId, pieceColor, boardSquaresArray) {
    let diagonalSquares = checkPawnDiagonalCaptures(startingSquareId, pieceColor, boardSquaresArray);
    let forwardSquares = checkPawnForwardMoves(startingSquareId, pieceColor, boardSquaresArray);
    let legalSquares = [...diagonalSquares, ...forwardSquares];
    return legalSquares;
  }

  function enPassantPossible(currentSquareId, pawnStartingSquareId, direction) {
    if (moves.length == 0) return false;
    let lastMove = moves[moves.length - 1];
    if (!(lastMove.to === currentSquareId && lastMove.from === pawnStartingSquareId && lastMove.pieceType == "pawn")) return false;
    file = currentSquareId[0];
    rank = parseInt(currentSquareId[1]);
    rank += direction;
    let squareBehindId = file + rank;
    enPassantSquare = squareBehindId;
    return true;
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
        if (squareContent == "blank") {
          currentSquareId = currentFile + rank;
          let pawnStartingSquareRank = rankNumber + direction * 2;
          let pawnStartingSquareId = currentFile + pawnStartingSquareRank;

          if (enPassantPossible(currentSquareId, pawnStartingSquareId, direction)) {
            let pawnStartingSquareRank = rankNumber + direction;
            let enPassantSquare = currentFile + pawnStartingSquareRank;
            legalSquares.push(enPassantSquare);
          }
        }
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

    // if (rankNumber != 2 && rankNumber != 7) return legalSquares;

    if ((pieceColor !== "black" || rankNumber != 7) && (pieceColor !== "white" || rankNumber != 2)) return legalSquares; // если белая пешка на 7 диагонали или черная пешка на 2 диагонали
    // if ((pieceColor == "white" && rankNumber == 7) || (pieceColor == "black" && rankNumber == 2)) return legalSquares;

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

    let shortCastleSquare = isShortCastlePossible(pieceColor, boardSquaresArray);
    let longCastleSquare = isLongCastlePossible(pieceColor, boardSquaresArray);
    if (shortCastleSquare !== "blank") legalSquares.push(shortCastleSquare);
    if (longCastleSquare !== "blank") legalSquares.push(longCastleSquare);

    return legalSquares;
  }

  // CASTLING

  function isShortCastlePossible(pieceColor, boardSquaresArray) {
    let rank = pieceColor === "white" ? "1" : "8";
    let fSquare = boardSquaresArray.find(element => element.squareId === `f${rank}`);
    let gSquare = boardSquaresArray.find(element => element.squareId === `g${rank}`);

    if (fSquare.pieceColor !== "blank" || gSquare.pieceColor !== "blank" || kingHasMoved(pieceColor) || rookHasMoved(pieceColor, `h${rank}`)) {
      return "blank";
    }
    return `g${rank}`;
  }

  function isLongCastlePossible(pieceColor, boardSquaresArray) {
    let rank = pieceColor === "white" ? "1" : "8";
    let dSquare = boardSquaresArray.find(element => element.squareId === `d${rank}`);
    let cSquare = boardSquaresArray.find(element => element.squareId === `c${rank}`);
    let bSquare = boardSquaresArray.find(element => element.squareId === `b${rank}`);
    if (dSquare.pieceColor !== "blank" || cSquare.pieceColor !== "blank" || bSquare.pieceColor !== "blank" || kingHasMoved(pieceColor) || rookHasMoved(pieceColor, `a${rank}`)) {
      return "blank";
    }
    return `c${rank}`;
  }

  function kingHasMoved(pieceColor) {
    let result = moves.find((element) => (element.pieceColor === pieceColor) && (element.pieceType === "king"));
    if (result !== undefined) return true;
    return false;
  }

  function rookHasMoved(pieceColor, startingSquareId) { // didn'T WORK
    let result = moves.find((element) => (element.pieceColor === pieceColor) && (element.pieceType === "rook") && (element.from == startingSquareId)); // piecetype - pieceType
    if (result !== undefined) return true;
    return false;
  }

  // CHECK AND MATE

  function isKingInCheck(squareId, pieceColor, boardSquaresArray) {
    let legalSquares = getRookMoves(squareId, pieceColor, boardSquaresArray);
    for (let squareId of legalSquares) {
      let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
      if (
        (pieceProperties.pieceType == "rook" ||
          pieceProperties.pieceType == "queen" ||
          pieceProperties.pieceType == "amazon") &&
        pieceColor != pieceProperties.pieceColor
      ) return true;
    }
    legalSquares = getBishopMoves(squareId, pieceColor, boardSquaresArray);
    for (let squareId of legalSquares) {
      let pieceProperties = getPieceAtSquare(squareId, boardSquaresArray);
      if (
        (pieceProperties.pieceType == "bishop" ||
          pieceProperties.pieceType == "queen" ||
          pieceProperties.pieceType == "amazon") &&
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
        (pieceProperties.pieceType == "knight" ||
          pieceProperties.pieceType == "amazon") &&
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

  function getKingLastMove(color) {
    let kingLastMove = moves.find(element => element.pieceType === "king" && element.pieceColor === color);
    if (kingLastMove == undefined) {
      return isWhiteTurn ? "e1" : "e8";
    }
    return kingLastMove.to;
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

  function checkForEndGame() {
    checkForCheckMateAndStaleMate();
  }

  function checkForCheckMateAndStaleMate() {
    let kingSqaure = isWhiteTurn ? getKingLastMove("white") : getKingLastMove("black");
    let pieceColor = isWhiteTurn ? "white" : "black";
    let boardSquaresArrayCopy = deepCopyArray(boardSquaresArray);
    let kingIsCheck = isKingInCheck(kingSqaure, pieceColor, boardSquaresArrayCopy);

    let possibleMoves = getAllPossibleMoves(boardSquaresArrayCopy, pieceColor);
    if (possibleMoves.length > 0) return;
    let message = "";
    if (kingIsCheck)
      isWhiteTurn ? (message = "Black Wins") : (message = "White Wins");
    console.log(message);
    // else
    //   message = "Draw";
    showAlert(message);
  }

  function getAllPossibleMoves(squaresArray, color) {
    return squaresArray
      .filter((square) => square.pieceColor === color)
      .flatMap((square) => {
        const { pieceColor, pieceType, pieceId } = getPieceAtSquare(square.squareId, squaresArray);
        if (pieceId === "blank") return [];

        //const piece = document.getElementById(pieceId);
        let squaresArrayCopy = deepCopyArray(squaresArray);
        const pieceObject = { pieceColor: pieceColor, pieceType: pieceType, pieceId: pieceId }

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

  function isMoveValidAgainstCheck(legalSquares, startingSquareId, pieceColor, pieceType) {
    let kingSquare = isWhiteTurn ? getKingLastMove("white") : getKingLastMove("black");
    let boardSquaresArrayCopy = deepCopyArray(boardSquaresArray);
    let legalSquaresCopy = legalSquares.slice();
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
        console.log(pieceType);
        legalSquares = legalSquares.filter((item) => item !== destinationId);
      }

      if (pieceType == "king" && isKingInCheck(destinationId, pieceColor, boardSquaresArrayCopy)) {
        console.log(pieceType);
        legalSquares = legalSquares.filter((item) => item !== destinationId);
      }

    });
    console.log(legalSquares);
    return legalSquares;
  }

  // Программа Нурэлеса работать перестала;

  // А в инете решения она сыскала, 

  // Что это баг еще не так большой руки:

  // Лишь стоит спросить у GPT,

  // Ответов с полдюжины себе Нурэлес достал;

  // Вертит решениями так и сяк:

  // То в функцию их вставит, то от руки все перепишет,

  // То их понюхает, то их полижет;

  // Код всё не действуют никак.

  // "Тьфу пропасть! - скрежет он зубами, - и тот дурак,

  // Кто слушает нейронок всех врак:

  // Всё про решения лишь мне налгали;

  // А проку на волос нет в них".

  // Мартышка тут с досады и с печали

  // О камень так хватила их,

  // Что только брызги засверкали.



  // К несчастью, то ж бывает у людей:

  // Как ни полезна вещь, - иены не зная ей,

  // Невежда про нее свой толк все к худу клонит;

  // А ежели невежда познатней,

  // Так он ее еще и гонит.



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
