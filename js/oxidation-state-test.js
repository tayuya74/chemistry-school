const questions = [
  {
    question: "Степень окисления кислорода в большинстве соединений:",
    answers: ["-2", "+2", "0", "-1"],
    correct: 0
  },
  {
    question: "Степень окисления простого вещества Cl₂:",
    answers: ["-1", "0", "+1", "+2"],
    correct: 1
  },
  {
    question: "Степень окисления водорода в HCl:",
    answers: ["-1", "+1", "0", "+2"],
    correct: 1
  },
  {
    question: "Степень окисления S в H₂SO₄:",
    answers: ["+4", "+5", "+6", "-2"],
    correct: 2
  },
  {
    question: "Сумма степеней окисления элементов в нейтральной молекуле равна:",
    answers: ["+1", "-1", "0", "заряду ядра"],
    correct: 2
  }
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

  localStorage.setItem("oxidation_state_score", String(score));
  localStorage.setItem("oxidation_state_total", String(questions.length));
}

checkBtn.addEventListener("click", checkAnswers);
renderQuestions();
