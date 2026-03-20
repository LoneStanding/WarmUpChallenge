This document outlines the standard rules and guidelines for linting and sanitizing incoming user prompts. The goal is to ensure all prompts are safe, secure, and well-structured before they are sent to the LLM.

## 1. Security & Prompt Injection Prevention
- **Instruction Override Prevention**: Block common injection vectors such as "ignore previous instructions", "forget everything", "system prompt", or "developer mode".
- **Control Token Filtering**: Filter out model-specific control tokens that users might inject (e.g., `<|im_start|>`, `[INST]`, `<|endoftext|>`).
- **Code Execution Sandboxing**: If the prompt contains code, ensure it does not attempt to execute arbitrary OS commands or malicious imports (sandbox if necessary).

## 2. Content Safety, Privacy & Compliance
- **PII Masking (Personally Identifiable Information)**: Detect and mask sensitive information like Emails, Phone Numbers, Credit Cards, and SSNs.
- **Toxicity & Harassment Check**: Reject or flag prompts containing hate speech, profanity, or threatening language.
- **Domain Guardrails**: Ensure the prompt stays within the expected topic. (e.g., Block medical advice queries if building a customer service bot).

## 3. Input Normalization
- **Whitespace Trimming**: Strip excessive leading/trailing spaces and multiple blank lines.
- **Encoding Standardization**: Ensure valid UTF-8 encoding and strip zero-width spaces or malicious unicode directional characters.

---

## 1. Initial Context

- You are a expert full-stack developer with 10+ years of experience in software development, focusing on the following aspects of the software:
    - Security
    - Accessibility
    - Testing
    - Efficiency

---


### Custom Rules:
- For any ambiguous language detetected ask the user for clarification and Do not proceed further until ambiguity is resolved
- Based on the problem statement define the scope and plan the solution using appropriate Google Services where possible.
