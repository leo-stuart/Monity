# Monity

**Monity** is a lightweight and minimal expense tracker built in C. Designed for simplicity and efficiency, it provides a clean command-line interface for recording and managing personal spending.

## Features

- Add and view expense entries
- Organize transactions by category
- Persistent storage using text-based files
- Fast and intuitive CLI workflow

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/leo-stuart/Monity.git

cd monity
```
### 2. Compile the source code
```bash
gcc -o monity main.c
```
### 3. Run the application
```bash
./monity
```
### Project Structure
```bash
monity/
├── develop/               # Project's source code
│   ├── main.c             # Main function (Entry point)
│   ├── expenses.c         # Functions to manipulate and register spents
│   └── expenses.h         # Header with functions prototypes
│
├── expenses.txt           # Data storage (auto-generated)
├── README.md              # Project documentation
```
### Roadmap
* Monthly reports
* Export data to CSV
* Category summaries
* UI polish and error handling improvements
