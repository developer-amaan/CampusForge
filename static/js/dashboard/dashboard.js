/* =========================================================
        CAMPUSFORGE DASHBOARD
        Complete Dashboard JavaScript
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
            BASIC ELEMENTS
    ===================================================== */

    const toast = document.getElementById("toast");


    /* =====================================================
            TOAST SYSTEM
    ===================================================== */

    function showToast(message) {

        if (!toast) return;

        toast.textContent = message;

        toast.classList.add("show");

        setTimeout(() => {
            toast.classList.remove("show");
        }, 2500);
    }


    /* =====================================================
            ANIMATED COUNTERS
    ===================================================== */

    const counters = document.querySelectorAll(
        ".stat-card h3"
    );

    counters.forEach(counter => {

        const target = parseInt(
            counter.textContent.replace(/,/g, "")
        );

        if (isNaN(target)) return;

        let current = 0;

        const increment = Math.max(
            1,
            Math.ceil(target / 60)
        );

        const timer = setInterval(() => {

            current += increment;

            if (current >= target) {

                current = target;

                clearInterval(timer);

            }

            counter.textContent =
                current.toLocaleString();

        }, 20);

    });


    /* =====================================================
            PROGRESS BAR ANIMATION
    ===================================================== */

    const progressBars =
        document.querySelectorAll(
            ".progress-fill, .xp-fill, .placement-fill"
        );

    progressBars.forEach(bar => {

        const finalWidth =
            bar.style.width ||
            getComputedStyle(bar).width;

        bar.style.width = "0";

        setTimeout(() => {

            if (finalWidth.includes("%")) {
                bar.style.width = finalWidth;
            }

        }, 300);

    });


    /* =====================================================
            HERO ANIMATION
    ===================================================== */

    const hero = document.querySelector(".hero");

    if (hero) {

        hero.style.opacity = "0";
        hero.style.transform = "translateY(20px)";

        setTimeout(() => {

            hero.style.transition =
                "all 0.7s ease";

            hero.style.opacity = "1";
            hero.style.transform =
                "translateY(0)";

        }, 150);

    }


    /* =====================================================
            CARD HOVER
    ===================================================== */

    const cards =
        document.querySelectorAll(".card");

    cards.forEach(card => {

        card.addEventListener("mouseenter", () => {

            card.style.transform =
                "translateY(-4px)";

        });

        card.addEventListener("mouseleave", () => {

            card.style.transform =
                "translateY(0)";

        });

    });


    /* =====================================================
            LEVEL CIRCLE
    ===================================================== */

    const levelCircle =
        document.querySelector(".level-circle");

    if (levelCircle) {

        levelCircle.addEventListener(
            "mouseenter",
            () => {

                levelCircle.classList.add(
                    "level-circle-pulse"
                );

            }
        );

        levelCircle.addEventListener(
            "mouseleave",
            () => {

                levelCircle.classList.remove(
                    "level-circle-pulse"
                );

            }
        );

    }


    /* =====================================================
            DARK / LIGHT MODE
    ===================================================== */

    const themeToggle =
        document.getElementById("themeToggle");

    if (themeToggle) {

        const savedTheme =
            localStorage.getItem("theme");

        if (savedTheme === "light") {
            document.body.classList.add("light");
        }

        themeToggle.addEventListener(
            "click",
            () => {

                document.body.classList.toggle(
                    "light"
                );

                const isLight =
                    document.body.classList.contains(
                        "light"
                    );

                localStorage.setItem(
                    "theme",
                    isLight ? "light" : "dark"
                );

            }
        );

    }


    /* =====================================================
            NOTIFICATIONS
    ===================================================== */

    const notificationBtn =
        document.getElementById(
            "notificationBtn"
        );

    const notificationPanel =
        document.getElementById(
            "notificationPanel"
        );

    if (
        notificationBtn &&
        notificationPanel
    ) {

        notificationBtn.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                notificationPanel.classList.toggle(
                    "show"
                );

            }
        );

        document.addEventListener(
            "click",
            event => {

                if (
                    !notificationPanel.contains(
                        event.target
                    ) &&
                    event.target !== notificationBtn
                ) {

                    notificationPanel.classList.remove(
                        "show"
                    );

                }

            }
        );

    }


    /* =====================================================
            SEARCH
    ===================================================== */

    const searchInput =
        document.getElementById(
            "searchInput"
        );

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            () => {

                const query =
                    searchInput.value
                        .toLowerCase()
                        .trim();

                const searchableElements =
                    document.querySelectorAll(
                        ".card, .stat-card"
                    );

                searchableElements.forEach(
                    element => {

                        const text =
                            element.textContent
                                .toLowerCase();

                        if (
                            query === "" ||
                            text.includes(query)
                        ) {

                            element.style.display =
                                "";

                        } else {

                            element.style.display =
                                "none";

                        }

                    }
                );

            }
        );

    }


    /* =====================================================
            ACHIEVEMENT SYSTEM
    ===================================================== */

    window.unlockAchievement =
        function (message) {

            const popup =
                document.getElementById(
                    "achievementPopup"
                );

            const achievementText =
                document.getElementById(
                    "achievementText"
                );

            if (!popup) return;

            if (achievementText) {

                achievementText.textContent =
                    message;

            }

            popup.classList.add("show");

            setTimeout(() => {

                popup.classList.remove(
                    "show"
                );

            }, 3500);

        };


    /* =====================================================
            XP + LEVEL SYSTEM
    ===================================================== */

    const XP_PER_LEVEL = 3000;

    let xp =
        parseInt(
            localStorage.getItem("xp")
        ) || 2380;

    let currentLevel =
        parseInt(
            localStorage.getItem("level")
        ) || 15;


    const xpText =
        document.querySelector(
            ".xp-info strong"
        );

    const nextLevelText =
        document.querySelectorAll(
            ".xp-info strong"
        )[1];

    const xpFill =
        document.querySelector(
            ".xp-fill"
        );

    const xpPercentageText =
        document.querySelector(
            ".xp-text"
        );

    const levelElement =
        document.querySelector(
            ".level-circle h1"
        );


    function renderXP() {

        if (xpText) {

            xpText.textContent =
                `${xp} XP`;

        }


        const xpRemaining =
            XP_PER_LEVEL - xp;


        if (nextLevelText) {

            nextLevelText.textContent =
                `${xpRemaining} XP`;

        }


        const percentage =
            Math.min(
                (xp / XP_PER_LEVEL) * 100,
                100
            );


        if (xpFill) {

            xpFill.style.width =
                `${percentage}%`;

        }


        if (xpPercentageText) {

            xpPercentageText.textContent =
                `${Math.floor(percentage)}% completed to Level ${currentLevel + 1}`;

        }


        if (levelElement) {

            levelElement.textContent =
                currentLevel;

        }


        localStorage.setItem(
            "xp",
            xp
        );

        localStorage.setItem(
            "level",
            currentLevel
        );

    }


    function checkLevel() {

        let leveledUp = false;


        while (xp >= XP_PER_LEVEL) {

            xp -= XP_PER_LEVEL;

            currentLevel++;

            leveledUp = true;

        }


        if (leveledUp) {

            if (levelCircle) {

                levelCircle.classList.add(
                    "level-up"
                );

                setTimeout(() => {

                    levelCircle.classList.remove(
                        "level-up"
                    );

                }, 900);

            }


            showToast(
                `🎉 LEVEL ${currentLevel} UNLOCKED!`
            );


            if (
                typeof unlockAchievement ===
                "function"
            ) {

                unlockAchievement(
                    `Reached Level ${currentLevel}`
                );

            }

        }


        renderXP();

    }


    function updateXP() {

        checkLevel();

    }


    renderXP();


    /* =====================================================
            DAILY GOALS SYSTEM
    ===================================================== */

    const goalList =
        document.getElementById(
            "goalList"
        );

    const addGoalBtn =
        document.getElementById(
            "addGoalBtn"
        );

    const editGoalsBtn =
        document.getElementById(
            "editGoalsBtn"
        );

    const goalProgressText =
        document.getElementById(
            "goalProgressText"
        );

    const goalProgressPercentage =
        document.getElementById(
            "goalProgressPercentage"
        );

    const goalProgressFill =
        document.getElementById(
            "goalProgressFill"
        );

    const todayXPElement =
        document.getElementById(
            "todayXP"
        );


    /* =====================================================
            GOAL XP SETTINGS
    ===================================================== */

    const DAILY_GOAL_XP_LIMIT = 200;

    const GOAL_XP = {

        Easy: 10,

        Medium: 25,

        Hard: 50,

        Epic: 100

    };
    // Flask API helper
    async function goalsAPI(url, options = {}) {
        const response = await fetch(url, {
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                ...options.headers
            },
            ...options
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Something went wrong.");
        }

        return data;
    }

    // Convert backend fields to the format used by dashboard.js
    function normalizeGoal(goal) {
        return {
            ...goal,
            estimatedTime: goal.estimatedTime ?? goal.estimated_time ?? 0,
            completed: Boolean(goal.completed)
        };
    }


    /* =====================================================
            TODAY'S DATE
    ===================================================== */

    // Today's local date
    const dateNow = new Date();

    const today = [
        dateNow.getFullYear(),
        String(dateNow.getMonth() + 1).padStart(2, "0"),
        String(dateNow.getDate()).padStart(2, "0")
    ].join("-");

    let dailyGoals = [];

    async function fetchDailyGoals() {
        try {
            const data = await goalsAPI("/api/goals");

            dailyGoals = (data.goals || []).map(normalizeGoal);

            renderGoals();

            if (todayXPElement) {
                todayXPElement.textContent = data.todayXP ?? 0;
            }
        } catch (error) {
            console.error("Failed to load daily goals:", error);
            showToast(`⚠️ ${error.message}`);
        }
    }


    /* =====================================================
            SAVE GOALS
    ===================================================== */

    function saveDailyGoals() {

        localStorage.setItem(
            GOALS_STORAGE_KEY,
            JSON.stringify(
                dailyGoals
            )
        );

    }


    /* =====================================================
            CALCULATE TODAY'S GOAL XP
    ===================================================== */

    function calculateTodayXP() {

        return dailyGoals
            .filter(goal => goal.completed)
            .reduce(
                (total, goal) =>
                    total + goal.xp,
                0
            );

    }


    /* =====================================================
            ESCAPE HTML
    ===================================================== */

    function escapeHTML(text) {

        const div =
            document.createElement(
                "div"
            );

        div.textContent = text;

        return div.innerHTML;

    }


    /* =====================================================
            RENDER DAILY GOALS
    ===================================================== */

    function renderGoals() {

        if (!goalList) return;


        goalList.innerHTML = "";


        /* ---------- Empty State ---------- */

        if (
            dailyGoals.length === 0
        ) {

            goalList.innerHTML = `

                <li class="empty-goals">

                    <div>

                        <i class="fa-solid fa-bullseye"></i>

                        <span>
                            No goals added yet.
                        </span>

                    </div>

                </li>

            `;

        }


        /* ---------- Goals ---------- */

        dailyGoals.forEach(
            goal => {

                const li =
                    document.createElement(
                        "li"
                    );


                li.className =
                    goal.completed
                        ? "completed"
                        : "";


                li.dataset.id =
                    goal.id;


                li.innerHTML = `

                        <input
                            type="checkbox"
                            class="goal-checkbox"
                            ${goal.completed ? "checked disabled" : ""}
                        >

                        <div class="goal-content">

                            <div class="goal-title">
                                ${escapeHTML(goal.title)}
                            </div>

                            <div class="goal-meta">

                                <span class="goal-category">
                                    ${escapeHTML(goal.category)}
                                </span>

                                <span class="goal-difficulty ${goal.difficulty.toLowerCase()}">
                                    ${goal.difficulty}
                                </span>

                                <span class="goal-time">
                                    ${goal.estimatedTime} min
                                </span>

                            </div>

                        </div>

                        <div class="goal-xp">
                            +${goal.xp} XP
                        </div>

                        <button
                            type="button"
                            class="goal-menu-btn"
                            title="Goal options"
                        >
                            <i class="fa-solid fa-ellipsis-vertical"></i>
                        </button>

                    `;


                const checkbox =
                    li.querySelector(
                        ".goal-checkbox"
                    );

                const menuBtn =
                    li.querySelector(".goal-menu-btn");

                if (menuBtn) {

                    menuBtn.addEventListener(
                        "click",
                        event => {

                            event.stopPropagation();

                            showGoalMenu(
                                goal,
                                menuBtn
                            );

                        }
                    );

                }


                if (checkbox) {

                    checkbox.addEventListener(
                        "change",
                        () => {

                            completeGoal(
                                goal.id
                            );

                        }
                    );

                }


                goalList.appendChild(
                    li
                );

            }
        );


        updateGoalProgress();

    }

