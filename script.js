
/* =====================================
   EXPENSEGATHER - COMPLETE JAVASCRIPT
   ===================================== */

// 1. STORAGE SETTINGS

const STORAGE_KEY = "expensegather_transactions";
const OLD_STORAGE_KEY = "spendwise_transactions";

let transactions = [];
let editingTransactionId = null;


// 2. DATE AND STORAGE FUNCTIONS

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getCurrentMonth() {
    return getTodayDate().slice(0, 7);
}

function loadTransactions() {
    try {
        const newData = localStorage.getItem(STORAGE_KEY);
        const oldData = localStorage.getItem(OLD_STORAGE_KEY);

        const savedData = JSON.parse(newData || oldData || "[]");

        transactions = Array.isArray(savedData) ? savedData : [];

        // Migrate previous SpendWise data
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(transactions)
        );

    } catch (error) {
        console.error("Unable to load transactions:", error);
        transactions = [];
    }
}

function saveTransactions() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(transactions)
        );
    } catch (error) {
        console.error("Unable to save transactions:", error);
        alert("Unable to save your transaction. Please check browser storage.");
    }
}

function formatMoney(amount) {
    return Number(amount || 0).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    });
}

function getMonthKey(date) {
    return String(date || "").slice(0, 7);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


// 3. DASHBOARD CALCULATIONS

function updateDashboard() {
    const income = transactions
        .filter(t => t.type === "income")
        .reduce((total, t) => total + Number(t.amount), 0);

    const expense = transactions
        .filter(t => t.type === "expense")
        .reduce((total, t) => total + Number(t.amount), 0);

    const balance = income - expense;

    document.getElementById("balance").textContent =
        formatMoney(balance);

    document.getElementById("income").textContent =
        formatMoney(income);

    document.getElementById("expense").textContent =
        formatMoney(expense);

    renderTransactions();
    updateAnalytics();
}


// 4. INCOME AND EXPENSE BUTTONS

function updateTypeButtons() {
    const selectedType =
        document.getElementById("type").value;

    document.querySelectorAll(".type-btn").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.type === selectedType
        );
    });
}

document.querySelectorAll(".type-btn").forEach(button => {
    button.addEventListener("click", function () {
        document.getElementById("type").value =
            this.dataset.type;

        updateTypeButtons();
    });
});


// 5. EDIT MODE BUTTONS

function updateSubmitButton() {
    const submitButton =
        document.getElementById("submit-transaction");

    submitButton.textContent =
        editingTransactionId !== null
            ? "Save Changes"
            : "Add Transaction";

    let cancelButton =
        document.getElementById("cancel-edit");

    if (editingTransactionId !== null && !cancelButton) {
        cancelButton = document.createElement("button");

        cancelButton.type = "button";
        cancelButton.id = "cancel-edit";
        cancelButton.textContent = "Cancel Editing";

        submitButton.insertAdjacentElement(
            "afterend",
            cancelButton
        );

        cancelButton.addEventListener("click", cancelEditing);
    }

    if (editingTransactionId === null && cancelButton) {
        cancelButton.remove();
    }
}


// 6. ADD AND UPDATE TRANSACTIONS

const transactionForm =
    document.getElementById("transaction-form");

transactionForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const description =
        document.getElementById("description").value.trim();

    const amount =
        Number(document.getElementById("amount").value);

    const type =
        document.getElementById("type").value;

    const category =
        document.getElementById("category").value;

    const date =
        document.getElementById("date").value;

    if (
        !description ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !date ||
        !["income", "expense"].includes(type)
    ) {
        alert("Please enter valid transaction details.");
        return;
    }

    if (editingTransactionId !== null) {

        const transaction = transactions.find(
            t => String(t.id) === String(editingTransactionId)
        );

        if (!transaction) {
            alert("Transaction not found.");
            cancelEditing();
            return;
        }

        transaction.description = description;
        transaction.amount = amount;
        transaction.type = type;
        transaction.category = category;
        transaction.date = date;

    } else {

        transactions.push({
            id: Date.now(),
            description: description,
            amount: amount,
            type: type,
            category: category,
            date: date
        });
    }

    saveTransactions();

    editingTransactionId = null;

    transactionForm.reset();

    document.getElementById("type").value = "expense";
    document.getElementById("date").value = getTodayDate();

    updateTypeButtons();
    updateSubmitButton();
    updateDashboard();
});


// 7. EDIT TRANSACTION

