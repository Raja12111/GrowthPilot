export type HashnodeConfig = {
  accessToken: string;
  publicationId: string;
};

export type HashnodePublication = {
  id: string;
  title?: string;
  url?: string;
};

export type HashnodeUser = {
  username?: string;
  name?: string;
  publications: HashnodePublication[];
};

export type HashnodePost = {
  id?: string;
  url?: string;
  title?: string;
  slug?: string;
};

const HASHNODE_GQL = "https://gql.hashnode.com";

type GqlError = { message?: string };

async function hashnodeGql<T>(
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(HASHNODE_GQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: accessToken.trim(),
    },
    body: JSON.stringify({ query, variables }),
  });

  const text = await response.text();
  let json: {
    data?: T;
    errors?: GqlError[];
  } = {};
  try {
    json = text ? (JSON.parse(text) as typeof json) : {};
  } catch {
    throw new Error(
      response.ok
        ? "Hashnode returned an invalid response."
        : `Hashnode API error (${response.status}).`,
    );
  }

  if (!response.ok || json.errors?.length) {
    const message =
      json.errors?.map((e) => e.message).filter(Boolean).join(" · ") ||
      `Hashnode API error (${response.status})`;
    throw new Error(message);
  }

  if (!json.data) {
    throw new Error("Hashnode returned no data.");
  }

  return json.data;
}

export async function testHashnodeConnection(accessToken: string) {
  const data = await hashnodeGql<{
    me: {
      username?: string;
      name?: string;
      publications?: {
        edges?: Array<{
          node?: { id?: string; title?: string; url?: string };
        }>;
      };
    } | null;
  }>(
    accessToken,
    `query MePublications {
      me {
        username
        name
        publications(first: 20) {
          edges {
            node {
              id
              title
              url
            }
          }
        }
      }
    }`,
  );

  if (!data.me) {
    throw new Error(
      "Invalid Hashnode token. Generate one in Hashnode → Settings → Developer.",
    );
  }

  const publications =
    data.me.publications?.edges
      ?.map((edge) => edge.node)
      .filter((node): node is { id: string; title?: string; url?: string } =>
        Boolean(node?.id),
      )
      .map((node) => ({
        id: node.id,
        title: node.title,
        url: node.url,
      })) ?? [];

  if (publications.length === 0) {
    throw new Error(
      "Token works, but no Hashnode publication was found. Create a blog first.",
    );
  }

  return {
    username: data.me.username,
    name: data.me.name,
    publications,
  } satisfies HashnodeUser;
}

export function toHashnodeMarkdown(body: string, targetUrl?: string) {
  const cleaned = body.trim();
  const cta = targetUrl?.trim()
    ? `\n\n[Read more](${targetUrl.trim()})`
    : "";
  return `${cleaned}${cta}`;
}

export async function publishToHashnode(
  config: HashnodeConfig,
  input: {
    title: string;
    body: string;
    targetUrl?: string;
  },
) {
  const publicationId = config.publicationId.trim();
  if (!publicationId) {
    throw new Error("Select a Hashnode publication before publishing.");
  }

  const variables: {
    input: {
      publicationId: string;
      title: string;
      contentMarkdown: string;
      originalArticleURL?: string;
    };
  } = {
    input: {
      publicationId,
      title: input.title.trim(),
      contentMarkdown: toHashnodeMarkdown(input.body, input.targetUrl),
    },
  };

  if (input.targetUrl?.trim()) {
    variables.input.originalArticleURL = input.targetUrl.trim();
  }

  const data = await hashnodeGql<{
    publishPost?: {
      post?: {
        id?: string;
        url?: string;
        title?: string;
        slug?: string;
      };
    };
  }>(
    config.accessToken,
    `mutation PublishPost($input: PublishPostInput!) {
      publishPost(input: $input) {
        post {
          id
          url
          title
          slug
        }
      }
    }`,
    variables,
  );

  const post = data.publishPost?.post;
  if (!post?.url && !post?.id) {
    throw new Error(
      "Hashnode publish returned no post. Writing via API may require Hashnode Pro on the publication.",
    );
  }

  return {
    id: post.id,
    url: post.url || "",
    title: post.title || input.title,
    slug: post.slug,
  } satisfies HashnodePost;
}
