import { hydrate } from "https://deno.land/x/nano_jsx@v0.0.30/mod.ts";
import { Feeds } from "../components/Feeds.jsx";

const result = await fetch("api/getFeeds").then((response) => response.json());
const obj = new Object();
obj.feeds = result;
hydrate(Feeds(obj), document.getElementById("feeds"));
