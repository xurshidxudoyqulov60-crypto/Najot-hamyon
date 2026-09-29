// ===================================================
// OILA MOLIYASI - BYUDJET, KIRIM VA CHIQIM TIZIMI
// ===================================================

// Kategoriyalar
const EXPENSE_CATEGORIES = ["O'qish", "Transport", "Kitob", "Kredit", "Oziq-ovqat", "Boshqa"];
const INCOME_CATEGORIES = ["Oylik maosh", "Bonus / Mukofot", "Qo'shimcha ish", "Savdo", "Sovg'a", "Boshqa"];

// Bosh harflar (ikonka indikatori uchun)
const CATEGORY_INITIALS = {
  "O'qish": "O'Q",
  "Transport": "TR",
  "Kitob": "KT",
  "Kredit": "KR",
  "Oziq-ovqat": "OZ",
  "Boshqa": "BS",
  "Oylik maosh": "MSH",
  "Bonus / Mukofot": "BNS",
  "Qo'shimcha ish": "QSH",
  "Savdo": "SVD",
  "Sovg'a": "SVG"
};

// Amallar ro'yxati (xarajatlar va kirimlar)
let transactions = [];

// Oylik asosiy byudjet (boshlang'ich qiymat: 5,000,000 so'm)
let monthlyBudget = 5000000;

// Hozirgi filtrlar
let currentTypeFilter = "all"; // 'all', 'expense', 'income'
let currentCategoryFilter = "Barchasi";

// LocalStorage kalitlari
const STORAGE_TRANSACTIONS_KEY = "family_expense_tracker_data";
const STORAGE_BUDGET_KEY = "family_monthly_budget_val";
const STORAGE_THEME_KEY = "family_app_theme_mode";

// Mavzuni boshqarish (Light / Dark mode)
function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_THEME_KEY) || "dark";
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  const sunIcon = document.getElementById("sunIcon");
  const moonIcon = document.getElementById("moonIcon");

  if (theme === "light") {
    document.body.classList.add("light-mode");
    if (sunIcon) sunIcon.style.display = "none";
    if (moonIcon) moonIcon.style.display = "block";
  } else {
    document.body.classList.remove("light-mode");
    if (sunIcon) sunIcon.style.display = "block";
    if (moonIcon) moonIcon.style.display = "none";
  }

  localStorage.setItem(STORAGE_THEME_KEY, theme);

  if (typeof renderDonutAndStats === "function") {
    renderDonutAndStats();
  }
}

function toggleTheme() {
  const isLight = document.body.classList.contains("light-mode");
  applyTheme(isLight ? "dark" : "light");
}

