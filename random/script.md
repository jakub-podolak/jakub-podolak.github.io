---
title: "Limits of JS scripting inside Jekyll Github Page"
layout: home
parent: Random
---

# Limits of JS scripting inside Jekyll Github Page

Evergreen project for testing the limits of this website.  
I don't know what is possible to do with Jekyll and what's not possible with just a markdown file and inline JS.  
This is a playground to test some features and potentially make an online game here!

## Simple Counter

{% raw %}

<div id="counter-container" style="text-align:center; margin:20px;">
  <h3>Counter: <span id="counter-value">0</span></h3>
  <button name="decrement-button" onclick="decrement()">-</button>
  <button name="increment-button" onclick="increment()">+</button>
</div>
{% endraw %}

## Choose-Your-Own-Adventure Game

{% raw %}

<!-- Display HP at all times -->
<div id="hp-container" style="text-align:center; margin:20px;">
  <h3>HP: <span id="hp-value">15</span></h3>
</div>

<!-- Start button -->

<button name="start-button" onclick="start()">Start</button>

<!-- Game text and options container -->
<div id="game-container" style="text-align:center; margin:20px;">
  <p id="game-text"></p>
  <div id="game-options"></div>
</div>
{% endraw %}

<!-- Load external JS file -->
<script src="/assets/js/game_demo.js"></script>