/* =====================================================
        GOAL OPTIONS MENU
===================================================== */

function showGoalMenu(goal, button) {

    /* Remove existing menu */

    const existingMenu =
        document.querySelector(
            ".goal-options-menu"
        );

    if (existingMenu) {

        existingMenu.remove();

    }


    /* Completed goals */

    if (goal.completed) {

        showToast(
            "🔒 Completed goals are locked."
        );

        return;

    }


    /* Create menu */

    const menu =
        document.createElement("div");

    menu.className =
        "goal-options-menu";


    menu.innerHTML = `

        <button
            type="button"
            class="edit-goal-option"
        >
            <i class="fa-solid fa-pen"></i>
            Edit
        </button>

        <button
            type="button"
            class="delete-goal-option"
        >
            <i class="fa-solid fa-trash"></i>
            Delete
        </button>

    `;


    document.body.appendChild(menu);


    /* Position menu */

    const rect =
        button.getBoundingClientRect();

    menu.style.top =
        `${rect.bottom + window.scrollY + 5}px`;

    menu.style.left =
        `${rect.right + window.scrollX - 130}px`;


    /* Edit */

    const editBtn =
        menu.querySelector(
            ".edit-goal-option"
        );

    editBtn.addEventListener(
        "click",
        () => {

            menu.remove();

            editGoal(goal);

        }
    );


    /* Delete */

    const deleteBtn =
        menu.querySelector(
            ".delete-goal-option"
        );

    deleteBtn.addEventListener(
        "click",
        () => {

            menu.remove();

            deleteGoal(goal.id);

        }
    );


    /* Close menu */

    setTimeout(() => {

        document.addEventListener(
            "click",
            function closeMenu(event) {

                if (
                    !menu.contains(
                        event.target
                    )
                ) {

                    menu.remove();

                    document.removeEventListener(
                        "click",
                        closeMenu
                    );

                }

            }
        );

    }, 0);

}

