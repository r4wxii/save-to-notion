import { h } from "https://deno.land/x/nano_jsx@v0.0.30/mod.ts";
import { tw } from "https://cdn.skypack.dev/twind@0.16.17?min";
import { FeedCard } from "./FeedCard.jsx";

export const Feeds = (prop) => (
  <div id="feeds" class={tw`grid grid-cols-4 gap-y-8`}>
    {prop.feeds.map((feed) =>
      feed.items.map((item) => <FeedCard item={item} />)
    )}
  </div>
);
