(function () {
    "use strict";

    var params = new URLSearchParams(window.location.search);
    var sessionId = params.get("session") || "demo";
    var password = params.get("password");

    var STALE_MS = 60 * 1000; // mark participant stale after 60s without heartbeat

    var participants = {}; // id -> { name, lastSeen }
    var taskCompletions = {}; // taskId -> Set of participantId
    var tasks = []; // { taskId, title }
    var heartbeatCount = 0; // anonymous heartbeats observed this dashboard session

    var el = {
        sessionName: document.getElementById("session-name"),
        statusDot: document.getElementById("status-dot"),
        statusText: document.getElementById("status-text"),
        heartbeatCount: document.getElementById("heartbeat-count"),
        participantList: document.getElementById("participant-list"),
        participantCount: document.getElementById("participant-count"),
        taskList: document.getElementById("task-list"),
        feedList: document.getElementById("feed-list"),
        celebration: document.getElementById("celebration"),
        celebrationText: document.getElementById("celebration-text")
    };

    el.sessionName.textContent = sessionId;

    function withPassword(url) {
        if (!password) {
            return url;
        }
        return url + (url.indexOf("?") === -1 ? "?" : "&") + "password=" + encodeURIComponent(password);
    }

    function api(path) {
        return withPassword("/sessions/" + encodeURIComponent(sessionId) + path);
    }

    function avatarUrl(participantId) {
        return api("/participants/" + encodeURIComponent(participantId) + "/avatar");
    }

    var EVENT_META = {
        "participant.connected": { icon: "👋", verb: "connected" },
        "participant.heartbeat": { icon: "💓", verb: "checked in" },
        "task.started": { icon: "▶️", verb: "started a task" },
        "task.completed": { icon: "✅", verb: "completed a task" },
        "chat.message.sent": { icon: "💬", verb: "said" },
        "checkpoint.passed": { icon: "🏁", verb: "passed a checkpoint" },
        "verification.failed": { icon: "⚠️", verb: "hit a verification failure" }
    };

    function setStatus(online, text) {
        el.statusDot.className = "dot " + (online ? "online" : "offline");
        el.statusText.textContent = text;
    }

    function escapeHtml(value) {
        if (value == null) {
            return "";
        }
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function taskTitle(taskId) {
        for (var i = 0; i < tasks.length; i++) {
            if (tasks[i].taskId === taskId) {
                return tasks[i].title;
            }
        }
        return taskId;
    }

    function renderParticipants() {
        var ids = Object.keys(participants);
        el.participantCount.textContent = ids.length;
        if (ids.length === 0) {
            el.participantList.innerHTML = '<li class="empty">Waiting for participants to connect…</li>';
            return;
        }
        var now = Date.now();
        ids.sort(function (a, b) {
            return participants[a].name.localeCompare(participants[b].name);
        });
        el.participantList.innerHTML = ids.map(function (id) {
            var p = participants[id];
            var stale = now - p.lastSeen > STALE_MS;
            return '<li>' +
                '<img class="pavatar" src="' + avatarUrl(id) + '" alt="" ' +
                'onerror="this.classList.add(&quot;missing&quot;)" />' +
                '<span class="pdot ' + (stale ? "stale" : "") + '"></span>' +
                '<span class="pname">' + escapeHtml(p.name) + '</span>' +
                '<span class="pmeta">' + (stale ? "idle" : "active") + '</span>' +
                '</li>';
        }).join("");
    }

    function renderTasks() {
        if (tasks.length === 0) {
            el.taskList.innerHTML = '<li class="empty">No tasks defined.</li>';
            return;
        }
        var total = Math.max(Object.keys(participants).length, 1);
        el.taskList.innerHTML = tasks.map(function (task) {
            var done = taskCompletions[task.taskId] ? taskCompletions[task.taskId].size : 0;
            var pct = Math.min(100, Math.round((done / total) * 100));
            return '<li>' +
                '<div class="task-head">' +
                '<span class="task-title">' + escapeHtml(task.title) + '</span>' +
                '<span class="task-count">' + done + " / " + total + '</span>' +
                '</div>' +
                '<div class="bar"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
                '</li>';
        }).join("");
    }

    function addFeedItem(item, prepend) {
        var meta = EVENT_META[item.eventType] || { icon: "•", verb: item.eventType };
        var name = item.displayName || "Someone";
        var detail = "";
        if (item.eventType === "chat.message.sent" && item.message) {
            detail = ' "' + escapeHtml(item.message) + '"';
        } else if (item.taskId) {
            detail = ": " + escapeHtml(taskTitle(item.taskId));
        } else if (item.message) {
            detail = " — " + escapeHtml(item.message);
        }
        var when = item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : "";
        var li = document.createElement("li");
        li.className = "type-" + item.eventType.replace(/\./g, "_");
        li.innerHTML =
            '<span class="feed-icon">' + meta.icon + '</span>' +
            '<div class="feed-body">' +
            '<div class="feed-line"><span class="feed-name">' + escapeHtml(name) + '</span> ' + meta.verb + detail + '</div>' +
            '<div class="feed-meta">' + when + '</div>' +
            '</div>';

        var emptyEl = el.feedList.querySelector(".empty");
        if (emptyEl) {
            emptyEl.remove();
        }
        if (prepend) {
            el.feedList.insertBefore(li, el.feedList.firstChild);
        } else {
            el.feedList.appendChild(li);
        }
        while (el.feedList.children.length > 100) {
            el.feedList.removeChild(el.feedList.lastChild);
        }
    }

    function applyEvent(item) {
        if (!item || !item.eventType) {
            return;
        }
        var id = item.participantId;
        var ts = item.timestamp ? new Date(item.timestamp).getTime() : Date.now();

        if (id) {
            if (!participants[id]) {
                participants[id] = { name: item.displayName || "Participant", lastSeen: ts };
            } else {
                if (item.displayName) {
                    participants[id].name = item.displayName;
                }
                participants[id].lastSeen = Math.max(participants[id].lastSeen, ts);
            }
        }

        if (item.eventType === "task.completed" && item.taskId && id) {
            if (!taskCompletions[item.taskId]) {
                taskCompletions[item.taskId] = new Set();
            }
            taskCompletions[item.taskId].add(id);
        }

        if (item.eventType === "checkpoint.passed") {
            celebrate((item.displayName || "A team") + " passed a checkpoint!");
        }
    }

    var celebrationTimer = null;
    function celebrate(text) {
        el.celebrationText.textContent = text;
        el.celebration.classList.remove("hidden");
        if (celebrationTimer) {
            clearTimeout(celebrationTimer);
        }
        celebrationTimer = setTimeout(function () {
            el.celebration.classList.add("hidden");
        }, 4000);
    }

    function renderAll() {
        renderParticipants();
        renderTasks();
        renderHeartbeats();
    }

    function renderHeartbeats() {
        el.heartbeatCount.textContent = heartbeatCount;
    }

    function loadTasks() {
        return fetch(api("/tasks"))
            .then(function (res) { return res.ok ? res.json() : []; })
            .then(function (data) { tasks = data; })
            .catch(function () { tasks = []; });
    }

    function loadInitialFeed() {
        return fetch(api("/feed"))
            .then(function (res) { return res.ok ? res.json() : []; })
            .then(function (items) {
                // API returns newest first; replay oldest first to build state.
                items.slice().reverse().forEach(function (item) {
                    if (item.eventType === "participant.heartbeat") {
                        heartbeatCount++;
                        return;
                    }
                    applyEvent(item);
                    addFeedItem(item, true);
                });
            })
            .catch(function () { /* ignore */ });
    }

    function connectStream() {
        var source = new EventSource(api("/feed/stream"));
        source.addEventListener("connected", function () {
            setStatus(true, "Live");
        });
        source.addEventListener("feed", function (evt) {
            var item = JSON.parse(evt.data);
            if (item.eventType === "participant.heartbeat") {
                // Anonymous presence ping: bump the global counter, keep it out of the feed.
                heartbeatCount++;
                renderHeartbeats();
                return;
            }
            applyEvent(item);
            addFeedItem(item, true);
            renderAll();
        });
        source.onopen = function () {
            setStatus(true, "Live");
        };
        source.onerror = function () {
            setStatus(false, "Reconnecting…");
        };
    }

    // Re-render periodically so "active/idle" status stays current.
    setInterval(renderAll, 15000);

    loadTasks()
        .then(loadInitialFeed)
        .then(renderAll)
        .then(connectStream);
})();
