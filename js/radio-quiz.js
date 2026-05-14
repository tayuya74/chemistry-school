/**
 * Простой квиз: только вопросы с одним верным вариантом (radio).
 * Вызов: initRadioQuiz(questions, "storage_key_prefix")
 */
function initRadioQuiz(questions, storageKeyBase) {
  const quizForm = document.getElementById("quizForm");
  const checkBtn = document.getElementById("checkBtn");
  const result = document.getElementById("result");

  if (!quizForm || !checkBtn || !result) {
    return;
  }

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
        input.value = String(answerIndex);

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
      const selected = document.querySelector(
        `input[name="q${index}"]:checked`,
      );
      if (selected && Number(selected.value) === q.correct) {
        score++;
      }
    });

    const percent = Math.round((score / questions.length) * 100);
    result.textContent = `Результат: ${score} из ${questions.length} (${percent}%)`;

    localStorage.setItem(`${storageKeyBase}_score`, String(score));
    localStorage.setItem(`${storageKeyBase}_total`, String(questions.length));
  }

  checkBtn.addEventListener("click", checkAnswers);
  renderQuestions();
}
