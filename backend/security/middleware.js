const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
/**
 * Rate limiting configurations for different endpoint types
 */
const rateLimiters = {
    // General API rate limit
    general: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: {
            error: 'Too many requests from this IP, please try again later.',
            retryAfter: '15 minutes'
        },
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        handler: (req, res) => {
            console.warn(`Rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
            res.status(429).json({
                error: 'Too many requests from this IP, please try again later.',
                retryAfter: '15 minutes'
            });
        }
    }),

    // Stricter rate limit for authentication endpoints
    auth: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // Limit each IP to 5 login attempts per windowMs
        message: {
            error: 'Too many authentication attempts, please try again later.',
            retryAfter: '15 minutes'
        },
        skipSuccessfulRequests: true, // Don't count successful requests
        handler: (req, res) => {
            console.warn(`Auth rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
            res.status(429).json({
                error: 'Too many authentication attempts, please try again later.',
                retryAfter: '15 minutes'
            });
        }
    }),

    // API endpoints that might be resource intensive
    intensive: rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 10, // Limit each IP to 10 requests per minute
        message: {
            error: 'Too many requests for this resource, please try again later.',
            retryAfter: '1 minute'
        }
    }),

    // File upload endpoints
    upload: rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10, // Limit each IP to 10 uploads per hour
        message: {
            error: 'Too many file uploads, please try again later.',
            retryAfter: '1 hour'
        }
    })
};

/**
 * Security logging middleware
 */
const securityLogger = morgan('combined', {
    stream: {
        write: (message) => {
            // Log security-relevant requests
            const logData = message.trim();
            if (logData.includes('401') || logData.includes('403') || logData.includes('429')) {
                console.warn(`[SECURITY] ${logData}`);
            }
            
            // In production, you might want to send this to a security monitoring service
            // or write to a dedicated security log file
        }
    }
});

/**
 * Audit logging for sensitive operations
 */
const auditLogger = (action, resource) => {
    return (req, res, next) => {
        // Store original end function
        const originalEnd = res.end;
        
        // Override res.end to capture response
        res.end = function(chunk, encoding) {
            // Log the action
            const auditLog = {
                timestamp: new Date().toISOString(),
                userId: req.user?.id || 'anonymous',
                userEmail: req.user?.email || 'unknown',
                action: action,
                resource: resource,
                method: req.method,
                path: req.path,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                statusCode: res.statusCode,
                success: res.statusCode < 400
            };
            
            console.log(`[AUDIT] ${JSON.stringify(auditLog)}`);
            
            // Call original end function
            originalEnd.call(this, chunk, encoding);
        };
        
        next();
    };
};

/**
 * IP whitelist middleware (for admin endpoints if needed)
 */
const ipWhitelist = (allowedIPs = []) => {
    return (req, res, next) => {
        if (allowedIPs.length === 0) {
            return next(); // No whitelist configured, allow all
        }
        
        const clientIP = req.ip || req.connection.remoteAddress;
        
        if (!allowedIPs.includes(clientIP)) {
            console.warn(`[SECURITY] Blocked request from non-whitelisted IP: ${clientIP}`);
            return res.status(403).json({ error: 'Access denied from this IP address' });
        }
        
        next();
    };
};

/**
 * Request size limiter
 */
const requestSizeLimiter = (maxSize = '10mb') => {
    return (req, res, next) => {
        req.on('data', (chunk) => {
            req.body = (req.body || '') + chunk;
            
            // Check if request body exceeds the limit
            if (req.body.length > parseInt(maxSize)) {
                res.status(413).json({ error: 'Request entity too large' });
                return;
            }
        });
        
        next();
    };
};

/**
 * Security headers configuration
 */
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://*.supabase.co"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Disable if using external APIs
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    }
});

/**
 * Error handling middleware that doesn't leak information
 */
const secureErrorHandler = (err, req, res, next) => {
    // Log the full error for debugging
    console.error(`[ERROR] ${err.stack}`);
    
    // Audit log for errors
    console.log(`[AUDIT] Error - User: ${req.user?.id || 'anonymous'}, Path: ${req.path}, Error: ${err.message}`);
    
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(err.status || 500).json({
        error: isDevelopment ? err.message : 'Internal server error',
        ...(isDevelopment && { stack: err.stack })
    });
};

/**
 * CORS configuration for production
 */
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:5173',
            'https://localhost:5173',
            // Add your production domains here
        ];
        
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        console.warn(`[SECURITY] Blocked CORS request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400 // 24 hours
};

module.exports = {
    rateLimiters,
    securityLogger,
    auditLogger,
    ipWhitelist,
    requestSizeLimiter,
    securityHeaders,
    secureErrorHandler,
    corsOptions,
    // Export security middleware as a bundle
    applyBasicSecurity: (app) => {
        app.use(compression()); // Compress responses
        app.use(securityHeaders); // Apply security headers
        app.use(hpp()); // Protect against HTTP Parameter Pollution
        app.use(mongoSanitize()); // Prevent NoSQL injection
        app.use(securityLogger); // Log security events
    }
}; 