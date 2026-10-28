
"use strict";

// --------------------------------------
// 1. GRAPH AND LOCATION DATA
// --------------------------------------

const locations = {
    A: { x: 65,  y: 205, name: "Central Hub",    h: 10 },
    B: { x: 190, y: 65,  name: "North Point",    h: 9 },
    C: { x: 325, y: 150, name: "East Junction",  h: 7 },
    D: { x: 190, y: 350, name: "West Park",      h: 7 },
    E: { x: 390, y: 300, name: "City Center",    h: 5 },
    F: { x: 520, y: 155, name: "South Point",    h: 2 },
    G: { x: 625, y: 315, name: "Destination",    h: 0 }
};

const edges = [
    ["A", "B", 4],
    ["A", "C", 3],
    ["A", "D", 5],
    ["B", "C", 2],
    ["B", "D", 6],
    ["C", "D", 4],
    ["C", "E", 5],
    ["C", "F", 6],
    ["D", "E", 2],
    ["E", "F", 3],
    ["E", "G", 5],
    ["F", "G", 2]
];

const graph = {};

Object.keys(locations).forEach(node => {
    graph[node] = [];
});

edges.forEach(([a, b, cost]) => {
    graph[a].push({ node: b, cost });
    graph[b].push({ node: a, cost });
});

const algorithmNames = {
    bfs: "Breadth-First Search (BFS)",
    dfs: "Depth-First Search (DFS)",
    ucs: "Uniform Cost Search (UCS)",
    greedy: "Greedy Best-First Search",
    astar: "A* Search Algorithm"
};

const $ = id => document.getElementById(id);
const svgNS = "http://www.w3.org/2000/svg";

let lastResult = null;

// --------------------------------------
// 2. SVG HELPER
// --------------------------------------

function svgElement(tag, attrs, parent, content) {
    const el = document.createElementNS(svgNS, tag);

    Object.entries(attrs).forEach(([key, value]) => {
        el.setAttribute(key, value);
    });

    if (content !== undefined) {
        el.textContent = content;
    }

    parent.appendChild(el);
    return el;
}

// --------------------------------------
// 3. DRAW THE GRAPH
// --------------------------------------

function drawGraph(result = null) {
    const roads = $("roads");
    const routeLines = $("route-lines");
    const nodes = $("nodes");

    roads.replaceChildren();
    routeLines.replaceChildren();
    nodes.replaceChildren();

    const start = $("start").value;
    const goal = $("destination").value;

    const explored = new Set(result ? result.explored : []);
    const route = result ? result.path : [];

    const routeEdges = new Set();

    for (let i = 0; i < route.length - 1; i++) {
        routeEdges.add(route[i] + "-" + route[i + 1]);
        routeEdges.add(route[i + 1] + "-" + route[i]);
    }

    // Draw all roads and their costs.
    edges.forEach(([a, b, cost]) => {
        const p1 = locations[a];
        const p2 = locations[b];

        svgElement("line", {
            x1: p1.x, y1: p1.y,
            x2: p2.x, y2: p2.y,
            class: "road"
        }, roads);

        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;

        svgElement("text", {
            x: mx,
            y: my - 9,
            class: "road-label"
        }, roads, String(cost));
    });

    // Draw the calculated route over the roads.
    for (let i = 0; i < route.length - 1; i++) {
        const a = locations[route[i]];
        const b = locations[route[i + 1]];

        svgElement("line", {
            x1: a.x, y1: a.y,
            x2: b.x, y2: b.y,
            class: "route-road"
        }, routeLines);
    }

    // Draw all location nodes.
    Object.entries(locations).forEach(([id, place]) => {
        let nodeClass = "node-normal";

        if (explored.has(id)) {
            nodeClass = "node-explored";
        }

        if (route.includes(id)) {
            nodeClass = "node-route";
        }

        if (id === start) {
            nodeClass = "node-start";
        }

        if (id === goal) {
            nodeClass = "node-end";
        }

        const group = svgElement("g", {}, nodes);

        svgElement("circle", {
            cx: place.x,
            cy: place.y,
            r: 20,
            class: "node-circle " + nodeClass
        }, group);

        svgElement("text", {
            x: place.x,
            y: place.y,
            class: "node-label"
        }, group, id);

        const labelY = place.y > 320 ? place.y + 35 : place.y + 38;

        svgElement("text", {
            x: place.x,
            y: labelY,
            class: "place-label"
        }, group, place.name);
    });
}

// --------------------------------------
// 4. ROUTE COST
// --------------------------------------