/* =====================================================
        EDIT GOAL
===================================================== */

function editGoal(goal) {

    const titleInput =
        document.getElementById(
            "goalTitle"
        );

    const categoryInput =
        document.getElementById(
            "goalCategory"
        );

    const difficultyInput =
        document.getElementById(
            "goalDifficulty"
        );

    const timeInput =
        document.getElementById(
            "goalTime"
        );

    const goalModalTitle =
        document.getElementById(
            "goalModalTitle"
        );

    const saveGoalBtn =
        document.getElementById(
            "saveGoalBtn"
        );


    if (!titleInput) return;


    /* Fill form */

    titleInput.value =
        goal.title;

    categoryInput.value =
        goal.category;

    difficultyInput.value =
        goal.difficulty;

    timeInput.value =
        goal.estimatedTime;


    /* Update XP preview */

    const reward =
        GOAL_XP[
            goal.difficulty
        ] || 0;

    if (goalXPPreview) {

        goalXPPreview.textContent =
            `${reward} XP`;

    }


    /* Change modal title */

    if (goalModalTitle) {

        goalModalTitle.textContent =
            "✏️ Edit Daily Goal";

    }


    if (saveGoalBtn) {

        saveGoalBtn.innerHTML = `
            <i class="fa-solid fa-check"></i>
            Save Changes
        `;

    }


    openGoalModal();


    /* ---------- Temporary Edit State ---------- */

    goalForm.dataset.editingId =
        goal.id;

}
/* =====================================================
        DELETE GOAL
===================================================== */


