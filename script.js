const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const calendarDates = document.getElementById("calendar-dates");
const monthSelect = document.getElementById("month-select");
const yearSelect = document.getElementById("year-select");
const selectedDateElem = document.getElementById("selected-date");
const todoListElem = document.getElementById("todo-list");
const todoInput = document.getElementById("todo-input");
const prioritySelect = document.getElementById("priority-select");
const searchInput = document.getElementById("search-input");
const filterPriority = document.getElementById("filter-priority");
const fileInput = document.getElementById("file-input");

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null;
let todos = {};

// Save tasks to LocalStorage
function saveTasks() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

// Load tasks from LocalStorage
function loadTasks() {
  const savedTodos = localStorage.getItem("todos");
  if (savedTodos) {
    todos = JSON.parse(savedTodos);
  }
}

// Call loadTasks when initializing
loadTasks();

// Notification API for Reminders
function showReminder() {
  const today = new Date();
  const todayKey = `${today.getDate()}-${
    today.getMonth() + 1
  }-${today.getFullYear()}`;
  if (todos[todayKey] && todos[todayKey].length > 0) {
    new Notification(
      `Reminder: You have ${todos[todayKey].length} task(s) today!`
    );
  }
}

// Request Notification permission
if (
  Notification.permission === "default" ||
  Notification.permission === "denied"
) {
  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      showReminder();
    }
  });
} else {
  showReminder();
}

// Generate Calendar with multiple colors based on number of tasks
function generateCalendar(month, year) {
  calendarDates.innerHTML = "";
  const firstDay = new Date(year, month).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Fill blank cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement("div");
    calendarDates.appendChild(emptyCell);
  }

  // Loop through days in the current month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateCell = document.createElement("div");
    const dateKey = `${day}-${month + 1}-${year}`;
    dateCell.textContent = day;

    // Check if the date has any tasks and apply corresponding color class
    if (todos[dateKey] && todos[dateKey].length > 0) {
      const taskCount = todos[dateKey].length;

      // Apply different colors based on the number of tasks
      if (taskCount === 1) {
        dateCell.classList.add("few-todos"); // 1 task - green
      } else if (taskCount >= 2 && taskCount <= 3) {
        dateCell.classList.add("medium-todos"); // 2-3 tasks - yellow
      } else if (taskCount > 3) {
        dateCell.classList.add("many-todos"); // More than 3 tasks - red
      }
    }

    // Add event listener to select date
    dateCell.addEventListener("click", () => selectDate(day, month, year));
    calendarDates.appendChild(dateCell);
  }

  // Set selected value on dropdowns
  monthSelect.value = month;
  yearSelect.value = year;
}

// Select Date and Display To-Dos
function selectDate(day, month, year) {
  selectedDate = `${day}-${month + 1}-${year}`;
  selectedDateElem.textContent = selectedDate;
  displayTodos();
}

// Display To-Dos for Selected Date
function displayTodos() {
  todoListElem.innerHTML = "";
  const tasks = todos[selectedDate] || [];

  // Filter tasks based on the search input and selected priority filter
  const searchTerm = searchInput.value.toLowerCase();
  const selectedPriority = filterPriority.value;

  tasks
    .filter((task) => task.task.toLowerCase().includes(searchTerm))
    .filter(
      (task) => selectedPriority === "all" || task.priority === selectedPriority
    )
    .forEach((task, index) => {
      const todoItem = document.createElement("li");
      todoItem.textContent = task.task;

      // Add priority class and done class if the task is marked as done
      todoItem.classList.add(`todo-${task.priority}`);
      if (task.done) {
        todoItem.classList.add("todo-done");
      }

      const doneBtn = document.createElement("button");
      doneBtn.textContent = task.done ? "Undo" : "Done";
      doneBtn.addEventListener("click", () => markAsDone(index));

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => deleteTask(index));

      todoItem.appendChild(doneBtn);
      todoItem.appendChild(deleteBtn);
      todoListElem.appendChild(todoItem);
    });
}

// Add New Task
document.getElementById("add-todo").addEventListener("click", () => {
  const task = todoInput.value;
  const priority = prioritySelect.value;
  if (task) {
    if (!todos[selectedDate]) {
      todos[selectedDate] = [];
    }
    todos[selectedDate].push({ task, priority, done: false });
    todoInput.value = "";
    displayTodos();
    generateCalendar(currentMonth, currentYear);
    saveTasks(); // Save after adding
  }
});

// Mark Task as Done or Undo
function markAsDone(index) {
  const task = todos[selectedDate][index];
  task.done = !task.done;
  displayTodos();
  saveTasks(); // Save after marking as done/undone
}

// Delete Task
function deleteTask(index) {
  todos[selectedDate].splice(index, 1);
  displayTodos();
  generateCalendar(currentMonth, currentYear);
  saveTasks(); // Save after deleting
}

// Search Task
searchInput.addEventListener("input", displayTodos);

// Filter By Priority
filterPriority.addEventListener("change", displayTodos);

// Handle File Import
document.getElementById("import-tasks").addEventListener("click", () => {
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const fileContent = event.target.result;
      const lines = fileContent.split("\n");
      if (!todos[selectedDate]) {
        todos[selectedDate] = [];
      }
      lines.forEach((line) => {
        if (line.trim()) {
          const [task, priority] = line.split(",");
          todos[selectedDate].push({
            task: task.trim(),
            priority: priority.trim() || "low",
            done: false, // Default to not done
          });
        }
      });
      displayTodos();
      generateCalendar(currentMonth, currentYear);
      saveTasks(); // Save after importing
    };
    reader.readAsText(file);
  }
});

// Initialize Calendar
function init() {
  const today = new Date();
  currentMonth = today.getMonth();
  currentYear = today.getFullYear();
  monthSelect.innerHTML = monthNames
    .map((name, index) => `<option value="${index}">${name}</option>`)
    .join("");
  yearSelect.innerHTML = Array.from(
    { length: 10 },
    (_, i) =>
      `<option value="${currentYear - 5 + i}">${currentYear - 5 + i}</option>`
  ).join("");
  generateCalendar(currentMonth, currentYear);
  selectDate(today.getDate(), currentMonth, currentYear);
}

document.getElementById("prev-month").addEventListener("click", () => {
  if (currentMonth === 0) {
    currentMonth = 11;
    currentYear -= 1;
  } else {
    currentMonth -= 1;
  }
  generateCalendar(currentMonth, currentYear);
});

document.getElementById("next-month").addEventListener("click", () => {
  if (currentMonth === 11) {
    currentMonth = 0;
    currentYear += 1;
  } else {
    currentMonth += 1;
  }
  generateCalendar(currentMonth, currentYear);
});

monthSelect.addEventListener("change", (e) => {
  currentMonth = parseInt(e.target.value);
  generateCalendar(currentMonth, currentYear);
});

yearSelect.addEventListener("change", (e) => {
  currentYear = parseInt(e.target.value);
  generateCalendar(currentMonth, currentYear);
});

// Dark Mode Toggle
document.getElementById("dark-mode-toggle").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// Initialize on load
init();
