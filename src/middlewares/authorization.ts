const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: No user information' });
        }

        if (typeof roles === 'string') {
            roles = [roles];
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'Forbidden: Insufficient permissions',
                required: roles,
                current: req.user.role
            });
        }

        next();
    };
};

// Specific authorization middlewares
const authorizeAdmin = authorize(['ADMIN']);
const authorizeStaff = authorize(['ADMIN', 'STAFF']);
const authorizeTechnician = authorize(['ADMIN', 'TECHNICIAN']);
module.exports = {
    authorize,
    authorizeAdmin,
    authorizeStaff,
    authorizeTechnician
};
