const Joi = require('joi');
const xss = require('xss');

/**
 * Comprehensive validation schemas for all API endpoints
 */
const validationSchemas = {
    // Authentication schemas
    login: Joi.object({
        email: Joi.string()
            .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'co', 'br', 'uk', 'edu', 'gov'] } })
            .max(255)
            .required()
            .messages({
                'string.email': 'Please provide a valid email address',
                'any.required': 'Email is required'
            }),
        password: Joi.string()
            .min(6)
            .max(128)
            .required()
            .messages({
                'string.min': 'Password must be at least 6 characters long',
                'any.required': 'Password is required'
            })
    }),

    signup: Joi.object({
        name: Joi.string()
            .min(2)
            .max(100)
            .pattern(/^[a-zA-Z\s\u00C0-\u017F]+$/) // Allow letters, spaces, and accented characters
            .required()
            .messages({
                'string.pattern.base': 'Name can only contain letters and spaces',
                'string.min': 'Name must be at least 2 characters long',
                'any.required': 'Name is required'
            }),
        email: Joi.string()
            .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'co', 'br', 'uk', 'edu', 'gov'] } })
            .max(255)
            .required(),
        password: Joi.string()
            .min(8)
            .max(128)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .required()
            .messages({
                'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                'string.min': 'Password must be at least 8 characters long'
            }),
        role: Joi.string()
            .valid('user', 'admin')
            .default('user')
    }),

    // Transaction schemas
    transaction: Joi.object({
        description: Joi.string()
            .min(1)
            .max(500)
            .required()
            .custom((value, helpers) => {
                // Sanitize XSS
                const cleaned = xss(value, {
                    whiteList: {}, // No HTML tags allowed
                    stripIgnoreTag: true,
                    stripIgnoreTagBody: ['script']
                });
                return cleaned.trim();
            }),
        amount: Joi.number()
            .precision(2)
            .positive()
            .max(1000000)
            .required()
            .messages({
                'number.positive': 'Amount must be a positive number',
                'number.max': 'Amount cannot exceed $1,000,000'
            }),
        category: Joi.string()
            .min(1)
            .max(100)
            .required()
            .custom((value, helpers) => {
                return xss(value, { whiteList: {}, stripIgnoreTag: true });
            }),
        date: Joi.date()
            .iso()
            .max('now')
            .min('1900-01-01')
            .required()
            .messages({
                'date.max': 'Date cannot be in the future',
                'date.min': 'Date must be after 1900'
            }),
        typeId: Joi.number()
            .integer()
            .positive()
            .valid(1, 2, 3) // Expense, Income, Savings
            .required()
    }),

    // Category schemas
    category: Joi.object({
        name: Joi.string()
            .min(1)
            .max(100)
            .required()
            .custom((value, helpers) => {
                return xss(value, { whiteList: {}, stripIgnoreTag: true });
            }),
        typeId: Joi.number()
            .integer()
            .positive()
            .valid(1, 2, 3)
            .required(),
        color: Joi.string()
            .pattern(/^#[0-9A-Fa-f]{6}$/)
            .optional()
            .messages({
                'string.pattern.base': 'Color must be a valid hex color code (e.g., #FF0000)'
            }),
        icon: Joi.string()
            .max(50)
            .optional()
            .custom((value, helpers) => {
                return xss(value, { whiteList: {}, stripIgnoreTag: true });
            })
    }),

    // Budget schemas
    budget: Joi.object({
        categoryId: Joi.string()
            .uuid()
            .required(),
        amount: Joi.number()
            .precision(2)
            .positive()
            .max(1000000)
            .required(),
        month: Joi.date()
            .iso()
            .required()
    }),

    // Group schemas
    group: Joi.object({
        name: Joi.string()
            .min(1)
            .max(100)
            .required()
            .custom((value, helpers) => {
                return xss(value, { whiteList: {}, stripIgnoreTag: true });
            }),
        description: Joi.string()
            .max(500)
            .optional()
            .custom((value, helpers) => {
                return xss(value, { whiteList: {}, stripIgnoreTag: true });
            })
    }),

    // Savings goal schemas
    savingsGoal: Joi.object({
        goal_name: Joi.string()
            .min(1)
            .max(100)
            .required()
            .custom((value, helpers) => {
                return xss(value, { whiteList: {}, stripIgnoreTag: true });
            }),
        target_amount: Joi.number()
            .precision(2)
            .positive()
            .max(10000000)
            .required(),
        target_date: Joi.date()
            .iso()
            .min('now')
            .optional()
            .messages({
                'date.min': 'Target date must be in the future'
            })
    }),

    // AI feedback schemas
    aiFeedback: Joi.object({
        transaction_description: Joi.string()
            .min(1)
            .max(500)
            .required()
            .custom((value, helpers) => {
                return xss(value, { whiteList: {}, stripIgnoreTag: true });
            }),
        suggested_category: Joi.string()
            .min(1)
            .max(100)
            .required(),
        actual_category: Joi.string()
            .min(1)
            .max(100)
            .required(),
        was_suggestion_accepted: Joi.boolean()
            .required(),
        transaction_amount: Joi.number()
            .precision(2)
            .positive()
            .optional()
    }),

    // Query parameter schemas
    queryParams: {
        month: Joi.string()
            .pattern(/^\d{4}-\d{2}$/)
            .messages({
                'string.pattern.base': 'Month must be in YYYY-MM format'
            }),
        category: Joi.string()
            .max(100)
            .custom((value, helpers) => {
                return xss(value, { whiteList: {}, stripIgnoreTag: true });
            }),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .default(20),
        offset: Joi.number()
            .integer()
            .min(0)
            .default(0),
        search: Joi.string()
            .max(100)
            .custom((value, helpers) => {
                return xss(value, { whiteList: {}, stripIgnoreTag: true });
            })
    }
};

/**
 * Validation middleware factory
 * @param {Object} schema - Joi schema to validate against
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 */
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false, // Return all validation errors
            stripUnknown: true, // Remove unknown properties
            convert: true // Convert strings to appropriate types
        });

        if (error) {
            const errorDetails = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context.value
            }));

            return res.status(400).json({
                error: 'Validation failed',
                details: errorDetails
            });
        }

        // Replace the request property with the validated and sanitized value
        req[property] = value;
        next();
    };
};

/**
 * Sanitize data to prevent XSS attacks
 * @param {*} data - Data to sanitize
 * @returns {*} - Sanitized data
 */
const sanitizeData = (data) => {
    if (typeof data === 'string') {
        return xss(data, {
            whiteList: {}, // No HTML tags allowed
            stripIgnoreTag: true,
            stripIgnoreTagBody: ['script']
        });
    }
    
    if (Array.isArray(data)) {
        return data.map(sanitizeData);
    }
    
    if (data && typeof data === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            sanitized[key] = sanitizeData(value);
        }
        return sanitized;
    }
    
    return data;
};

module.exports = {
    validationSchemas,
    validate,
    sanitizeData
}; 