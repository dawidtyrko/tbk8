const { body } = require('express-validator');

const registrationValidator = [
    body('name')
        .isString().withMessage('Name is required')
        .trim()
        .notEmpty().withMessage('Nazwa jest wymagana')
        .isLength({ min: 3 }).withMessage('Nazwa musi mieć przynajmniej 3 znaki'),

    body('category')
        .notEmpty().withMessage('Kategoria wymagana')
        .isString(),

    body('quantity')
        .notEmpty().withMessage('Ilość wymagana')
        .isInt({gt:0}).withMessage('Liczba całkowita wymagana'),

    body('unitPrice')
        .notEmpty().withMessage('Cena wymagana')
        .isNumeric().withMessage('Cena musi być liczbą')
        .custom(value => value > 0).withMessage('Cena większa od zera'),

    body('dateAdded')
        .notEmpty().withMessage('Data jest wymagana')
        .isISO8601({ strict: true }).withMessage('Data musi być w formacie YYYY-MM-DD'),
    body('supplier')
        .notEmpty().withMessage('Dostawca jest wymagany')
        .isString()
        .isLength({min:3})
];

module.exports = { registrationValidator };