// Xavfsiz matn chiqarish (XSS oldini olish)
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Joriy sanani DD.MM.YYYY formatida olish
function getCurrentDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day}.${month}.${year}`;
}

// Summani vergul bilan formatlash (masalan: 3,000,000 so'm)
function formatMoney(amount) {
  const rounded = Math.round(amount);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " so'm";
}

// Jami chiqim (xarajatlar) summasini hisoblash
function calculateTotal() {
  return transactions
    .filter(item => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);
}

// Jami qo'shimcha kirimlar summasini hisoblash
function calculateTotalIncome() {
  return transactions
    .filter(item => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);
}

// Umumiy mavjud mablag' (Oylik byudjet + Qo'shimcha kirimlar)
function calculateTotalFunds() {
  return monthlyBudget + calculateTotalIncome();
}

// Qoldiq balansni hisoblash (Jami mablag' - Jami chiqim)
function calculateBalance() {
  return calculateTotalFunds() - calculateTotal();
}

// Ma'lumotlarni localStorage'ga saqlash
function saveData() {
  localStorage.setItem(STORAGE_TRANSACTIONS_KEY, JSON.stringify(transactions));
  localStorage.setItem(STORAGE_BUDGET_KEY, monthlyBudget.toString());
}

// Sahifalar (Tablar) o'rtasida o'tish
function switchTab(tabId) {
  const pages = document.querySelectorAll(".tab-page");
  pages.forEach(page => page.classList.remove("active"));

  const targetPage = document.getElementById(tabId);
  if (targetPage) {
    targetPage.classList.add("active");
  }

  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(btn => {
    if (btn.getAttribute("data-target") === tabId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  if (tabId === "tab-add") {
    setTimeout(() => {
      const titleInput = document.getElementById("expenseTitle");
      if (titleInput) titleInput.focus();
    }, 100);
  }
}

// Formadagi amal turini o'zgartirish (Chiqim yoki Kirim)
function setEntryType(type) {
  const entryTypeInput = document.getElementById("entryType");
  const typeExpenseBtn = document.getElementById("typeExpenseBtn");
  const typeIncomeBtn = document.getElementById("typeIncomeBtn");
  const formPageTitle = document.getElementById("formPageTitle");
  const formPageDesc = document.getElementById("formPageDesc");
  const labelTitle = document.getElementById("labelTitle");
  const categorySelect = document.getElementById("expenseCategory");
  const addBtn = document.getElementById("addBtn");

  entryTypeInput.value = type;

  if (type === "expense") {
    typeExpenseBtn.classList.add("active");
    typeIncomeBtn.classList.remove("active");

    formPageTitle.textContent = "Yangi xarajat qo'shish";
    formPageDesc.textContent = "Xarajat ma'lumotlarini to'ldiring va saqlang";
    labelTitle.textContent = "Xarajat nomi";
    addBtn.textContent = "Xarajatni saqlash";

    // Chiqim kategoriyalarini to'ldirish
    populateCategorySelect(EXPENSE_CATEGORIES);
  } else {
    typeIncomeBtn.classList.add("active");
    typeExpenseBtn.classList.remove("active");

    formPageTitle.textContent = "Qo'shimcha kirim qo'shish";
    formPageDesc.textContent = "Kirim / daromad ma'lumotlarini to'ldiring va saqlang";
    labelTitle.textContent = "Kirim nomi";
    addBtn.textContent = "Kirimni saqlash";

    // Kirim kategoriyalarini to'ldirish
    populateCategorySelect(INCOME_CATEGORIES);
  }
}

// Select menyuni toifalar bilan to'ldirish
function populateCategorySelect(categoriesList) {
  const categorySelect = document.getElementById("expenseCategory");
  categorySelect.innerHTML = "";
  categoriesList.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

// Bosh sahifa (Home) ma'lumotlarini yangilash
function renderHomeSummary() {
  const totalExpense = calculateTotal();
  const totalIncome = calculateTotalIncome();
  const totalFunds = calculateTotalFunds();
  const balance = calculateBalance();

  // Qoldiq balans
  const remainingBalanceEl = document.getElementById("remainingBalanceText");
  if (remainingBalanceEl) {
    remainingBalanceEl.textContent = formatMoney(balance);
    if (balance < 0) {
      remainingBalanceEl.style.color = "#ef4444";
    } else {
      remainingBalanceEl.style.color = "";
    }
  }

  // Hero kartadagi ko'rsatkichlar
  const cardBudgetText = document.getElementById("cardBudgetText");
  if (cardBudgetText) cardBudgetText.textContent = formatMoney(monthlyBudget);

  const cardIncomeText = document.getElementById("cardIncomeText");
  if (cardIncomeText) cardIncomeText.textContent = `+${formatMoney(totalIncome)}`;

  const cardExpenseText = document.getElementById("cardExpenseText");
  if (cardExpenseText) cardExpenseText.textContent = `-${formatMoney(totalExpense)}`;

  // Byudjet sarflanish ko'rsatkichi (progress bar)
  const percentUsed = totalFunds > 0 ? Math.round((totalExpense / totalFunds) * 100) : 0;
  const budgetPercentText = document.getElementById("budgetPercentText");
  const budgetStatusText = document.getElementById("budgetStatusText");
  const heroProgressBar = document.getElementById("heroProgressBar");

  if (budgetPercentText) {
    budgetPercentText.textContent = `Sarflanish: ${percentUsed}%`;
  }

  if (budgetStatusText) {
    if (percentUsed >= 100) {
      budgetStatusText.textContent = "Byudjet tugadi!";
      budgetStatusText.style.color = "#991b1b";
    } else if (percentUsed >= 80) {
      budgetStatusText.textContent = "Byudjet tugab bormoqda";
      budgetStatusText.style.color = "#b45309";
    } else {
      budgetStatusText.textContent = "Byudjet me'yorda";
      budgetStatusText.style.color = "#0c0f14";
    }
  }

  if (heroProgressBar) {
    heroProgressBar.style.width = `${Math.min(percentUsed, 100)}%`;
  }

  // Oylik byudjet kartasidagi joriy summa
  const currentBudgetValueText = document.getElementById("currentBudgetValueText");
  if (currentBudgetValueText) {
    currentBudgetValueText.textContent = formatMoney(monthlyBudget);
  }

  // So'nggi amallar ro'yxati
  renderRecentExpenses();
}

// Bosh sahifadagi so'nggi 3 ta amal
function renderRecentExpenses() {
  const recentListEl = document.getElementById("recentExpenseList");
  if (!recentListEl) return;

  if (transactions.length === 0) {
    recentListEl.innerHTML = '<div class="empty-message">Hozircha amallar yo\'q</div>';
    return;
  }

  const recent = transactions.slice(0, 3);
  recentListEl.innerHTML = "";

  recent.forEach(item => {
    const isIncome = item.type === "income";
    const itemEl = document.createElement("div");
    itemEl.className = `expense-item ${isIncome ? "item-income" : "item-expense"}`;

    const initials = CATEGORY_INITIALS[item.category] || (isIncome ? "KRM" : "CHQ");

    itemEl.innerHTML = `
      <div class="expense-left">
        <div class="category-icon-indicator ${isIncome ? "income-indicator" : ""}">${initials}</div>
        <div class="expense-info">
          <span class="expense-title">${escapeHtml(item.title)}</span>
          <span class="expense-meta">${escapeHtml(item.category)} • ${escapeHtml(item.date)}</span>
        </div>
      </div>
      <div class="expense-right">
        <span class="expense-sum ${isIncome ? "sum-income" : ""}">${isIncome ? "+" : "-"}${formatMoney(item.amount)}</span>
      </div>
    `;

    recentListEl.appendChild(itemEl);
  });
}

// Kategoriya ranglari (Aylana diagramma uchun)
const CATEGORY_COLORS = {
  "O'qish": "#38bdf8",     // moviy
  "Transport": "#c5f13b",  // neon laym
  "Kitob": "#a855f7",      // binafsha
  "Kredit": "#f97316",     // to'q sariq
  "Oziq-ovqat": "#10b981", // zumrad yashil
  "Boshqa": "#ec4899"      // pushti
};

// Statistika vaqt filtri ('all', 'month', 'week')
let currentStatsPeriod = "all";

// Sananing tanlangan davrga to'g'ri kelishini tekshirish
function isDateInPeriod(dateStr, period) {
  if (period === "all") return true;
  const parts = dateStr.split(".");
  if (parts.length !== 3) return true;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  const itemDate = new Date(year, month, day);
  const now = new Date();

  if (period === "month") {
    return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
  }

  if (period === "week") {
    const diffTime = Math.abs(now - itemDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }

  return true;
}

// Aylana Donut diagramma va tahliliy ko'rsatkichlarni chizish
function renderDonutAndStats() {
  const donutChart = document.getElementById("donutChart");
  const donutCenterTotal = document.getElementById("donutCenterTotal");
  const donutCenterCount = document.getElementById("donutCenterCount");
  const donutLegendList = document.getElementById("donutLegendList");
  const kpiTopExpenseText = document.getElementById("kpiTopExpenseText");
  const kpiTopExpenseSub = document.getElementById("kpiTopExpenseSub");
  const kpiDailyAvgText = document.getElementById("kpiDailyAvgText");

  // Tanlangan davr bo'yicha chiqimlarni olish
  const periodExpenses = transactions.filter(t => t.type === "expense" && isDateInPeriod(t.date, currentStatsPeriod));
  const totalExpense = periodExpenses.reduce((sum, item) => sum + Number(item.amount), 0);

  if (!donutChart || !donutCenterTotal || !donutLegendList) return;

  if (totalExpense === 0 || periodExpenses.length === 0) {
    donutChart.style.background = "conic-gradient(#272f3b 0% 100%)";
    donutCenterTotal.textContent = "0 so'm";
    donutCenterCount.textContent = "0 ta amal";
    donutLegendList.innerHTML = '<div class="empty-message">Ushbu davrda xarajatlar yo\'q</div>';

    if (kpiTopExpenseText) kpiTopExpenseText.textContent = "-";
    if (kpiTopExpenseSub) kpiTopExpenseSub.textContent = "Xarajat yo'q";
    if (kpiDailyAvgText) kpiDailyAvgText.textContent = "0 so'm";
    return;
  }

  // Kategoriyalar hisobi
  const catStats = [];
  EXPENSE_CATEGORIES.forEach(cat => {
    const sum = periodExpenses
      .filter(item => item.category === cat)
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
    if (sum > 0) {
      const percent = (sum / totalExpense) * 100;
      catStats.push({
        name: cat,
        sum: sum,
        percent: percent,
        percentRound: Math.round(percent),
        color: CATEGORY_COLORS[cat] || "#c5f13b"
      });
    }
  });

  // Eng kattasidan boshlab tartiblash
  catStats.sort((a, b) => b.sum - a.sum);

  // Conic-gradient orqali chiroyli aylana segmentlarini yasash
  let gradientParts = [];
  let currentAngle = 0;
  catStats.forEach(item => {
    const nextAngle = currentAngle + item.percent;
    gradientParts.push(`${item.color} ${currentAngle.toFixed(1)}% ${nextAngle.toFixed(1)}%`);
    currentAngle = nextAngle;
  });

  donutChart.style.background = `conic-gradient(${gradientParts.join(", ")})`;
  donutCenterTotal.textContent = formatMoney(totalExpense);
  donutCenterCount.textContent = `${periodExpenses.length} ta xarajat`;

  // Aylana ostidagi rangli toifalar ro'yxati
  donutLegendList.innerHTML = "";
  catStats.forEach(item => {
    const el = document.createElement("div");
    el.className = "donut-legend-item";
    el.innerHTML = `
      <div class="donut-legend-header">
        <div class="legend-left">
          <span class="legend-dot" style="background-color: ${item.color};"></span>
          <span class="legend-name">${item.name}</span>
        </div>
        <div class="legend-right">
          <span class="legend-amount">${formatMoney(item.sum)}</span>
          <span class="legend-percent">(${item.percentRound}%)</span>
        </div>
      </div>
      <div class="legend-bar-track">
        <div class="legend-bar-fill" style="width: ${item.percentRound}%; background-color: ${item.color};"></div>
      </div>
    `;
    donutLegendList.appendChild(el);
  });

  // KPIs yangilash
  if (kpiTopExpenseText && catStats.length > 0) {
    kpiTopExpenseText.textContent = catStats[0].name;
    kpiTopExpenseSub.textContent = `${formatMoney(catStats[0].sum)} (${catStats[0].percentRound}%)`;
  }

  if (kpiDailyAvgText) {
    const days = currentStatsPeriod === "week" ? 7 : (currentStatsPeriod === "month" ? 30 : 30);
    const avg = Math.round(totalExpense / days);
    kpiDailyAvgText.textContent = formatMoney(avg);
  }
}

// Telegram uchun to'liq hisobotni nusxalash
function copyTelegramReport() {
  const totalExpense = calculateTotal();
  const totalIncome = calculateTotalIncome();
  const totalFunds = calculateTotalFunds();
  const balance = calculateBalance();

  let report = `📊 Oila moliyaviy hisoboti:\n`;
  report += `💰 Oylik reja byudjet: ${formatMoney(monthlyBudget)}\n`;
  if (totalIncome > 0) {
    report += `➕ Qo'shimcha kirim: +${formatMoney(totalIncome)}\n`;
  }
  report += `💳 Jami tushum: ${formatMoney(totalFunds)}\n`;
  report += `🔻 Jami chiqim: -${formatMoney(totalExpense)}\n`;
  report += `🟢 Qoldiq mablag': ${formatMoney(balance)}\n\n`;

  report += `📌 Pul qayerga ketdi (Xarajatlar taqsimoti):\n`;
  EXPENSE_CATEGORIES.forEach(cat => {
    const catSum = transactions
      .filter(t => t.type === "expense" && t.category === cat)
      .reduce((acc, c) => acc + Number(c.amount), 0);
    if (catSum > 0) {
      const p = Math.round((catSum / totalExpense) * 100);
      report += `• ${cat}: ${formatMoney(catSum)} (${p}%)\n`;
    }
  });

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(report).then(() => {
      const btnText = document.getElementById("copyReportBtnText");
      if (btnText) {
        const oldText = btnText.textContent;
        btnText.textContent = "Hisobot nusxalandi! Telegramga yuborishingiz mumkin";
        setTimeout(() => {
          btnText.textContent = oldText;
        }, 2500);
      }
    }).catch(() => {
      prompt("Hisobotni nusxalab oling:", report);
    });
  } else {
    prompt("Hisobotni nusxalab oling:", report);
  }
}

