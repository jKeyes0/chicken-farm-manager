// Initialize batches array from localStorage
let batches = JSON.parse(localStorage.getItem('chickenBatches')) || [];

// DOM Elements
const chickenForm = document.getElementById('chickenForm');
const batchesList = document.getElementById('batchesList');
const aiInsightsList = document.getElementById('aiInsightsList');

// Event Listeners
chickenForm.addEventListener('submit', handleAddBatch);

// Tab switching
function showTab(tabName) {
    // Hide all tabs
    const allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all buttons
    const allBtns = document.querySelectorAll('.tab-btn');
    allBtns.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Refresh data when switching to dashboard or insights
    if (tabName === 'dashboard') {
        updateDashboard();
    } else if (tabName === 'ai-insights') {
        displayAIInsights();
    } else if (tabName === 'batches') {
        renderBatches();
    }
}

// Add new batch
function handleAddBatch(e) {
    e.preventDefault();
    
    const batch = {
        id: Date.now(),
        name: document.getElementById('batchName').value,
        quantity: parseInt(document.getElementById('quantity').value),
        startDate: document.getElementById('startDate').value,
        expectedHarvest: parseInt(document.getElementById('expectedHarvest').value),
        createdAt: new Date().toISOString()
    };
    
    batches.push(batch);
    saveBatches();
    renderBatches();
    updateDashboard();
    chickenForm.reset();
    alert('✅ Batch added successfully! AI is monitoring it.');
}

// Save batches to localStorage
function saveBatches() {
    localStorage.setItem('chickenBatches', JSON.stringify(batches));
}

// Render all batches
function renderBatches() {
    if (batches.length === 0) {
        batchesList.innerHTML = '<div class="empty-message">No batches added yet. Add your first chicken batch!</div>';
        return;
    }
    
    batchesList.innerHTML = batches.map(batch => createBatchCard(batch)).join('');
    
    // Add event listeners to delete and edit buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteBatch(parseInt(this.dataset.id));
        });
    });
    
    document.querySelectorAll('.btn-details').forEach(btn => {
        btn.addEventListener('click', function() {
            showBatchDetails(parseInt(this.dataset.id));
        });
    });
}