function editTransaction(id) {
    const transaction = transactions.find(
        t => String(t.id) === String(id)
    );

    if (!transaction) return;

    editingTransactionId = transaction.id;

    document.getElementById("description").value =
        transaction.description;

    document.getElementById("amount").value =
        transaction.amount;

    document.getElementById("type").value =
        transaction.type;

    document.getElementById("category").value =
        transaction.category;

    document.getElementById("date").value =
        transaction.date;

    updateTypeButtons();
    updateSubmitButton();

    document.getElementById("add-transaction")
        .scrollIntoView({ behavior: "smooth" });
}


// 8. CANCEL EDITING

function cancelEditing() {
    editingTransactionId = null;

    transactionForm.reset();

    document.getElementById("type").value = "expense";
    document.getElementById("date").value = getTodayDate();

    updateTypeButtons();
    updateSubmitButton();
}


// 9. DELETE TRANSACTION

function deleteTransaction(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) return;

    transactions = transactions.filter(
        t => String(t.id) !== String(id)
    );

    if (String(editingTransactionId) === String(id)) {
        cancelEditing();
    }

    saveTransactions();
    updateDashboard();
}


// 10. SEARCH AND FILTER

function renderTransactions() {
    const list =
        document.getElementById("transaction-list");

    const search =
        document.getElementById("search-transaction")
            .value.toLowerCase().trim();

    const typeFilter =
        document.getElementById("filter-type").value;

    const categoryFilter =
        document.getElementById("filter-category").value;

    const monthFilter =
        document.getElementById("filter-month").value;

    const filteredTransactions = transactions
        .filter(transaction => {

            const matchesSearch =
                String(transaction.description)
                    .toLowerCase()
                    .includes(search);

            const matchesType =
                typeFilter === "all" ||
                transaction.type === typeFilter;

            const matchesCategory =
                categoryFilter === "all" ||
                transaction.category === categoryFilter;

            const matchesMonth =
                !monthFilter ||
                getMonthKey(transaction.date) === monthFilter;

            return matchesSearch &&
                matchesType &&
                matchesCategory &&
                matchesMonth;
        })
        .sort((a, b) =>
            b.date.localeCompare(a.date) ||
            Number(b.id) - Number(a.id)
        );

    if (filteredTransactions.length === 0) {
        list.innerHTML =
            "<p class='empty-message'>No transactions found.</p>";
        return;
    }

    list.innerHTML = filteredTransactions.map(transaction => {

        const sign =
            transaction.type === "income" ? "+" : "-";

        return `
            <div class="transaction-item">

                <div class="transaction-details">
                    <strong>
                        ${escapeHTML(transaction.description)}
                    </strong>

                    <small>
                        ${escapeHTML(transaction.category)}
                        • ${escapeHTML(transaction.date)}
                    </small>
                </div>

                <div class="transaction-amount ${transaction.type}">
                    ${sign}${formatMoney(transaction.amount)}
                </div>

                <div class="transaction-actions">

                    <button type="button"
                        class="edit-btn"
                        data-action="edit"
                        data-id="${escapeHTML(transaction.id)}">
                        Edit
                    </button>

                    <button type="button"
                        class="delete-btn"
                        data-action="delete"
                        data-id="${escapeHTML(transaction.id)}">
                        Delete
                    </button>

                </div>
            </div>
        `;
    }).join("");
}


// Handle Edit and Delete clicks

document.getElementById("transaction-list")
    .addEventListener("click", function (event) {

        const button = event.target.closest("button[data-action]");

        if (!button) return;

        const id = button.dataset.id;

        if (button.dataset.action === "edit") {
            editTransaction(id);
        }

        if (button.dataset.action === "delete") {
            deleteTransaction(id);
        }
    });


// Search and filter listeners

document.getElementById("search-transaction")
    .addEventListener("input", renderTransactions);

document.getElementById("filter-type")
    .addEventListener("change", renderTransactions);

document.getElementById("filter-category")
    .addEventListener("change", renderTransactions);

document.getElementById("filter-month")
    .addEventListener("change", renderTransactions);


// Clear filters

document.getElementById("clear-filters")
    .addEventListener("click", function () {

        document.getElementById("search-transaction").value = "";
        document.getElementById("filter-type").value = "all";
        document.getElementById("filter-category").value = "all";
        document.getElementById("filter-month").value = "";

        renderTransactions();
    });


// 11. MONTHLY ANALYTICS

function updateAnalytics() {
    const selectedMonth =
        document.getElementById("analytics-month").value;

    const monthlyTransactions = transactions.filter(
        t => getMonthKey(t.date) === selectedMonth
    );

    const income = monthlyTransactions
        .filter(t => t.type === "income")
        .reduce((total, t) => total + Number(t.amount), 0);

    const expense = monthlyTransactions
        .filter(t => t.type === "expense")
        .reduce((total, t) => total + Number(t.amount), 0);

    const savings = income - expense;

    document.getElementById("monthly-savings").textContent =
        formatMoney(savings);

    document.getElementById("savings-caption").textContent =
        savings >= 0
            ? "Income minus expenses"
            : "You spent more than your income";

    renderMonthlyChart();
    renderCategoryChart(monthlyTransactions);
}