// Kategoriyalar va Moliya xulosasi (Statistika)
function renderCategories() {
  const totalExpense = calculateTotal();
  const totalIncome = calculateTotalIncome();
  const totalFunds = calculateTotalFunds();
  const balance = calculateBalance();

  // Moliya xulosasi
  const statsBudgetText = document.getElementById("statsBudgetText");
  if (statsBudgetText) statsBudgetText.textContent = formatMoney(monthlyBudget);

  const statsIncomeText = document.getElementById("statsIncomeText");
  if (statsIncomeText) statsIncomeText.textContent = `+${formatMoney(totalIncome)}`;

  const statsTotalFundsText = document.getElementById("statsTotalFundsText");
  if (statsTotalFundsText) statsTotalFundsText.textContent = formatMoney(totalFunds);

  const statsExpenseText = document.getElementById("statsExpenseText");
  if (statsExpenseText) statsExpenseText.textContent = `-${formatMoney(totalExpense)}`;

  const statsBalanceText = document.getElementById("statsBalanceText");
  if (statsBalanceText) {
    statsBalanceText.textContent = formatMoney(balance);
    statsBalanceText.style.color = balance < 0 ? "#ef4444" : "";
  }

  // Aylana diagrammani va KPI larni chizish
  renderDonutAndStats();
}

