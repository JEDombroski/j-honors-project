// Set up SVG dimensions (larger than the window size)
const width = window.innerWidth;  // Larger width than the window
const height = window.innerHeight;  // Larger height than the window

console.log(`Initial Width: ${width}, Initial Height: ${height}`);

// Create an SVG element
const svg = d3.select("body")
    .append("svg")
    .attr("width", width)  // Set SVG width larger than the window size
    .attr("height", height)  // Set SVG height larger than the window size
   // .attr("viewBox", `0 0 ${width} ${height}`)  // Allow it to scale and scroll
   // .attr("preserveAspectRatio", "xMinYMin")  // Ensure proper scaling when resizing
	//.call(d3.zoom()
   //	 .scaleExtent([1, 10])  // Define zoom scale limits
   //	 .on("zoom", zoomed));

//function zoomed(event) {
 // svg.attr("transform", event.transform);  // Apply zoom and pan transformations
//}


// Load data
d3.json("updated_data.json").then(data => {
    let nodes = [];
    let links = [];
    let themeMap = {};
    

    // Helper function to generate random positions within the screen bounds
    function getRandomPosition(nodes) {
        let x, y, overlap;
        let minDistance = Math.min(width, height) * 0.001; // Minimum distance between points

        // Ensure points are within the screen bounds
        do {
            x = Math.random() * (width - 40) + 20;
           // x=Math.random() * width;  // Ensures points are within the screen bounds
            y = Math.random() * (height - 40) + 20;
            //y=Math.random() * height
            overlap = false;

            // Check overlap with existing nodes
            nodes.forEach(d => {
                const dx = x - d.x;
                const dy = y - d.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < minDistance) { // Enforcing a minimum distance between nodes
                    overlap = true;
                }
            });
        } while (overlap);

        return { x, y };
    }

    // Populate nodes from the data
    data.forEach(item => {
        nodes.push({ id: item.title, type: "item", ...item });

        item.themes.forEach(theme => {
            if (!themeMap[theme]) {
                themeMap[theme] = { id: theme, type: "theme" };
                nodes.push(themeMap[theme]);
            }
            links.push({ source: item.title, target: theme });
        });
    });

   // Assign random positions for event nodes (items) and theme nodes ensuring they don't overlap
nodes.forEach(d => {
    if (d.type === "item" || d.type === "theme") {
        const pos = getRandomPosition(nodes);
        d.x = pos.x;
        d.y = pos.y;
    }
});


// Handle zooming (apply transformation to the entire SVG content)
//function zoomed(event) {
//    svg.attr("transform", event.transform);  // Apply zoom and pan transformations
//}

// Create a custom collision function with bounce behavior
function collideWithBounce(nodes) {
    let minDistance = Math.min(width, height) * 0.001; // Minimum distance between nodes to avoid overlap
    return function(d) {
        nodes.forEach(function(d2) {
            if (d === d2) return; // Skip if it's the same node

            const dx = d.x - d2.x;
            const dy = d.y - d2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const overlap = minDistance - distance;

            if (overlap > 0) {
                // Calculate the angle of collision and how much to push nodes apart
                const angle = Math.atan2(dy, dx);
                const pushX = Math.cos(angle) * overlap;
                const pushY = Math.sin(angle) * overlap;

                // Apply the repulsion to both nodes
                d.x += pushX;
                d.y += pushY;
                d2.x -= pushX;
                d2.y -= pushY;
            }
        });
    };
}

// Create simulation with bounce behavior and custom collision handling
// Define the simulation with more aggressive repulsion and persistent collision
const simulation = d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-20))  // Increase repulsion strength to prevent drifting
    .force("center", d3.forceCenter(width/2, height/2)) // Keep nodes centered
    .force("collide", d3.forceCollide(30))  // Apply persistent collision force with minimum distance between nodes
    .force("x", d3.forceX().strength(0.1).x(d => Math.max(20, Math.min(width - 20, d.x)))) // Keep nodes within bounds horizontally
    .force("y", d3.forceY().strength(0.1).y(d => Math.max(20, Math.min(height - 20, d.y)))) // Keep nodes within bounds vertically
    .alpha(.05)
    .alphaMin(0.01)

    .on("tick", () => {
        node.attr("cx", d => Math.max(20, Math.min(width - 20, d.x)))
            .attr("cy", d => Math.max(20, Math.min(height - 20, d.y)));

        label.attr("x", d => Math.max(20, Math.min(width - 20, d.x)))
            .attr("y", d => Math.max(20, Math.min(height - 20, d.y)));
    });
    
    window.addEventListener("resize", () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    svg.attr("width", newWidth).attr("height", newHeight);

    // Update the center force for D3 simulation
    simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));
    simulation.alpha(1).restart();  // Restart simulation to apply new forces
});

// When a theme is selected, lower the alpha decay to slow the simulation
function onThemeSelected() {
    simulation.alphaTarget(0.3).restart();  // Start or speed up simulation when a theme is selected
}

// Reset the alpha decay when no theme is selected
function onThemeDeselected() {
    simulation.alphaTarget(0).restart();  // Gradually stop the simulation
}



    // Create circles for the nodes
    const node = svg.selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", d => d.type === "theme" ? 20 : 10) // Smaller radius for event nodes
        .attr("fill", d => d.type === "theme" ? "#9768d1" : "#25064c") // Different colors for themes and items
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)); 

    // Add labels to the event and theme nodes
    const label = svg.selectAll("text")
        .data(nodes.filter(d => d.type === "theme"))
        .enter().append("text")
        .text(d => d.id)
        .attr("font-size", "12px")
        .attr("text-anchor", "middle")
        .attr("dx", 0)
        .attr("dy", 3)
        .style("pointer-events", "none");  // Make labels click-through;
        
