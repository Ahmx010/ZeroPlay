const FAVORITES_TABLE = "favorites";
const FAVORITES_SELECT = `
  id,
  user_id,
  team_id,
  created_at,
  team:teams (
    id,
    name,
    league,
    country
  )
`;

function createServiceError(message, statusCode, details) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

function assertUserClient(userClient) {
  if (!userClient) {
    throw createServiceError("Authenticated Supabase client is not available.", 500);
  }
}

function handleFavoriteError(error) {
  if (!error) {
    return;
  }

  if (error.code === "23505") {
    throw createServiceError("Team is already in favorites.", 409, error);
  }

  if (error.code === "23503") {
    throw createServiceError("Team does not exist.", 400, error);
  }

  throw createServiceError(error.message || "Favorite request failed.", 500, error);
}

async function getFavorites(userId, userClient) {
  assertUserClient(userClient);

  const { data, error } = await userClient
    .from(FAVORITES_TABLE)
    .select(FAVORITES_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  handleFavoriteError(error);

  return data || [];
}

async function addFavorite(userId, teamId, userClient) {
  assertUserClient(userClient);

  const { data, error } = await userClient
    .from(FAVORITES_TABLE)
    .insert({
      user_id: userId,
      team_id: teamId,
    })
    .select(FAVORITES_SELECT)
    .single();

  handleFavoriteError(error);

  return data;
}

async function deleteFavorite(userId, favoriteId, userClient) {
  assertUserClient(userClient);

  const { data, error } = await userClient
    .from(FAVORITES_TABLE)
    .delete()
    .eq("id", favoriteId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  handleFavoriteError(error);

  if (!data) {
    throw createServiceError("Favorite not found.", 404);
  }

  return {
    id: favoriteId,
  };
}

module.exports = {
  getFavorites,
  addFavorite,
  deleteFavorite,
};
