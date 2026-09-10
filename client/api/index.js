import { createClient } from '@libsql/client'

const PISTON_URL = process.env.PISTON_URL || 'https://emkc.org/api/v2/piston'
const ALLOWED_ORIGINS = new Set([
  'https://mango-code.vercel.app',
  'https://mango-code-deathmango.vercel.app',
  'https://mango-code-git-main-deathmango.vercel.app',
  'http://localhost:5173',
])

let db
let seededPromise
let runtimes = { at: 0, map: {} }

function getDb() {
  if (!db) {
    const url = process.env.TURSO_DATABASE_URL
    const authToken = process.env.TURSO_AUTH_TOKEN
    if (!url || !authToken) throw new Error('Turso database environment is not configured')
    db = createClient({ url, authToken })
  }
  return db
}

async function ensureSchemaAndSeed() {
  if (seededPromise) return seededPromise
  seededPromise = (async () => {
    const database = getDb()
    await database.batch([
      { sql: `CREATE TABLE IF NOT EXISTS courses (id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0)` },
      { sql: `CREATE TABLE IF NOT EXISTS lessons (id TEXT PRIMARY KEY, course_id TEXT NOT NULL REFERENCES courses(id), title TEXT NOT NULL, content TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0)` },
      { sql: `CREATE TABLE IF NOT EXISTS exercises (id TEXT PRIMARY KEY, lesson_id TEXT NOT NULL REFERENCES lessons(id), language TEXT NOT NULL, prompt TEXT NOT NULL, starter_code TEXT DEFAULT '', test_input TEXT DEFAULT '', expected_output TEXT NOT NULL)` },
      { sql: `CREATE TABLE IF NOT EXISTS quiz_questions (id TEXT PRIMARY KEY, lesson_id TEXT NOT NULL REFERENCES lessons(id), question TEXT NOT NULL, options TEXT NOT NULL, correct_index INTEGER NOT NULL)` },
      { sql: `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)` },
      { sql: `CREATE TABLE IF NOT EXISTS progress (user_id TEXT NOT NULL REFERENCES users(id), lesson_id TEXT NOT NULL REFERENCES lessons(id), completed_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (user_id, lesson_id))` },
      { sql: `CREATE TABLE IF NOT EXISTS streaks (user_id TEXT PRIMARY KEY REFERENCES users(id), current_streak INTEGER NOT NULL DEFAULT 0, longest_streak INTEGER NOT NULL DEFAULT 0, last_active_date TEXT)` },
      { sql: `CREATE TABLE IF NOT EXISTS exercise_attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL REFERENCES users(id), exercise_id TEXT NOT NULL REFERENCES exercises(id), passed INTEGER NOT NULL, submitted_code TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP)` },
    ], 'write')

    const count = await database.execute('SELECT COUNT(*) AS count FROM courses')
    if (Number(count.rows[0]?.count || 0) > 0) return

    const courses = [
      ['html-css', 'HTML & CSS', '#FF6B3D', 1],
      ['javascript', 'JavaScript', '#FFB627', 2],
      ['python', 'Python', '#2FBF71', 3],
      ['c', 'C', '#4C7CFF', 4],
      ['cpp', 'C++', '#B266FF', 5],
    ]
    const lessons = [
      ['html-1', 'html-css', 'Your First HTML Page', 'HTML is the structure of a web page. The document normally contains html, head, and body. Headings use h1 through h6, paragraphs use p, links use a, and images use img. Elements are written with opening and closing tags when a closing tag is required.\n\nThink of HTML as the nouns and structure of a page: it tells the browser what each piece of content is.', 1],
      ['html-2', 'html-css', 'CSS: Make It Look Good', 'CSS controls presentation: colors, spacing, borders, sizing, layout, and typography. A selector chooses elements and declarations inside braces change their appearance.\n\nFor example, p { color: tomato; } selects paragraphs and gives their text a color. Classes let you apply the same style to selected elements.', 2],
      ['html-3', 'html-css', 'Layout With Flexbox', 'Flexbox is a practical way to arrange elements in a row or column. display: flex turns an element into a flex container. flex-direction chooses row or column, while justify-content controls the main axis and align-items controls the cross axis.\n\nFlexbox is especially useful for navigation bars, cards, toolbars, and responsive layouts.', 3],
      ['js-1', 'javascript', 'Variables & console.log', 'JavaScript stores values in variables. Use const when a binding should not be reassigned and let when it may be reassigned. console.log prints values, which makes it useful for learning and debugging.\n\nExample:\nlet a = 4\nlet b = 5\nconsole.log(a + b)', 1],
      ['js-2', 'javascript', 'Conditions & Functions', 'Conditions let a program choose what to do. An if statement runs code when a condition is true; else handles the other path. Functions package reusable behavior and can accept parameters and return values.\n\nExample:\nfunction add(a, b) { return a + b }', 2],
      ['js-3', 'javascript', 'Arrays & Loops', 'Arrays hold ordered collections of values. A for...of loop is a readable way to visit every value. Array methods such as map, filter, and reduce are powerful tools for transforming data.\n\nStart simple: learn to loop over an array, inspect each item, and build a result.', 3],
      ['py-1', 'python', 'Your First Python Program', 'Python reads programs from top to bottom. print() writes text to the output. Python uses indentation to group blocks instead of braces.\n\nExample:\nprint("Hello, MangoCode!")', 1],
      ['py-2', 'python', 'Variables & Decisions', 'Python variables are created by assignment. Use if, elif, and else to choose between paths. Comparison operators such as ==, !=, <, and > produce True or False.\n\nExample:\nage = 14\nif age >= 13:\n    print("teen")', 2],
      ['py-3', 'python', 'Lists & Loops', 'Lists store ordered values and can be changed. A for loop can visit each item in a list. range() is useful when you need a sequence of numbers.\n\nExample:\nfor number in [1, 2, 3]:\n    print(number)', 3],
      ['c-1', 'c', 'Hello, World in C', 'C programs start executing in main(). The stdio.h header provides printf, which writes formatted text. A typical program returns 0 from main to indicate successful completion.\n\nExample:\n#include <stdio.h>\nint main() {\n    printf("Hello, World!");\n    return 0;\n}', 1],
      ['c-2', 'c', 'Variables & Types', 'C is statically typed. Common basic types include int for whole numbers, double for decimal values, and char for a character. Declare a variable with its type, then assign a value.\n\nExample:\nint score = 10;', 2],
      ['c-3', 'c', 'Loops & Arrays', 'C arrays store a fixed number of values of the same type. A for loop commonly uses an initializer, a condition, and an update expression.\n\nAlways keep array indexes inside their valid range; C does not automatically protect you from out-of-bounds access.', 3],
      ['cpp-1', 'cpp', 'Hello, World in C++', 'C++ uses streams for convenient input and output. Include iostream and use cout with the << operator to print. Execution begins in main().\n\nExample:\n#include <iostream>\nint main() {\n    std::cout << "Hello, World!";\n    return 0;\n}', 1],
      ['cpp-2', 'cpp', 'Variables & Types', 'C++ has familiar built-in types such as int, double, char, and bool. Modern C++ also provides auto for type inference when the initializer makes the type clear.\n\nPrefer clear types when they make the code easier to understand.', 2],
      ['cpp-3', 'cpp', 'Vectors & Loops', 'std::vector is a dynamic array from the standard library. Include vector, create a vector with values, and use a range-based for loop to visit each element.\n\nExample:\nstd::vector<int> values{1, 2, 3};\nfor (int value : values) std::cout << value;', 3],
    ]
    const exercises = [
      ['js-1-ex1', 'js-1', 'javascript', 'Print the sum of 4 and 5 using console.log — nothing else.', '// write your code here\n', '', '9'],
      ['js-2-ex1', 'js-2', 'javascript', 'Create a function add(a, b) and print add(7, 8).', 'function add(a, b) {\n  // return the sum\n}\n\n// print the result\n', '', '15'],
      ['js-3-ex1', 'js-3', 'javascript', 'Print each value from the array [2, 4, 6], one per line.', 'const values = [2, 4, 6]\n// loop over values\n', '', '2\n4\n6'],
      ['py-1-ex1', 'py-1', 'python', 'Print exactly: Hello, MangoCode!', '# write your code here\n', '', 'Hello, MangoCode!'],
      ['py-2-ex1', 'py-2', 'python', 'Set score to 10 and print "pass" when score is at least 10.', 'score = 10\n# write your if statement\n', '', 'pass'],
      ['py-3-ex1', 'py-3', 'python', 'Print the numbers 1, 2, and 3, one per line, using a loop.', '# write your loop here\n', '', '1\n2\n3'],
      ['c-1-ex1', 'c-1', 'c', 'Complete main() so the program prints exactly: Hello, World!', '#include <stdio.h>\n\nint main() {\n    // your code here\n    return 0;\n}\n', '', 'Hello, World!'],
      ['c-2-ex1', 'c-2', 'c', 'Create an int named score with value 42 and print it with printf.', '#include <stdio.h>\n\nint main() {\n    // your code here\n    return 0;\n}\n', '', '42'],
      ['c-3-ex1', 'c-3', 'c', 'Print 1, 2, and 3 on separate lines using a for loop.', '#include <stdio.h>\n\nint main() {\n    // your loop here\n    return 0;\n}\n', '', '1\n2\n3'],
      ['cpp-1-ex1', 'cpp-1', 'cpp', 'Complete main() so the program prints exactly: Hello, World!', '#include <iostream>\n\nint main() {\n    // your code here\n    return 0;\n}\n', '', 'Hello, World!'],
      ['cpp-2-ex1', 'cpp-2', 'cpp', 'Create an int named score with value 42 and print it with std::cout.', '#include <iostream>\n\nint main() {\n    // your code here\n    return 0;\n}\n', '', '42'],
      ['cpp-3-ex1', 'cpp-3', 'cpp', 'Print 1, 2, and 3 on separate lines using a range-based loop.', '#include <iostream>\n#include <vector>\n\nint main() {\n    std::vector<int> values{1, 2, 3};\n    // loop and print values\n    return 0;\n}\n', '', '1\n2\n3'],
    ]
    const quizzes = [
      ['html-1-q1', 'html-1', 'Which tag defines the main heading?', ['<h1>', '<h6>', '<head>', '<title>'], 0],
      ['html-2-q1', 'html-2', 'Which property changes text color?', ['font-style', 'color', 'background', 'text-size'], 1],
      ['html-3-q1', 'html-3', 'Which declaration creates a flex container?', ['position: flex', 'display: flex', 'flex: display', 'layout: flex'], 1],
      ['js-1-q1', 'js-1', 'Which keyword is normally used for a variable that can be reassigned?', ['const', 'let', 'fixed', 'define'], 1],
      ['js-2-q1', 'js-2', 'Which keyword sends a value back from a function?', ['give', 'return', 'send', 'yield-only'], 1],
      ['js-3-q1', 'js-3', 'Which structure stores an ordered collection?', ['object only', 'array', 'boolean', 'function'], 1],
      ['py-1-q1', 'py-1', 'What function prints text in Python?', ['echo()', 'print()', 'console.log()', 'write()'], 1],
      ['py-2-q1', 'py-2', 'Which keyword starts a conditional?', ['when', 'if', 'check', 'case'], 1],
      ['py-3-q1', 'py-3', 'Which keyword starts a Python loop over items?', ['loop', 'for', 'each', 'repeat'], 1],
      ['c-1-q1', 'c-1', 'Which function is the entry point of a C program?', ['start()', 'main()', 'run()', 'init()'], 1],
      ['c-2-q1', 'c-2', 'Which type stores a whole number?', ['int', 'text', 'decimal', 'string'], 0],
      ['c-3-q1', 'c-3', 'Which keyword is commonly used for a counted loop?', ['repeat', 'for', 'foreach', 'iterate'], 1],
      ['cpp-1-q1', 'cpp-1', 'Which operator sends a value to cout?', ['>>', '<<', '::', '->'], 1],
      ['cpp-2-q1', 'cpp-2', 'Which type stores a whole number?', ['int', 'floattext', 'string', 'char[]'], 0],
      ['cpp-3-q1', 'cpp-3', 'Which standard container is a dynamic array?', ['std::map', 'std::vector', 'std::pair', 'std::array_only'], 1],
    ]

    const statements = []
    for (const c of courses) statements.push({ sql: 'INSERT OR IGNORE INTO courses (id, name, color, sort_order) VALUES (?, ?, ?, ?)', args: c })
    for (const l of lessons) statements.push({ sql: 'INSERT OR IGNORE INTO lessons (id, course_id, title, content, sort_order) VALUES (?, ?, ?, ?, ?)', args: l })
    for (const e of exercises) statements.push({ sql: 'INSERT OR IGNORE INTO exercises (id, lesson_id, language, prompt, starter_code, test_input, expected_output) VALUES (?, ?, ?, ?, ?, ?, ?)', args: e })
    for (const q of quizzes) statements.push({ sql: 'INSERT OR IGNORE INTO quiz_questions (id, lesson_id, question, options, correct_index) VALUES (?, ?, ?, ?, ?)', args: [q[0], q[1], q[2], JSON.stringify(q[3]), q[4]] })
    await database.batch(statements, 'write')
  })().catch((error) => {
    seededPromise = null
    throw error
  })
  return seededPromise
}

