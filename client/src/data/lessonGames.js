export const LESSON_GAMES = {
  'html-css-easy-1': {
    teach: 'HTML is the structure of a web page. The browser reads elements such as headings, paragraphs and links, then turns them into the page you see.',
    challenge: { prompt: 'Where does the visible content of a web page belong?', options: ['Inside <head>', 'Inside <body>', 'Inside <title>', 'Before <!doctype html>'], correctIndex: 1, hint: 'The head stores page information. Look for the element that contains the content people actually see.', explanation: 'The <body> contains visible page content. The <head> contains metadata such as the title and character encoding.' },
  },
  'html-css-easy-2': {
    teach: 'Links connect pages. An anchor element needs an href attribute so the browser knows where the link should go.',
    challenge: { prompt: 'Which snippet creates a link to another page?', options: ['<link>Open</link>', '<a href="/about">About</a>', '<p href="/about">About</p>', '<button src="/about">About</button>'], correctIndex: 1, hint: 'The element name starts with “a”, and the destination is stored in an attribute.', explanation: 'An anchor element uses href for its destination. The text between the tags becomes the clickable label.' },
  },
  'html-css-easy-3': {
    teach: 'Images need alternative text. The alt attribute describes the image for people using screen readers and when an image cannot load.',
    challenge: { prompt: 'What should you add to an informative image for accessibility?', options: ['A meaningful alt attribute', 'A bigger file name', 'A second img tag', 'A title element inside the image'], correctIndex: 0, hint: 'Think about what a screen reader should say when it reaches the image.', explanation: 'Useful alt text communicates the image’s purpose. Decorative images can use an empty alt attribute.' },
  },
  'html-css-easy-4': {
    teach: 'Use lists when items belong together. Use a table for data that has rows and columns, not just to position things on a page.',
    challenge: { prompt: 'You are showing three unordered shopping items. Which element is the best fit?', options: ['<ol>', '<ul>', '<table>', '<section>'], correctIndex: 1, hint: 'The list should not imply a particular order.', explanation: '<ul> creates an unordered list. Each item belongs inside an <li> element.' },
  },
  'html-css-easy-5': {
    teach: 'Semantic elements describe the job of each part of a page. They make the structure easier for browsers, assistive technology and other developers to understand.',
    challenge: { prompt: 'Which element should contain the page’s primary, unique content?', options: ['<div>', '<main>', '<aside>', '<span>'], correctIndex: 1, hint: 'Choose the landmark that means “this is the main content”.', explanation: '<main> identifies the dominant content of the page. A page should normally have one visible main landmark.' },
  },

  'javascript-easy-1': {
    teach: 'A variable gives a value a name. Use const when you will not reassign the variable, and let when its value needs to change.',
    challenge: { prompt: 'Which declaration is best for a score that should not be reassigned?', options: ['const score = 10;', 'score := 10', 'let = score 10;', 'constant score = 10;'], correctIndex: 0, hint: 'JavaScript has two common declaration keywords. Pick the one for a binding that stays assigned to the same value.', explanation: 'const prevents reassignment of the variable binding. It does not make objects or arrays deeply immutable.' },
  },
  'javascript-easy-2': {
    teach: 'Operators combine values into expressions. JavaScript follows precedence rules, so multiplication happens before addition unless parentheses change the order.',
    challenge: { prompt: 'What does 4 + 3 * 2 evaluate to?', options: ['14', '10', '11', '18'], correctIndex: 1, hint: 'Do the multiplication before the addition.', explanation: '3 * 2 is 6, then 4 + 6 is 10. Parentheses can make a different order explicit.' },
  },
  'javascript-easy-3': {
    teach: 'Strings store text. Template literals use backticks and let you insert values with an expression placeholder, which is useful for building messages.',
    challenge: { prompt: 'Which syntax inserts the name variable into a template literal?', options: ['"Hello, name!"', 'A backtick template with an expression placeholder', '"Hello, " + name', 'A string with braces but no template marker'], correctIndex: 1, hint: 'Look for the special template-string syntax that evaluates an expression placeholder.', explanation: 'Template literals use backticks. Expressions inside the placeholder are evaluated and inserted into the string.' },
  },
  'javascript-easy-4': {
    teach: 'A condition lets a program choose what to do. An if block runs when its expression is true; else handles the other case.',
    challenge: { prompt: 'Which condition checks whether a score is at least 60?', options: ['score = 60', 'score < 60', 'score >= 60', 'score === 0'], correctIndex: 2, hint: '“At least” includes 60 and every value above it.', explanation: 'The >= operator means greater than or equal to, so it includes 60 itself.' },
  },
  'javascript-easy-5': {
    teach: 'Loops repeat work. A for loop is useful when you know how many times you want to repeat an action.',
    challenge: { prompt: 'Which loop header counts from 1 through 3?', options: ['for (let i = 1; i <= 3; i++)', 'for (let i = 1; i < 3; i--)', 'while (i = 3)', 'for (let i = 3; i < 1; i++)'], correctIndex: 0, hint: 'Start at 1, keep going while the counter is no greater than 3, then increment it.', explanation: 'The initializer starts i at 1, the condition includes 3, and i++ adds one after each pass.' },
  },

  'python-easy-1': {
    teach: 'Python uses indentation to show which statements belong together. A colon starts a block, and the indented lines form that block.',
    challenge: { prompt: 'What tells Python that a line belongs inside an if block?', options: ['Curly braces', 'Indentation', 'A semicolon', 'Capital letters'], correctIndex: 1, hint: 'Python makes whitespace part of the language syntax.', explanation: 'Indentation defines Python blocks. Keep the indentation level consistent inside the same block.' },
  },
  'python-easy-2': {
    teach: 'Python variables are names bound to objects. You do not declare a fixed type first; the value determines the object’s type.',
    challenge: { prompt: 'Which value is a Boolean in Python?', options: ['"True"', '1', 'True', '"yes"'], correctIndex: 2, hint: 'A Boolean is not text. It is one of Python’s two truth values.', explanation: 'True and False are Boolean values. "True" is a string because it is surrounded by quotes.' },
  },
  'python-easy-3': {
    teach: 'An f-string formats values inside text. Put an f before the opening quote and wrap each expression in curly braces.',
    challenge: { prompt: 'Which line inserts the value of name into a greeting?', options: ['print("Hello, {name}")', 'print(f"Hello, {name}")', 'print(f"Hello, name")', 'print("Hello, " + {name})'], correctIndex: 1, hint: 'An f-string needs the letter f before the opening quote.', explanation: 'The f prefix enables expression replacement inside curly braces.' },
  },
  'python-easy-4': {
    teach: 'Python follows normal arithmetic precedence: parentheses first, then multiplication and division, then addition and subtraction.',
    challenge: { prompt: 'What does 4 + 3 * 2 evaluate to in Python?', options: ['14', '10', '11', '18'], correctIndex: 1, hint: 'Multiply 3 by 2 before adding 4.', explanation: '3 * 2 is 6, then 4 + 6 is 10.' },
  },
  'python-easy-5': {
    teach: 'A condition is an expression that becomes True or False. Python uses if and else to choose which indented block runs.',
    challenge: { prompt: 'Which condition checks that score is at least 60?', options: ['score = 60', 'score > 60 only', 'score >= 60', 'score == 0'], correctIndex: 2, hint: 'The condition must include exactly 60 as well as numbers above it.', explanation: '>= means greater than or equal to. A single = assigns a value; it does not compare values.' },
  },

  'c-easy-1': {
    teach: 'A C program starts in main. Header files provide declarations, statements end with semicolons, and braces group the function body.',
    challenge: { prompt: 'Where does a normal C program begin executing?', options: ['At the first #include', 'Inside main', 'At the last return statement', 'Inside every function at once'], correctIndex: 1, hint: 'Look for the function that the runtime calls first.', explanation: 'Execution starts in main. Header directives are processed before the program runs.' },
  },
  'c-easy-2': {
    teach: 'C variables have declared types. int stores whole numbers, double stores floating-point values, and char stores a character.',
    challenge: { prompt: 'Which type is the best fit for a value such as 7.5?', options: ['char', 'int', 'double', 'void'], correctIndex: 2, hint: 'Choose a numeric type that can represent a fractional value.', explanation: 'double is a floating-point type. int stores whole numbers, while char stores a character value.' },
  },
  'c-easy-3': {
    teach: 'printf writes formatted output. scanf reads input into variables, and the & operator gives scanf the variable’s address.',
    challenge: { prompt: 'Why does scanf("%d", &age) use &age?', options: ['To pass the address where the value should be stored', 'To convert age into a string', 'To print age twice', 'To declare age as a pointer'], correctIndex: 0, hint: 'scanf needs to know where in memory it should place the input value.', explanation: '&age evaluates to the address of age, which lets scanf write the value into that variable.' },
  },
  'c-easy-4': {
    teach: 'C expressions use operator precedence. Multiplication is evaluated before addition unless parentheses tell the compiler otherwise.',
    challenge: { prompt: 'What is the value of 4 + 3 * 2 in C?', options: ['14', '10', '11', '18'], correctIndex: 1, hint: 'Evaluate the multiplication first.', explanation: '3 * 2 becomes 6, then 4 + 6 becomes 10.' },
  },
  'c-easy-5': {
    teach: 'An if statement runs a block when its condition is non-zero. An else block handles the other case.',
    challenge: { prompt: 'Which expression checks whether score is at least 60?', options: ['score = 60', 'score >= 60', 'score < 60', 'score != 60'], correctIndex: 1, hint: '“At least” means greater than OR equal to.', explanation: '>= includes both 60 and every value greater than 60. A single = is assignment.' },
  },

  'cpp-easy-1': {
    teach: 'A C++ program commonly includes iostream, defines main, and uses std::cout to write output. The program starts in main.',
    challenge: { prompt: 'Which statement writes text to the console in this course’s C++ examples?', options: ['std::cout << "Hi";', 'std::cin >> "Hi";', 'printf >> "Hi";', 'console.log("Hi");'], correctIndex: 0, hint: 'cout sends output to the console; cin is used to read input.', explanation: 'std::cout is the standard output stream. The << operator sends data into that stream.' },
  },
  'cpp-easy-2': {
    teach: 'C++ uses declared types. int stores whole numbers, double stores fractional numbers, and std::string stores text.',
    challenge: { prompt: 'Which type is a good choice for a price such as 12.5?', options: ['int', 'double', 'char', 'bool'], correctIndex: 1, hint: 'Choose the type used for floating-point numbers.', explanation: 'double can represent fractional numeric values. int is intended for whole numbers.' },
  },
  'cpp-easy-3': {
    teach: 'C++ expressions combine values with operators. Comparisons such as >= produce a Boolean result that can control an if statement.',
    challenge: { prompt: 'Which condition checks whether score is at least 60?', options: ['score = 60', 'score >= 60', 'score < 60', 'score != 60'], correctIndex: 1, hint: 'The operator must include equality as well as greater-than.', explanation: '>= means greater than or equal to. A single = assigns a value.' },
  },
  'cpp-easy-4': {
    teach: 'A range-based for loop visits each item in a collection. It is useful when you want to process every element without managing an index yourself.',
    challenge: { prompt: 'Which loop visits each value in an array named levels?', options: ['for (int level : levels)', 'for (int level = levels)', 'while (levels == true)', 'foreach levels -> level'], correctIndex: 0, hint: 'The range-based loop puts the item variable before a colon and the collection after it.', explanation: 'for (int level : levels) copies each value from levels into level on each iteration.' },
  },
  'cpp-easy-5': {
    teach: 'std::string stores text. You can combine strings with + and send them to std::cout to display a message.',
    challenge: { prompt: 'Which statement prints the text stored in name?', options: ['std::cout << name;', 'std::cin >> name;', 'std::cout >> name;', 'print(name);'], correctIndex: 0, hint: 'Choose the output stream and the output operator.', explanation: 'std::cout << name sends the string to the console. std::cin is for input.' },
  },
};

