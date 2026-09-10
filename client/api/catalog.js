export const courses = [
  ['html-css', 'HTML & CSS', '#FF6B3D', 1],
  ['javascript', 'JavaScript', '#FFB627', 2],
  ['python', 'Python', '#2FBF71', 3],
  ['c', 'C', '#4C7CFF', 4],
  ['cpp', 'C++', '#B266FF', 5],
]

const curriculum = {
  'html-css': {
    easy: [
      ['HTML Foundations','Learn doctype, html, head, body, headings, paragraphs, links, and the basic structure of a document.'],
      ['Text, Headings & Links','Use headings, paragraphs, emphasis, lists, and links to give a page clear structure and meaning.'],
      ['Images, Lists & Tables','Add images with useful alt text, ordered and unordered lists, and simple tables.'],
      ['Semantic HTML & Forms','Use header, nav, main, section, article, footer, labels, inputs, and buttons correctly.'],
      ['CSS Foundations','Connect CSS, use selectors, colors, units, the box model, typography, and basic spacing.'],
    ],
    medium: [
      ['Selectors & Specificity','Use class, id, attribute, descendant, child, and pseudo-class selectors and understand specificity.'],
      ['Box Model & Positioning','Control margin, padding, border, sizing, box-sizing, position, and stacking.'],
      ['Flexbox Layout','Build row and column layouts with flex direction, alignment, gaps, wrapping, and flexible sizing.'],
      ['Grid & Responsive Layout','Use CSS Grid and media queries to build layouts that adapt to different screens.'],
      ['Components, States & Polish','Create reusable visual patterns with variables, hover/focus states, transitions, shadows, and consistent spacing.'],
    ],
    hard: [
      ['Accessible Interfaces','Build keyboard-friendly, semantic interfaces with labels, focus states, alt text, contrast, and logical headings.'],
      ['Advanced Responsive Design','Combine Grid, Flexbox, min/max functions, responsive units, and breakpoints for robust layouts.'],
      ['Complex Forms & Validation UI','Design forms with clear labels, validation states, helpful messages, and accessible feedback.'],
      ['Landing Page Architecture','Build a complete responsive page with navigation, hero, sections, cards, calls to action, and footer.'],
      ['Capstone: Responsive Website','Combine semantic HTML and modern CSS into a polished responsive mini-site.'],
    ],
  },
  javascript: {
    easy: [
      ['Variables & Values','Use const and let and work with strings, numbers, booleans, null, undefined, and expressions.'],
      ['Operators & Comparisons','Use arithmetic, assignment, comparison, logical, and ternary operators.'],
      ['Conditions','Use if, else if, else, truthy/falsy values, and switch to choose program paths.'],
      ['Functions','Declare functions, use parameters and return values, and understand local scope.'],
      ['Arrays & Loops','Store ordered data in arrays and process it with for, for...of, and basic array methods.'],
    ],
    medium: [
      ['Objects','Create objects, read and update properties, use methods, and work with nested data.'],
      ['Array Methods','Use map, filter, find, some, every, and reduce to transform and inspect collections.'],
      ['DOM Basics','Select elements, change text and classes, create elements, and respond to events.'],
      ['Events & Forms','Handle clicks and form submission, read input values, prevent default behavior, and validate data.'],
      ['Async JavaScript','Understand promises, async/await, fetch, loading states, and error handling.'],
    ],
    hard: [
      ['Modules & Code Organization','Split functionality into modules, use imports/exports, and keep responsibilities focused.'],
      ['Closures & Higher-Order Functions','Understand lexical scope, closures, callbacks, and functions that accept or return functions.'],
      ['Robust State & Error Handling','Design predictable state updates, validate inputs, handle failures, and avoid inconsistent UI state.'],
      ['API-Driven Application','Fetch JSON, render dynamic data, handle loading and errors, and respond to user actions.'],
      ['Capstone: Interactive App','Combine DOM events, arrays, objects, async data, validation, and modular JavaScript.'],
    ],
  },
  python: {
    easy: [
      ['Python Basics','Run Python code, use print, comments, indentation, and simple expressions.'],
      ['Variables & Types','Create variables and work with int, float, str, bool, and type conversion.'],
      ['Conditions','Use if, elif, else, comparisons, and boolean logic to make decisions.'],
      ['Loops','Use for, while, range, break, and continue to repeat work.'],
      ['Lists & Strings','Create lists, index and slice values, and use common string and list operations.'],
    ],
    medium: [
      ['Dictionaries & Sets','Store keyed data with dictionaries and unique values with sets.'],
      ['Functions','Define functions, parameters, return values, default arguments, and local scope.'],
      ['Comprehensions','Use list and dictionary comprehensions for concise data transformations.'],
      ['Files & Exceptions','Read and write text files and handle expected failures with try/except.'],
      ['Modules & JSON','Import modules and work with JSON data using the standard library.'],
    ],
    hard: [
      ['Object-Oriented Python','Create classes, instances, methods, constructors, and simple inheritance.'],
      ['Iterators & Generators','Understand iteration, iterators, yield, and generator expressions.'],
      ['Testing & Debugging','Write focused tests, inspect tracebacks, isolate bugs, and validate assumptions.'],
      ['API Data Processing','Consume JSON data, validate it, transform it, and produce useful output.'],
      ['Capstone: CLI Application','Combine functions, data structures, files, errors, and modules into a small CLI app.'],
    ],
  },
  c: {
    easy: [
      ['C Program Structure','Understand main, headers, statements, compilation, and printf.'],
      ['Variables & Types','Use int, float, double, char, constants, and basic conversions.'],
      ['Operators & Input','Use arithmetic and comparison operators and read values with scanf.'],
      ['Conditions','Use if, else if, switch, and the conditional operator to choose paths.'],
      ['Loops','Use for, while, do-while, break, and continue.'],
    ],
    medium: [
      ['Arrays & Strings','Store fixed-size collections and work with null-terminated character arrays.'],
      ['Functions','Declare and define functions, pass arguments, return values, and use prototypes.'],
      ['Pointers','Understand addresses, dereferencing, pointer parameters, and safe pointer use.'],
      ['Structs & Enums','Group related data with structs and represent named choices with enums.'],
      ['Dynamic Memory','Use malloc, calloc, realloc, and free while checking allocations and avoiding leaks.'],
    ],
    hard: [
      ['File I/O','Open, read, write, and close files while checking errors.'],
      ['Preprocessor & Headers','Use includes, macros, guards, and separate declarations from implementations.'],
      ['Data Structures','Build simple stacks, queues, or linked structures using structs and pointers.'],
      ['Debugging & Memory Safety','Reason about bounds, lifetimes, null pointers, undefined behavior, and defensive checks.'],
      ['Capstone: C Program','Combine functions, structs, pointers, dynamic memory, files, and input validation.'],
    ],
  },
  cpp: {
    easy: [
      ['C++ Program Structure','Understand main, headers, compilation, namespaces, and basic output with cout.'],
      ['Variables & Types','Use int, double, char, bool, const, and type inference with auto.'],
      ['Operators & Conditions','Use arithmetic, comparison, logical operators, if/else, and switch.'],
      ['Loops','Use for, while, range-based for, break, and continue.'],
      ['Strings & Vectors','Work with std::string and std::vector for common text and collection tasks.'],
    ],
    medium: [
      ['Functions & References','Write functions with parameters, return values, references, and const references.'],
      ['Classes & Objects','Define classes, constructors, methods, access control, and object state.'],
      ['STL Algorithms','Use iterators and algorithms such as sort, find, count, and transform.'],
      ['Maps, Sets & Pairs','Use map, unordered_map, set, and pair to model and query structured data.'],
      ['Error Handling & Files','Use exceptions for expected failures and streams for reading and writing files.'],
    ],
    hard: [
      ['Templates','Understand function and class templates and write reusable type-independent code.'],
      ['Smart Pointers','Use unique_ptr and shared_ptr to express ownership and reduce manual memory management.'],
      ['Lambdas & Functional Style','Write lambdas, capture values, and combine them with standard algorithms.'],
      ['Modern C++ Design','Use RAII, const correctness, value semantics, and clear ownership boundaries.'],
      ['Capstone: C++ Application','Combine classes, STL containers, algorithms, files, validation, and modern memory management.'],
    ],
  },
}