async function deleteGoal(goalId) {
    const goal = dailyGoals.find(
        item => Number(item.id) === Number(goalId)
    );

    if (!goal) return;

    if (goal.completed) {
        showToast("🔒 Completed goals cannot be deleted.");
        return;
    }

    if (!confirm(`Delete "${goal.title}"?`)) {
        return;
    }

    try {
        await goalsAPI(`/api/goals/${goalId}`, {
            method: "DELETE"
        });

        await fetchDailyGoals();
        showToast("🗑️ Goal deleted successfully!");

    } catch (error) {
        console.error("Goal delete failed:", error);
        showToast(`⚠️ ${error.message}`);
    }
}



    /* =====================================================
            COMPLETE GOAL
    ===================================================== */

    
async function completeGoal(goalId) {
    const goal = dailyGoals.find(
        item => Number(item.id) === Number(goalId)
    );

    if (!goal || goal.completed) return;

    try {
        const data = await goalsAPI(
            `/api/goals/${goalId}/complete`,
            {
                method: "POST",
                body: JSON.stringify({})
            }
        );

        // Backend has awarded XP and saved completion.
        await fetchDailyGoals();

        // Sync dashboard XP only when the API returns total XP.
        const totalXP = data.totalXP ?? data.total_xp;

        if (typeof totalXP === "number") {
            const XP_PER_LEVEL = 3000;

            xp = totalXP % XP_PER_LEVEL;
            currentLevel = Math.floor(totalXP / XP_PER_LEVEL) + 1;

            renderXP();
        }

        showToast(`⭐ +${goal.xp} XP Earned!`);

        if (typeof unlockAchievement === "function") {
            unlockAchievement(`Completed: ${goal.title}`);
        }

    } catch (error) {
        console.error("Goal completion failed:", error);
        showToast(`⚠️ ${error.message}`);

        // Restore checkbox state if the API request fails.
        fetchDailyGoals();
    }
}



    /* =====================================================
            UPDATE GOAL PROGRESS
    ===================================================== */

    function updateGoalProgress() {

        const totalGoals =
            dailyGoals.length;


        const completedGoals =
            dailyGoals.filter(
                goal =>
                    goal.completed
            ).length;


        let percentage = 0;


        if (totalGoals > 0) {

            percentage =
                Math.round(
                    (
                        completedGoals /
                        totalGoals
                    ) * 100
                );

        }


        if (goalProgressText) {

            goalProgressText.textContent =
                `${completedGoals} / ${totalGoals} Completed`;

        }


        if (
            goalProgressPercentage
        ) {

            goalProgressPercentage.textContent =
                `${percentage}%`;

        }


        if (goalProgressFill) {

            goalProgressFill.style.width =
                `${percentage}%`;

        }


        if (todayXPElement) {

            todayXPElement.textContent =
                calculateTodayXP();

        }

    }


    /* =====================================================
            INITIAL GOAL RENDER
    ===================================================== */

    renderGoals();


    /* =====================================================
            ADD GOAL BUTTON
    ===================================================== */
    /* =====================================================
        GOAL MODAL
===================================================== */

