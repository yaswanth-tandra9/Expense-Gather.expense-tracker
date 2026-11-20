
let transactions = [];

const form = document.getElementById("transaction-form");

form.addEventListener("submit", function(event) {
    event.preventDefault();

    const description = document.getElementById("description").value.trim();
    const amount = Number(document.getElementById("amount").value);
    const type = document.getElementById("type").value;

    if (!description || !Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid description and amount.");
        return;
    }

    transactions.push({
        description,
        amount,
        type
    });

    form.reset();
    updateDashboard();
});

function updateDashboard() {
    const income = transactions
        .filter(t => t.type === "income")
        .reduce((total, t) => total + t.amount, 0);

    const expenses = transactions
        .filter(t => t.type === "expense")
        .reduce((total, t) => total + t.amount, 0);

    const balance = income - expenses;

    document.getElementById("income").textContent = formatMoney(income);
    document.getElementById("expenses").textContent = formatMoney(expenses);
    document.getElementById("balance").textContent = formatMoney(balance);

    const list = document.getElementById("transaction-list");
    list.innerHTML = "";

    transactions.slice().reverse().forEach(t => {
        const item = document.createElement("li");

        const name = document.createElement("span");
        name.textContent = t.description;

        const value = document.createElement("strong");
        value.textContent =
            `${t.type === "income" ? "+" : "-"}${formatMoney(t.amount)}`;
        value.className = t.type;

        item.append(name, value);
        list.appendChild(item);
    });
}

function formatMoney(amount) {
    return amount.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR"
    });
}

updateDashboard();