// Tarix ro'yxati (renderList)
function renderList() {
  const expenseListEl = document.getElementById("expenseList");
  if (!expenseListEl) return;

  // Filtrlar bo'yicha saralash
  let filtered = transactions;

  // 1. Tur bo'yicha filtr (Chiqim yoki Kirim)
  if (currentTypeFilter !== "all") {
    filtered = filtered.filter(item => item.type === currentTypeFilter);
  }

  // 2. Kategoriya bo'yicha filtr
  if (currentCategoryFilter !== "Barchasi") {
    filtered = filtered.filter(item => item.category === currentCategoryFilter);
  }

  if (filtered.length === 0) {
    expenseListEl.innerHTML = '<div class="empty-message">Hozircha mos amallar yo\'q</div>';
    return;
  }

  expenseListEl.innerHTML = "";

  filtered.forEach(item => {
    const isIncome = item.type === "income";
    const itemEl = document.createElement("div");
    itemEl.className = `expense-item ${isIncome ? "item-income" : "item-expense"}`;

    const initials = CATEGORY_INITIALS[item.category] || (isIncome ? "KRM" : "CHQ");

    const leftBox = document.createElement("div");
    leftBox.className = "expense-left";
    leftBox.innerHTML = `
      <div class="category-icon-indicator ${isIncome ? "income-indicator" : ""}">${initials}</div>
      <div class="expense-info">
        <span class="expense-title">${escapeHtml(item.title)}</span>
        <span class="expense-meta">${escapeHtml(item.category)} • ${escapeHtml(item.date)}</span>
      </div>
    `;

    const rightBox = document.createElement("div");
    rightBox.className = "expense-right";

    const sumEl = document.createElement("span");
    sumEl.className = `expense-sum ${isIncome ? "sum-income" : ""}`;
    sumEl.textContent = `${isIncome ? "+" : "-"}${formatMoney(item.amount)}`;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-delete";
    deleteBtn.textContent = "O'chirish";
    deleteBtn.type = "button";
    deleteBtn.addEventListener("click", () => {
      itemEl.classList.add("deleting");
      setTimeout(() => {
        deleteExpense(item.id);
      }, 200);
    });

    rightBox.appendChild(sumEl);
    rightBox.appendChild(deleteBtn);

    itemEl.appendChild(leftBox);
    itemEl.appendChild(rightBox);

    expenseListEl.appendChild(itemEl);
  });
}

