// --- CAROUSEL LOGIC ---
const carousel = {
  slides: [
    {
      title: "What is a Decision Tree?",
      text: "You're looking at one! This branching structure is a decision tree. It's a tool used to make decisions based on data. In this game, your answers guide you through the tree to a final outcome.",
    },
    {
      title: "Nodes & Decisions",
      text: 'Each point where the path splits is a "node". Think of the question you\'re asked as a small algorithm running at that node. It evaluates the "data" (your answer) and decides which path to take.',
    },
    {
      title: "Branches & Outcomes",
      text: 'The lines connecting the nodes are "branches". Each branch represents the outcome of a decision. Choosing a correct answer sends you up an optimal branch, while a wrong answer leads down a different path.',
    },
    {
      title: "The Full Path",
      text: "Where you finally end up depends on the entire chain of decisions you made. The goal of a machine learning model is to tune the tiny algorithm at each node to create the best possible chain of decisions.",
    },
    {
      title: "Leaf Nodes: The End",
      text: 'The tips of the tree that don\'t branch any further are "leaf nodes". Reaching a leaf means the decision process is complete. In this game, it marks the end of your ascent, and your score is finalized.',
    },
    {
      title: "Winning vs. Losing",
      text: 'In a real model, some leaf nodes are "success" and others are "failure". Here, the highest leaves are good outcomes, reached by correct answers. Lower leaves are suboptimal, reached when you make a mistake.',
    },
  ],
  currentIndex: 0,

  init() {
    this.renderSlides();
    document
      .getElementById("carousel-next")
      .addEventListener("click", () => this.next());
    document
      .getElementById("carousel-prev")
      .addEventListener("click", () => this.prev());
    this.showSlide(0);
  },

  renderSlides() {
    const container = document.getElementById("carousel-slides");
    container.innerHTML = this.slides
      .map(
        (slide, index) => `
            <div class="carousel-slide" data-index="${index}">
                <h3>${slide.title}</h3>
                <p>${slide.text}</p>
            </div>
        `
      )
      .join("");
  },

  showSlide(index) {
    this.currentIndex = (index + this.slides.length) % this.slides.length;
    const slides = document.querySelectorAll(".carousel-slide");
    slides.forEach((slide) => {
      slide.classList.remove("active");
    });
    document
      .querySelector(`.carousel-slide[data-index="${this.currentIndex}"]`)
      .classList.add("active");
  },

  next() {
    this.showSlide(this.currentIndex + 1);
  },

  prev() {
    this.showSlide(this.currentIndex - 1);
  },
};

