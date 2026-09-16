// controllers/categoryController.js
const CategoryModel = require('../models/categoryModel');

async function getCategories(req, res, next) {
  try {
    const categories = await CategoryModel.getAll();
    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name, description } = req.body;
    const image = req.file ? req.file.filename : req.body.image;
    const id = await CategoryModel.create({ name, description, image });
    res.status(201).json({ success: true, id });
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const { name, description } = req.body;
    const image = req.file ? req.file.filename : req.body.image;
    await CategoryModel.update(req.params.id, { name, description, image });
    res.json({ success: true, message: 'Category updated.' });
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    await CategoryModel.remove(req.params.id);
    res.json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
