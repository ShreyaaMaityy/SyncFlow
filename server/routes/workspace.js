const express = require('express');
const router = express.Router();
const Workspace = require('../models/Workspace');
const { protect } = require('../middleware/auth');

// Get all workspaces for a user
// @route GET /api/workspaces
router.get('/', protect, async (req, res) => {
    try {
        const workspaces = await Workspace.find({ user: req.user._id }).sort({ lastUpdated: -1 });
        res.json(workspaces);
    } catch (err) {
        console.error('Error fetching workspaces:', err);
        res.status(500).json({ message: 'Failed to fetch workspaces' });
    }
});

// Create a new workspace
// @route POST /api/workspaces
router.post('/', protect, async (req, res) => {
    const workspaceId = `ws-${Date.now()}`; // Simple ID generation
    const workspace = new Workspace({
        workspaceId,
        nodes: [],
        edges: [],
        user: req.user._id
    });

    try {
        const newWorkspace = await workspace.save();
        res.status(201).json(newWorkspace);
    } catch (err) {
        res.status(400).json({ message: 'Failed to create workspace' });
    }
});

// Get a specific workspace
// @route GET /api/workspaces/:id
router.get('/:id', async (req, res) => {
    try {
        let workspace = await Workspace.findOne({ workspaceId: req.params.id });
        if (!workspace) {
            // Create if not exists (for backward compatibility/new dynamic URLs)
            // Note: This won't have a user associated if created anonymously, 
            // but we might want to attach it if req.user exists (would need middleware here)
            workspace = new Workspace({
                workspaceId: req.params.id,
                nodes: [],
                edges: []
            });
            await workspace.save();
        }
        res.json(workspace);
    } catch (err) {
        console.error('Error fetching workspace:', err);
        res.status(500).json({ message: 'Failed to fetch workspace' });
    }
});

// Rename workspace
// @route PUT /api/workspaces/:id
router.put('/:id', protect, async (req, res) => {
    try {
        // Find by workspaceId, ensure user owns it (optional: strict ownership)
        // For now, allow shared edits or just check existence
        const workspace = await Workspace.findOneAndUpdate(
            { workspaceId: req.params.id },
            { name: req.body.name, lastUpdated: Date.now() },
            { new: true }
        );
        if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
        res.json(workspace);
    } catch (err) {
        console.error('Error renaming workspace:', err);
        res.status(500).json({ message: 'Failed to rename workspace' });
    }
});

// Delete workspace
// @route DELETE /api/workspaces/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const workspace = await Workspace.findOneAndDelete({ workspaceId: req.params.id });
        if (!workspace) return res.status(404).json({ message: 'Workspace not found' });
        res.json({ message: 'Workspace deleted' });
    } catch (err) {
        console.error('Error deleting workspace:', err);
        res.status(500).json({ message: 'Failed to delete workspace' });
    }
});

// Save workspace state
// @route POST /api/workspaces/:id/save
router.post('/:id/save', async (req, res) => {
    try {
        const { nodes, edges } = req.body;
        const workspace = await Workspace.findOneAndUpdate(
            { workspaceId: req.params.id },
            { nodes, edges, lastUpdated: Date.now() },
            { new: true, upsert: true }
        );
        res.json(workspace);
    } catch (err) {
        console.error('Error saving workspace:', err);
        res.status(500).json({ message: 'Failed to save workspace' });
    }
});

module.exports = router;
