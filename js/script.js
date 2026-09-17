// ============================================================
// TASKFLOW - SMART TASK MANAGER
// FRONTEND ONLY - LOCALSTORAGE VERSION
// No Node.js, Express, SQLite, JWT or API required.
// ============================================================

let currentUser = JSON.parse(localStorage.getItem("taskflowCurrentUser"));
let tasks = [];
let notifications = [];

// Protect dashboard
if (!currentUser) {
    window.location.href = "pages/login.html";
}

// ============================================================
// STORAGE
// ============================================================

function getTaskStorageKey() {
    return currentUser ? `taskflowTasks_${currentUser.id}` : "taskflowTasks_guest";
}

function loadTasks() {
    if (!currentUser) return;

    try {
        const saved = localStorage.getItem(getTaskStorageKey());
        tasks = saved ? JSON.parse(saved) : [];

        if (!Array.isArray(tasks)) {
            tasks = [];
        }
    } catch (error) {
        console.error("Could not load tasks:", error);
        tasks = [];
    }
}

function saveTasks() {
    if (!currentUser) return;
    localStorage.setItem(getTaskStorageKey(), JSON.stringify(tasks));
}

// ============================================================
// USER / NAVIGATION
// ============================================================

function displayUserInfo() {
    const userName = document.getElementById("userName");
    if (userName && currentUser) {
        userName.textContent = currentUser.name || "User";
    }
}

function showSection(sectionId) {
    const sections = document.querySelectorAll(".section");

    sections.forEach(section => {
        section.classList.add("hidden");
    });

    const selected = document.getElementById(sectionId);
    if (selected) {
        selected.classList.remove("hidden");
    }

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.remove("active");

        const onclick = button.getAttribute("onclick") || "";
        if (onclick.includes(`'${sectionId}'`) || onclick.includes(`"${sectionId}"`)) {
            button.classList.add("active");
        }
    });

    const pageTitle = document.getElementById("pageTitle");
    const titles = {
        dashboard: "Dashboard",
        tasks: "My Tasks",
        completed: "Completed Tasks",
        analytics: "Analytics"
    };

    if (pageTitle) {
        pageTitle.textContent = titles[sectionId] || "TaskFlow";
    }

    if (sectionId === "dashboard") renderDashboard();
    if (sectionId === "tasks") renderTasks();
    if (sectionId === "completed") renderCompletedTasks();
    if (sectionId === "analytics") renderAnalytics();

    closeNotifications();
}

// Keep compatibility with older code
function showPage(sectionId) {
    showSection(sectionId);
}

// ============================================================
// TASK MODAL
// ============================================================

function openTaskModal(taskId = null) {
    const modal = document.getElementById("taskModal");
    const form = document.getElementById("taskForm");
    const modalTitle = document.getElementById("modalTitle");
    const taskIdInput = document.getElementById("taskId");

    if (!modal || !form) {
        console.error("Task modal or form not found.");
        return;
    }

    form.reset();

    if (taskId === null || taskId === undefined || taskId === "") {
        if (taskIdInput) taskIdInput.value = "";
        if (modalTitle) modalTitle.textContent = "Add New Task";

        const priority = document.getElementById("taskPriority");
        const category = document.getElementById("taskCategory");

        if (priority) priority.value = "medium";
        if (category) category.value = "College";
    } else {
        const task = tasks.find(item => String(item.id) === String(taskId));

        if (!task) {
            alert("Task not found.");
            return;
        }

        if (modalTitle) modalTitle.textContent = "Edit Task";
        if (taskIdInput) taskIdInput.value = task.id;

        const title = document.getElementById("taskTitle");
        const description = document.getElementById("taskDescription");
        const category = document.getElementById("taskCategory");
        const priority = document.getElementById("taskPriority");
        const dueDate = document.getElementById("taskDueDate");

        if (title) title.value = task.title || "";
        if (description) description.value = task.description || "";
        if (category) category.value = task.category || "College";
        if (priority) priority.value = task.priority || "medium";
        if (dueDate) dueDate.value = task.dueDate || "";
    }

    modal.classList.remove("hidden");

    const titleInput = document.getElementById("taskTitle");
    if (titleInput) {
        setTimeout(() => titleInput.focus(), 50);
    }
}

function closeTaskModal() {
    const modal = document.getElementById("taskModal");
    if (modal) modal.classList.add("hidden");
}

const taskForm = document.getElementById("taskForm");

