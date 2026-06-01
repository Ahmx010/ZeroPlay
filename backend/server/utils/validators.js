function validateTeam(team) {
    if (!team || typeof team !== "object") {
        return "Team data is required";
    }

    if (typeof team.name !== "string" || team.name.trim().length === 0) {
        return "Team name is required";
    }

    if (typeof team.league !== "string" || team.league.trim().length === 0) {
        return "League is required";
    }

    if (typeof team.country !== "string" || team.country.trim().length === 0) {
        return "Country is required";
    }

    return null;
}

function isObject(value) {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stripWrappingQuotes(value) {
    const trimmedValue = value.trim();
    const firstCharacter = trimmedValue[0];
    const lastCharacter = trimmedValue[trimmedValue.length - 1];

    if (
        trimmedValue.length >= 2 &&
        ((firstCharacter === "\"" && lastCharacter === "\"") ||
            (firstCharacter === "'" && lastCharacter === "'"))
    ) {
        return trimmedValue.slice(1, -1).trim();
    }

    return trimmedValue;
}

function normalizeEmail(email) {
    if (typeof email !== "string") {
        return "";
    }

    return stripWrappingQuotes(email).toLowerCase();
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function getFavoriteTeamId(favorite) {
    return favorite?.team_id ?? favorite?.teamId;
}

function validateSignup(body) {
    if (!isObject(body)) {
        return "Signup data is required";
    }

    if (typeof body.email !== "string" || !isValidEmail(body.email)) {
        return "A valid email is required";
    }

    if (typeof body.password !== "string" || body.password.length < 8) {
        return "Password must be at least 8 characters";
    }

    if (typeof body.username !== "string") {
        return "Username is required";
    }

    const username = body.username.trim();

    if (username.length < 3 || username.length > 30) {
        return "Username must be between 3 and 30 characters";
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return "Username can only contain letters, numbers, and underscores";
    }

    return null;
}

function validateLogin(body) {
    if (!isObject(body)) {
        return "Login data is required";
    }

    if (typeof body.email !== "string" || !isValidEmail(body.email)) {
        return "A valid email is required";
    }

    if (typeof body.password !== "string" || body.password.length === 0) {
        return "Password is required";
    }

    return null;
}

function validateUpdateAccount(body) {
    if (!isObject(body)) {
        return "Account update data is required";
    }

    const hasUsername = Object.prototype.hasOwnProperty.call(body, "username");
    const hasEmail = Object.prototype.hasOwnProperty.call(body, "email");
    const hasPassword = Object.prototype.hasOwnProperty.call(body, "password");

    if (!hasUsername && !hasEmail && !hasPassword) {
        return "At least one account field is required";
    }

    if (hasUsername) {
        if (typeof body.username !== "string") {
            return "Username must be a string";
        }

        const username = body.username.trim();

        if (username.length < 3 || username.length > 30) {
            return "Username must be between 3 and 30 characters";
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return "Username can only contain letters, numbers, and underscores";
        }
    }

    if (hasEmail && (typeof body.email !== "string" || !isValidEmail(body.email))) {
        return "A valid email is required";
    }

    if (hasPassword && (typeof body.password !== "string" || body.password.length < 8)) {
        return "Password must be at least 8 characters";
    }

    if (
        (hasEmail || hasPassword) &&
        (typeof body.currentPassword !== "string" || body.currentPassword.length === 0)
    ) {
        return "Current password is required";
    }

    return null;
}

function validateCreateFavorite(body) {
    if (!isObject(body)) {
        return "Favorite data is required";
    }

    const teamId = Number(getFavoriteTeamId(body));

    if (!Number.isInteger(teamId) || teamId <= 0) {
        return "A valid team_id is required";
    }

    return null;
}

function validateFavoriteId(id) {
    const favoriteId = Number(id);

    if (!Number.isInteger(favoriteId) || favoriteId <= 0) {
        return "A valid favorite id is required";
    }

    return null;
}

module.exports = {
    validateTeam,
    validateSignup,
    validateLogin,
    validateUpdateAccount,
    validateCreateFavorite,
    validateFavoriteId,
    getFavoriteTeamId,
    normalizeEmail,
};