// --- GAME STATE & LOGIC ---
const game = {
  score: 0,
  penalty: 0,
  highScore: 0,
  moves: 0,
  tree: [],
  questions: {},
  currentNode: null,
  path: [],
  state: "PRE_START", // PRE_START, PLAYING, FINISHED
  questionPool: [
    // Questions with 4 answers
    {
      q: "Which of these is NOT a primary color?",
      a: ["Green", "Red", "Blue", "Yellow"],
    },
    {
      q: "Which planet is known as the Red Planet?",
      a: ["Mars", "Jupiter", "Venus", "Saturn"],
    },
    {
      q: 'Who wrote "To Kill a Mockingbird"?',
      a: [
        "Harper Lee",
        "Mark Twain",
        "F. Scott Fitzgerald",
        "Ernest Hemingway",
      ],
    },
    {
      q: "What is the largest mammal in the world?",
      a: ["Blue Whale", "Elephant", "Giraffe", "Great White Shark"],
    },
    {
      q: "Which country is known as the Land of the Rising Sun?",
      a: ["Japan", "China", "Thailand", "South Korea"],
    },

    // Questions with 3 answers
    {
      q: "What is the main ingredient in guacamole?",
      a: ["Avocado", "Tomato", "Onion"],
    },
    { q: "How many continents are there?", a: ["7", "5", "6"] },
    {
      q: "What is the hardest natural substance on Earth?",
      a: ["Diamond", "Gold", "Iron"],
    },
    {
      q: "Which is the longest river in the world?",
      a: ["The Nile", "The Amazon", "The Yangtze"],
    },
    {
      q: 'What type of animal is a "doe"?',
      a: ["A female deer", "A male deer", "A young sheep"],
    },

    // Questions with 2 answers
    { q: "Is the sun a star or a planet?", a: ["Star", "Planet"] },
    { q: "Does sound travel faster in water or in air?", a: ["Water", "Air"] },
    { q: "What is the chemical symbol for gold?", a: ["Au", "Ag"] },
    { q: "Did the Titanic sink in 1912 or 1915?", a: ["1912", "1915"] },
    { q: "Is a tomato a fruit or a vegetable?", a: ["Fruit", "Vegetable"] },
    { q: "What is the capital of France?", a: ["Paris", "London"] },
    { q: "What is 5 × 6?", a: ["30", "56"] },
    { q: "Which gas do plants absorb?", a: ["Carbon Dioxide", "Oxygen"] },
    { q: "Who wrote Romeo and Juliet?", a: ["Shakespeare", "Dickens"] },
    { q: "Water's boiling point (°C)?", a: ["100", "0"] },
    { q: "Which is Earth's largest ocean?", a: ["Pacific", "Atlantic"] },
    { q: "How many sides in a hexagon?", a: ["6", "8"] },
    { q: 'Which element is "O"?', a: ["Oxygen", "Osmium"] },
    { q: "When did WWII end?", a: ["1945", "1944"] },
    { q: "Square root of 64?", a: ["8", "6"] },
    { q: "Home of the kangaroo?", a: ["Australia", "New Zealand"] },
    { q: "Who painted the Mona Lisa?", a: ["Da Vinci", "Michelangelo"] },
    { q: "Largest human body organ?", a: ["Skin", "Liver"] },
    { q: "Capital of Japan?", a: ["Tokyo", "Kyoto"] },
    { q: "Planet closest to the Sun?", a: ["Mercury", "Venus"] },
  ],
  complexity: 3,

  init() {
    this.highScore = localStorage.getItem("neuralAscentHighScore") || 0;
    document
      .getElementById("start-btn")
      .addEventListener("click", () => this.start());
    document
      .getElementById("restart-btn")
      .addEventListener("click", () => this.restart());

    const complexitySlider = document.getElementById("complexity");
    const complexityValueSpan = document.getElementById("complexity-value");
    this.complexity = parseInt(complexitySlider.value, 10);

    complexitySlider.addEventListener("input", (e) => {
      this.complexity = parseInt(e.target.value, 10);
      complexityValueSpan.textContent = this.complexity;
      if (window.p5Instance) {
        window.p5Instance.restart();
      }
    });

    this.updateUI();
  },

  setTree(treeData) {
    this.tree = treeData.tree;
    this.optimalPath = treeData.optimalPath;
    this.assignQuestions();
  },

  start() {
    this.state = "PLAYING";
    this.score = 0;
    this.penalty = 0;
    this.moves = 0;
    this.currentNode = this.tree.find((n) => n.id === "0");
    this.path = [this.currentNode];

    this.updateUI();

    document.getElementById("start-controls").style.display = "none";

    this.showQuestion();
  },

  restart() {
    this.state = "PRE_START";
    window.p5Instance.restart();
  },

  assignQuestions() {
    this.questions = {};
    let questionBank = [...this.questionPool].sort(() => 0.5 - Math.random());

    const nodesToAssign = this.tree.filter((node) => node.children.length > 0);

    nodesToAssign.forEach((node) => {
      const childCount = node.children.length;
      if (childCount === 0) return;

      let questionIndex = questionBank.findIndex(
        (q) => q.a.length >= childCount
      );

      // If no suitable question is found in the remaining bank, reset and reshuffle the bank
      if (questionIndex === -1) {
        questionBank = [...this.questionPool].sort(() => 0.5 - Math.random());
        questionIndex = questionBank.findIndex((q) => q.a.length >= childCount);
        if (questionIndex === -1) {
          console.error(
            `CRITICAL: No question in the entire pool for a node with ${childCount} children.`
          );
          return;
        }
      }

      const questionData = questionBank.splice(questionIndex, 1)[0];
      const correctChild =
        node.children.find((child) => this.optimalPath.includes(child.id)) ||
        node.children[0];
      const otherChildren = node.children.filter(
        (c) => c.id !== correctChild.id
      );

      const answers = questionData.a;
      const correctAnswerText = answers[0];
      const incorrectAnswerTexts = [...answers.slice(1)].sort(
        () => 0.5 - Math.random()
      );

      let answerMappings = [];
      answerMappings.push({
        text: correctAnswerText,
        isCorrect: true,
        nextNode: correctChild,
      });

      for (let i = 0; i < otherChildren.length; i++) {
        if (i < incorrectAnswerTexts.length) {
          answerMappings.push({
            text: incorrectAnswerTexts[i],
            isCorrect: false,
            nextNode: otherChildren[i],
          });
        }
      }

      this.questions[node.id] = {
        q: questionData.q,
        answers: answerMappings.sort(() => 0.5 - Math.random()),
      };
    });
  },

  showQuestion() {
    const panel = document.getElementById("question-panel");
    if (!this.questions[this.currentNode.id] || this.state !== "PLAYING") {
      panel.classList.remove("visible");
      return;
    }

    const questionText = document.getElementById("question-text");
    const answersContainer = document.getElementById("answers-container");

    const questionData = this.questions[this.currentNode.id];
    questionText.textContent = questionData.q;
    answersContainer.innerHTML = "";

    questionData.answers.forEach((answer) => {
      const button = document.createElement("button");
      button.textContent = answer.text;
      button.onclick = () => this.handleAnswer(answer);
      answersContainer.appendChild(button);
    });

    panel.classList.add("visible");
  },

  handleAnswer(answer) {
    this.moves++;
    if (answer.isCorrect) {
      this.score += 10;
    } else {
      this.score -= 5;
      this.penalty += 5;
    }

    carousel.next(); // Advance carousel on answer

    this.currentNode = answer.nextNode;
    this.path.push(this.currentNode);

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("neuralAscentHighScore", this.highScore);
    }

    this.updateUI();

    if (
      this.currentNode.children.length > 0 &&
      this.questions[this.currentNode.id]
    ) {
      this.showQuestion();
    } else {
      this.endGame();
    }
  },

  endGame() {
    this.state = "FINISHED";
    document.getElementById("question-panel").classList.remove("visible");

    const summaryHTML = `
            <div id="end-summary">
                <h2>Path Complete</h2>
                <p>Final Score: ${this.score} | Moves: ${this.moves} | Penalties: -${this.penalty}</p>
                <p>Refresh your browser to have another go!</p>
            </div>
        `;
    const summaryWrapper = document.getElementById("end-summary-wrapper");
    summaryWrapper.innerHTML = summaryHTML;
    summaryWrapper.style.display = "block";

    document.getElementById("start-btn").style.display = "none";
  },

  updateUI() {
    document.getElementById("score").textContent = this.score;
    document.getElementById("penalty").textContent = this.penalty;
  },
};

