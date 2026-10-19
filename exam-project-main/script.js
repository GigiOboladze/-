let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const searchInput = document.getElementById('search-input');
const filterSelect = document.getElementById('filter-select');
const sortBtn = document.getElementById('sort-btn');
const dateTimeDiv = document.getElementById('date-time');
const fetchBtn = document.getElementById('fetch-btn');
const statsDiv = document.getElementById('stats');

function updateTime() {
    const now = new Date();
    dateTimeDiv.innerText = `მიმდინარე დრო: ${now.toLocaleString('ka-GE')}`;
}
setInterval(updateTime, 1000);
updateTime();

taskForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const text = taskInput.value.trim();

    if (text === "") {
        alert("გთხოვთ შეიყვანოთ ტექსტი!");
        return;
    }
    if (text.length < 3) {
        alert("დავალება მინიმუმ 3 სიმბოლო უნდა იყოს!");
        return;
    }

    const newTask = {
        id: Date.now(),
        text: text,
        completed: false,
        date: new Date().toLocaleString('ka-GE')
    };

    tasks.push(newTask);
    saveAndApplyFilters();
    taskInput.value = "";
});

function renderTasks(arrayToRender) {
    taskList.innerHTML = "";

    if (arrayToRender.length === 0) {
        const emptyLi = document.createElement('li');
        emptyLi.className = 'empty';
        emptyLi.innerText = 'დავალებები არ არის';
        taskList.appendChild(emptyLi);
        return;
    }

    arrayToRender.forEach(task => {
        const li = document.createElement('li');
        if (task.completed) {
            li.classList.add('completed');
        }

        const infoDiv = document.createElement('div');
        infoDiv.className = 'task-info';

        const span = document.createElement('span');
        span.innerText = task.text;

        const small = document.createElement('small');
        small.innerText = task.date ? `დამატებულია: ${task.date}` : '';

        infoDiv.appendChild(span);
        infoDiv.appendChild(small);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'task-actions';

        const statusBtn = document.createElement('button');
        statusBtn.innerText = task.completed ? 'აღდგენა' : 'შესრულება';
        statusBtn.className = 'status-btn';
        statusBtn.type = 'button';
        statusBtn.onclick = () => toggleTaskStatus(task.id);

        const deleteBtn = document.createElement('button');
        deleteBtn.innerText = 'წაშლა';
        deleteBtn.className = 'delete-btn';
        deleteBtn.type = 'button';
        deleteBtn.onclick = () => deleteTask(task.id);

        actionsDiv.appendChild(statusBtn);
        actionsDiv.appendChild(deleteBtn);

        li.appendChild(infoDiv);
        li.appendChild(actionsDiv);
        taskList.appendChild(li);
    });
}

function updateStats() {
    let doneCount = 0;
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].completed) {
            doneCount++;
        }
    }
    statsDiv.innerText = `სულ: ${tasks.length} | შესრულებული: ${doneCount} | დარჩენილი: ${tasks.length - doneCount}`;
}

function toggleTaskStatus(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    saveAndApplyFilters();
}

function deleteTask(id) {
    if (!confirm("ნამდვილად გინდა წაშლა?")) {
        return;
    }
    tasks = tasks.filter(task => task.id !== id);
    saveAndApplyFilters();
}

function saveAndApplyFilters() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    applyFiltersAndSearch();
}

function applyFiltersAndSearch() {
    let result = [...tasks];

    const searchText = searchInput.value.trim().toLowerCase();
    if (searchText !== "") {
        result = result.filter(task => task.text.toLowerCase().includes(searchText));
    }

    const filterValue = filterSelect.value;
    if (filterValue === 'completed') {
        result = result.filter(t => t.completed);
    } else if (filterValue === 'pending') {
        result = result.filter(t => !t.completed);
    }

    renderTasks(result);
    updateStats();
}

searchInput.addEventListener('input', applyFiltersAndSearch);
filterSelect.addEventListener('change', applyFiltersAndSearch);

let isAscending = true;
sortBtn.addEventListener('click', function() {
    tasks.sort((a, b) => {
        if (isAscending) {
            return a.text.localeCompare(b.text);
        } else {
            return b.text.localeCompare(a.text);
        }
    });
    sortBtn.innerText = isAscending ? 'სორტირება (ა-ჰ) ↓' : 'სორტირება (ჰ-ა) ↑';
    isAscending = !isAscending;
    saveAndApplyFilters();
});

fetchBtn.addEventListener('click', async function() {
    fetchBtn.innerText = "იტვირთება...";
    fetchBtn.disabled = true;

    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5');

        if (!response.ok) {
            throw new Error("სერვერმა დააბრუნა შეცდომა: " + response.status);
        }

        const data = await response.json();
        let addedCount = 0;

        data.forEach(item => {
            const exists = tasks.some(task => task.text === item.title);
            if (!exists) {
                tasks.push({
                    id: Date.now() + item.id,
                    text: item.title,
                    completed: item.completed,
                    date: new Date().toLocaleString('ka-GE')
                });
                addedCount++;
            }
        });

        saveAndApplyFilters();

        if (addedCount === 0) {
            alert("სერვერის დავალებები უკვე ჩატვირთულია!");
        }
    } catch (error) {
        console.error("შეცდომა:", error);
        alert("მოხდა შეცდომა სერვერთან კავშირისას!");
    } finally {
        fetchBtn.innerText = "სერვერიდან წამოღება (API)";
        fetchBtn.disabled = false;
    }
});

applyFiltersAndSearch();