function routeCost(path) {
    let total = 0;

    for (let i = 0; i < path.length - 1; i++) {
        const edge = graph[path[i]].find(
            item => item.node === path[i + 1]
        );

        if (!edge) return Infinity;
        total += edge.cost;
    }

    return total;
}

// --------------------------------------
// 5. BREADTH-FIRST SEARCH
// --------------------------------------

function bfs(start, goal) {
    const queue = [start];
    const visited = new Set([start]);
    const parent = {};
    const explored = [];

    while (queue.length > 0) {
        const current = queue.shift();
        explored.push(current);

        if (current === goal) {
            return {
                path: buildPath(parent, start, goal),
                explored
            };
        }

        for (const edge of graph[current]) {
            if (!visited.has(edge.node)) {
                visited.add(edge.node);
                parent[edge.node] = current;
                queue.push(edge.node);
            }
        }
    }

    return { path: [], explored };
}

// --------------------------------------
// 6. DEPTH-FIRST SEARCH
// --------------------------------------

function dfs(start, goal) {
    const stack = [start];
    const visited = new Set([start]);
    const parent = {};
    const explored = [];

    while (stack.length > 0) {
        const current = stack.pop();
        explored.push(current);

        if (current === goal) {
            return {
                path: buildPath(parent, start, goal),
                explored
            };
        }

        // Reverse insertion makes traversal order predictable.
        for (const edge of [...graph[current]].reverse()) {
            if (!visited.has(edge.node)) {
                visited.add(edge.node);
                parent[edge.node] = current;
                stack.push(edge.node);
            }
        }
    }

    return { path: [], explored };
}

// --------------------------------------
// 7. UNIFORM COST SEARCH
// --------------------------------------

function ucs(start, goal) {
    const frontier = [{ node: start, cost: 0 }];
    const distance = { [start]: 0 };
    const parent = {};
    const explored = [];
    const closed = new Set();

    while (frontier.length > 0) {
        frontier.sort((a, b) => a.cost - b.cost);

        const current = frontier.shift();
        const node = current.node;

        if (closed.has(node)) continue;
        closed.add(node);
        explored.push(node);

        if (node === goal) {
            return {
                path: buildPath(parent, start, goal),
                explored
            };
        }

        for (const edge of graph[node]) {
            if (closed.has(edge.node)) continue;

            const newCost = current.cost + edge.cost;

            if (newCost < (distance[edge.node] ?? Infinity)) {
                distance[edge.node] = newCost;
                parent[edge.node] = node;

                frontier.push({
                    node: edge.node,
                    cost: newCost
                });
            }
        }
    }

    return { path: [], explored };
}

// --------------------------------------
// 8. GREEDY BEST-FIRST SEARCH
// --------------------------------------

function greedy(start, goal) {
    const frontier = [{ node: start, priority: locations[start].h }];
    const visited = new Set([start]);
    const parent = {};
    const explored = [];

    while (frontier.length > 0) {
        frontier.sort((a, b) => a.priority - b.priority);

        const current = frontier.shift();
        const node = current.node;
        explored.push(node);

        if (node === goal) {
            return {
                path: buildPath(parent, start, goal),
                explored
            };
        }

        for (const edge of graph[node]) {
            if (!visited.has(edge.node)) {
                visited.add(edge.node);
                parent[edge.node] = node;

                frontier.push({
                    node: edge.node,
                    priority: locations[edge.node].h
                });
            }
        }
    }

    return { path: [], explored };
}

// --------------------------------------
// 9. A* SEARCH
// f(n) = g(n) + h(n)
// --------------------------------------

function astar(start, goal) {
    const frontier = [{
        node: start,
        g: 0,
        f: locations[start].h
    }];

    const distance = { [start]: 0 };
    const parent = {};
    const explored = [];
    const closed = new Set();

    while (frontier.length > 0) {
        frontier.sort((a, b) => a.f - b.f);

        const current = frontier.shift();
        const node = current.node;

        if (closed.has(node)) continue;

        closed.add(node);
        explored.push(node);

        if (node === goal) {
            return {
                path: buildPath(parent, start, goal),
                explored
            };
        }

        for (const edge of graph[node]) {
            if (closed.has(edge.node)) continue;

            const newG = current.g + edge.cost;

            if (newG < (distance[edge.node] ?? Infinity)) {
                distance[edge.node] = newG;
                parent[edge.node] = node;

                const h = locations[edge.node].h;

                frontier.push({
                    node: edge.node,
                    g: newG,
                    f: newG + h
                });
            }
        }
    }

    return { path: [], explored };
}

// --------------------------------------
// 10. RECONSTRUCT THE ROUTE
// --------------------------------------

