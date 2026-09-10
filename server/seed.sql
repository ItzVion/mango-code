-- Paste into the Turso SQL console to populate real content.
-- Safe to re-run: uses INSERT OR REPLACE.

INSERT OR REPLACE INTO courses (id, name, color, sort_order) VALUES
  ('html-css', 'HTML & CSS', '#FF6B3D', 1),
  ('javascript', 'JavaScript', '#FFB627', 2),
  ('python', 'Python', '#2FBF71', 3),
  ('c', 'C', '#4C7CFF', 4),
  ('cpp', 'C++', '#B266FF', 5);

-- HTML & CSS -----------------------------------------------------
INSERT OR REPLACE INTO lessons (id, course_id, title, content, sort_order) VALUES
  ('html-1', 'html-css', 'Your First HTML Page',
   'Every web page starts with a basic structure: <html>, <head>, and <body>. The <head> holds page info like the title; the <body> holds everything people actually see — headings, paragraphs, images, links.

A heading uses <h1> through <h6> (h1 is biggest). A paragraph uses <p>. Tags almost always come in pairs: an opening tag and a closing tag with a slash, like <p>Hello</p>.',
   1);

INSERT OR REPLACE INTO quiz_questions (id, lesson_id, question, options, correct_index) VALUES
  ('html-1-q1', 'html-1', 'Which tag defines the biggest heading?',
   '["<h1>", "<h6>", "<head>", "<title>"]', 0),
  ('html-1-q2', 'html-1', 'Which tag is used for a paragraph of text?',
   '["<para>", "<p>", "<text>", "<pg>"]', 1);

-- JavaScript -------------------------------------------------------
INSERT OR REPLACE INTO lessons (id, course_id, title, content, sort_order) VALUES
  ('js-1', 'javascript', 'Variables & console.log',
   'JavaScript runs inside the browser (or Node) and can print output with console.log(...). Variables are declared with let or const:

let a = 4
let b = 5
console.log(a + b)

Try the exercise below: it runs your exact code and checks the printed output.',
   1);

INSERT OR REPLACE INTO exercises (id, lesson_id, language, prompt, starter_code, test_input, expected_output) VALUES
  ('js-1-ex1', 'js-1', 'javascript',
   'Print the sum of 4 and 5 using console.log — nothing else.',
   '// write your code here
',
   '', '9');

INSERT OR REPLACE INTO quiz_questions (id, lesson_id, question, options, correct_index) VALUES
  ('js-1-q1', 'js-1', 'Which keyword declares a variable that can be reassigned later?',
   '["const", "let", "var only", "define"]', 1);

-- Python -------------------------------------------------------
INSERT OR REPLACE INTO lessons (id, course_id, title, content, sort_order) VALUES
  ('py-1', 'python', 'Your First Python Program',
   'Python programs run top to bottom. To print something to the screen, use print(...):

print("Hello, MangoCode!")

No semicolons, no curly braces — indentation is how Python groups code.',
   1);

INSERT OR REPLACE INTO exercises (id, lesson_id, language, prompt, starter_code, test_input, expected_output) VALUES
  ('py-1-ex1', 'py-1', 'python',
   'Write a program that prints exactly: Hello, MangoCode!',
   '# write your code here
',
   '', 'Hello, MangoCode!');

INSERT OR REPLACE INTO quiz_questions (id, lesson_id, question, options, correct_index) VALUES
  ('py-1-q1', 'py-1', 'What function prints text to the screen in Python?',
   '["echo()", "print()", "console.log()", "write()"]', 1);

-- C -------------------------------------------------------
INSERT OR REPLACE INTO lessons (id, course_id, title, content, sort_order) VALUES
  ('c-1', 'c', 'Hello, World in C',
   'Every C program needs a main() function — that is where execution starts. printf(...) prints text:

#include <stdio.h>

int main() {
    printf("Hello, World!");
    return 0;
}',
   1);

INSERT OR REPLACE INTO exercises (id, lesson_id, language, prompt, starter_code, test_input, expected_output) VALUES
  ('c-1-ex1', 'c-1', 'c',
   'Complete main() so the program prints exactly: Hello, World!',
   '#include <stdio.h>

int main() {
    // your code here
    return 0;
}
',
   '', 'Hello, World!');

INSERT OR REPLACE INTO quiz_questions (id, lesson_id, question, options, correct_index) VALUES
  ('c-1-q1', 'c-1', 'Which function starts every C program?',
   '["start()", "main()", "run()", "init()"]', 1);

-- C++ -------------------------------------------------------
INSERT OR REPLACE INTO lessons (id, course_id, title, content, sort_order) VALUES
  ('cpp-1', 'cpp', 'Hello, World in C++',
   'C++ uses cout to print, and << to feed values into it:

#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!";
    return 0;
}',
   1);

INSERT OR REPLACE INTO exercises (id, lesson_id, language, prompt, starter_code, test_input, expected_output) VALUES
  ('cpp-1-ex1', 'cpp-1', 'cpp',
   'Complete main() so the program prints exactly: Hello, World!',
   '#include <iostream>
using namespace std;

int main() {
    // your code here
    return 0;
}
',
   '', 'Hello, World!');

INSERT OR REPLACE INTO quiz_questions (id, lesson_id, question, options, correct_index) VALUES
  ('cpp-1-q1', 'cpp-1', 'Which operator sends a value to cout?',
   '[">>", "<<", "::", "->"]', 1);
