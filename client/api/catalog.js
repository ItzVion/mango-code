export const courses = [
  ['html-css', 'HTML & CSS', '#FF6B3D', 1],
  ['javascript', 'JavaScript', '#FFB627', 2],
  ['python', 'Python', '#2FBF71', 3],
  ['c', 'C', '#4C7CFF', 4],
  ['cpp', 'C++', '#B266FF', 5],
]

export const lessons = [
  ['html-1','html-css','Your First HTML Page','HTML is the structure of a web page. Documents normally contain html, head, and body. Headings use h1 through h6, paragraphs use p, links use a, and images use img.\n\nThink of HTML as the structure and meaning of a page.',1],
  ['html-2','html-css','CSS: Make It Look Good','CSS controls presentation: colors, spacing, borders, sizing, layout, and typography. Selectors choose elements and declarations change their appearance.\n\nExample: p { color: tomato; }',2],
  ['html-3','html-css','Layout With Flexbox','Flexbox arranges elements in rows or columns. display: flex creates a flex container; flex-direction, justify-content, and align-items control the layout.',3],
  ['js-1','javascript','Variables & console.log','JavaScript stores values in variables. Use const when a binding should not be reassigned and let when it may be reassigned. console.log prints values.',1],
  ['js-2','javascript','Conditions & Functions','Use if/else to choose between paths. Functions package reusable behavior and can accept parameters and return values.',2],
  ['js-3','javascript','Arrays & Loops','Arrays hold ordered collections. A for...of loop visits every value, while map, filter, and reduce transform data.',3],
  ['py-1','python','Your First Python Program','Python reads programs top to bottom. print() writes output and indentation groups blocks.\n\nExample:\nprint("Hello, MangoCode!")',1],
  ['py-2','python','Variables & Decisions','Python variables are created by assignment. if, elif, and else choose between paths. Comparisons produce True or False.',2],
  ['py-3','python','Lists & Loops','Lists store ordered values. A for loop can visit each item and range() can generate number sequences.',3],
  ['c-1','c','Hello, World in C','C programs start in main(). stdio.h provides printf for output. Returning 0 from main indicates successful completion.',1],
  ['c-2','c','Variables & Types','C is statically typed. Common types include int, double, and char. Declare a variable with its type and assign a value.',2],
  ['c-3','c','Loops & Arrays','C arrays store a fixed number of values. A for loop commonly uses an initializer, condition, and update. Keep indexes inside valid bounds.',3],
  ['cpp-1','cpp','Hello, World in C++','C++ uses streams for input and output. Include iostream and use cout with << to print. Execution begins in main().',1],
  ['cpp-2','cpp','Variables & Types','C++ has built-in types such as int, double, char, and bool. Modern C++ also provides auto for type inference.',2],
  ['cpp-3','cpp','Vectors & Loops','std::vector is a dynamic array. Include vector, create a vector with values, and use a range-based for loop to visit each element.',3],
]

export const exercises = [
  ['js-1-ex1','js-1','javascript','Print the sum of 4 and 5 using console.log — nothing else.','// write your code here\n','','9'],
  ['js-2-ex1','js-2','javascript','Create a function add(a, b) and print add(7, 8).','function add(a, b) {\n  // return the sum\n}\n\n// print the result\n','','15'],
  ['js-3-ex1','js-3','javascript','Print each value from the array [2, 4, 6], one per line.','const values = [2, 4, 6]\n// loop over values\n','','2\n4\n6'],
  ['py-1-ex1','py-1','python','Print exactly: Hello, MangoCode!','# write your code here\n','','Hello, MangoCode!'],
  ['py-2-ex1','py-2','python','Set score to 10 and print "pass" when score is at least 10.','score = 10\n# write your if statement\n','','pass'],
  ['py-3-ex1','py-3','python','Print the numbers 1, 2, and 3, one per line, using a loop.','# write your loop here\n','','1\n2\n3'],
  ['c-1-ex1','c-1','c','Complete main() so the program prints exactly: Hello, World!','#include <stdio.h>\n\nint main() {\n    // your code here\n    return 0;\n}\n','','Hello, World!'],
  ['c-2-ex1','c-2','c','Create an int named score with value 42 and print it with printf.','#include <stdio.h>\n\nint main() {\n    // your code here\n    return 0;\n}\n','','42'],
  ['c-3-ex1','c-3','c','Print 1, 2, and 3 on separate lines using a for loop.','#include <stdio.h>\n\nint main() {\n    // your loop here\n    return 0;\n}\n','','1\n2\n3'],
  ['cpp-1-ex1','cpp-1','cpp','Complete main() so the program prints exactly: Hello, World!','#include <iostream>\n\nint main() {\n    // your code here\n    return 0;\n}\n','','Hello, World!'],
  ['cpp-2-ex1','cpp-2','cpp','Create an int named score with value 42 and print it with std::cout.','#include <iostream>\n\nint main() {\n    // your code here\n    return 0;\n}\n','','42'],
  ['cpp-3-ex1','cpp-3','cpp','Print 1, 2, and 3 on separate lines using a range-based loop.','#include <iostream>\n#include <vector>\n\nint main() {\n    std::vector<int> values{1, 2, 3};\n    // loop and print values\n    return 0;\n}\n','','1\n2\n3'],
]

export const quizzes = [
  ['html-1-q1','html-1','Which tag defines the main heading?',['<h1>','<h6>','<head>','<title>'],0],
  ['html-2-q1','html-2','Which property changes text color?',['font-style','color','background','text-size'],1],
  ['html-3-q1','html-3','Which declaration creates a flex container?',['position: flex','display: flex','flex: display','layout: flex'],1],
  ['js-1-q1','js-1','Which keyword is normally used for a variable that can be reassigned?',['const','let','fixed','define'],1],
  ['js-2-q1','js-2','Which keyword sends a value back from a function?',['give','return','send','yield-only'],1],
  ['js-3-q1','js-3','Which structure stores an ordered collection?',['object only','array','boolean','function'],1],
  ['py-1-q1','py-1','What function prints text in Python?',['echo()','print()','console.log()','write()'],1],
  ['py-2-q1','py-2','Which keyword starts a conditional?',['when','if','check','case'],1],
  ['py-3-q1','py-3','Which keyword starts a Python loop over items?',['loop','for','each','repeat'],1],
  ['c-1-q1','c-1','Which function is the entry point of a C program?',['start()','main()','run()','init()'],1],
  ['c-2-q1','c-2','Which type stores a whole number?',['int','text','decimal','string'],0],
  ['c-3-q1','c-3','Which keyword is commonly used for a counted loop?',['repeat','for','foreach','iterate'],1],
  ['cpp-1-q1','cpp-1','Which operator sends a value to cout?',['>>','<<','::','->'],1],
  ['cpp-2-q1','cpp-2','Which type stores a whole number?',['int','floattext','string','char[]'],0],
  ['cpp-3-q1','cpp-3','Which standard container is a dynamic array?',['std::map','std::vector','std::pair','std::array_only'],1],
]