let selectedThemes = [];  // Track the currently selected theme nodes

// Focus on a theme when clicked
function focusOnTheme(themeNode) {
    const index = selectedThemes.indexOf(themeNode);

    if (index > -1) {
        // If the same theme node is clicked again, deselect it
        selectedThemes.splice(index, 1);
        resetNodePositions();  // Reset the positions of all nodes
        resetNodeOpacity();    // Reset opacity for all nodes
    } else {
        // Otherwise, select the new theme node
        selectedThemes.push(themeNode);
        updateNodePositionsForSelection();  // Update the positions of the nodes
        updateNodeOpacity();  // Apply opacity changes to nodes
    }

    simulation.alpha(1).restart();  // Restart simulation after selection or deselection
}

// Function to reset the positions of all nodes to their force simulation
function resetNodePositions() {
    nodes.forEach(d => {
        // Reset positions for event nodes (items)
        if (d.type === "item") {
            d.fx = null;  // Let them move freely with the simulation
            d.fy = null;
        }
        // Allow theme nodes to move freely unless selected
        if (d.type === "theme" && !selectedThemes.includes(d)) {
            d.fx = null;
            d.fy = null;
        }
    });
}

// Function to reset the opacity of all nodes to default (e.g., full opacity)
function resetNodeOpacity() {
    nodes.forEach(d => {
        d.opacity = 1;  // Set opacity to 1 for all nodes (default state)
    });

    updateNodeOpacity();  // Apply opacity changes to the nodes
}

// Function to update the opacity of all nodes based on their opacity value
function updateNodeOpacity() {
    node.transition()
        .duration(500)
        .style("fill-opacity", d => d.opacity || 1);  // Apply opacity changes
}

// Function to update the node positions based on the selected theme nodes
function updateNodePositionsForSelection() {
    // Find the event nodes that are related to all selected themes
    const relatedEventNodes = getEventNodesForSelectedThemes();

    // Adjust the radius of the circle based on the number of selected themes
    const nodeRadius = 20;  // Approximate radius of event nodes
    const minRingRadius = 50;  // Inner ring size (should fit the theme nodes)
    const spacingFactor = 2.2;  // Space between rings
    let numPerRing = Math.floor((2 * Math.PI * minRingRadius) / (nodeRadius * spacingFactor));
    let currentLayer = 0;
    let angleStep = (2 * Math.PI) / numPerRing;
    let indexInLayer = 0;

    // Calculate the center of the circle for the selected theme nodes
    let centerX = width / 2;
    let centerY = height / 2;

    // Assign positions based on layers for event nodes and related theme nodes
    nodes.forEach(d => {
        if (relatedEventNodes.includes(d.id)) {
            if (indexInLayer >= numPerRing) {
                currentLayer++;  // Move to next layer
                numPerRing = Math.floor((2 * Math.PI * (minRingRadius + currentLayer * nodeRadius * spacingFactor)) / (nodeRadius * spacingFactor));
                indexInLayer = 0;
                angleStep = (2 * Math.PI) / numPerRing;
            }

            let ringRadius = minRingRadius + currentLayer * nodeRadius * spacingFactor;
            let angle = indexInLayer * angleStep;

            // Position the event nodes in a circular formation around the theme nodes
            d.fx = centerX + ringRadius * Math.cos(angle);
            d.fy = centerY + ringRadius * Math.sin(angle);

            // Set opacity to 1 for the related event nodes
            d.opacity = 1;

            indexInLayer++;
        } else {
            // For non-related event nodes, leave their positions to the force simulation
            d.fx = null;
            d.fy = null;

            // Set opacity to a lower value for non-related nodes
            d.opacity = 0.3;
        }

        // For theme nodes that are not the selected ones, allow them to move freely
        if (d.type === "theme" && !selectedThemes.includes(d)) {
            d.fx = null;
            d.fy = null;
            // Ensure the non-selected theme nodes also have full opacity
            d.opacity = 1;  // Keep them opaque as well
        }
    });

    // Move all selected theme nodes to the center
    selectedThemes.forEach((themeNode, index) => {
        const angle = (2 * Math.PI / selectedThemes.length) * index;
        themeNode.fx = centerX + 100 * Math.cos(angle);
        themeNode.fy = centerY + 100 * Math.sin(angle);
        themeNode.opacity = 1;
    });
}

// Function to get event nodes that correspond to all selected theme nodes
function getEventNodesForSelectedThemes() {
    let eventNodes = nodes.filter(d => d.type === "item");

    selectedThemes.forEach(themeNode => {
        eventNodes = eventNodes.filter(eventNode => {
            return links.some(link => link.source === eventNode.id && link.target === themeNode.id);
        });
    });

    return eventNodes.map(d => d.id);  // Return the IDs of the event nodes that match
}


    // Dragging functionality
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    // Add click interaction for selecting a theme
    node.on("click", (event, d) => {
        if (d.type === "theme") {
            focusOnTheme(d); // Focus on the clicked theme
        }
    });
});



