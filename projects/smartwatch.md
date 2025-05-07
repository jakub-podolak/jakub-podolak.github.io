---
title: My Cyberpunk DIY Smartwatches Over The Years
layout: post
parent: Projects and Blogposts
carousels:
  - images:
      - image: /assets/images/smartwatches/skl1_start.png
      - image: /assets/images/smartwatches/skl1_game.png
      - image: /assets/images/smartwatches/skl1_calc.png
      - image: /assets/images/smartwatches/skl1_binsearch.png
  - images:
      - image: /assets/images/smartwatches/skl2_front.png
      - image: /assets/images/smartwatches/skl2_rgb.png
      - image: /assets/images/smartwatches/skl2_inside.png
      - image: /assets/images/smartwatches/skl2_pcb.png
  - images:
      - image: /assets/images/smartwatches/skl3_front.jpg
      - image: /assets/images/smartwatches/skl3_menu.jpg
      - image: /assets/images/smartwatches/skl3_pong.jpg
      - image: /assets/images/smartwatches/skl3_pcb_print.jpg
  - images:
      - image: /assets/images/smartwatches/skl4_only_pic.jpg
  - images:
      - image: /assets/images/smartwatches/skl5_front.png
      - image: /assets/images/smartwatches/skl5_sideways.png
  - images:
      - image: /assets/images/smartwatches/skl6_pcb.jpg
---

# My Cyberpunk DIY Smartwatches Over The Years - Offical Rating

Hello! Since 2017 I've been dreaming of building my own smartwatch, and as a result, I've created several prototypes over the years. I thought it might be cool (for me, and maybe someone else as well) to go over them one by one and rate them in a scale from 1 to 5 stars. Let's go!

---

## 2018: SKL1, Encouraging Start

{% include carousel.html height="50" unit="%" duration="10" number="1" %}

First smartwatch, made with a 0.96" OLED display, Arduino Pro Micro, and a case built from spare laminates. Super bulky, very ugly both inside and out, but it worked! Charged via two jumper wires plugged into some holes in the case. Super messy software, but it had one game and even a crude calculator (numbers inserted via binary search 🤓).

### 😍 Pros:

- First smartwatch and encouraging start
- 1 game (obstacle avoidance)
- 1 calculator (binary search, numbers in range 0 - 1024)
- 24 hour battery life

### 😩 Cons:

- Super bulky
- Weird charging method
- Memory limiting the number of apps (32kB)
- Can break easily

### Final Rating: ⭐⭐⭐ out of 5

---

## 2018: SKL2, Hand-drawing first PCBs

{% include carousel.html height="50" unit="%" duration="10" number="2" %}

Slimmer than the previous version, with significantly more memory thanks to a Proton development board. The case was still made from spare laminates, but this time I hand-drew the PCB and etched it myself, removing ugly wires and making it slimmer. Unfortunately, my homebrew PCB was very fragile—elements and traces peeled off easily, and the whole watch fell apart after just a few days of use.

### 😍 Pros

- Slim design
- Cool RGB LED effects
- More memory = space for more apps

### 😩 Cons

- Very fragile because of homebrew PCB

### Final Rating: ⭐⭐ out of 5

---

## 2019: SKL3, 3D Printing Enabled

{% include carousel.html height="50" unit="%" duration="10" number="3" %}

Designing and 3D-printing a custom enclosure allowed me to make it more robust. While the PCB was still etched at home, it was designed on a computer and protected with a layer of lacquer. The screen was now a 1.3" OLED, and the watch finally got a proper charging method via micro-USB. The slim design limited battery size and left out an RTC module, so the watch had to be charged every day and the time reset each time it died. Still, thanks to improved robustness, it was finally usable as a daily watch for weeks.

### 😍 Pros

- Cool and durable 3D printed case
- Micro USB charging
- Bigger display
- New apps: 2 player Pong, app for running (stopwatch + distance calculator)

### 😩 Cons

- No RTC module
- Poor battery life (1 day)
- Limited memory (32kB)

### Final Rating: ⭐⭐⭐⭐ out of 5

---

## 2020: SKL4, Testing new technologies

{% include carousel.html height="50" unit="%" duration="10" number="4" %}

This ephemeral version was made to test new technologies such as using an ESP32 with built-in Wi-Fi and OLED display, and capacitive touch buttons instead of tactile switches. Unfortunately, the capacitive touch buttons worked poorly, and the ESP32 module I had was too big to wear on the wrist—so the watch was never finished.

### 😍 Pros

- More memory and WiFi
- No moving parts, and no custom PCB needed

### 😩 Cons

- Capacitive touch buttons didn't work well
- Too big to wear on a wrist

### Final Rating: ⭐ out of 5

---

## 2020: SKL5, Rugged and with a professional custom PCB

{% include carousel.html height="50" unit="%" duration="10" number="5" %}

Building on SKL3’s success, this version aimed to improve robustness and usability. The PCB was designed in Eagle and manufactured professionally, allowing for a more detailed layout. I also swapped the big 1.3-inch OLED for a smaller one, and replaced the Arduino Pro Micro with a compact, more powerful Seeeduino Xiao. This made room for a bigger battery and an RTC module, giving the watch several days of runtime without charging. The 3D-printed case featured button covers and a transparent screen cover for basic rain protection.

### 😍 Pros

- Professional PCB manufacturing
- RTC module
- Bigger battery
- Very durable 3D printed case
- More memory (256kB)

### 😩 Cons

- Small display
- Only very basic features of a watch

### Final Rating: ⭐⭐⭐⭐⭐ out of 5

---

## 2022: SKL6, Too many features, too little time

{% include carousel.html height="50" unit="%" duration="10" number="6" %}

Like SKL4, this watch was intended to incorporate many new technologies, with ambitions to be truly “smart”— offering more than just timekeeping. The PCB was again designed in Eagle and professionally manufactured, with plans to add temperature, humidity, and pressure sensors, as well as a pulse oximeter and heart-rate monitor. Unfortunately, the number of features and fitting them into the case became overwhelming, and I was busy with my studies. As of 2025, it’s probably better to start from scratch with up-to-date components.

### 😍 Pros

- More features: Pulsoximeter, outdoor sensors
- Professional PCB manufacturing

### 😩 Cons

- Too many features
- Too little time

### Final Rating: ⭐⭐ out of 5

---

### 202?: SKL7, The Future

I’ve noticed that every odd version is a success (reliable solutions, good design) and every even version is a failure (too many features, new technologies). Following this trend, SKL7 has to be a success 😁. With more up-to-date components, I hope to combine SKL5’s robustness with SKL6’s dream of new features. My design taste has also evolved, so it might be less cyberpunk-y. We’ll see what the future brings!
