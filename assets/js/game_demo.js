document.addEventListener("DOMContentLoaded", function () {
  // --- Simple Counter Logic ---
  let counter = 0;
  const counterValue = document.getElementById("counter-value");

  // Expose these functions globally for the inline onclick handlers
  window.increment = function () {
    counter++;
    if (counterValue) counterValue.textContent = counter;
  };

  window.decrement = function () {
    counter--;
    if (counterValue) counterValue.textContent = counter;
  };

  // --- Choose-Your-Own-Adventure Game Logic ---
  let hp = 15;
  const hpValue = document.getElementById("hp-value");
  const gameText = document.getElementById("game-text");
  const gameOptions = document.getElementById("game-options");

  // Define the game states
  const states = {
    ballroom: {
      text: "You are in a lavish ballroom with echoes of a forgotten past. Doors lead to a corridor and a library.",
      options: [
        { text: "Go to corridor", nextState: "corridor" },
        { text: "Go to library", nextState: "library" },
      ],
    },
    corridor: {
      text: "You are in a long, dim corridor lined with old paintings. Doors lead back to the ballroom and to the library.",
      options: [
        { text: "Go to ballroom", nextState: "ballroom" },
        { text: "Go to library", nextState: "library" },
      ],
    },
    library: {
      text: "You are in a dusty library filled with ancient tomes. Doors lead back to the ballroom and corridor. There is also a mysterious bookshelf.",
      options: [
        { text: "Go to ballroom", nextState: "ballroom" },
        { text: "Go to corridor", nextState: "corridor" },
        { text: "Investigate bookshelf", nextState: "trap" },
      ],
    },
    trap: {
      text: "As you investigate the bookshelf, a hidden mechanism triggers a trap! You lose 3 HP.",
      options: [{ text: "Return to library", nextState: "library" }],
      onEnter: function () {
        hp -= 3;
        if (hp < 0) {
          hp = 0;
        }
        if (hpValue) hpValue.textContent = hp;
      },
    },
  };

  // Function to enter a state
  function enterState(stateName) {
    const state = states[stateName];
    // Run onEnter if defined
    if (state.onEnter) {
      state.onEnter();
    }
    if (gameText) {
      gameText.textContent = state.text;
    }
    if (gameOptions) {
      // Clear existing options
      gameOptions.innerHTML = "";
      // Create new buttons for each option
      state.options.forEach(function (option) {
        const btn = document.createElement("button");
        btn.textContent = option.text;
        btn.style.margin = "5px";
        btn.onclick = function () {
          enterState(option.nextState);
        };
        gameOptions.appendChild(btn);
      });
    }
  }

  // Expose the start function globally so that the Start button can call it.
  window.start = function () {
    enterState("ballroom");
  };
});