const goalModal =
    document.getElementById("goalModal");

const closeGoalModal =
    document.getElementById("closeGoalModal");

const cancelGoalBtn =
    document.getElementById("cancelGoalBtn");

const goalForm =
    document.getElementById("goalForm");

const goalDifficulty =
    document.getElementById("goalDifficulty");

const goalXPPreview =
    document.getElementById("goalXPPreview");


/* ---------- Open Modal ---------- */

function openGoalModal() {

    if (!goalModal) return;

    goalModal.classList.add("show");

}


/* ---------- Close Modal ---------- */

function closeGoalModalFunction() {

    if (!goalModal) return;

    goalModal.classList.remove("show");

}


/* ---------- Add Goal Button ---------- */

if (addGoalBtn) {

    addGoalBtn.addEventListener(
        "click",
        () => {

            openGoalModal();

        }
    );

}


/* ---------- Edit Button ---------- */

if (editGoalsBtn) {

    editGoalsBtn.addEventListener(
        "click",
        () => {

            openGoalModal();

        }
    );

}


/* ---------- Close Buttons ---------- */

if (closeGoalModal) {

    closeGoalModal.addEventListener(
        "click",
        closeGoalModalFunction
    );

}


if (cancelGoalBtn) {

    cancelGoalBtn.addEventListener(
        "click",
        closeGoalModalFunction
    );

}