document.getElementById("analytics-month")
    .addEventListener("change", updateAnalytics);


// 12. LAST SIX MONTHS CHART

function renderMonthlyChart() {
    const chart =
        document.getElementById("monthly-chart");

    const months = [];

    for (let i = 5; i >= 0; i--) {
        const date = new Date();

        date.setDate(1);
        date.setMonth(date.getMonth() - i);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");

        months.push({
            key: `${year}-${month}`,
            label: date.toLocaleString("en-IN", {
                month: "short"
            })
        });
    }

    const monthlyData = months.map(month => {

        const monthTransactions = transactions.filter(
            t => getMonthKey(t.date) === month.key
        );

        const income = monthTransactions
            .filter(t => t.type === "income")
            .reduce((total, t) => total + Number(t.amount), 0);

        const expense = monthTransactions
            .filter(t => t.type === "expense")
            .reduce((total, t) => total + Number(t.amount), 0);

        return {
            ...month,
            income,
            expense
        };
    });

    const maximum = Math.max(
        1,
        ...monthlyData.map(m => Math.max(m.income, m.expense))
    );

    chart.innerHTML = monthlyData.map(month => {

        const incomeHeight = month.income / maximum * 100;
        const expenseHeight = month.expense / maximum * 100;

        return `
            <div class="month-group">

                <div class="month-bars">

                    <div class="bar income-bar"
                        style="height:${incomeHeight}%"
                        title="Income: ${formatMoney(month.income)}">
                    </div>

                    <div class="bar expense-bar"
                        style="height:${expenseHeight}%"
                        title="Expense: ${formatMoney(month.expense)}">
                    </div>

                </div>

                <small>${month.label}</small>

            </div>
        `;
    }).join("");
}


// 13. CATEGORY DONUT CHART

function renderCategoryChart(monthTransactions) {
    const expenseTransactions = monthTransactions.filter(
        t => t.type === "expense"
    );

    const categoryTotals = {};

    expenseTransactions.forEach(transaction => {
        const category = transaction.category || "Other";

        categoryTotals[category] =
            (categoryTotals[category] || 0) +
            Number(transaction.amount);
    });

    const entries = Object.entries(categoryTotals);

    const total = entries.reduce(
        (sum, entry) => sum + entry[1], 0
    );

    const donut =
        document.getElementById("category-donut");

    const legend =
        document.getElementById("category-legend");

    document.getElementById("category-total").textContent =
        formatMoney(total);

    const colors = [
        "#2563eb",
        "#16a34a",
        "#f59e0b",
        "#ef4444",
        "#8b5cf6",
        "#06b6d4",
        "#ec4899",
        "#64748b",
        "#0f766e",
        "#a16207"
    ];

    if (total === 0) {
        donut.style.background =
            "conic-gradient(#e5e7eb 0deg 360deg)";

        legend.innerHTML =
            "<p>No expenses recorded this month.</p>";

        return;
    }

    let currentDegree = 0;

    const gradient = [];
    const legendHTML = [];

    entries.forEach(([category, amount], index) => {

        const percentage = amount / total * 100;
        const degree = amount / total * 360;
        const color = colors[index % colors.length];

        gradient.push(
            `${color} ${currentDegree}deg ${currentDegree + degree}deg`
        );

        currentDegree += degree;

        legendHTML.push(`
            <div class="category-row">

                <span class="category-dot"
                    style="background:${color}">
                </span>

                <span class="category-name">
                    ${escapeHTML(category)}
                </span>

                <strong>${formatMoney(amount)}</strong>

                <small>${percentage.toFixed(1)}%</small>

            </div>
        `);
    });

    donut.style.background =
        `conic-gradient(${gradient.join(", ")})`;

    legend.innerHTML = legendHTML.join("");
}


// 14. MOBILE NAVIGATION

document.querySelectorAll(".nav-item").forEach(link => {

    link.addEventListener("click", function () {

        document.querySelectorAll(".nav-item")
            .forEach(item => item.classList.remove("active"));

        this.classList.add("active");
    });
});


// 15. INITIAL PAGE SETUP

loadTransactions();

document.getElementById("date").value = getTodayDate();

document.getElementById("analytics-month").value =
    getCurrentMonth();

document.getElementById("type").value = "expense";

updateTypeButtons();
updateSubmitButton();
updateDashboard();
