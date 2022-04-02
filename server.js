import { serve } from "https://deno.land/std@0.130.0/http/server.ts";

serve(async () => {
  const feedlyToken = Deno.env.get("feedly");
  const collections =
    await (await fetch("https://cloud.feedly.com/v3/collections", {
      headers: {
        Authorization: `Bearer ${feedlyToken}`,
      },
    })).json();

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