function send(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data))
}

function cors(req, res) {
  const origin = req.headers.origin
  if (origin && ALLOWED_ORIGINS.has(origin)) res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Mango-User')
  res.setHeader('Access-Control-Max-Age', '86400')
}

async function getRuntimes() {
  if (Date.now() - runtimes.at < 60 * 60 * 1000) return runtimes.map
  const response = await fetch(`${PISTON_URL}/runtimes`)
  if (!response.ok) throw new Error(`Piston runtimes returned ${response.status}`)
  const list = await response.json()
  const map = {}
  for (const runtime of list) {
    map[runtime.language] = runtime.version
    for (const alias of runtime.aliases || []) map[alias] = runtime.version
  }
  runtimes = { at: Date.now(), map }
  return map
}

const languageMap = { python: 'python', javascript: 'javascript', c: 'c', cpp: 'c++' }
const fileMap = { python: 'main.py', javascript: 'main.js', c: 'main.c', cpp: 'main.cpp' }

async function handle(req, res) {
  cors(req, res)
  if (req.method === 'OPTIONS') return send(res, 204, {})
  const url = new URL(req.url || '/', 'https://mango-code.vercel.app')
  const path = url.pathname.replace(/\/+$/, '') || '/'
  const database = getDb()
  await ensureSchemaAndSeed()

  if (req.method === 'GET' && path === '/api/health') return send(res, 200, { ok: true, database: true })

  if (req.method === 'GET' && path === '/api/courses') {
    const result = await database.execute('SELECT * FROM courses ORDER BY sort_order')
    return send(res, 200, result.rows)
  }

  const courseLessons = path.match(/^\/api\/courses\/([^/]+)\/lessons$/)
  if (req.method === 'GET' && courseLessons) {
    const result = await database.execute({ sql: 'SELECT id, title, sort_order FROM lessons WHERE course_id = ? ORDER BY sort_order', args: [courseLessons[1]] })
    return send(res, 200, result.rows)
  }

  const lessonMatch = path.match(/^\/api\/lessons\/([^/]+)$/)
  if (req.method === 'GET' && lessonMatch) {
    const lesson = await database.execute({ sql: 'SELECT * FROM lessons WHERE id = ?', args: [lessonMatch[1]] })
    if (!lesson.rows.length) return send(res, 404, { error: 'Lesson not found' })
    const exercises = await database.execute({ sql: 'SELECT id, language, prompt, starter_code FROM exercises WHERE lesson_id = ?', args: [lessonMatch[1]] })
    const quiz = await database.execute({ sql: 'SELECT id, question, options FROM quiz_questions WHERE lesson_id = ?', args: [lessonMatch[1]] })
    return send(res, 200, {
      ...lesson.rows[0],
      exercises: exercises.rows,
      quiz: quiz.rows.map((q) => ({ id: q.id, question: q.question, options: JSON.parse(q.options) })),
    })
  }

  if (req.method === 'POST' && path === '/api/quiz/check') {
    const { questionId, selectedIndex } = req.body || {}
    if (!questionId || !Number.isInteger(selectedIndex) || selectedIndex < 0) return send(res, 400, { error: 'Invalid questionId or selectedIndex' })
    const result = await database.execute({ sql: 'SELECT correct_index FROM quiz_questions WHERE id = ?', args: [questionId] })
    if (!result.rows.length) return send(res, 404, { error: 'Question not found' })
    const correct = selectedIndex === Number(result.rows[0].correct_index)
    return send(res, 200, { correct, message: correct ? 'Correct!' : 'Not quite — try another answer.' })
  }

  if (req.method === 'POST' && path === '/api/exercises/check') {
    const { exerciseId, code } = req.body || {}
    if (!exerciseId || typeof code !== 'string') return send(res, 400, { pass: false, message: 'Missing exerciseId or code.' })
    if (code.length > 20000) return send(res, 413, { pass: false, message: 'Code is too long. Keep submissions under 20,000 characters.' })
    const result = await database.execute({ sql: 'SELECT * FROM exercises WHERE id = ?', args: [exerciseId] })
    const exercise = result.rows[0]
    if (!exercise) return send(res, 404, { pass: false, message: 'Exercise not found.' })
    const language = languageMap[exercise.language]
    if (!language) return send(res, 400, { pass: false, message: 'Unsupported exercise language.' })
    try {
      const versions = await getRuntimes()
      const version = versions[language]
      if (!version) return send(res, 503, { pass: false, message: 'This code runtime is temporarily unavailable.' })
      const runResponse = await fetch(`${PISTON_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, version, files: [{ name: fileMap[exercise.language], content: code }], stdin: exercise.test_input || '' }),
      })
      const data = await runResponse.json()
      if (!runResponse.ok) return send(res, 502, { pass: false, message: 'The code runner is temporarily unavailable.' })
      const run = data.run || {}
      if (run.code !== 0) return send(res, 200, { pass: false, message: explainError(run.stderr || run.output || 'The program failed.'), stderr: run.stderr || '' })
      const actual = String(run.stdout || '').trim()
      const expected = String(exercise.expected_output || '').trim()
      const pass = actual === expected
      return send(res, 200, { pass, message: pass ? 'Correct! Your output matched.' : 'Not quite. Check your output and try again.', stdout: run.stdout || '' })
    } catch (error) {
      console.error('exercise runner error', error)
      return send(res, 502, { pass: false, message: 'Could not run your code right now. Try again.' })
    }
  }

  return send(res, 404, { error: 'Not found' })
}

function explainError(stderr) {
  const firstLine = String(stderr).split('\n').find(Boolean) || 'Unknown error'
  if (/SyntaxError/i.test(stderr)) return `Syntax error: ${firstLine}`
  if (/NameError/i.test(stderr)) return `Name error: ${firstLine}`
  if (/error:/i.test(stderr)) return `Compile error: ${firstLine}`
  return `Error: ${firstLine}`
}

export default async function handler(req, res) {
  try {
    if (req.body === undefined && req.method !== 'GET' && req.method !== 'HEAD') {
      let raw = ''
      for await (const chunk of req) raw += chunk
      try { req.body = raw ? JSON.parse(raw) : {} } catch { req.body = {} }
    }
    await handle(req, res)
  } catch (error) {
    console.error('api error', error)
    send(res, 500, { error: 'Internal server error' })
  }
}
