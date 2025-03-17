const width = 800, height = 600;
const svg = d3.select("svg").attr("width", width).attr("height", height);

// Load data
d3.json("data.json").then(data => {
    let nodes = [];
    let links = [];
    let themeMap = {};

    // Helper function to generate random positions within the screen bounds
    function getRandomPosition(nodes) {
        let x, y, overlap;
        let minDistance = 2; // Minimum distance between points

        // Ensure points are within the screen bounds
        do {
            x = Math.random() * (width - 40) + 20;  // Ensures points are within the screen bounds
            y = Math.random() * (height - 40) + 20;
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

    // Assign random positions for event nodes (items) ensuring they don't overlap
    nodes.forEach(d => {
        if (d.type === "item") {
            const pos = getRandomPosition(nodes);
            d.x = pos.x;
            d.y = pos.y;
        }
    });

    // Create simulation for node positioning (we won't use links here, just the nodes)
    const simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(-100))  // Repulsion to spread nodes
        .force("center", d3.forceCenter(width / 2, height / 3)); // Keeps nodes centered
        

    // Create circles for the nodes
     const node = svg.selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", d => d.type === "theme" ? 10 : 20) // Smaller radius for theme nodes
        .attr("fill", d => d.type === "theme" ? "#FF5733" : "#3399FF") // Different colors for themes and items
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)); 
            
            
 /*           
// Add event nodes (example)
const node = svg.selectAll("circle")
    .data(nodes.filter(d => d.type === "item"))
    .enter().append("circle")
    .attr("r", 10)
    .attr("fill", "#3399FF");

// Add theme nodes with random positions but keeping them within the screen
const themeNodes = svg.selectAll("circle.theme")
    .data(nodes.filter(d => d.type === "theme")) // Filter theme nodes
    .enter().append("circle")
    .attr("class", "theme")
    .attr("r", 15) // Set radius of the theme nodes
    .attr("fill", "#FF5733") // Color for theme nodes
    .attr("cx", () => Math.max(20, Math.min(width - 20, Math.random() * width))) // Keep nodes inside width
    .attr("cy", () => Math.max(20, Math.min(height - 20, Math.random() * height))); // Keep nodes inside height

 */           

  /*  // Add labels to the event nodes
    const label = svg.selectAll("text")
        .data(nodes)
        .enter().append("text")
        .text(d => d.id)
        .attr("font-size", "12px")
        .attr("dx", 10)
        .attr("dy", 3);*/
        
    // Add labels for the theme nodes
 /*   
const themeLabels = svg.selectAll("text.theme-label")
    .data(nodes.filter(d => d.type === "theme"))
    .enter().append("text")
    .attr("class", "theme-label")
    .attr("x", d => d.x) // Position the label on the x-coordinate of the theme node
    .attr("y", d => d.y) // Position the label on the y-coordinate of the theme node
    .text(d => d.id) // Set the text to the theme's id or any other property
    .attr("font-size", "12px")
    .attr("dx", 10) // Horizontal padding for the text
    .attr("dy", 3);  // Vertical padding for the text
    */

    // Tooltip for details on hover
    const tooltip = d3.select(".tooltip");

    node.on("mouseover", (event, d) => {
        tooltip.style("display", "block")
            .html(`<strong>${d.id}</strong><br>${d.description || ""}`)
            .style("left", event.pageX + "px")
            .style("top", event.pageY + "px");
    }).on("mouseout", () => tooltip.style("display", "none"));

    // Simulation tick function: update node positions
simulation.on("tick", () => {
    node.attr("cx", d => {
        d.x = Math.max(20, Math.min(width - 20, d.x)); // Keep nodes inside width
        return d.x;
    })
    .attr("cy", d => {
        d.y = Math.max(20, Math.min(height - 20, d.y)); // Keep nodes inside height
        return d.y;
    });

    label.attr("x", d => d.x)
        .attr("y", d => d.y);
        
    // Update the labels' positions to match the theme nodes
   /* themeLabels.attr("x", d => d.x) // Position label based on theme node's x
        .attr("y", d => d.y);        // Position label based on theme node's y
//}); */


/*
// Create the theme nodes with random positions
const themeNodes = svg.selectAll("circle.theme")
    .data(nodes.filter(d => d.type === "theme")) // Filter to get only theme nodes
    .enter().append("circle")
    .attr("class", "theme")
    .attr("r", 15)
    .attr("fill", "#FF5733")
    .attr("cx", () => Math.max(20, Math.min(width - 20, Math.random() * width))) // Random x-position
    .attr("cy", () => Math.max(20, Math.min(height - 20, Math.random() * height))); // Random y-position

// Add labels for the theme nodes
const themeLabels = svg.selectAll("text.theme-label")
    .data(nodes.filter(d => d.type === "theme"))
    .enter().append("text")
    .attr("class", "theme-label")
    .attr("x", d => d.x) // Start at the x-position of the theme node
    .attr("y", d => d.y) // Start at the y-position of the theme node
    .text(d => d.id) // Set the label text (can be replaced with d.title or another property)
    .attr("font-size", "12px")
    .attr("dx", 10) // Horizontal padding for the text
    .attr("dy", 3);  // Vertical padding for the text 
    
*/

/*
// Update label positions on each tick of the simulation
simulation.on("tick", () => {
    // Update the theme nodes positions
    themeNodes.attr("cx", d => d.x)
        .attr("cy", d => d.y);

    // Update the labels' positions to match the theme nodes
    themeLabels.attr("x", d => d.x) // Position label based on theme node's x
        .attr("y", d => d.y);        // Position label based on theme node's y

    // Update the event nodes' positions (if you have event nodes)
    node.attr("cx", d => d.x)
        .attr("cy", d => d.y);

    // Update the event labels' positions
    label.attr("x", d => d.x)
        .attr("y", d => d.y);
});
*/


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
});


