const REST_ROOT = "https://api.github.com";
const GRAPHQL_ROOT = "https://api.github.com/graphql";

export interface RepoCardData {
  name: string;
  description: string;
  url: string;
  language?: string;
  stars: number;
  updatedAt: string;
}

export interface GitHubOverview {
  profile: {
    login: string;
    avatarUrl: string;
    bio: string;
    followers: number;
    following: number;
    publicRepos: number;
    profileUrl: string;
  };
  repos: RepoCardData[];
}

export async function getGitHubOverview(username: string, token?: string) {
  try {
    const profile = await fetchJson(`${REST_ROOT}/users/${username}`, token);
    const repos = token
      ? await getPinnedRepos(username, token)
      : await getRecentRepos(username, token);

    return {
      profile: {
        login: profile.login,
        avatarUrl: profile.avatar_url,
        bio: profile.bio ?? "A builder connecting notes, code, and writing.",
        followers: profile.followers,
        following: profile.following,
        publicRepos: profile.public_repos,
        profileUrl: profile.html_url
      },
      repos
    } satisfies GitHubOverview;
  } catch {
    return fallbackOverview(username);
  }
}

async function getRecentRepos(username: string, token?: string) {
  const repos = await fetchJson(
    `${REST_ROOT}/users/${username}/repos?sort=updated&per_page=6`,
    token
  );

  return repos.map((repo: any) => ({
    name: repo.name,
    description: repo.description ?? "No description yet.",
    url: repo.html_url,
    language: repo.language ?? "Mixed",
    stars: repo.stargazers_count,
    updatedAt: repo.updated_at
  })) as RepoCardData[];
}

async function getPinnedRepos(username: string, token: string) {
  const query = `
    query Pinned($login: String!) {
      user(login: $login) {
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes {
            ... on Repository {
              name
              description
              url
              stargazerCount
              updatedAt
              primaryLanguage {
                name
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(GRAPHQL_ROOT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ query, variables: { login: username } })
  });

  if (!response.ok) {
    return getRecentRepos(username, token);
  }

  const payload = await response.json();
  const nodes = payload.data?.user?.pinnedItems?.nodes ?? [];

  if (!nodes.length) {
    return getRecentRepos(username, token);
  }

  return nodes.map((repo: any) => ({
    name: repo.name,
    description: repo.description ?? "Pinned repository",
    url: repo.url,
    language: repo.primaryLanguage?.name ?? "Mixed",
    stars: repo.stargazerCount,
    updatedAt: repo.updatedAt
  })) as RepoCardData[];
}

async function fetchJson(url: string, token?: string) {
  const response = await fetch(url, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`
        }
      : undefined
  });

  if (!response.ok) {
    throw new Error(`GitHub request failed: ${response.status}`);
  }

  return response.json();
}

function fallbackOverview(username: string): GitHubOverview {
  return {
    profile: {
      login: username,
      avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
      bio: "Set GITHUB_USERNAME and GITHUB_TOKEN to show your live GitHub profile.",
      followers: 0,
      following: 0,
      publicRepos: 0,
      profileUrl: `https://github.com/${username}`
    },
    repos: [
      {
        name: "portfolio-router",
        description: "A fallback showcase card until live GitHub data is configured.",
        url: `https://github.com/${username}`,
        language: "Astro",
        stars: 0,
        updatedAt: new Date().toISOString()
      }
    ]
  };
}
