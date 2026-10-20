
/* =========================================================
   CampusForge — GD Arena
   File: static/js/gd/gd_arena.js
   Frontend-only implementation
   ========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    // -----------------------------------------------------
    // 1. Topic data
    // Later, this array can be replaced by a Flask API.
    // -----------------------------------------------------

    const topics = [
        {
            id: 1,
            title: "Is Artificial Intelligence a Threat to Jobs?",
            category: "Technology",
            difficulty: "Beginner",
            duration: 10,
            description: "Discuss how AI is changing the workplace, creating opportunities, and affecting traditional roles.",
            prompt: "Will AI replace human workers, or will it create more opportunities than it removes?"
        },
        {
            id: 2,
            title: "Should Social Media Have Age Restrictions?",
            category: "Society",
            difficulty: "Beginner",
            duration: 8,
            description: "Explore digital safety, privacy, freedom, and the effects of social media on young people.",
            prompt: "How can society protect young users without unnecessarily restricting access to information?"
        },
        {
            id: 3,
            title: "Online Education vs Traditional Education",
            category: "Education",
            difficulty: "Beginner",
            duration: 10,
            description: "Compare flexibility, accessibility, classroom interaction, and learning outcomes.",
            prompt: "Which approach provides better learning outcomes, and can a hybrid model work better?"
        },
        {
            id: 4,
            title: "Startups vs Established Companies",
            category: "Business",
            difficulty: "Intermediate",
            duration: 12,
            description: "Compare career growth, stability, learning opportunities, and workplace culture.",
            prompt: "Where should a fresh graduate begin their career, and what factors matter most?"
        },
        {
            id: 5,
            title: "Is Social Media Making Us Less Social?",
            category: "Society",
            difficulty: "Beginner",
            duration: 8,
            description: "Discuss online relationships, loneliness, communication habits, and real-world connections.",
            prompt: "Does digital connectivity strengthen relationships or weaken face-to-face communication?"
        },
        {
            id: 6,
            title: "Should Coding Be Mandatory in Schools?",
            category: "Education",
            difficulty: "Intermediate",
            duration: 10,
            description: "Examine digital literacy, computational thinking, curriculum pressure, and equal access.",
            prompt: "Should every student learn programming, or should it remain an optional subject?"
        },
        {
            id: 7,
            title: "Can India Become a Global AI Leader?",
            category: "Technology",
            difficulty: "Intermediate",
            duration: 12,
            description: "Discuss talent, infrastructure, research, investment, and responsible AI development.",
            prompt: "What are India's biggest opportunities and obstacles in the global AI race?"
        },
        {
            id: 8,
            title: "Work From Home vs Work From Office",
            category: "Business",
            difficulty: "Beginner",
            duration: 8,
            description: "Consider productivity, teamwork, commuting, work-life boundaries, and company culture.",
            prompt: "Which work model is best for employees, employers, and long-term collaboration?"
        },
        {
            id: 9,
            title: "Is Climate Change the Biggest Global Challenge?",
            category: "Environment",
            difficulty: "Intermediate",
            duration: 12,
            description: "Discuss environmental responsibility, economic development, and global cooperation.",
            prompt: "How should governments balance economic growth with environmental protection?"
        },
        {
            id: 10,
            title: "Should College Attendance Be Mandatory?",
            category: "Education",
            difficulty: "Beginner",
            duration: 8,
            description: "Explore discipline, independent learning, practical skills, and academic flexibility.",
            prompt: "Should students be judged by attendance or by demonstrated learning and performance?"
        },
        {
            id: 11,
            title: "Cashless Economy: Opportunity or Risk?",
            category: "Business",
            difficulty: "Intermediate",
            duration: 10,
            description: "Examine convenience, financial inclusion, cybercrime, privacy, and digital infrastructure.",
            prompt: "Can a cashless economy work fairly for people with different levels of digital access?"
        },
        {
            id: 12,
            title: "Should Smartphones Be Banned in Classrooms?",
            category: "Education",
            difficulty: "Beginner",
            duration: 8,
            description: "Consider distraction, educational applications, emergency access, and classroom discipline.",
            prompt: "How can schools reduce distraction while allowing useful technology?"
        },
        {
            id: 13,
            title: "Electric Vehicles vs Petrol Vehicles",
            category: "Environment",
            difficulty: "Intermediate",
            duration: 10,
            description: "Compare emissions, purchase costs, charging infrastructure, and battery production.",
            prompt: "What needs to change for electric vehicles to become a practical option for more people?"
        },
        {
            id: 14,
            title: "Should Companies Prioritize Skills Over Degrees?",
            category: "Business",
            difficulty: "Intermediate",
            duration: 12,
            description: "Discuss formal education, portfolios, practical experience, and fair hiring practices.",
            prompt: "How should employers evaluate candidates who have skills but lack a traditional degree?"
        },
        {
            id: 15,
            title: "Is Privacy Possible in the Digital Age?",
            category: "Technology",
            difficulty: "Advanced",
            duration: 15,
            description: "Examine data collection, personalization, surveillance, consent, and digital rights.",
            prompt: "What responsibility should individuals, companies, and governments have for protecting privacy?"
        },
        {
            id: 16,
            title: "Failure Is the First Step Towards Success",
            category: "Abstract",
            difficulty: "Beginner",
            duration: 8,
            description: "Discuss resilience, learning from mistakes, risk-taking, and different definitions of success.",
            prompt: "Does failure always teach valuable lessons, or does its value depend on how we respond?"
        },
        {
            id: 17,
            title: "The World Without the Internet",
            category: "Abstract",
            difficulty: "Intermediate",
            duration: 10,
            description: "Imagine how education, business, relationships, and public services would change.",
            prompt: "Would society adapt successfully, or would the loss of connectivity create greater problems?"
        },
        {
            id: 18,
            title: "Should Companies Adopt a Four-Day Workweek?",
            category: "Business",
            difficulty: "Advanced",
            duration: 12,
            description: "Evaluate productivity, employee wellbeing, operating costs, and industry-specific limitations.",
            prompt: "Can a shorter workweek improve productivity without increasing workloads or reducing service quality?"
        }
    ];

    // -----------------------------------------------------
    // 2. DOM references
    // -----------------------------------------------------

    const $ = (selector) => document.querySelector(selector);

    const topicGrid = $("#topicGrid");
    const topicSearch = $("#topicSearch");
    const difficultyFilter = $("#difficultyFilter");
    const categoryFilters = $("#categoryFilters");
    const visibleTopicsCount = $("#visibleTopicsCount");
    const availableTopicsCount = $("#availableTopicsCount");
    const emptyTopicsState = $("#emptyTopicsState");

    const workspace = $("#practiceWorkspace");
    const activeTopicTitle = $("#activeTopicTitle");
    const activeTopicDescription = $("#activeTopicDescription");
    const activeTopicCategory = $("#activeTopicCategory");
    const activeTopicDifficulty = $("#activeTopicDifficulty");
    const activeTopicPrompt = $("#activeTopicPrompt");

    const openingNotes = $("#openingNotes");
    const argumentNotes = $("#argumentNotes");
    const conclusionNotes = $("#conclusionNotes");

    const timerDisplay = $("#timerDisplay");
    const timerStatus = $("#timerStatus");
    const timerStartBtn = $("#timerStartBtn");
    const timerResetBtn = $("#timerResetBtn");

    const evaluationDialog = $("#evaluationDialog");
    const evaluationForm = $("#evaluationForm");
    const evaluationTopicName = $("#evaluationTopicName");
    const reflectionNotes = $("#reflectionNotes");

    const historyList = $("#historyList");
    const emptyHistoryState = $("#emptyHistoryState");
    const gdToast = $("#gdToast");

    // -----------------------------------------------------
    // 3. State
    // -----------------------------------------------------

    const STORAGE_KEY = "campusforge_gd_sessions_v1";

    let activeTopic = null;
    let activeCategory = "all";
    let elapsedSeconds = 0;
    let timerInterval = null;
    let sessionStarted = false;
    let pendingSession = null;
    let toastTimeout = null;

    // -----------------------------------------------------
    // 4. Safe local storage
    // -----------------------------------------------------

    
let sessions = [];
let historyLoaded = false;

async function loadHistory() {
    try {
        const response = await fetch("/api/gd/sessions", {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error(`Could not load history (${response.status})`);
        }

        const data = await response.json();
        sessions = Array.isArray(data.sessions) ? data.sessions : [];
        historyLoaded = true;

        renderHistory();
        renderStats();
    } catch (error) {
        console.error("Could not load GD session history:", error);
        showToast("Could not load saved history. Please refresh and try again.");
    }
}

async function saveSessionToServer(sessionData) {
    const response = await fetch("/api/gd/sessions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify(sessionData)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || "Could not save the GD session.");
    }

    return data.session;
}


    // -----------------------------------------------------
    // 5. Utility functions
    // -----------------------------------------------------

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (character) => {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[character];
        });
    }

    function formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return (
            String(minutes).padStart(2, "0") +
            ":" +
            String(seconds).padStart(2, "0")
        );
    }

    function formatDate(dateValue) {
        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "Unknown date";
        }

        return date.toLocaleString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function showToast(message) {
        gdToast.textContent = message;
        gdToast.classList.add("visible");

        window.clearTimeout(toastTimeout);

        toastTimeout = window.setTimeout(() => {
            gdToast.classList.remove("visible");
        }, 3200);
    }

    function getDifficultyClass(difficulty) {
        return difficulty.toLowerCase();
    }

    // -----------------------------------------------------
    // 6. Render topic cards
    // -----------------------------------------------------

    function getFilteredTopics() {
        const searchTerm = topicSearch.value.trim().toLowerCase();
        const selectedDifficulty = difficultyFilter.value;

        return topics.filter((topic) => {
            const matchesCategory =
                activeCategory === "all" ||
                topic.category === activeCategory;

            const matchesDifficulty =
                selectedDifficulty === "all" ||
                topic.difficulty === selectedDifficulty;

            const searchableText = [
                topic.title,
                topic.category,
                topic.difficulty,
                topic.description,
                topic.prompt
            ].join(" ").toLowerCase();

            const matchesSearch = searchableText.includes(searchTerm);

            return matchesCategory && matchesDifficulty && matchesSearch;
        });
    }

    function renderTopics() {
        const filteredTopics = getFilteredTopics();

        visibleTopicsCount.textContent = filteredTopics.length;
        availableTopicsCount.textContent = topics.length;

        topicGrid.innerHTML = filteredTopics.map((topic) => `
            <article class="gd-topic-card">
                <div class="gd-topic-card-top">
                    <span class="gd-topic-category">
                        ${escapeHTML(topic.category)}
                    </span>

                    <span class="gd-difficulty ${getDifficultyClass(topic.difficulty)}">
                        ${escapeHTML(topic.difficulty)}
                    </span>
                </div>

                <h3>${escapeHTML(topic.title)}</h3>

                <p>${escapeHTML(topic.description)}</p>

                <div class="gd-topic-card-bottom">
                    <span class="gd-topic-duration">
                        <i class="fa-regular fa-clock"></i>
                        ${topic.duration} min target
                    </span>

                    <button
                        class="gd-topic-start"
                        type="button"
                        data-topic-id="${topic.id}">
                        Practice <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </article>
        `).join("");

        emptyTopicsState.hidden = filteredTopics.length !== 0;
        topicGrid.hidden = filteredTopics.length === 0;
    }

    // -----------------------------------------------------
    // 7. Topic filters and search
    // -----------------------------------------------------

    topicSearch.addEventListener("input", renderTopics);
    difficultyFilter.addEventListener("change", renderTopics);

    categoryFilters.addEventListener("click", (event) => {
        const button = event.target.closest("[data-category]");

        if (!button) {
            return;
        }

        activeCategory = button.dataset.category;

        categoryFilters.querySelectorAll("[data-category]").forEach((item) => {
            const isActive = item === button;

            item.classList.toggle("active", isActive);
            item.setAttribute("aria-pressed", String(isActive));
        });

        renderTopics();
    });

    $("#clearFiltersBtn").addEventListener("click", () => {
        topicSearch.value = "";
        difficultyFilter.value = "all";
        activeCategory = "all";

        categoryFilters.querySelectorAll("[data-category]").forEach((item) => {
            const isActive = item.dataset.category === "all";

            item.classList.toggle("active", isActive);
            item.setAttribute("aria-pressed", String(isActive));
        });

        renderTopics();
    });

    // -----------------------------------------------------
    // 8. Start a topic
    // -----------------------------------------------------

    function startTopic(topicId) {
        const selectedTopic = topics.find(
            (topic) => topic.id === Number(topicId)
        );

        if (!selectedTopic) {
            showToast("Topic not found. Please choose another topic.");
            return;
        }

        if (activeTopic && sessionStarted) {
            const shouldSwitch = window.confirm(
                "Switching topics will discard the current unsaved session. Continue?"
            );

            if (!shouldSwitch) {
                return;
            }
        }

        stopTimer();

        activeTopic = selectedTopic;
        elapsedSeconds = 0;
        sessionStarted = false;
        pendingSession = null;

        activeTopicTitle.textContent = selectedTopic.title;
        activeTopicDescription.textContent = selectedTopic.description;
        activeTopicCategory.textContent = selectedTopic.category;
        activeTopicDifficulty.textContent = selectedTopic.difficulty;
        activeTopicPrompt.textContent = selectedTopic.prompt;

        openingNotes.value = "";
        argumentNotes.value = "";
        conclusionNotes.value = "";
        reflectionNotes.value = "";

        evaluationForm.reset();

        timerDisplay.textContent = formatTime(elapsedSeconds);
        timerStatus.textContent = "Ready when you are";
        timerStartBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';

        workspace.hidden = false;

        workspace.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    topicGrid.addEventListener("click", (event) => {
        const button = event.target.closest("[data-topic-id]");

        if (!button) {
            return;
        }

        startTopic(button.dataset.topicId);
    });

    $("#exploreTopicsBtn").addEventListener("click", () => {
        $("#topicsSection").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        window.setTimeout(() => topicSearch.focus(), 400);
    });

    $("#randomTopicBtn").addEventListener("click", () => {
        const pool = getFilteredTopics();

        if (pool.length === 0) {
            showToast("No matching topics. Clear the filters and try again.");
            return;
        }

        const randomTopic = pool[Math.floor(Math.random() * pool.length)];
        startTopic(randomTopic.id);
    });

    $("#closeWorkspaceBtn").addEventListener("click", () => {
        if (activeTopic && sessionStarted) {
            const shouldClose = window.confirm(
                "Close this workspace? Your unsaved notes and session will be lost."
            );

            if (!shouldClose) {
                return;
            }
        }

        stopTimer();
        workspace.hidden = true;
        activeTopic = null;
        sessionStarted = false;
        elapsedSeconds = 0;
    });

    // -----------------------------------------------------
    // 9. Session timer
    // -----------------------------------------------------

    function updateTimerDisplay() {
        timerDisplay.textContent = formatTime(elapsedSeconds);
    }

    function stopTimer() {
        if (timerInterval !== null) {
            window.clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function startTimer() {
        if (!activeTopic) {
            showToast("Choose a topic before starting your timer.");
            return;
        }

        if (timerInterval !== null) {
            stopTimer();
            timerStartBtn.innerHTML = '<i class="fa-solid fa-play"></i> Resume';
            timerStatus.textContent = "Timer paused";
            return;
        }

        sessionStarted = true;
        timerStatus.textContent = "Practice in progress";
        timerStartBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';

        timerInterval = window.setInterval(() => {
            elapsedSeconds += 1;
            updateTimerDisplay();
        }, 1000);
    }

    timerStartBtn.addEventListener("click", startTimer);

    timerResetBtn.addEventListener("click", () => {
        stopTimer();

        elapsedSeconds = 0;
        sessionStarted = false;

        updateTimerDisplay();
        timerStatus.textContent = "Timer reset";
        timerStartBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start';

        showToast("Timer reset. Your notes have been kept.");
    });

    // -----------------------------------------------------
    // 10. Complete a session and open evaluation
    // -----------------------------------------------------

    $("#completeSessionBtn").addEventListener("click", () => {
        if (!activeTopic) {
            showToast("Choose a topic first.");
            return;
        }

        stopTimer();

        timerStartBtn.innerHTML = '<i class="fa-solid fa-play"></i> Resume';
        timerStatus.textContent = "Session ready for review";

        pendingSession = {
            topicId: activeTopic.id,
            topicTitle: activeTopic.title,
            category: activeTopic.category,
            difficulty: activeTopic.difficulty,
            durationSeconds: elapsedSeconds,
            openingNotes: openingNotes.value.trim(),
            argumentNotes: argumentNotes.value.trim(),
            conclusionNotes: conclusionNotes.value.trim(),
            completedAt: new Date().toISOString()
        };

        evaluationTopicName.textContent =
            `Topic: ${activeTopic.title} · Practice time: ${formatTime(elapsedSeconds)}`;

        reflectionNotes.value = "";

        if (typeof evaluationDialog.showModal === "function") {
            evaluationDialog.showModal();
        } else {
            showToast("Your browser does not support the evaluation dialog.");
        }
    });

    // -----------------------------------------------------
    // 11. Save evaluation
    // -----------------------------------------------------

    function closeEvaluationDialog() {
        if (evaluationDialog.open) {
            evaluationDialog.close();
        }
    }

    $("#closeEvaluationBtn").addEventListener("click", closeEvaluationDialog);
    $("#cancelEvaluationBtn").addEventListener("click", closeEvaluationDialog);

    
    evaluationForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!pendingSession) {
            closeEvaluationDialog();
            showToast("No active session to save.");
            return;
        }

        const selectedRating = evaluationForm.querySelector(
            'input[name="rating"]:checked'
        );

        if (!selectedRating) {
            showToast("Please select a performance rating.");
            return;
        }

        const completedSession = {
            ...pendingSession,
            rating: Number(selectedRating.value),
            reflection: reflectionNotes.value.trim()
        };

        const submitButton = evaluationForm.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
        }

        try {
            const savedSession = await saveSessionToServer(completedSession);

            sessions.unshift(savedSession);
            sessions = sessions.slice(0, 100);

            closeEvaluationDialog();

            pendingSession = null;
            activeTopic = null;
            sessionStarted = false;
            elapsedSeconds = 0;

            workspace.hidden = true;

            renderHistory();
            renderStats();

            showToast("Session saved successfully!");

            $("#historySection").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        } catch (error) {
            console.error("Could not save GD session:", error);
            showToast(error.message || "Could not save session. Please try again.");
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });


    // -----------------------------------------------------
    // 12. Render session history
    // -----------------------------------------------------

    function renderHistory() {
        emptyHistoryState.hidden = sessions.length > 0;
        historyList.hidden = sessions.length === 0;

        historyList.innerHTML = sessions.map((session) => {
            const minutes = Math.floor(
                Math.max(0, Number(session.durationSeconds) || 0) / 60
            );

            const rating = Math.min(
                5,
                Math.max(1, Number(session.rating) || 1)
            );

            return `
                <article class="gd-history-item">
                    <div class="gd-history-icon">
                        <i class="fa-solid fa-check"></i>
                    </div>

                    <div class="gd-history-details">
                        <h3>${escapeHTML(session.topicTitle)}</h3>
                        <p>
                            ${escapeHTML(session.category || "General")}
                            · ${escapeHTML(session.difficulty || "Beginner")}
                            · ${minutes} min
                            · ${escapeHTML(formatDate(session.completedAt))}
                        </p>
                        ${
                            session.reflection
                                ? `<p>${escapeHTML(session.reflection)}</p>`
                                : ""
                        }
                    </div>

                    <div class="gd-history-rating"
                         aria-label="Self-rating ${rating} out of 5">
                        <i class="fa-solid fa-star"></i>
                        ${rating}/5
                    </div>
                </article>
            `;
        }).join("");
    }

    // -----------------------------------------------------
    // 13. Update stats
    // -----------------------------------------------------

    function renderStats() {
        availableTopicsCount.textContent = topics.length;
        $("#completedSessionsCount").textContent = sessions.length;

        const totalMinutes = sessions.reduce((total, session) => {
            return total +
                Math.floor(
                    Math.max(0, Number(session.durationSeconds) || 0) / 60
                );
        }, 0);

        $("#practiceMinutesCount").textContent = totalMinutes;

        if (sessions.length === 0) {
            $("#averageRating").textContent = "—";
            return;
        }

        const average = sessions.reduce((total, session) => {
            return total + Math.min(
                5,
                Math.max(1, Number(session.rating) || 1)
            );
        }, 0) / sessions.length;

        $("#averageRating").textContent = average.toFixed(1);
    }

    // -----------------------------------------------------
    // 14. Clear history
    // -----------------------------------------------------

    
    $("#clearHistoryBtn").addEventListener("click", async () => {
        if (sessions.length === 0) {
            showToast("There is no session history to clear.");
            return;
        }

        const confirmed = window.confirm(
            "Delete all your GD practice history? This cannot be undone."
        );

        if (!confirmed) {
            return;
        }

        const clearButton = $("#clearHistoryBtn");
        clearButton.disabled = true;

        try {
            const response = await fetch("/api/gd/sessions", {
                method: "DELETE",
                headers: {
                    "Accept": "application/json"
                },
                credentials: "same-origin"
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.error || "Could not clear GD history.");
            }

            sessions = [];

            renderHistory();
            renderStats();

            showToast("GD practice history cleared.");
        } catch (error) {
            console.error("Could not clear GD history:", error);
            showToast(error.message || "Could not clear history. Please try again.");
        } finally {
            clearButton.disabled = false;
        }
    });


    // -----------------------------------------------------
    // 15. Initialize
    // -----------------------------------------------------

    categoryFilters.querySelectorAll("[data-category]").forEach((button) => {
        button.setAttribute(
            "aria-pressed",
            String(button.dataset.category === "all")
        );
    });

    renderTopics();
    renderHistory();
    renderStats();
    loadHistory();
});