if (taskForm) {
    taskForm.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!currentUser) return;

        const title = document.getElementById("taskTitle")?.value.trim();
        const description = document.getElementById("taskDescription")?.value.trim() || "";
        const category = document.getElementById("taskCategory")?.value || "College";
        const priority = document.getElementById("taskPriority")?.value || "medium";
        const dueDate = document.getElementById("taskDueDate")?.value || "";
        const taskId = document.getElementById("taskId")?.value;

        if (!title) {
            alert("Please enter a task title.");
            return;
        }

        if (!dueDate) {
            alert("Please select a due date.");
            return;
        }

        if (taskId) {
            const task = tasks.find(item => String(item.id) === String(taskId));

            if (task) {
                task.title = title;
                task.description = description;
                task.category = category;
                task.priority = priority;
                task.dueDate = dueDate;
                task.updatedAt = new Date().toISOString();
            }
        } else {
            tasks.push({
                id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                userId: currentUser.id,
                title,
                description,
                category,
                priority,
                dueDate,
                completed: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }

        saveTasks();
        closeTaskModal();
        renderAll();
        generateNotifications();
    });
}

// ============================================================
// TASK ACTIONS
// ============================================================

function editTask(id) {
    openTaskModal(id);
}

function deleteTask(id) {
    const task = tasks.find(item => String(item.id) === String(id));

    if (!task) return;

    if (!confirm(`Delete "${task.title}"?`)) return;

    tasks = tasks.filter(item => String(item.id) !== String(id));

    saveTasks();
    renderAll();
    generateNotifications();
}

function toggleTask(id) {
    const task = tasks.find(item => String(item.id) === String(id));

    if (!task) return;

    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;
    task.updatedAt = new Date().toISOString();

    saveTasks();
    renderAll();
    generateNotifications();
}

// ============================================================
// DATE HELPERS
// ============================================================