// Kategoriya filter chiplarini dinamik yangilash
function updateFilterChips() {
  const container = document.getElementById("filterChipsContainer");
  if (!container) return;

  container.innerHTML = "";

  // Amaldagi turga qarab tegishli kategoriyalar
  let categories = ["Barchasi"];
  if (currentTypeFilter === "expense") {
    categories = categories.concat(EXPENSE_CATEGORIES);
  } else if (currentTypeFilter === "income") {
    categories = categories.concat(INCOME_CATEGORIES);
  } else {
    // Hammasi
    categories = categories.concat(EXPENSE_CATEGORIES);
  }

  // Agar tanlangan kategoriya yangi ro'yxatda yo'q bo'lsa "Barchasi"ga o'tish
  if (!categories.includes(currentCategoryFilter)) {
    currentCategoryFilter = "Barchasi";
  }

  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = `filter-chip ${cat === currentCategoryFilter ? "active" : ""}`;
    btn.textContent = cat;
    btn.addEventListener("click", () => {
      currentCategoryFilter = cat;
      updateFilterChips();
      renderList();
    });
    container.appendChild(btn);
  });
}

// Barcha interfeysni sinxron yangilash
function updateUI() {
  renderHomeSummary();
  renderCategories();
  renderList();
}

// Raqam kiritish paytida avtomatik vergul qo'yish (3,000,000)
function handleAmountInput(e) {
  const input = e.target;
  let val = input.value.replace(/\D/g, "");
  if (val) {
    input.value = Number(val).toLocaleString("en-US");
  } else {
    input.value = "";
  }
}