const levelLabel = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }
const languages = new Set(['javascript','python','c','cpp'])

export const lessons = []
export const exercises = []
export const quizzes = []

function addQuiz(id, lessonId, question, options, correctIndex = 0) {
  quizzes.push([id, lessonId, question, options, correctIndex])
}

function addPractice(courseId, lessonId, title, level, index) {
  if (!languages.has(courseId)) return
  const output = `${courseId.toUpperCase()}-${level.toUpperCase()}-${index}`
  const starter = courseId === 'python' ? '# Write your solution here\n' : courseId === 'javascript' ? '// Write your solution here\n' : courseId === 'c' ? '#include <stdio.h>\n\nint main(void) {\n    // Write your solution here\n    return 0;\n}\n' : '#include <iostream>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n'
  const command = courseId === 'python' ? `print("${output}")` : courseId === 'javascript' ? `console.log("${output}")` : courseId === 'c' ? `printf("${output}\\n");` : `std::cout << "${output}" << std::endl;`
  exercises.push([`${lessonId}-ex1`, lessonId, courseId, `Practice ${title.toLowerCase()}. Write a short program that demonstrates the concept and prints exactly: ${output}`, starter + `\n// Hint: ${command}\n`, '', output])
}

for (const [courseId] of courses) {
  let order = 0
  for (const level of ['easy','medium','hard']) {
    for (let i = 0; i < curriculum[courseId][level].length; i++) {
      const [title, content] = curriculum[courseId][level][i]
      order++
      const id = `${courseId}-${level}-${i + 1}`
      lessons.push([id, courseId, title, content, order, level, 'lesson'])
      addPractice(courseId, id, title, level, i + 1)
      addQuiz(`${id}-q1`, id, `Which outcome best matches the goal of “${title}”?`, [
        `Apply ${title.toLowerCase()} correctly in a small project`,
        'Only rename a file',
        'Only change a browser setting',
        'Skip the concept entirely',
      ])
    }
    order++
    const testId = `${courseId}-${level}-test`
    lessons.push([testId, courseId, `${levelLabel[level]} Test`, `Assessment covering all five ${levelLabel[level]} lessons. Complete this test before moving to the next difficulty.`, order, level, 'test'])
    for (let q = 0; q < 5; q++) {
      const topic = curriculum[courseId][level][q][0]
      addQuiz(`${testId}-q${q + 1}`, testId, `Test ${levelLabel[level]} ${q + 1}: Which task demonstrates understanding of ${topic}?`, [
        `Use ${topic.toLowerCase()} correctly in a real program`,
        'Ignore the concept',
        'Only rename the project',
        'Only change the page title',
      ])
    }
  }
  order++
  const finalId = `${courseId}-final`
  lessons.push([finalId, courseId, 'Final Test', 'Comprehensive assessment covering Easy, Medium, and Hard. This is the final checkpoint for the course.', order, 'final', 'final'])
  const allTopics = ['easy','medium','hard'].flatMap(level => curriculum[courseId][level])
  for (let q = 0; q < 10; q++) {
    const topic = allTopics[q % allTopics.length][0]
    addQuiz(`${finalId}-q${q + 1}`, finalId, `Final ${q + 1}: Which choice best demonstrates mastery of ${topic}?`, [
      `Apply ${topic.toLowerCase()} appropriately while solving a problem`,
      'Avoid all program logic',
      'Only rename the project',
      'Only change the page title',
    ])
  }
}