function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getDateAfterDays(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function isOverdue(task) {
    return !task.completed && task.dueDate && task.dueDate < getToday();
}

function isDueToday(task) {
    return !task.completed && task.dueDate === getToday();
}

function isDueTomorrow(task) {
    return !task.completed && task.dueDate === getDateAfterDays(1);
}

function formatDate(dateString) {
    if (!dateString) return "No due date";

    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateString;

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

// ============================================================
// SECURITY / DISPLAY
// ============================================================

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getPriorityClass(priority) {
    return `priority-${String(priority || "medium").toLowerCase()}`;
}

// ============================================================
// FILTERING
// ============================================================

function getFilteredTasks() {
    const search = (document.getElementById("searchInput")?.value || "")
        .trim()
        .toLowerCase();

    const category = document.getElementById("filterCategory")?.value || "all";
    const priority = document.getElementById("filterPriority")?.value || "all";
    const status = document.getElementById("filterStatus")?.value || "all";

    return tasks.filter(task => {
        const matchesSearch =
            !search ||
            task.title.toLowerCase().includes(search) ||
            (task.description || "").toLowerCase().includes(search) ||
            (task.category || "").toLowerCase().includes(search);

        const matchesCategory =
            category === "all" || task.category === category;

        const matchesPriority =
            priority === "all" || task.priority === priority;

        const matchesStatus =
            status === "all" ||
            (status === "pending" && !task.completed) ||
            (status === "completed" && task.completed) ||
            (status === "overdue" && isOverdue(task));

        return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
    });
}

function clearFilters() {
    const search = document.getElementById("searchInput");
    const category = document.getElementById("filterCategory");
    const priority = document.getElementById("filterPriority");
    const status = document.getElementById("filterStatus");

    if (search) search.value = "";
    if (category) category.value = "all";
    if (priority) priority.value = "all";
    if (status) status.value = "all";

    renderTasks();
}

// ============================================================
// TASK HTML
// ============================================================

function createTaskHTML(task) {
    const overdue = isOverdue(task);

    return `
        <div class="task ${task.completed ? "completed" : ""}">
            <input
                type="checkbox"
                class="task-check"
                ${task.completed ? "checked" : ""}
                onchange="toggleTask('${escapeHTML(task.id)}')"
                aria-label="Complete task"
            >

            <div class="task-info">
                <h3>${escapeHTML(task.title)}</h3>

                ${task.description
                    ? `<p>${escapeHTML(task.description)}</p>`
                    : ""
                }

                <div class="task-meta">
                    <span class="badge category">
                        ${escapeHTML(task.category || "Other")}
                    </span>

                    <span class="badge ${getPriorityClass(task.priority)}">
                        ${escapeHTML((task.priority || "medium").toUpperCase())}
                    </span>

                    <span class="${overdue ? "overdue" : ""}">
                        📅 ${formatDate(task.dueDate)}
                        ${overdue ? " • OVERDUE" : ""}
                    </span>
                </div>
            </div>

            <div class="task-actions">
                <button
                    type="button"
                    onclick="editTask('${escapeHTML(task.id)}')"
                    title="Edit task"
                >
                    ✏️
                </button>

                <button
                    type="button"
                    onclick="deleteTask('${escapeHTML(task.id)}')"
                    title="Delete task"
                >
                    🗑️
                </button>
            </div>
        </div>
    `;
}

// ============================================================
// RENDER TASKS
// ============================================================

function renderTasks() {
    const taskList = document.getElementById("taskList");
    if (!taskList) return;

    const status = document.getElementById("filterStatus")?.value || "all";

    const filteredTasks = getFilteredTasks()
        .filter(task => status === "completed" ? task.completed : !task.completed)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty">
                <h3>No pending tasks found</h3>
                <p>Add a task or change your filters.</p>
            </div>
        `;
        return;
    }

    taskList.innerHTML = filteredTasks.map(createTaskHTML).join("");
}

function renderCompletedTasks() {
    const completedList = document.getElementById("completedList");
    if (!completedList) return;

    const completedTasks = tasks
        .filter(task => task.completed)
        .sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));

    if (completedTasks.length === 0) {
        completedList.innerHTML = `
            <div class="empty">
                <h3>No completed tasks</h3>
                <p>Completed tasks will appear here.</p>
            </div>
        `;
        return;
    }

    completedList.innerHTML = completedTasks.map(createTaskHTML).join("");
}

function renderRecentTasks() {
    const recentTasks = document.getElementById("recentTasks");
    if (!recentTasks) return;

    const recent = [...tasks]
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
        .slice(0, 5);

    if (recent.length === 0) {
        recentTasks.innerHTML = `
            <div class="empty">
                <p>No tasks yet. Click "+ Add Task" to create one.</p>
            </div>
        `;
        return;
    }

    recentTasks.innerHTML = recent.map(createTaskHTML).join("");
}

// ============================================================
// DASHBOARD STATISTICS
// ============================================================

function updateStatistics() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = tasks.filter(task => !task.completed).length;
    const overdue = tasks.filter(task => isOverdue(task)).length;

    const values = {
        totalTasks: total,
        completedTasks: completed,
        pendingTasks: pending,
        overdueTasks: overdue
    };

    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });

    const progress = total ? Math.round((completed / total) * 100) : 0;

    const progressText = document.getElementById("progressText");
    const progressFill = document.getElementById("progressFill");

    if (progressText) progressText.textContent = `${progress}%`;
    if (progressFill) progressFill.style.width = `${progress}%`;
}

function renderDashboard() {
    updateStatistics();
    renderRecentTasks();
}

// ============================================================
// ANALYTICS
// ============================================================

function countCategory(category) {
    return tasks.filter(
        task => String(task.category).toLowerCase() === category.toLowerCase()
    ).length;
}

function updateAnalyticsValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function updateAnalyticsBar(id, percentage) {
    const element = document.getElementById(id);
    if (element) element.style.width = `${percentage}%`;
}

function renderAnalytics() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const rate = total ? Math.round((completed / total) * 100) : 0;

    updateAnalyticsValue("analyticsTotal", total);
    updateAnalyticsValue("analyticsCompleted", completed);
    updateAnalyticsValue("analyticsPending", pending);
    updateAnalyticsValue("analyticsRate", `${rate}%`);

    const analyticsProgressFill = document.getElementById("analyticsProgressFill");
    const analyticsProgressText = document.getElementById("analyticsProgressText");

    if (analyticsProgressFill) analyticsProgressFill.style.width = `${rate}%`;
    if (analyticsProgressText) analyticsProgressText.textContent = `${rate}%`;

    const high = tasks.filter(task => task.priority === "high").length;
    const medium = tasks.filter(task => task.priority === "medium").length;
    const low = tasks.filter(task => task.priority === "low").length;

    updateAnalyticsValue("highCount", high);
    updateAnalyticsValue("mediumCount", medium);
    updateAnalyticsValue("lowCount", low);

    updateAnalyticsBar("highBar", total ? (high / total) * 100 : 0);
    updateAnalyticsBar("mediumBar", total ? (medium / total) * 100 : 0);
    updateAnalyticsBar("lowBar", total ? (low / total) * 100 : 0);

    const categories = [
        ["College", "collegeCount", "collegeBar"],
        ["Project", "projectCount", "projectBar"],
        ["Personal", "personalCount", "personalBar"],
        ["Work", "workCount", "workBar"]
    ];

    categories.forEach(([category, countId, barId]) => {
        const count = countCategory(category);
        updateAnalyticsValue(countId, count);
        updateAnalyticsBar(barId, total ? (count / total) * 100 : 0);
    });
}

// ============================================================
// NOTIFICATIONS
// ============================================================

function generateNotifications() {
    notifications = [];

    const overdueTasks = tasks.filter(task => isOverdue(task));
    const todayTasks = tasks.filter(task => isDueToday(task));
    const tomorrowTasks = tasks.filter(task => isDueTomorrow(task));

    overdueTasks.forEach(task => {
        notifications.push({
            id: `overdue_${task.id}`,
            taskId: task.id,
            type: "overdue",
            title: "Overdue task",
            message: `"${task.title}" is overdue.`
        });
    });

    todayTasks.forEach(task => {
        notifications.push({
            id: `today_${task.id}`,
            taskId: task.id,
            type: "today",
            title: "Due today",
            message: `"${task.title}" is due today.`
        });
    });

    tomorrowTasks.forEach(task => {
        notifications.push({
            id: `tomorrow_${task.id}`,
            taskId: task.id,
            type: "tomorrow",
            title: "Due tomorrow",
            message: `"${task.title}" is due tomorrow.`
        });
    });

    renderNotifications();
}

function renderNotifications() {
    const list = document.getElementById("notificationList");
    const count = document.getElementById("notificationCount");

    if (count) {
        count.textContent = notifications.length;
        count.classList.toggle("hidden", notifications.length === 0);
    }

    if (!list) return;

    if (notifications.length === 0) {
        list.innerHTML = `
            <div class="empty">
                <p>🔔 No new notifications</p>
            </div>
        `;
        return;
    }

    list.innerHTML = notifications.map(notification => `
        <div
            class="notification-item"
            onclick="openNotificationTask('${escapeHTML(notification.taskId)}')"
            style="cursor:pointer; padding:10px; border-bottom:1px solid #e5e7eb;"
        >
            <strong>${escapeHTML(notification.title)}</strong>
            <p>${escapeHTML(notification.message)}</p>
        </div>
    `).join("");
}

function openNotificationTask(taskId) {
    const task = tasks.find(item => String(item.id) === String(taskId));
    if (!task) return;

    closeNotifications();
    showSection("tasks");

    setTimeout(() => {
        const taskElement = [...document.querySelectorAll(".task")].find(
            element => element.innerText.includes(task.title)
        );

        if (taskElement) {
            taskElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, 100);
}

function toggleNotifications() {
    const panel = document.getElementById("notificationPanel");
    if (!panel) return;

    panel.classList.toggle("hidden");
}

function closeNotifications() {
    const panel = document.getElementById("notificationPanel");
    if (panel) panel.classList.add("hidden");
}

function clearNotifications() {
    notifications = [];
    renderNotifications();
}

// ============================================================
// THEME
// ============================================================

function updateThemeIcon() {
    const themeButton = document.querySelector(".theme-btn");
    if (!themeButton) return;

    themeButton.textContent =
        document.body.classList.contains("dark")
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";
}

function toggleTheme() {
    document.body.classList.toggle("dark");

    localStorage.setItem(
        "taskflowTheme",
        document.body.classList.contains("dark") ? "dark" : "light"
    );

    updateThemeIcon();
}

function loadTheme() {
    const savedTheme = localStorage.getItem("taskflowTheme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
    } else {
        document.body.classList.remove("dark");
    }

    updateThemeIcon();
}

// ============================================================
// LOGOUT
// ============================================================

function logout() {
    if (!confirm("Are you sure you want to logout?")) return;

    localStorage.removeItem("taskflowCurrentUser");
    localStorage.removeItem("taskflowLoggedIn");

    window.location.href = "pages/login.html";
}

// ============================================================
// MODAL / KEYBOARD EVENTS
// ============================================================

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeTaskModal();
        closeNotifications();
    }
});

const taskModal = document.getElementById("taskModal");

if (taskModal) {
    taskModal.addEventListener("click", function (event) {
        if (event.target === taskModal) {
            closeTaskModal();
        }
    });
}

// ============================================================
// INITIALIZATION
// ============================================================

function renderAll() {
    updateStatistics();
    renderRecentTasks();
    renderTasks();
    renderCompletedTasks();
    renderAnalytics();
}

function initializeApp() {
    if (!currentUser) return;

    loadTheme();
    loadTasks();
    displayUserInfo();
    generateNotifications();
    renderAll();
    showSection("dashboard");

    console.log("TaskFlow initialized successfully 🚀");
}

initializeApp();
