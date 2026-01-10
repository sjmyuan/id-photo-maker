---
name: fixing-a-bug
description: Identify the root cause of the bug first, then generate a plan to fix the bug, and execute the plan step by step; Use this skill when user reports a bug.
---

# Fixing a bug

This skill helps you
- Identify the root cause of the bug.
- Generate a plan to fix the bug.
- Complete the plan step by step

# When to use this skill

Use this skill when user reports a bug

# Guidance to fix a bug

- Gather relevant information from the codebase, knowledge base, test results and user input to clearly identify the bug.
- Analyze the information to identify patterns, inconsistencies, or anomalies that may indicate the root cause of the bug.
- Formulate hypotheses about potential causes and systematically test them through code inspection, debugging, or additional logging.
- Ask questions to the user to narrow down the possibilities until the most likely root cause is identified.
- Present the identified root cause and the reasoning process to the user and request confirmation or refinements.

- Break down the identified bug root cause into specific, independently testable issues.
- Map out dependencies between issues to establish an efficient bug-fixing sequence.
- Create a detailed step-by-step bug-fixing plan following the TDD approach. For each issue, the steps should include:
  - **Write Focused Tests**: Create precise unit tests targeting the specific bug issue, ensuring comprehensive coverage of all scenarios, edge cases, and invalid inputs.
  - **Confirm Test Failure**: Execute the tests to verify they fail initially, validating that the tests correctly identify the current code behavior before fixing begins.
  - **Fix Code**: Modify the minimum amount of code necessary to pass the tests while addressing the bug, avoiding over-engineering or introducing unrelated changes.
  - **Verify Fix**: Re-run all tests to confirm the fix works successfully. Debug and refine as necessary to ensure correctness.
  - **Validate Linting, Formatting and Type Checking**: Run linting, formatting and type checking tools to ensure code quality and adherence to coding standards.
- Ensure the total number of steps in the plan is manageable and does not exceed 20 steps.
- Summarize the complete plan to the user. For example:
  """
  To fix the bug of [bug summary], the plan is as follows:
  - Step 1: Write Focused Tests for issue A
  - Step 2: Confirm Test Failure for issue A
  - Step 3: Fix Code for issue A
  - Step 4: Verify Fix for issue A
  - Step 5: Validate Linting, Formatting and Type Checking for issue A
  - Step 6: Write Focused Tests for issue B
  - Step 7: Confirm Test Failure for issue B
  - Step 8: Fix Code for issue B
  - Step 9: Verify Fix for issue B
  - Step 10: Validate Linting, Formatting and Type Checking for issue B
  - ...
  I will update the #todo tool to match this plan and proceed to fix the bug step by step as outlined.
  Aside from the status of steps, I will not modify the steps of the plan in the #todo tool.
  """
- Fix the bug step by step as outlined. And aside from the status of steps, do not modify the steps of the plan in the #todo tool.