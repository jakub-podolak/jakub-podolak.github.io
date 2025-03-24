---
title: "When and why do Uncertainty Quantification Methods for LLMs Work?"
layout: home
parent: Blogposts
---

# When and Why Do Uncertainty Quantification Methods for LLMs Work?

<div style="background-color:#ffdddd; border-left:4px solid #f44336; padding:10px; margin-bottom:15px;">
⚠️ <strong>Note:</strong> As of 24.03.2025 this work is still in progress. Contents may change.
</div>

## Why do Uncertainty Quantification methods matter?

Large Language Models (LLMs), such as GPT, LLaMA, and Phi, can produce impressive, human-like responses on a wide variety of tasks—from answering trivia questions to writing Python code ([Dubey et al. 2024]). Despite their impressive capabilities, these models may produce incorrect answers while maintaining high confidence and sounding plausible - an issue often referred to as **hallucinations** ([Huang et al. 2023]).

To safely rely on LLM outputs, we must understand **how certain the model is about its answers**. This is precisely the goal of **Uncertainty Quantification (UQ)** methods, which measure how much we can trust a model's predictions.

Although numerous uncertainty quantification methods exist, it's still unclear whether they generalize well across different contexts or data types. Recent studies, such as those exploring "multicalibration," suggest that calibration performance can vary significantly across domains ([Detommaso et al. 2024]).

In particular, easy-to-use methods like **Verbalized Confidence**, where a model explicitly states its certainty (e.g., "I'm 80% sure"), might seem appealing but could be unreliable or overly confident in some contexts. This work aims to systematically assess when and why these discrepancies occur, providing insights into the practical use of uncertainty quantification methods.

This blog post explores why and when certain UQ methods succeed or fail. Gaining this understanding is crucial not only for building safer AI systems but also for deepening our knowledge of how these powerful models behave and when we can trust them.

<figure style="text-align: center; margin-bottom: 20px; margin-top: 4em">
  <img src="/assets/images/semantic_discrepancies.png" alt="Discrepancy between UQ methods" style="max-width: 500px; width: 100%;">
  <figcaption><strong>Figure 1.</strong> <em>Example discrepancy between semantic and verbalized confidence scores for LLaMA3. The model provides different answers when asked the same question multiple times, despite reporting high confidence.</em></figcaption>
</figure>

---

## Why Care about Calibration?

Effective uncertainty quantification relies heavily on **calibration**—a model’s predicted confidence should closely reflect its actual probability of correctness ([Guo et al. 2017]). Ideally, a perfectly calibrated model that claims to be "90% confident" about its answers should indeed be correct in approximately 90% of those cases. Unfortunately, most large language models, particularly those tuned using reinforcement learning with human feedback (RLHF), tend to be overly confident even when they're incorrect ([Tian et al. 2023]; [Kadavath et al. 2022]).

Reliable calibration becomes especially critical in high-stakes domains such as medicine or finance, where trusting an incorrect but confidently presented answer can lead to serious consequences.

When assessing calibration in large language models, we identify two potential challanges:

- **Domain-Specific Calibration**: Existing research indicates that a language model may be well-calibrated within one domain or dataset but poorly calibrated in another—a phenomenon known as **multicalibration** ([Detommaso et al. 2024]). This variability means confidence scores could be highly accurate for certain types of questions but unreliable for others.

- **Inconsistent Confidence Measures**: There are multiple ways to extract confidence scores from LLMs, some of them described in the next section. We hypothesize that model might be accurately calibrated using one method (for example, explicitly asking the model for its confidence), yet poorly calibrated when assessed using a different approach (such as token-level probability scores). For instance, a model might provide reasonable confidence ratings verbally but have token probabilities that don't correlate well with actual correctness.

These two possible issues may complicate the reliable adoption and use of uncertainty quantification methods. Our work aims to clarify when and why particular methods are effective, ultimately helping practitioners choose appropriate strategies for different contexts and understand models better.

---

## How to quantify LLM's confidence?

Several methods exist for quantifying the uncertainty of LLM-generated answers:

1. **Token-Level Probabilities:**  
   Using the raw probabilities of individual tokens as indicators of model confidence ([Dhuliawala et al. 2022]).

2. **Semantic Consistency:**  
   Generating multiple answers with slight variations (using higher randomness, i.e., higher temperature) and measuring agreement among the answers ([Farquhar et al. 2024]).

3. **True/False Scoring:**  
   Asking the model separately if its answer is true or false, then taking the probability of the model answering "True" as its confidence ([Detommaso et al. 2024]).

