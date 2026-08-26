  (function () {
    let current = 0;
    let PATH = "assets/crossword_pdfs/";

    const problemSelect    = document.getElementById('problemSelect');
    const problemPdfFrame  = document.getElementById('problemPdfFrame');
    const solutionPdfFrame = document.getElementById('solutionPdfFrame');
    const statusText       = document.getElementById('statusText');
    const solutionBox      = document.getElementById('solutionBox');
    const checkBtn         = document.getElementById('checkBtn');
    const clearBtn         = document.getElementById('clearBtn');
    const giveUpBtn        = document.getElementById('giveUpBtn');
    let size;
    let inputs;

    /* ── Populate select ── */
    function populateSelect() {
      crosswordData.forEach(function (entry, idx) {
        var o = document.createElement('option');
        o.value = idx;
        o.textContent = entry.name;

        if (entry.disabled) {
          o.disabled = true;
        }
        problemSelect.appendChild(o);
      });
    }

    /* ── For custom grid sizes, the size has to be extracted first. Then, we can set inputs. ── */
    function getSize() {
      /* Note that we would simply be extracting from a size attribute. */
      var entry = crosswordData[current];
      size = entry.size;
    }

    /* ── Sets up crossword from const size ── */
    function gridCrossword() {
      var grid = document.getElementById("grid") /* We'll need to add this attribute later */
      grid.style.gridTemplateColumns = `repeat(${size[1]}, ${480 / size[1]}px)`;  /* 480 is the standard size, but we can adjust this */
      grid.style.gridTemplateRows = `repeat(${size[0]}, ${480 / size[1]}px)`;     /* 480 is the standard size, but we can adjust this */
      var entry = crosswordData[current];
      var answer = entry.answer;
      grid.innerHTML = "";
      var currentnumber = 1;
      for (var i = 0; i < size[0] * size[1]; i++) {
        const cell = document.createElement("div")
        cell.className = "cell"
        const input = document.createElement("input")
        if (answer[i] !== "#") {
          input.id = `c${i}`;
          input.inputMode = "text";
          input.autocomplete = "off";
          input.ariaLabel = `cell ${i + 1}`;
        } else {
          input.id = `c${i}`
          input.disabled = true;
          input.style.backgroundColor = 'rgba(20, 36, 60, 0.28)';
          input.style.cursor = 'default';
          input.ariaLabel = `cell ${i + 1}`;
        }

        const addnumbering = (across_word(i, answer) || down_word(i, answer));
        if (addnumbering) {
          const span = document.createElement("span");
          span.className = "cell-number";
          span.innerHTML = `${currentnumber}.`;
          cell.appendChild(span);
          currentnumber++
        }

        cell.appendChild(input);
        grid.appendChild(cell);
      }

      inputs = Array.from({ length: size[0] * size[1] }, (_, i) => i).map(i => document.getElementById('c' + i)) /* Getting the correct inputs */
    }

    function across_word(i, answer) {
      if (answer[i] !== "#") {
        if (col(i) === 0) {
          if (answer[i+1] !== "#") {
            return true;
          }
        } else {
          if (col(i) < size[1] - 1) {
            if ((answer[i+1] !== "#") && (answer[i-1] === "#")) {
              return true;
            }
          }
        }
      }
      return false;
    }

    function down_word(i, answer) {
      if (answer[i] !== "#") {
        if (row(i) === 0) {
          if (answer[i+size[1]] !== "#") {
            return true;
          }
        } else {
          if (row(i) < size[0] - 1) {
            if ((answer[i+size[1]] !== "#") && (answer[i-size[1]] === "#")) {
              return true;
            }
          }
        }
      }
      return false;
    }

    /* ── Load PDFs for selected month ── */
    function loadEntry() {
      var entry = crosswordData[current];
      problemPdfFrame.src = PATH + entry.problemPdf;
      getSize();
      gridCrossword();
      clearGrid();
      activateInputs();
    }

    /* ── Clear grid + hide solution ── */
    function clearGrid() {
      inputs.forEach(function (inp) { inp.value = ''; });
      statusText.textContent = '';
      solutionBox.style.display = 'none';
      solutionPdfFrame.src = '';
    }

    /* ── Show solution PDF ── */
    function showSolution() {
      var entry = crosswordData[current];
      solutionPdfFrame.src = PATH + entry.solutionPdf;
      solutionBox.style.display = 'block';
      solutionBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /* ── Check answers ── */
    function checkWin() {
      var entry = crosswordData[current];
      var allFilled  = true;
      var allCorrect = true;

      for (var i = 0; i < size[0] * size[1]; i++) {
        var user = (inputs[i].value || '').trim();
        if (user === '') allFilled = false;
        if ((user !== entry.answer[i]) && (entry.answer[i] != "#")) allCorrect = false;
      }

      if (allCorrect && allFilled) {
        statusText.textContent = '🎉 You win!';
        showSolution();
      } else {
        statusText.textContent = '🚫 Incorrect — keep going!';
        solutionBox.style.display = 'none';
      }
    }

    /* ── Give Up ── */
    function giveUp() {
      statusText.textContent = '😔 Better luck next time!';
      showSolution();
    }

    /* ── Init ── */
    populateSelect();
    problemSelect.value = 0;
    loadEntry();

    function row(i) {
      return Math.floor(i / size[1]);
    }

    function col(i) {
      return i % size[1];
    }

    /* ── Input behaviour ── */
    function activateInputs() {
      inputs.forEach(function (inp, i) {
        inp.setAttribute('maxlength', '1');
        inp.setAttribute('data-index', i);

        inp.addEventListener('input', function (e) {
          var cleaned = (e.target.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 1);
          e.target.value = cleaned;
          if (cleaned) {
            inputs[(i + 1) % inputs.length].focus();
          }
        });
      
        inp.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            checkWin();
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            inputs[(i + 1) % inputs.length].focus();
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            inputs[(i - 1 + inputs.length) % inputs.length].focus();
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            inputs[(Number(inp.dataset.index) + size[1]) % inputs.length].focus();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            inputs[(Number(inp.dataset.index) - size[1] + inputs.length) % inputs.length].focus();
          }
        });
      });
    }

    /* ── Wire buttons ── */
    problemSelect.addEventListener('change', function () {
      current = Number(problemSelect.value);
      loadEntry();
    });
    checkBtn.addEventListener('click', checkWin);
    clearBtn.addEventListener('click', clearGrid);
    giveUpBtn.addEventListener('click', giveUp);
  })();