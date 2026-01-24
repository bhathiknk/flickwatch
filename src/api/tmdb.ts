import axios, { AxiosError } from "axios";

/**
 * TMDB API client and endpoints.
 * Keep all TMDB calls here so screens stay clean and consistent.
 */

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Expo recommends EXPO_PUBLIC_ vars for client-side access
const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;

if (!TMDB_API_KEY) {
  // Fail early so you don't waste time debugging empty responses
  throw new Error(
    "Missing TMDB API key. Set EXPO_PUBLIC_TMDB_API_KEY in your .env file."
  );
}

export type MediaType = "movie" | "tv";

export type TMDBPaginatedResponse<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

export type TMDBGenre = {
  id: number;
  name: string;
};

export type TMDBMediaBase = {
  id: number;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  genre_ids?: number[];
  overview?: string;
  media_type?: MediaType;
};

export type TMDBMovie = TMDBMediaBase & {
  title: string;
  release_date: string;
};

export type TMDBTV = TMDBMediaBase & {
  name: string;
  first_air_date: string;
};

export type TMDBSearchItem = (TMDBMovie | TMDBTV) & {
  media_type: MediaType;
};

export type TMDBMovieDetails = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
  genres: TMDBGenre[];
  runtime: number | null;
};

export type TMDBTVDetails = {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  first_air_date: string;
  genres: TMDBGenre[];
  episode_run_time: number[];
};

export type TMDBCreditsResponse = {
  id: number;
  cast: Array<{
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
  }>;
};

export type ApiError = {
  message: string;
  status?: number;
  code?: string;
  url?: string;
};

const client = axios.create({
  baseURL: TMDB_BASE_URL,
  timeout: 12_000,
  params: {
    api_key: TMDB_API_KEY,
    language: "en-US",
  },
});

/**
 * Normalize Axios errors into a consistent shape that UI can display.
 * This avoids repeating try/catch formatting across screens.
 */
function toApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const axErr = err as AxiosError<any>;
    const status = axErr.response?.status;
    const url = axErr.config?.url;

    // TMDB often includes "status_message" in body for errors
    const tmdbMessage =
      axErr.response?.data?.status_message || axErr.response?.data?.message;

    return {
      message:
        tmdbMessage ||
        axErr.message ||
        "Something went wrong while calling TMDB.",
      status,
      code: axErr.code,
      url,
    };
  }

  if (err instanceof Error) {
    return { message: err.message };
  }

  return { message: "Unknown error occurred." };
}

/**
 * Thin request wrapper so all endpoints share the same error behavior.
 */
async function get<T>(path: string, params?: Record<string, any>): Promise<T> {
  try {
    const baseParams = (client.defaults.params as any) || {};

    const res = await client.get<T>(path, {
      params: {
        ...baseParams,
        ...(params ?? {}),
      },
    });

    return res.data;
  } catch (err) {
    throw toApiError(err);
  }
}


/**
 * /movie/popular
 */
export function getPopularMovies(page = 1) {
  return get<TMDBPaginatedResponse<TMDBMovie>>("/movie/popular", { page });
}

/**
 * /trending/all/week
 * Note: this returns mixed types; we filter to movie/tv only.
 */
export async function getTrendingWeek(page = 1) {
  const data = await get<TMDBPaginatedResponse<any>>("/trending/all/week", {
    page,
  });

  const results = (data.results || []).filter(
    (item: any) => item.media_type === "movie" || item.media_type === "tv"
  ) as TMDBSearchItem[];

  return { ...data, results } as TMDBPaginatedResponse<TMDBSearchItem>;
}

/**
 * /tv/top_rated
 */
export function getTopRatedTV(page = 1) {
  return get<TMDBPaginatedResponse<TMDBTV>>("/tv/top_rated", { page });
}

/**
 * /search/multi?query=...
 * Filters out "person" results because FlickWatch is movie/tv focused.
 */
export async function searchMulti(query: string, page = 1) {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return {
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    } as TMDBPaginatedResponse<TMDBSearchItem>;
  }

  const data = await get<TMDBPaginatedResponse<any>>("/search/multi", {
    query: cleanQuery,
    page,
    include_adult: false,
  });

  const results = (data.results || []).filter(
    (item: any) => item.media_type === "movie" || item.media_type === "tv"
  ) as TMDBSearchItem[];

  return { ...data, results } as TMDBPaginatedResponse<TMDBSearchItem>;
}

/**
 * Get details for either a movie or tv show.
 * /movie/{id} or /tv/{id}
 */
export function getDetails(type: MediaType, id: number) {
  if (type === "movie") {
    return get<TMDBMovieDetails>(`/movie/${id}`);
  }
  return get<TMDBTVDetails>(`/tv/${id}`);
}

/**
 * Bonus: credits
 * /movie/{id}/credits or /tv/{id}/credits
 */
export function getCredits(type: MediaType, id: number) {
  const path = type === "movie" ? `/movie/${id}/credits` : `/tv/${id}/credits`;
  return get<TMDBCreditsResponse>(path);
}