export const HTML_MISSIONS = {
  'html-css-easy-1': {
    title: 'Build Mango’s first page',
    prompt: 'Give the page a real main heading and place the visible content inside a main landmark.',
    starterHtml: '<header><p>MangoCode</p></header>\n<main>\n  <p>My first web page is ready.</p>\n</main>',
    starterCss: 'body { font-family: system-ui, sans-serif; padding: 24px; background: #fff8e8; }\nheader { color: #a96508; }',
    checks: [
      { label: 'Add a main heading with h1', pattern: '<h1\\b' },
      { label: 'Keep the main content inside main', pattern: '<main\\b[\\s\\S]*</main>' },
    ],
    hint: 'Try an h1 for the page’s main title. The main element should wrap the primary content.',
  },
  'html-css-easy-2': {
    title: 'Connect the pages',
    prompt: 'Add a meaningful link that takes a learner to the course catalogue.',
    starterHtml: '<main>\n  <h1>Choose your next skill</h1>\n  <p>Pick a course and start building.</p>\n</main>',
    starterCss: 'body { font-family: system-ui, sans-serif; padding: 24px; }\na { color: #a96508; font-weight: 700; }',
    checks: [
      { label: 'Add an anchor with an href destination', pattern: '<a\\b[^>]*href\\s*=' },
      { label: 'Give the link readable text', pattern: '<a\\b[^>]*>\\s*[^<\\s][\\s\\S]*?</a>' },
    ],
    hint: 'Use an anchor: <a href="/courses">Explore courses</a>.',
  },
  'html-css-easy-3': {
    title: 'Make the picture accessible',
    prompt: 'Add an image with useful alt text, then wrap it in a figure with a caption.',
    starterHtml: '<main>\n  <h1>Mango of the day</h1>\n  <p>Meet the fruit that powers this learning journey.</p>\n</main>',
    starterCss: 'body { font-family: system-ui, sans-serif; padding: 24px; }\nimg { max-width: 220px; border-radius: 16px; }',
    checks: [
      { label: 'Add an image with alt text', pattern: '<img\\b[^>]*alt\\s*=' },
      { label: 'Wrap the image in a figure', pattern: '<figure\\b[\\s\\S]*<img\\b[\\s\\S]*</figure>' },
      { label: 'Add a caption', pattern: '<figcaption\\b' },
    ],
    hint: 'An informative image should have alt text. figure and figcaption group the image with its caption.',
  },
  'html-css-easy-4': {
    title: 'Organise the menu',
    prompt: 'Create an unordered list for the items and a small table for their prices.',
    starterHtml: '<main>\n  <h1>Mango café menu</h1>\n  <h2>Popular items</h2>\n</main>',
    starterCss: 'body { font-family: system-ui, sans-serif; padding: 24px; }\nli { margin: 8px 0; }\ntable { border-collapse: collapse; }\ntd, th { padding: 8px 12px; border: 1px solid #e1d4bb; }',
    checks: [
      { label: 'Add an unordered list', pattern: '<ul\\b[\\s\\S]*<li\\b[\\s\\S]*</ul>' },
      { label: 'Add a table with a row', pattern: '<table\\b[\\s\\S]*<tr\\b[\\s\\S]*</table>' },
    ],
    hint: 'A list uses ul and li. A table is built with table, tr and cells such as th or td.',
  },
  'html-css-easy-5': {
    title: 'Build a semantic layout',
    prompt: 'Give the page clear landmarks: a header, navigation, main content and footer.',
    starterHtml: '<h1>MangoCode Academy</h1>\n<p>Learn by making things.</p>',
    starterCss: 'body { font-family: system-ui, sans-serif; margin: 0; }\nheader, nav, main, footer { padding: 16px 24px; }\nheader { background: #fff0cb; }\nfooter { color: #6a746d; }',
    checks: [
      { label: 'Add a header landmark', pattern: '<header\\b' },
      { label: 'Add navigation', pattern: '<nav\\b' },
      { label: 'Add main content', pattern: '<main\\b' },
      { label: 'Add a footer landmark', pattern: '<footer\\b' },
    ],
    hint: 'Use semantic elements to describe each page region instead of using div for everything.',
  },
};