// --- P5.JS SKETCH FOR VISUALS ---
const sketch = (p) => {
  let treeData = {};
  let grassTufts = [];
  const SOIL_Y_OFFSET = 80;
  let soilLevel;

  function generateTreeData(complexity = 3) {
    const tree = [];
    let nodeIdCounter = 0;

    // --- Map complexity to tree parameters ---
    const optimalPathLength = 6 + complexity * 2; // e.g., 8 to 16
    const maxDepth = 10 + complexity * 2; // e.g., 12 to 20
    const mainLength = p.height / (6 + complexity); // Shorter segments for more complex trees

    const root = {
      id: "0",
      pos: p.createVector(p.width / 2, soilLevel),
      children: [],
      depth: 0,
      parent: null,
    };
    tree.push(root);

    const optimalPath = [root];
    let currentOptimal = root;
    for (let i = 1; i < optimalPathLength; i++) {
      const angle = -p.PI / 2 + p.random(-p.PI / 16, p.PI / 16);
      const length =
        p.map(i, 1, optimalPathLength - 1, mainLength, 15) * p.random(0.9, 1.1);
      const endPoint = p.createVector(
        currentOptimal.pos.x + length * p.cos(angle),
        currentOptimal.pos.y + length * p.sin(angle)
      );
      const node = {
        id: (++nodeIdCounter).toString(),
        pos: endPoint,
        parent: currentOptimal,
        children: [],
        depth: i,
        optimal: true,
      };
      currentOptimal.children.push(node);
      tree.push(node);
      optimalPath.push(node);
      currentOptimal = node;
    }

    function branch(parent, length, angle, depth, optimalBranch = false) {
      if (depth > maxDepth || length < 8) return;

      const branches = optimalBranch
        ? p.random([1, 2])
        : complexity > 2
        ? p.random([2, 3])
        : p.random([1, 2]);
      for (let i = 0; i < branches; i++) {
        const angleVariation = p.PI / p.map(depth, 1, 10, 4, 8);
        const newAngle =
          angle + p.random(-angleVariation, angleVariation) * (i > 0 ? -1 : 1);
        const newLength = length * p.random(0.7, 0.85);

        const endPoint = p.createVector(
          parent.pos.x + newLength * p.cos(newAngle),
          parent.pos.y + newLength * p.sin(newAngle)
        );
        const node = {
          id: (++nodeIdCounter).toString(),
          pos: endPoint,
          parent: parent,
          children: [],
          depth: depth,
          optimal: false,
        };
        parent.children.push(node);
        tree.push(node);
        branch(node, newLength, newAngle, depth + 1);
      }
    }

    tree.forEach((node) => {
      if (node.depth > 0) {
        const initialAngle = node.parent
          ? p.atan2(
              node.pos.y - node.parent.pos.y,
              node.pos.x - node.parent.pos.x
            )
          : -p.PI / 2;
        branch(
          node,
          (p.height / 8) * p.pow(0.8, node.depth),
          initialAngle,
          node.depth + 1,
          node.optimal
        );
      }
    });

    return { tree, optimalPath: optimalPath.map((n) => n.id) };
  }

  p.setup = () => {
    const canvasContainer = document.getElementById("canvas-container");
    p.createCanvas(
      canvasContainer.offsetWidth,
      canvasContainer.offsetHeight
    ).parent(canvasContainer);
    p.restart();
  };

  p.draw = () => {
    p.clear();

    // Draw soil and grass first
    p.strokeWeight(4);
    p.stroke(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--soil-color"
      )
    );
    p.line(0, soilLevel, p.width, soilLevel);
    grassTufts.forEach((tuft) => {
      p.push();
      p.stroke(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--grass-color"
        )
      );
      p.strokeWeight(tuft.weight);
      tuft.blades.forEach((blade) => {
        p.line(tuft.x, soilLevel, tuft.x + blade.x, soilLevel + blade.y);
      });
      p.pop();
    });

    if (!treeData.tree) return;

    treeData.tree.forEach((node) => {
      if (node.parent) {
        const sw = p.map(node.depth, 1, 12, 10, 1);
        p.strokeWeight(sw);
        p.stroke(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--dim-color"
          )
        );
        p.line(node.parent.pos.x, node.parent.pos.y, node.pos.x, node.pos.y);
      }
    });

    if (game.path.length > 1) {
      for (let i = 0; i < game.path.length - 1; i++) {
        const node = game.path[i + 1];
        const sw = p.map(node.depth, 1, 12, 12, 3);
        p.strokeWeight(sw);

        const pathColor = game.path[i + 1].optimal
          ? "--visited-color"
          : "--wrong-color";
        p.stroke(
          getComputedStyle(document.documentElement).getPropertyValue(
            pathColor
          ) + "80"
        );
        p.line(node.parent.pos.x, node.parent.pos.y, node.pos.x, node.pos.y);
        p.strokeWeight(sw * 0.6);
        p.stroke(
          getComputedStyle(document.documentElement).getPropertyValue(pathColor)
        );
        p.line(node.parent.pos.x, node.parent.pos.y, node.pos.x, node.pos.y);
      }
    }

    treeData.tree.forEach((node) => {
      const isCurrent = node === game.currentNode;
      const size = isCurrent ? 24 : game.path.includes(node) ? 16 : 10;

      p.noStroke();
      if (isCurrent) {
        p.fill(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--glow-color"
          ) + "99"
        );
        p.ellipse(node.pos.x, node.pos.y, size * 1.5, size * 1.5);
        p.fill(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--glow-color"
          )
        );
      } else if (game.path.includes(node)) {
        const nodeColor = node.optimal ? "--visited-color" : "--wrong-color";
        p.fill(
          getComputedStyle(document.documentElement).getPropertyValue(nodeColor)
        );
      } else {
        p.fill(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--dim-color"
          )
        );
      }
      p.ellipse(node.pos.x, node.pos.y, size, size);
    });
  };

  p.windowResized = () => {
    const canvasContainer = document.getElementById("canvas-container");
    p.resizeCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
    p.restart();
  };

  p.restart = () => {
    const summaryWrapper = document.getElementById("end-summary-wrapper");
    if (summaryWrapper) {
      summaryWrapper.style.display = "none";
      summaryWrapper.innerHTML = "";
    }

    document.getElementById("start-controls").style.display = "flex";
    document.getElementById("restart-btn").style.display = "none";

    soilLevel = p.height - SOIL_Y_OFFSET;

    // Generate grass
    grassTufts = [];
    for (let i = 0; i < p.width; i += p.random(10, 40)) {
      const tuft = {
        x: i,
        weight: p.random(1, 2.5),
        blades: [],
      };
      const bladeCount = p.random(3, 7);
      for (let j = 0; j < bladeCount; j++) {
        const angle = -p.PI / 2 + p.random(-p.PI / 8, p.PI / 8);
        const length = p.random(5, 20);
        tuft.blades.push({
          x: length * p.cos(angle),
          y: length * p.sin(angle),
        });
      }
      grassTufts.push(tuft);
    }

    treeData = generateTreeData(game.complexity);
    game.setTree(treeData);
    game.state = "PRE_START";
    game.score = 0;
    game.penalty = 0;
    game.updateUI();
  };
};

// --- INITIALIZATION ---
// Moved the entire script to the end of the body to ensure all DOM elements are loaded.
document.addEventListener("DOMContentLoaded", () => {
  carousel.init();
  game.init();
  window.p5Instance = new p5(sketch, "canvas-container");
});
