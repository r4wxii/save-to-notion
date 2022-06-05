import { serve } from "https://deno.land/std@0.130.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.130.0/http/file_server.ts";
import { h, renderSSR } from "https://deno.land/x/nano_jsx@v0.0.30/mod.ts";
import { setup, tw } from "https://cdn.skypack.dev/twind@0.16.17?min";
import {
  getStyleTag,
  virtualSheet,
} from "https://cdn.skypack.dev/twind@0.16.17/sheets?min";
import { Feeds } from "./components/Feeds.jsx";
import { FeedCard } from "./components/FeedCard.jsx";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.28-alpha/src/dom/dom-parser.ts";

const sheet = virtualSheet();

serve(async (request) => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname.startsWith("/static/")) {
    return serveDir(request, {
      fsRoot: "",
      urlRoot: "",
    });
  }

  if (pathname.startsWith("/api")) {
    switch (pathname) {
      case "/api/getFeeds":
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
              const req = new Request(
                `${request.url}/expired-feedly-token.html`,
              );
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

        return new Response(JSON.stringify(results), {
          headers: {
            "content-type": "application/json",
          },
        });
      case "/api/getOgpImage":
        const params = url.searchParams;
        const target = params.get("url");
        const result = await fetch(target).then((res) => res.text()).then(
          (text) => {
            const dom = new DOMParser().parseFromString(text, "text/html");
            const headers = (dom.head.children);

            return Array.from(headers).map((header) => {
              const prop = header.getAttribute("property");
              if (!prop) return;
              return {
                prop: prop,
                content: header.getAttribute("content"),
              };
            });
          },
        ).then((list) =>
          list.filter((header) => header ?? false).find((header) =>
            header.prop == "og:image"
          )
        ).then((image) => image.content);

        return new Response(result);
    }
  }

  setup({ sheet });
  sheet.reset();
  const html = renderSSR(<Feeds feeds={[]} />);

  const styleTag = getStyleTag(sheet);

  return new Response(
    renderSSR(`<html lang="ja">
      <head>
        <title>index</title>
        <meta charset="UTF-8" />
        ${styleTag}
      </head>
      <body>
      <script type="module" src="static/client.bundle.js"></script>
        ${html}
      </body>
    </html>`),
    {
      headers: {
        "content-type": "text/html",
      },
    },
  );
});
