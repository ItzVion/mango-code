-- Replace the placeholder beginner drills with small tasks that practise the named concept.
-- Safe to re-run: this updates existing exercise rows only.
BEGIN;
WITH replacements(id, prompt, starter_code, test_input, expected_output) AS (
VALUES
  ('javascript-easy-1-ex1', 'Create two constants named learner and xp. Print the sentence shown in the comment.', '// Store the learner''s name and XP, then print the sentence.
const learner = "Mango";
const xp = 10;

// Print: Mango earned 10 XP.
', '', 'Mango earned 10 XP.'),
  ('javascript-easy-2-ex1', 'Use multiplication to calculate the total fruit count, then print the number.', 'const apples = 4;
const mangoes = 3;
// Calculate and print the total number of fruit.
', '', '12'),
  ('javascript-easy-3-ex1', 'Use a template literal to print the greeting shown in the comment.', 'const name = "Mango";
// Print: Hello, Mango!
', '', 'Hello, Mango!'),
  ('javascript-easy-4-ex1', 'Use if/else to print Pass when the score is at least 60; otherwise print Try again.', 'const score = 72;
// Add an if/else decision here.
', '', 'Pass'),
  ('javascript-easy-5-ex1', 'Use a for loop to add 1, 2 and 3, then print the total.', 'let total = 0;
// Add a for loop that adds 1, 2 and 3 to total.
', '', '6'),
  ('python-easy-1-ex1', 'Print the exact greeting shown in the comment using print().', '# Print: Hello, Mango!
', '', 'Hello, Mango!'),
  ('python-easy-2-ex1', 'Create learner and xp variables, then print the sentence shown in the comment.', 'learner = "Mango"
xp = 10
# Print: Mango earned 10 XP.
', '', 'Mango earned 10 XP.'),
  ('python-easy-3-ex1', 'Use an f-string to print the greeting shown in the comment.', 'name = "Mango"
# Print: Hello, Mango!
', '', 'Hello, Mango!'),
  ('python-easy-4-ex1', 'Use multiplication and addition to calculate the total price, then print it.', 'apples = 4
mangoes = 3
# Print 4 + 3 * 2.
', '', '10'),
  ('python-easy-5-ex1', 'Use if/else to print Pass when score is at least 60; otherwise print Try again.', 'score = 72
# Add an if/else decision here.
', '', 'Pass'),
  ('c-easy-1-ex1', 'Complete main so the program prints Hello, Mango! using puts or printf.', '#include <stdio.h>

int main(void) {
    // Print: Hello, Mango!
    return 0;
}
', '', 'Hello, Mango!'),
  ('c-easy-2-ex1', 'Declare an int and a double, then print both values in the requested format.', '#include <stdio.h>

int main(void) {
    int lives = 3;
    double health = 7.5;
    // Print: Lives: 3, Health: 7.5
    return 0;
}
', '', 'Lives: 3, Health: 7.5'),
  ('c-easy-3-ex1', 'Read one integer from standard input and print that number plus 3. The test input is 4.', '#include <stdio.h>

int main(void) {
    int apples;
    // Read an integer, then print Total: followed by apples + 3.
    return 0;
}
', '4', 'Total: 7'),
  ('c-easy-4-ex1', 'Use operator precedence to calculate 4 + 3 * 2 and print the result.', '#include <stdio.h>

int main(void) {
    int total = 4 + 3 * 2;
    printf("%d", total);
    return 0;
}
', '', '10'),
  ('c-easy-5-ex1', 'Use if/else to print Pass when score is at least 60; otherwise print Try again.', '#include <stdio.h>

int main(void) {
    int score = 72;
    // Add the if/else decision.
    return 0;
}
', '', 'Pass'),
  ('cpp-easy-1-ex1', 'Complete main so the program prints Hello, Mango! using std::cout.', '#include <iostream>

int main() {
    // Print: Hello, Mango!
    return 0;
}
', '', 'Hello, Mango!'),
  ('cpp-easy-2-ex1', 'Declare an int and a double, then print both values in the requested format.', '#include <iostream>

int main() {
    int lives = 3;
    double health = 7.5;
    // Print: Lives: 3, Health: 7.5
    return 0;
}
', '', 'Lives: 3, Health: 7.5'),
  ('cpp-easy-3-ex1', 'Use an if/else condition to print Pass when score is at least 60.', '#include <iostream>

int main() {
    int score = 72;
    // Add the if/else decision.
    return 0;
}
', '', 'Pass'),
  ('cpp-easy-4-ex1', 'Use a range-based for loop to add every value in the array, then print the total.', '#include <iostream>

int main() {
    int levels[] = {1, 2, 3};
    int total = 0;
    // Use a range-based for loop to add each level.
    return 0;
}
', '', '6'),
  ('cpp-easy-5-ex1', 'Use std::string to print the greeting shown in the comment.', '#include <iostream>
#include <string>

int main() {
    std::string name = "Mango";
    // Print: Hello, Mango!
    return 0;
}
', '', 'Hello, Mango!')
)
UPDATE exercises AS e
SET prompt = r.prompt,
    starter_code = r.starter_code,
    test_input = r.test_input,
    expected_output = r.expected_output
FROM replacements AS r
WHERE e.id = r.id;
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM exercises WHERE id IN ('javascript-easy-1-ex1', 'javascript-easy-2-ex1', 'javascript-easy-3-ex1', 'javascript-easy-4-ex1', 'javascript-easy-5-ex1', 'python-easy-1-ex1', 'python-easy-2-ex1', 'python-easy-3-ex1', 'python-easy-4-ex1', 'python-easy-5-ex1', 'c-easy-1-ex1', 'c-easy-2-ex1', 'c-easy-3-ex1', 'c-easy-4-ex1', 'c-easy-5-ex1', 'cpp-easy-1-ex1', 'cpp-easy-2-ex1', 'cpp-easy-3-ex1', 'cpp-easy-4-ex1', 'cpp-easy-5-ex1')) <> 20 THEN
    RAISE EXCEPTION 'Interactive beginner exercise migration expected 20 rows.';
  END IF;
END $$;
COMMIT;