// Yangi amal (xarajat yoki kirim) qo'shish
function addExpense(event) {
  if (event) {
    event.preventDefault();
  }

  const entryType = document.getElementById("entryType").value;
  const titleInput = document.getElementById("expenseTitle");
  const amountInput = document.getElementById("expenseAmount");
  const categorySelect = document.getElementById("expenseCategory");
  const errorMessage = document.getElementById("errorMessage");

  const title = titleInput.value.trim();
  const rawAmount = amountInput.value.replace(/,/g, "").trim();
  const amount = parseFloat(rawAmount);
  const category = categorySelect.value;

  if (!title || isNaN(amount) || amount <= 0) {
    errorMessage.textContent = "Iltimos, nomni kiriting va summa 0 dan katta bo'lsin.";
    errorMessage.classList.add("active");
    return;
  }

  errorMessage.classList.remove("active");
  errorMessage.textContent = "";

  const newTransaction = {
    id: Date.now(),
    type: entryType,
    title: title,
    amount: amount,
    category: category,
    date: getCurrentDate()
  };

  transactions.unshift(newTransaction);

  saveData();
  updateUI();

  titleInput.value = "";
  amountInput.value = "";

  // Asosiy sahifaga qaytish
  switchTab("tab-home");
}

// Amalni o'chirish
function deleteExpense(id) {
  transactions = transactions.filter(item => item.id !== id);
  saveData();
  updateUI();
}

// Oylik byudjetni saqlash funksiyasi
function saveMonthlyBudget() {
  const budgetInput = document.getElementById("budgetAmountInput");
  const rawAmount = budgetInput.value.replace(/,/g, "").trim();
  const amount = parseFloat(rawAmount);

  if (isNaN(amount) || amount <= 0) {
    alert("Iltimos, to'g'ri byudjet summasini kiriting!");
    return;
  }

  monthlyBudget = amount;
  saveData();
  updateUI();

  // Formani yopish
  document.getElementById("budgetEditFormBox").style.display = "none";
}

