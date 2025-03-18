import { Quiz } from '../../interfaces/quiz.interface';

export const quiz: Quiz = {
    name: "Sample Quiz",
    questions:
    [
        {
            name: "Is Agile a software development methodology?",
            type: "yes_no",
            answers: {
                type: "yes_no",
                correctAnswer: "Yes"
            }
        },
        {
            name: "Does SQL stand for 'Structured Query Language'?",
            type: "yes_no",
            answers: {
                type: "yes_no",
                correctAnswer: "Yes"
            }
        },
        {
            name: "Is C# a dynamically typed language?",
            type: "yes_no",
            answers: {
                type: "yes_no",
                correctAnswer: "No"
            }
        },
        {
            name: "Which of the following is an OOP principle?",
            type: "multiple_choice",
            answers: {
                type: "multiple_choice",
                options: ["Encapsulation", "Compilation", "Iteration", "Recursion"],
                correctAnswer: "Encapsulation"
            }
        },
        {
            name: "Which HTTP status code means 'Not Found'?",
            type: "multiple_choice",
            answers: {
                type: "multiple_choice",
                options: ["200", "301", "404", "500"],
                correctAnswer: "404"
            }
        },
        {
            name: "Which database is NoSQL?",
            type: "multiple_choice",
            answers: {
                type: "multiple_choice",
                options: ["PostgreSQL", "MongoDB", "MySQL", "SQLite"],
                correctAnswer: "MongoDB"
            }
        },
        {
            name: "Which programming language is commonly used for web development?",
            type: "multiple_choice",
            answers: {
                type: "multiple_choice",
                options: ["C", "Python", "JavaScript", "Swift"],
                correctAnswer: "JavaScript"
            }
        },
        {
            name: "What is the main purpose of version control systems?",
            type: "multiple_choice",
            answers: {
                type: "multiple_choice",
                options: ["To edit images", "To manage code changes", "To improve performance", "To debug applications"],
                correctAnswer: "To manage code changes"
            }
        },
        {
            name: "Describe a commonly used version control system.",
            type: "open",
            answers: {
                type: "open",
                correctAnswer: "Git"
            }
        },
        {
            name: "What is the primary language used for frontend development?",
            type: "open",
            answers: {
                type: "open",
                correctAnswer: "JavaScript"
            }
        },
        {
            name: "What is the most popular cloud computing provider?",
            type: "open",
            answers: {
                type: "open",
                correctAnswer: "AWS"
            }
        },
        {
            name: "What is the relational database query language?",
            type: "open",
            answers: {
                type: "open",
                correctAnswer: "SQL"
            }
        }
    ]
};