// Create batch card HTML
function createBatchCard(batch) {
    const startDate = new Date(batch.startDate);
    const today = new Date();
    const daysElapsed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = batch.expectedHarvest - daysElapsed;
    const progress = Math.min((daysElapsed / batch.expectedHarvest) * 100, 100);
    
    let status = 'active';
    let statusText = 'Growing';
    let recommendation = 'Monitor feed and water intake';
    
    if (daysElapsed < 7) {
        statusText = '🐣 Chick Stage';\n        recommendation = 'Keep warm (32-35°C). Starter feed.';\n    } else if (daysElapsed < 14) {
        statusText = '🐥 Young Pullet';\n        recommendation = 'Reduce temperature. Switch to grower feed.';\n    } else if (daysElapsed < 30) {
        statusText = '🐓 Growing';\n        recommendation = 'Ensure proper ventilation. Grower feed.';\n    } else if (daysRemaining <= 7 && daysRemaining > 0) {
        status = 'ready';\n        statusText = '⚠️ Nearly Ready';\n        recommendation = 'Prepare for harvest in ' + daysRemaining + ' days';\n    } else if (daysRemaining <= 0) {
        status = 'harvested';\n        statusText = '✅ Ready to Harvest';\n        recommendation = 'HARVEST TIME! Process and sell.';\n    }\n    \n    return `\n        <div class=\"batch-card\">\n            <div class=\"status ${status}\">${statusText}</div>\n            <h3>${batch.name}</h3>\n            <div class=\"batch-info\">\n                <p><span class=\"label\">Quantity:</span> ${batch.quantity} PCs</p>\n                <p><span class=\"label\">Start Date:</span> ${new Date(batch.startDate).toLocaleDateString()}</p>\n                <p><span class=\"label\">Age:</span> ${daysElapsed} days</p>\n                <p><span class=\"label\">Days Remaining:</span> ${Math.max(daysRemaining, 0)} days</p>\n                <p><span class=\"label\">Expected Harvest:</span> ${new Date(new Date(batch.startDate).getTime() + batch.expectedHarvest * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>\n                <p><span class=\"label\">Est. Weight:</span> ${farmAI ? farmAI.estimateWeight(daysElapsed) : '--'} kg/bird</p>\n            </div>\n            <div class=\"progress-bar\">\n                <div class=\"progress-fill\" style=\"width: ${progress}%\"></div>\n            </div>\n            <p style=\"color: #667eea; font-weight: bold; margin-bottom: 10px; font-size: 0.9em;\">💡 ${recommendation}</p>\n            <div class=\"actions\">\n                <button class=\"btn-details\" data-id=\"${batch.id}\">📋 Details</button>\n                <button class=\"btn-delete\" data-id=\"${batch.id}\">🗑️ Delete</button>\n            </div>\n        </div>\n    `;\n}\n\n// Show batch details\nfunction showBatchDetails(batchId) {\n    if (!farmAI) return;\n    \n    const recommendations = farmAI.getBatchRecommendations(batchId);\n    if (!recommendations) return;\n    \n    const batch = recommendations.batch;\n    const startDate = new Date(batch.startDate);\n    const today = new Date();\n    const daysElapsed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));\n    \n    alert(`\n📊 BATCH DETAILS: ${batch.name}\n\n🐓 Quantity: ${batch.quantity} birds\n📅 Age: ${daysElapsed} days old\n⏱️ Days Until Harvest: ${Math.max(batch.expectedHarvest - daysElapsed, 0)} days\n⚖️ Estimated Weight: ${recommendations.estimatedWeight} kg/bird\n💚 Health Score: ${recommendations.healthScore}/100\n\n📋 CARE RECOMMENDATIONS:\n${recommendations.recommendations.map(r => '✓ ' + r).join('\\n')}\n\n🔔 ALERTS:\n${recommendations.alerts.length > 0 ? recommendations.alerts.map(a => '⚠️ ' + a).join('\\n') : 'No alerts - Batch is healthy!'}\n    `);\n}\n\n// Delete batch\nfunction deleteBatch(id) {\n    if (confirm('Are you sure you want to delete this batch?')) {\n        batches = batches.filter(batch => batch.id !== id);\n        saveBatches();\n        renderBatches();\n        updateDashboard();\n        alert('✅ Batch deleted successfully!');\n    }\n}\n\n// Update dashboard\nfunction updateDashboard() {\n    if (!farmAI) return;\n    \n    const dashboard = farmAI.getAIDashboard();\n    \n    document.getElementById('totalBatches').textContent = dashboard.totalBatches;\n    document.getElementById('activeBatches').textContent = dashboard.activeBatches;\n    document.getElementById('readyBatches').textContent = dashboard.readyToHarvest;\n    document.getElementById('totalChickens').textContent = dashboard.totalChickens;\n    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();\n    \n    // Display alerts\n    const alertsList = document.getElementById('alertsList');\n    let alertsHTML = '';\n    \n    batches.forEach(batch => {\n        const startDate = new Date(batch.startDate);\n        const today = new Date();\n        const daysElapsed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));\n        const daysRemaining = batch.expectedHarvest - daysElapsed;\n        \n        if (daysRemaining <= 7 && daysRemaining > 0) {\n            alertsHTML += `<div class=\"alert-item\">⚠️ <strong>${batch.name}</strong>: Ready in ${daysRemaining} days!</div>`;\n        }\n        if (daysRemaining <= 0) {\n            alertsHTML += `<div class=\"alert-item critical\">🔴 <strong>${batch.name}</strong>: OVERDUE FOR HARVEST!</div>`;\n        }\n    });\n    \n    if (alertsHTML === '') {\n        alertsHTML = '<div class=\"alert-item\">✅ No alerts. All batches are healthy!</div>';\n    }\n    \n    alertsList.innerHTML = alertsHTML;\n}\n\n// Display AI Insights\nfunction displayAIInsights() {\n    if (!farmAI) return;\n    \n    if (batches.length === 0) {\n        aiInsightsList.innerHTML = '<div class=\"empty-message\">No batches to analyze. Add a batch to get AI insights!</div>';\n        return;\n    }\n    \n    aiInsightsList.innerHTML = batches.map(batch => {\n        const recommendations = farmAI.getBatchRecommendations(batch.id);\n        if (!recommendations) return '';\n        \n        return `\n            <div class=\"insight-card\">\n                <h3>🧠 AI Analysis: ${batch.name}</h3>\n                <span class=\"status ${recommendations.healthScore >= 90 ? 'active' : 'ready'}\">\n                    ${recommendations.status}\n                </span>\n                <p style=\"margin: 10px 0;\"><strong>Health Score:</strong> ${recommendations.healthScore}/100 ${'█'.repeat(Math.floor(recommendations.healthScore/10))}${'░'.repeat(10-Math.floor(recommendations.healthScore/10))}</p>\n                \n                <div class=\"recommendations\">\n                    <h4>📋 AI Recommendations:</h4>\n                    <ul>\n                        ${recommendations.recommendations.map(r => `<li>✓ ${r}</li>`).join('')}\n                    </ul>\n                </div>\n                \n                ${recommendations.alerts.length > 0 ? `\n                <div class=\"recommendations\" style=\"margin-top: 10px;\">\n                    <h4>🔔 Active Alerts:</h4>\n                    <ul>\n                        ${recommendations.alerts.map(a => `<li style=\"color: #dc3545;\">${a}</li>`).join('')}\n                    </ul>\n                </div>\n                ` : ''}\n            </div>\n        `;\n    }).join('');\n}\n\n// Manual AI Update\nfunction manualAIUpdate() {\n    if (!farmAI) {\n        alert('AI Assistant not initialized');\n        return;\n    }\n    \n    farmAI.analyzeAllBatches();\n    updateDashboard();\n    alert('🤖 AI update completed! Dashboard refreshed.');\n}\n\n// Initial render\nrenderBatches();\nupdateDashboard();\n\n// Update dashboard every 5 minutes\nsetInterval(() => {\n    updateDashboard();\n}, 300000);\n