// Boshlang'ich sozlamalar
function init() {
  // Mavzuni sozlash (Light / Dark mode)
  initTheme();

  // Bugungi sana
  const currentDateEl = document.getElementById("currentDateText");
  if (currentDateEl) {
    const today = new Date();
    const options = { day: "numeric", month: "long" };
    currentDateEl.textContent = today.toLocaleDateString("uz-UZ", options);
  }

  // Oylik byudjetni yuklash
  const storedBudget = localStorage.getItem(STORAGE_BUDGET_KEY);
  if (storedBudget !== null) {
    const parsedBudget = parseFloat(storedBudget);
    if (!isNaN(parsedBudget) && parsedBudget > 0) {
      monthlyBudget = parsedBudget;
    }
  }

  // Amallarni yuklash
  const storedData = localStorage.getItem(STORAGE_TRANSACTIONS_KEY);
  if (storedData === null) {
    const today = getCurrentDate();
    transactions = [
      { id: 1, type: "expense", title: "O'qish to'lovlari", amount: 300000, category: "O'qish", date: today },
      { id: 2, type: "expense", title: "Taxi", amount: 15000, category: "Transport", date: today },
      { id: 3, type: "expense", title: "Kitob", amount: 50000, category: "Kitob", date: today },
      { id: 4, type: "expense", title: "Kredit", amount: 400000, category: "Kredit", date: today },
      { id: 5, type: "income", title: "Mukofot puli", amount: 500000, category: "Bonus / Mukofot", date: today }
    ];
    saveData();
  } else {
    try {
      const parsed = JSON.parse(storedData);
      if (Array.isArray(parsed)) {
        // Eski ma'lumotlar bilan orqaga moslik (agar type bo'lmasa 'expense' deb qabul qilamiz)
        transactions = parsed.map(item => ({
          ...item,
          type: item.type || "expense"
        }));
      } else {
        transactions = [];
      }
    } catch (e) {
      transactions = [];
    }
  }

  // Formada boshlang'ich kategoriya menyusini to'ldirish (Chiqim)
  setEntryType("expense");

  // Chiqim / Kirim tugmalarini ulash
  const typeExpenseBtn = document.getElementById("typeExpenseBtn");
  const typeIncomeBtn = document.getElementById("typeIncomeBtn");
  if (typeExpenseBtn) typeExpenseBtn.addEventListener("click", () => setEntryType("expense"));
  if (typeIncomeBtn) typeIncomeBtn.addEventListener("click", () => setEntryType("income"));

  // Forma yuborilishi
  const expenseForm = document.getElementById("expenseForm");
  if (expenseForm) {
    expenseForm.addEventListener("submit", addExpense);
  }

  // Summa inputlarida avtomatik vergul
  const expenseAmountInput = document.getElementById("expenseAmount");
  if (expenseAmountInput) {
    expenseAmountInput.addEventListener("input", handleAmountInput);
  }

  const budgetAmountInput = document.getElementById("budgetAmountInput");
  if (budgetAmountInput) {
    budgetAmountInput.addEventListener("input", handleAmountInput);
  }

  // Byudjetni tahrirlash formasi tugmalari
  const btnToggleBudgetEdit = document.getElementById("btnToggleBudgetEdit");
  const budgetEditFormBox = document.getElementById("budgetEditFormBox");
  const btnSaveBudget = document.getElementById("btnSaveBudget");

  if (btnToggleBudgetEdit && budgetEditFormBox) {
    btnToggleBudgetEdit.addEventListener("click", () => {
      const isHidden = budgetEditFormBox.style.display === "none";
      budgetEditFormBox.style.display = isHidden ? "block" : "none";
      if (isHidden && budgetAmountInput) {
        budgetAmountInput.value = monthlyBudget.toLocaleString("en-US");
        budgetAmountInput.focus();
      }
    });
  }

  if (btnSaveBudget) {
    btnSaveBudget.addEventListener("click", saveMonthlyBudget);
  }

  // Pastki navigatsiya doki
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const target = item.getAttribute("data-target");
      if (target) switchTab(target);
    });
  });

  // Mavzuni almashtirish tugmasi (Quyosh / Oy)
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme);
  }

  const goToAddExpenseBtn = document.getElementById("goToAddExpenseBtn");
  if (goToAddExpenseBtn) {
    goToAddExpenseBtn.addEventListener("click", () => {
      setEntryType("expense");
      switchTab("tab-add");
    });
  }

  const goToAddIncomeBtn = document.getElementById("goToAddIncomeBtn");
  if (goToAddIncomeBtn) {
    goToAddIncomeBtn.addEventListener("click", () => {
      setEntryType("income");
      switchTab("tab-add");
    });
  }

  const seeAllExpensesBtn = document.getElementById("seeAllExpensesBtn");
  if (seeAllExpensesBtn) {
    seeAllExpensesBtn.addEventListener("click", () => switchTab("tab-history"));
  }

  // Tarix sahifasidagi tur chiplari (Barchasi, Chiqimlar, Kirimlar)
  const typeChips = document.querySelectorAll(".type-chip");
  typeChips.forEach(chip => {
    chip.addEventListener("click", () => {
      typeChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      currentTypeFilter = chip.getAttribute("data-type-filter") || "all";
      updateFilterChips();
      renderList();
    });
  });

  // Statistika vaqt filtri tugmalari (All, Month, Week)
  const statsPeriodBtns = document.querySelectorAll(".stats-period-btn");
  statsPeriodBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      statsPeriodBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentStatsPeriod = btn.getAttribute("data-period") || "all";
      renderCategories();
    });
  });

  // Telegram hisobotini nusxalash tugmasi
  const btnCopyReport = document.getElementById("btnCopyReport");
  if (btnCopyReport) {
    btnCopyReport.addEventListener("click", copyTelegramReport);
  }

  // Interfeysni chizish
  updateUI();
}

window.addEventListener("DOMContentLoaded", init);