4. **Verbalized Confidence:**  
   A more user-friendly method where the model explicitly states its confidence as a percentage (e.g., "I'm 85% confident in this answer.") ([Xiong et al. 2024]; [Yang et al. 2024]).

---

## Understanding Verbalized Confidence in Detail

**Verbalized confidence** methods prompt the LLM to directly communicate how certain it is, typically as a percentage (0%–100%). This approach is particularly appealing because:

- It provides intuitive, human-readable uncertainty estimates.
- It’s compatible with closed-source or API-based LLMs (like OpenAI’s GPT-4), which often limit access to internal model probabilities ([Xiong et al. 2024]; [Ni et al. 2024]).
- It allows flexible prompting strategies, such as asking the model to first produce an answer and then reflect on its correctness (self-judge calibration) or asking it directly how confident it is about the given answer (judge calibration) ([Yang et al. 2024]; [Wei et al. 2024]).

However, despite these benefits, verbalized confidence estimates have notable drawbacks:

- **Overconfidence**: Models frequently report overly optimistic confidence levels, especially after RLHF, often claiming high certainty even when they are incorrect ([Zhang et al. 2024]; [Yang et al. 2024]; [Wei et al. 2024]).
- **Inconsistency**: Small changes in the prompt wording or context can lead to drastically different confidence estimates ([Pawitan et al. 2024]).
- **Model Size & Reasoning Dependence**: Larger models or longer reasoning times generally improves calibration, making verbalized score less useful for smaller LLMs ([Jurayj et al. 2025]; [Xiong et al. 2024]).

In fact, prior studies have found that while verbalized confidence is convenient, probabilistic methods like semantic consistency or token-level scores often outperform it in reliability ([Ni et al. 2024]; [Wei et al. 2024]). Understanding when verbalized confidence works and when it fails remains an important open research question, that could shed a light on the internal workings of LLM's reported confidence.

---

## Open Questions

Given these complexities, our research seeks to answer the following questions:

- **RQ1**: Do different UQ methods (e.g., verbalized vs. semantic) generally agree, or do they often diverge significantly?
- **RQ2**: Which types of questions or domains allow LLMs to accurately verbalize their uncertainty?
- **RQ3**: What underlying factors lead to accurate (or inaccurate) uncertainty estimates within specific domains?
- **RQ4**: Does extended reasoning or chain-of-thought improve the reliability of verbalized confidence?

---

## Planned Experiments

To explore these questions, we're planning experiments using popular question-answering datasets like TriviaQA ([Joshi et al. 2017]), MMLU ([Hendrycks et al. 2021]), and SimpleQA ([Wei et al. 2024]), enriched with domain-specific tags (sports, culture, reasoning complexity).

We'll perform:

- **Comparisons of UQ methods** across domains (sports, science, etc.) to see if some methods consistently outperform others.
- **Analysis of reasoning length**, comparing verbalized confidence with and without chain-of-thought prompting ([Wei et al. 2024]).
- **Assessment of domain familiarity**, investigating whether familiar topics produce better calibrated confidence scores.

Through these experiments, we aim to deliver actionable insights into which uncertainty methods work best in different scenarios.

---

## Changelog:

- 19.03.2025: Added introduction, motivation, descriptions of existing methods and research questions
- 24.03.2025: Fixed the references links

[Dubey et al. 2024]: https://arxiv.org/abs/2407.21783
[Huang et al. 2023]: https://arxiv.org/abs/2311.05232
[Guo et al. 2017]: https://arxiv.org/abs/1706.04599
[Dhuliawala et al. 2022]: https://aclanthology.org/2022.findings-acl.133/
[Farquhar et al. 2024]: https://www.nature.com/articles/s41586-024-07421-0
[Detommaso et al. 2024]: https://arxiv.org/abs/2404.04689
[Xiong et al. 2024]: https://arxiv.org/abs/2306.13063
[Yang et al. 2024]: https://arxiv.org/abs/2412.14737
[Pawitan et al. 2024]: https://arxiv.org/abs/2412.15296
[Jurayj et al. 2025]: https://arxiv.org/abs/2502.13962
[Ni et al. 2024]: https://arxiv.org/abs/2408.09773
[Wei et al. 2024]: https://arxiv.org/abs/2411.04368
[Zhang et al. 2024]: https://arxiv.org/abs/2404.02655
[Kadavath et al. 2022]: https://arxiv.org/abs/2207.05221
[Tian et al. 2023]: https://arxiv.org/abs/2305.14975
[Joshi et al. 2017]: https://arxiv.org/abs/1705.03551
[Hendrycks et al. 2021]: https://arxiv.org/abs/2009.03300
