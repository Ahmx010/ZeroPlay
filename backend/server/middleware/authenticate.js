const {
  supabase,
  hasSupabaseConfig,
  createSupabaseUserClient,
} = require("../services/supabaseClient");

function getBearerToken(authorizationHeader) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token, ...extraParts] = authorizationHeader.trim().split(/\s+/);

  if (extraParts.length > 0 || scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

async function authenticate(req, res, next) {
  if (!hasSupabaseConfig || !supabase) {
    return res.status(500).json({
      success: false,
      message: "Supabase is not configured.",
    });
  }

  const accessToken = getBearerToken(req.get("authorization"));

  if (!accessToken) {
    return res.status(401).json({
      success: false,
      message: "Missing or invalid Authorization bearer token.",
    });
  }

  try {
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    req.accessToken = accessToken;
    req.user = {
      id: data.user.id,
      email: data.user.email,
      emailConfirmedAt: data.user.email_confirmed_at,
      createdAt: data.user.created_at,
      role: data.user.role,
      appMetadata: data.user.app_metadata,
      userMetadata: data.user.user_metadata,
    };
    req.supabase = createSupabaseUserClient(accessToken);

    return next();
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: "Could not verify authentication token.",
    });
  }
}

module.exports = {
  authenticate,
  getBearerToken,
};
