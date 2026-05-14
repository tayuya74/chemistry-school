const questions = [
  {
    question: "Какой тип связи в молекуле кислорода O₂?",
    answers: [
      "Ковалентная неполярная",
      "Ковалентная полярная",
      "Ионная",
      "Металлическая",
    ],
    correct: 0,
  },
  {
    question: "Какой тип связи преобладает в кристаллической соли NaCl?",
    answers: [
      "Металлическая",
      "Ковалентная неполярная",
      "Ионная",
      "Водородная",
    ],
    correct: 2,
  },
  {
    question: "Связь между атомами H и O в молекуле H₂O — это:",
    answers: [
      "Ионная",
      "Ковалентная полярная",
      "Ковалентная неполярная",
      "Металлическая",
    ],
    correct: 1,
  },
  {
    question: "В кристаллическом железе Fe связь между атомами железа:",
    answers: [
      "Ионная",
      "Ковалентная полярная",
      "Металлическая",
      "Ковалентная неполярная",
    ],
    correct: 2,
  },
  {
    question: "Ионная связь чаще всего образуется между атомами:",
    answers: [
      "двух неметаллов",
      "металла и неметалла",
      "одинаковых неметаллов",
      "благородного газа и металла",
    ],
    correct: 1,
  },
  {
    question: "В молекуле водорода H₂ связь:",
    answers: [
      "ковалентная полярная",
      "ионная",
      "ковалентная неполярная",
      "металлическая",
    ],
    correct: 2,
  },
];

const quizForm = document.getElementById("quizForm");
const checkBtn = document.getElementById("checkBtn");
const result = document.getElementById("result");

function renderQuestions() {
  questions.forEach((q, index) => {
    const block = document.createElement("div");
    block.className = "question-block";

    const title = document.createElement("p");
    title.innerHTML = `<strong>${index + 1}. ${q.question}</strong>`;
    block.appendChild(title);

    q.answers.forEach((answer, answerIndex) => {
      const label = document.createElement("label");
      label.className = "answer-option";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `q${index}`;
      input.value = answerIndex;

      label.appendChild(input);
      label.append(` ${answer}`);
      block.appendChild(label);
    });

    quizForm.appendChild(block);
  });
}

function checkAnswers() {
  let score = 0;

  questions.forEach((q, index) => {
    const selected = document.querySelector(`input[name="q${index}"]:checked`);
    if (selected && Number(selected.value) === q.correct) {
      score++;
    }
  });

  const percent = Math.round((score / questions.length) * 100);
  result.textContent = `Результат: ${score} из ${questions.length} (${percent}%)`;

  localStorage.setItem("chemical_bonds_score", String(score));
  localStorage.setItem("chemical_bonds_total", String(questions.length));
}

checkBtn.addEventListener("click", checkAnswers);
renderQuestions();
