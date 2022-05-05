import { serve } from "https://deno.land/std@0.130.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.130.0/http/file_server.ts";

serve(async (request) => {
  const feedlyToken = Deno.env.get("feedly");

  const collectionsResponse = await fetch(
    "https://cloud.feedly.com/v3/collections",
    {
      headers: {
        Authorization: `Bearer ${feedlyToken}`,
      },
    },
  );

  if (!collectionsResponse.ok) {
    switch (collectionsResponse.status) {
      case 401:
        const req = new Request(`${request.url}/expired-feedly-token.html`);
        return serveDir(req, {
          fsRoot: "static",
          urlRoot: "",
        });
      default:
        return new Response("error");
    }
  }

  const collections = await collectionsResponse.json();

  const results = await Promise.all(
    collections[0].feeds.map(async (feed) =>
      await (await fetch(
        `https://cloud.feedly.com/v3/streams/${
          encodeURIComponent(feed.id)
        }/contents?count=1000&ranked=oldest&unreadOnly=true`,
        {
          headers: {
            Authorization: `Bearer ${feedlyToken}`,
          },
        },
      )).json()
    ),
  );

  return new Response(JSON.stringify(results));
});
