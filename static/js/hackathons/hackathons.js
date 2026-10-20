
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("hackathonForm");
    const message = document.getElementById("formMessage");
    const list = document.getElementById("hackathonList");
    const submitButton = document.getElementById("submitHackathon");

    if (!form || !message || !list || !submitButton) {
        return;
    }

    function showMessage(text, isError = false) {
        message.textContent = text;
        message.style.color = isError ? "#ff9098" : "#42d6a4";
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function formatStatus(status) {
        return String(status || "pending")
            .replaceAll("_", " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    async function loadHackathons() {
        list.textContent = "Loading your hackathons...";

        try {
            const response = await fetch("/api/hackathons", {
                headers: { "Accept": "application/json" }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Could not load hackathons.");
            }

            const records = data.hackathons || [];

            if (records.length === 0) {
                list.innerHTML = `
                    <div class="empty-state">
                        <h3>No hackathons added yet</h3>
                        <p>Submit your first hackathon using the form above.</p>
                    </div>
                `;
                return;
            }

            list.innerHTML = records.map((item) => {
                const status = String(item.verification_status || "pending")
                    .toLowerCase();

                const safeStatus = ["pending", "approved", "rejected"].includes(status)
                    ? status
                    : "pending";

                const project = item.project_title
                    ? `<p><strong>Project:</strong> ${escapeHTML(item.project_title)}</p>`
                    : "";

                const organizer = item.organizer
                    ? `<p><strong>Organizer:</strong> ${escapeHTML(item.organizer)}</p>`
                    : "";

                const result = formatStatus(item.result);
                const xp = Number(item.xp_awarded) || 0;

                return `
                    <article class="hackathon-card">
                        <div class="hackathon-card-top">
                            <div>
                                <h3>${escapeHTML(item.event_name)}</h3>
                                ${organizer}
                                ${project}
                            </div>
                            <span class="status-badge ${safeStatus}">
                                ${escapeHTML(formatStatus(safeStatus))}
                            </span>
                        </div>
                        <p><strong>Result:</strong> ${escapeHTML(result)}</p>
                        <p><strong>Verified XP:</strong> ${xp}</p>
                    </article>
                `;
            }).join("");
        } catch (error) {
            list.textContent = error.message || "Unable to load your hackathons.";
        }
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!form.reportValidity()) {
            return;
        }

        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());

        payload.is_public = form.querySelector('[name="is_public"]').checked;

        submitButton.disabled = true;
        showMessage("Submitting your hackathon...");

        try {
            const response = await fetch("/api/hackathons", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Submission failed.");
            }

            showMessage(data.message || "Hackathon submitted successfully.");
            form.reset();
            await loadHackathons();
        } catch (error) {
            showMessage(error.message || "Something went wrong.", true);
        } finally {
            submitButton.disabled = false;
        }
    });

    loadHackathons();
});
