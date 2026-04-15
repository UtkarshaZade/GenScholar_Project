const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all documents for the sidebar history
router.get('/', async (req, res, next) => {
  try {
    const docs = await prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        formatType: true,
        createdAt: true
      }
    });
    res.json(docs);
  } catch (error) {
    next(error);
  }
});

// GET a specific document by ID
router.get('/:id', async (req, res, next) => {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id }
    });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(doc);
  } catch (error) {
    next(error);
  }
});

// POST a new document after formatting Let's assume it saves automatically
router.post('/', async (req, res, next) => {
  try {
    const { title, originalText, formattedText, formatType } = req.body;
    
    if (!originalText || !formattedText || !formatType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const doc = await prisma.document.create({
      data: {
        title: title || 'Untitled Paper',
        originalText,
        formattedText,
        formatType
      }
    });
    
    res.json(doc);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
