const questions = [
  {
    question: "Степень окисления кислорода в большинстве соединений:",
    answers: ["-2", "+2", "0", "-1"],
    correct: 0,
  },
  {
    question: "Степень окисления простого вещества Cl₂:",
    answers: ["-1", "0", "+1", "+2"],
    correct: 1,
  },
  {
    question: "Степень окисления водорода в HCl:",
    answers: ["-1", "+1", "0", "+2"],
    correct: 1,
  },
  {
    question: "Степень окисления S в H₂SO₄:",
    answers: ["+4", "+5", "+6", "-2"],
    correct: 2,
  },
  {
    question:
      "Сумма степеней окисления элементов в нейтральной молекуле равна:",
    answers: ["+1", "-1", "0", "заряду ядра"],
    correct: 2,
  },
  {
    type: "match",
    instruction:
      "Установите соответствие между веществом и степенью окисления хлора в данном веществе: к каждой позиции, обозначенной буквой, подберите соответствующую позицию, обозначенную цифрой.",
    substances: [
      { letter: "А", html: "NH<sub>4</sub>Cl" },
      { letter: "Б", html: "Ca(ClO)<sub>2</sub>" },
      { letter: "В", html: "Ba(ClO<sub>4</sub>)<sub>2</sub>" },
    ],
    oxidationStates: ["1) −1", "2) +1", "3) +3", "4) +7"],
    correctMatch: [1, 2, 4],
  },
];

const quizForm = document.getElementById("quizForm");
const checkBtn = document.getElementById("checkBtn");
const result = document.getElementById("result");

function renderMatchQuestion(block, q, index) {
  const num = index + 1;

  const title = document.createElement("p");
  title.innerHTML = `<strong>${num}. ${q.instruction}</strong>`;
  block.appendChild(title);

  const grid = document.createElement("div");
  grid.className = "match-columns";

  const left = document.createElement("div");
  const leftTitle = document.createElement("strong");
  leftTitle.textContent = "ВЕЩЕСТВО";
  left.appendChild(leftTitle);
  const leftList = document.createElement("ul");
  q.substances.forEach(function (s) {
    const li = document.createElement("li");
    li.innerHTML =
      s.letter + ') <span class="chem-formula">' + s.html + "</span>";
    leftList.appendChild(li);
  });
  left.appendChild(leftList);

  const right = document.createElement("div");
  const rightTitle = document.createElement("strong");
  rightTitle.textContent = "СТЕПЕНЬ ОКИСЛЕНИЯ ХЛОРА";
  right.appendChild(rightTitle);
  const rightList = document.createElement("ul");
  q.oxidationStates.forEach(function (line) {
    const li = document.createElement("li");
    li.textContent = line;
    rightList.appendChild(li);
  });
  right.appendChild(rightList);

  grid.appendChild(left);
  grid.appendChild(right);
  block.appendChild(grid);

  const note = document.createElement("p");
  note.textContent =
    "Запишите в таблицу выбранные цифры под соответствующими буквами.";
  block.appendChild(note);

  const answerRow = document.createElement("p");
  answerRow.innerHTML = "<strong>Ответ:</strong>";
  block.appendChild(answerRow);

  const table = document.createElement("table");
  table.className = "match-answer-table";
  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");
  q.substances.forEach(function (s) {
    const th = document.createElement("th");
    th.textContent = s.letter;
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  const trBody = document.createElement("tr");
  for (let r = 0; r < q.correctMatch.length; r++) {
    const td = document.createElement("td");
    const sel = document.createElement("select");
    sel.name = "q" + index + "_match_" + r;
    sel.setAttribute(
      "aria-label",
      "Ответ для позиции " + q.substances[r].letter,
    );
    const optEmpty = document.createElement("option");
    optEmpty.value = "";
    optEmpty.textContent = "—";
    sel.appendChild(optEmpty);
    for (let d = 1; d <= 4; d++) {
      const opt = document.createElement("option");
      opt.value = String(d);
      opt.textContent = String(d);
      sel.appendChild(opt);
    }
    td.appendChild(sel);
    trBody.appendChild(td);
  }
  tbody.appendChild(trBody);
  table.appendChild(tbody);
  block.appendChild(table);
}

function renderQuestions() {
  questions.forEach(function (q, index) {
    const block = document.createElement("div");
    block.className = "question-block";

    if (q.type === "match") {
      renderMatchQuestion(block, q, index);
      quizForm.appendChild(block);
      return;
    }

    const title = document.createElement("p");
    title.innerHTML =
      "<strong>" + (index + 1) + ". " + q.question + "</strong>";
    block.appendChild(title);

    q.answers.forEach(function (answer, answerIndex) {
      const label = document.createElement("label");
      label.className = "answer-option";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "q" + index;
      input.value = answerIndex;

      label.appendChild(input);
      label.append(" " + answer);
      block.appendChild(label);
    });

    quizForm.appendChild(block);
  });
}

function checkAnswers() {
  let score = 0;

  questions.forEach(function (q, index) {
    if (q.type === "match") {
      let allOk = true;
      for (let r = 0; r < q.correctMatch.length; r++) {
        const sel = document.querySelector(
          'select[name="q' + index + "_match_" + r + '"]',
        );
        if (
          !sel ||
          sel.value === "" ||
          Number(sel.value) !== q.correctMatch[r]
        ) {
          allOk = false;
          break;
        }
      }
      if (allOk) {
        score++;
      }
      return;
    }

    const selected = document.querySelector(
      'input[name="q' + index + '"]:checked',
    );
    if (selected && Number(selected.value) === q.correct) {
      score++;
    }
  });

  const percent = Math.round((score / questions.length) * 100);
  result.textContent =
    "Результат: " + score + " из " + questions.length + " (" + percent + "%)";

  localStorage.setItem("oxidation_state_score", String(score));
  localStorage.setItem("oxidation_state_total", String(questions.length));
}

checkBtn.addEventListener("click", checkAnswers);
renderQuestions();