/* ---------- Click Outside ---------- */

if (goalModal) {

    goalModal.addEventListener(
        "click",
        event => {

            if (
                event.target === goalModal
            ) {

                closeGoalModalFunction();

            }

        }
    );

}


/* ---------- Escape Key ---------- */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            goalModal &&
            goalModal.classList.contains("show")
        ) {

            closeGoalModalFunction();

        }

    }
);


/* ---------- XP Preview ---------- */
/* =====================================================
        CREATE DAILY GOAL
===================================================== */


if (goalForm) {
    goalForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const titleInput = document.getElementById("goalTitle");
        const categoryInput = document.getElementById("goalCategory");
        const difficultyInput = document.getElementById("goalDifficulty");
        const timeInput = document.getElementById("goalTime");

        const title = titleInput.value.trim();
        const category = categoryInput.value;
        const difficulty = difficultyInput.value;
        const estimatedTime = parseInt(timeInput.value, 10) || 0;

        // Validate form
        if (!title) {
            showToast("⚠️ Please enter a goal.");
            titleInput.focus();
            return;
        }

        if (!category) {
            showToast("⚠️ Please select a category.");
            categoryInput.focus();
            return;
        }

        if (!difficulty || !GOAL_XP[difficulty]) {
            showToast("⚠️ Please select a valid difficulty.");
            difficultyInput.focus();
            return;
        }

        const editingId = goalForm.dataset.editingId;

        try {
            const payload = {
                title,
                category,
                difficulty,
                estimatedTime
            };

            if (editingId) {
                // Update existing goal in database
                await goalsAPI(`/api/goals/${editingId}`, {
                    method: "PUT",
                    body: JSON.stringify(payload)
                });

                showToast("✅ Goal updated successfully!");
            } else {
                // Create new goal in database
                await goalsAPI("/api/goals", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });

                showToast("🎯 Goal added successfully!");
            }

            // Reload the latest database data
            await fetchDailyGoals();

            // Reset form and editing state
            goalForm.reset();
            delete goalForm.dataset.editingId;

            if (goalXPPreview) {
                goalXPPreview.textContent = "0 XP";
            }

            const goalModalTitle =
                document.getElementById("goalModalTitle");

            if (goalModalTitle) {
                goalModalTitle.textContent = "🎯 Create Daily Goal";
            }

            const saveGoalBtn =
                document.getElementById("saveGoalBtn");

            if (saveGoalBtn) {
                saveGoalBtn.innerHTML = `
                    <i class="fa-solid fa-plus"></i>
                    Add Goal
                `;
            }

            closeGoalModalFunction();

        } catch (error) {
            console.error("Goal save failed:", error);
            showToast(`⚠️ ${error.message}`);
        }
    });
}




    /* =====================================================
            EDIT GOALS BUTTON
    ===================================================== */

    if (editGoalsBtn) {

        editGoalsBtn.addEventListener(
            "click",
            () => {

                showToast(
                    "✏️ Goal editor coming next!"
                );

            }
        );

    }


    /* =====================================================
            STREAK
    ===================================================== */

    const streakElement =
        document.querySelector(
            ".streak"
        );

    if (streakElement) {

        let streak =
            parseInt(
                localStorage.getItem(
                    "streak"
                )
            ) || 1;

        streakElement.textContent =
            `🔥 ${streak} Day Streak`;

    }


    /* =====================================================
            HEATMAP
    ===================================================== */

    const heatmapBoxes =
        document.querySelectorAll(
            ".heatmap .box"
        );

    heatmapBoxes.forEach(
        box => {

            box.addEventListener(
                "click",
                () => {

                    box.classList.toggle(
                        "active"
                    );

                }
            );

        }
    );


    /* =====================================================
            AI CAREER COACH
    ===================================================== */

    const aiButton =
        document.getElementById(
            "aiCoachBtn"
        );

    const aiResponse =
        document.getElementById(
            "aiResponse"
        );

    if (
        aiButton &&
        aiResponse
    ) {

        aiButton.addEventListener(
            "click",
            () => {

                aiResponse.textContent =
                    "Based on your current progress, focus on DSA, projects and consistent daily practice.";

            }
        );

    }


    /* =====================================================
            PROFILE / SETTINGS
    ===================================================== */

    const settingsBtn =
        document.getElementById(
            "settingsBtn"
        );

    const settingsModal =
        document.getElementById(
            "settingsModal"
        );

    const closeSettings =
        document.getElementById(
            "closeSettings"
        );


    if (
        settingsBtn &&
        settingsModal
    ) {

        settingsBtn.addEventListener(
            "click",
            () => {

                settingsModal.classList.add(
                    "show"
                );

            }
        );

    }


    if (
        closeSettings &&
        settingsModal
    ) {

        closeSettings.addEventListener(
            "click",
            () => {

                settingsModal.classList.remove(
                    "show"
                );

            }
        );

    }


    /* =====================================================
            BADGES
    ===================================================== */

    const badgeElements =
        document.querySelectorAll(
            ".badge"
        );

    badgeElements.forEach(
        badge => {

            badge.addEventListener(
                "click",
                () => {

                    showToast(
                        "🏆 Badge unlocked!"
                    );

                }
            );

        }
    );


    /* =====================================================
            SMART NOTIFICATION
    ===================================================== */

    setTimeout(() => {

        if (
            dailyGoals.length === 0
        ) {

            showToast(
                "🎯 Create your first daily goal!"
            );

        }

    }, 1500);


    /* =====================================================
            SYNC BUTTONS
    ===================================================== */

    const syncButtons =
        document.querySelectorAll(
            ".sync-btn"
        );

    syncButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    showToast(
                        "🔄 Syncing..."
                    );

                }
            );

        }
    );


    /* =====================================================
            XP HISTORY
    ===================================================== */

    const xpHistory =
        document.getElementById(
            "xpHistory"
        );

    if (xpHistory) {

        const savedXPHistory =
            JSON.parse(
                localStorage.getItem(
                    "xpHistory"
                )
            ) || [];

        savedXPHistory
            .slice(-10)
            .reverse()
            .forEach(
                item => {

                    const element =
                        document.createElement(
                            "div"
                        );

                    element.className =
                        "xp-history-item";

                    element.textContent =
                        `${item.description} +${item.xp} XP`;

                    xpHistory.appendChild(
                        element
                    );

                }
            );

    }


    /* =====================================================
            ANALYTICS
    ===================================================== */

    const analyticsCards =
        document.querySelectorAll(
            ".analytics-card"
        );

    analyticsCards.forEach(
        card => {

            card.addEventListener(
                "click",
                () => {

                    card.classList.toggle(
                        "active"
                    );

                }
            );

        }
    );


    /* =====================================================
            MOBILE SIDEBAR
    ===================================================== */

    const menuToggle =
        document.getElementById(
            "menuToggle"
        );

    const sidebar =
        document.getElementById(
            "sidebar"
        );


    if (
        menuToggle &&
        sidebar
    ) {

        menuToggle.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                sidebar.classList.toggle(
                    "active"
                );

            }
        );


        document.addEventListener(
            "click",
            event => {

                if (
                    window.innerWidth <= 992 &&
                    sidebar.classList.contains(
                        "active"
                    ) &&
                    !sidebar.contains(
                        event.target
                    ) &&
                    event.target !== menuToggle
                ) {

                    sidebar.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    /* =====================================================
            FINAL INITIALIZATION
    ===================================================== */

    renderXP();
    fetchDailyGoals();

});