function buildPath(parent, start, goal) {
    const path = [];
    let current = goal;

    while (current !== undefined) {
        path.unshift(current);

        if (current === start) {
            return path;
        }

        current = parent[current];
    }

    return [];
}

// --------------------------------------
// 11. RUN THE SELECTED ALGORITHM
// --------------------------------------

function findRoute() {
    const start = $("start").value;
    const goal = $("destination").value;
    const algorithm = $("algorithm").value;
    const message = $("message");

    message.textContent = "";
    message.className = "message";

    if (!graph[start] || !graph[goal]) {
        message.textContent = "Please select valid locations.";
        return;
    }

    if (start === goal) {
        lastResult = null;
        $("results-content").hidden = true;
        $("empty-state").hidden = false;
        message.textContent =
            "Starting location and destination must be different.";
        drawGraph();
        return;
    }

    const algorithms = {
        bfs,
        dfs,
        ucs,
        greedy,
        astar
    };

    const begin = performance.now();
    const result = algorithms[algorithm](start, goal);
    const elapsed = performance.now() - begin;

    result.cost = result.path.length
        ? routeCost(result.path)
        : Infinity;

    result.algorithm = algorithm;
    result.time = elapsed;
    result.start = start;
    result.goal = goal;

    lastResult = result;

    drawGraph(result);

    if (result.path.length === 0) {
        $("results-content").hidden = true;
        $("empty-state").hidden = false;
        message.textContent = "No route exists between these locations.";
        return;
    }

    message.textContent = "Route calculated successfully.";
    message.className = "message success";

    showResults(result);
}

// --------------------------------------
// 12. DISPLAY RESULTS
// --------------------------------------

function showResults(result) {
    $("empty-state").hidden = true;
    $("results-content").hidden = false;

    $("result-algorithm").textContent =
        algorithmNames[result.algorithm];

    $("total-cost").textContent = result.cost;
    $("explored-count").textContent = result.explored.length;
    $("execution-time").textContent = result.time.toFixed(3);

    const routeDisplay = $("route-display");
    routeDisplay.replaceChildren();

    result.path.forEach((node, index) => {
        const item = document.createElement("span");
        item.className = "route-node";
        item.textContent = node;
        routeDisplay.appendChild(item);

        if (index < result.path.length - 1) {
            const arrow = document.createElement("span");
            arrow.className = "route-arrow";
            arrow.textContent = "→";
            routeDisplay.appendChild(arrow);
        }
    });

    $("route-summary").textContent =
        `Route from ${result.start} to ${result.goal} contains ` +
        `${result.path.length - 1} road segments with total cost ` +
        `${result.cost} units.`;

    const exploredList = $("explored-list");
    exploredList.replaceChildren();

    result.explored.forEach(node => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = node;
        exploredList.appendChild(chip);
    });

    const stepsList = $("steps-list");
    stepsList.replaceChildren();

    const addStep = text => {
        const li = document.createElement("li");
        li.textContent = text;
        stepsList.appendChild(li);
    };

    addStep(
        `Start at ${result.start} and set its initial path cost to 0.`
    );

    addStep(
        `Run ${algorithmNames[result.algorithm]} to explore the graph.`
    );

    addStep(
        `Nodes expanded in order: ${result.explored.join(" → ")}.`
    );

    let accumulated = 0;

    for (let i = 0; i < result.path.length - 1; i++) {
        const from = result.path[i];
        const to = result.path[i + 1];
        const edge = graph[from].find(item => item.node === to);

        accumulated += edge.cost;

        addStep(
            `Travel from ${from} to ${to}: cost ${edge.cost}. ` +
            `Accumulated cost = ${accumulated}.`
        );
    }

    addStep(
        `Destination ${result.goal} reached. Total route cost: ` +
        `${result.cost} units.`
    );
}

// --------------------------------------
// 13. RESET AND EVENT LISTENERS
// --------------------------------------

$("route-form").addEventListener("submit", event => {
    event.preventDefault();
    findRoute();
});

$("reset-btn").addEventListener("click", () => {
    $("start").value = "A";
    $("destination").value = "G";
    $("algorithm").value = "bfs";

    $("message").textContent = "";
    $("message").className = "message";

    lastResult = null;

    $("results-content").hidden = true;
    $("empty-state").hidden = false;

    drawGraph();
});

$("algorithm").addEventListener("change", () => {
    if (lastResult) {
        findRoute();
    }
});

$("start").addEventListener("change", () => {
    if (lastResult) findRoute();
});

$("destination").addEventListener("change", () => {
    if (lastResult) findRoute();
});

// Show the default graph when the page opens.
drawGraph();
