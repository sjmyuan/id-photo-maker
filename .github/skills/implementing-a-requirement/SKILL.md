---
name: implementing-a-requirement
description: Clarify and structure the requirement first, then generate an implementation plan for the requirement, and execute the plan step by step; Use this skill when user submits a requirement to add new functionalities.
---

# Implementing a requirement

This skill helps you
- Clarify and structure the requirement 
- Generate a plan to implement the requirement
- Complete the plan step by step

# When to use this skill

Use this skill when user submits a requirement to add new functionalities.

# Guidance to implement a requirement

- Gather relevant information from the codebase, knowledge base, and user input to clearly define the software requirement.
- Identify and clarify any ambiguous terms or implicit assumptions to ensure proper understanding.
- Ask questions to the user to refine and narrow down the focus of the software requirement as needed.
- Present a structured summary of the requirement to the user and request confirmation or refinements.

- Break down high-level software requirements into specific, independently testable functionalities.
- Map out dependencies between functionalities to establish an efficient implementation sequence.
- Create a detailed step-by-step implementation plan for the functionalities following the tdd approach. for each functionality, the steps should include:
  - **Write Focused Tests**, Create precise unit tests for a single functionality, task or requirement, ensuring coverage of all possible scenarios, edge cases, and invalid inputs.  
  - **Confirm Test Failure**, Execute the tests to verify they fail initially, confirming their validity before implementation begins.  
  - **Implement Minimal Code**, Write the simplest code required to pass the tests, avoiding over-engineering or adding features not directly related to the current test cases.  
  - **Verify Implementation**, Re-run the tests to confirm that the implemented code passes all test cases successfully. Debug and refine as necessary.  
  - **Refactor**, Improve the code’s structure, readability, and performance while maintaining functionality, ensuring no tests break during the process.  
  - **Validate Refactoring**, Run the tests again after refactoring to ensure the updated code still passes all test cases without introducing regressions.
  - **Validate Linting, Formatting and Type Checking**, Run linting, formatting and type checking tools to ensure code quality and adherence to coding standards.
- Ensure the total number of steps in the plan is manageable and does not exceed 20 steps.
- Summarize the plan back to the user. for example:
  """
  To implement the requirement of [requirement summary], the plan is as follows:
  - Step 1: Write Focused Tests for functionality A
  - Step 2: Confirm Test Failure for functionality A
  - Step 3: Implement Minimal Code for functionality A
  - Step 4: Verify Implementation for functionality A
  - Step 5: Refactor code related to functionality A
  - Step 6: Validate Refactoring for functionality A
  - Step 7: Validate Linting, Formatting and Type Checking for functionality A
  - Step 8: Write Focused Tests for functionality B
  - Step 9: Confirm Test Failure for functionality B
  - Step 10: Implement Minimal Code for functionality B
  - Step 11: Verify Implementation for functionality B
  - Step 12: Refactor code related to functionality B
  - Step 13: Validate Refactoring for functionality B
  - Step 14: Validate Linting, Formatting and Type Checking for functionality B
  - ...

  I will update the #todo tool to match this plan and proceed to implement the requirement step by step as outlined.
  Aside from the status of steps, I will not modify the steps of the plan in the #todo tool.
  """

- Implement the requirement step by step as outlined. And aside from the status of steps, do not modify the steps of the plan in the #todo tool.