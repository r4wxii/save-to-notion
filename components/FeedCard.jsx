import {
  Component,
  Fragment,
  h,
  Img,
  Link,
  Suspense,
} from "https://deno.land/x/nano_jsx@v0.0.30/mod.ts";
import { tw } from "https://cdn.skypack.dev/twind@0.16.17?min";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.28-alpha/deno-dom-wasm.ts";

export const FeedCard = (prop) => {
  return (
    <div class={tw`max-w-sm rounded overflow-hidden shadow-lg m-8`}>
      <Suspense
        src={() =>
          fetch(`api/getOgpImage?url=${prop.item.canonicalUrl}`).then((
            result,
          ) => result.text())}
        fallback={<div>loading...</div>}
      >
        <Img lazy={false} />
      </Suspense>
      <Link
        class={tw`font-bold text-xl mb-2`}
        prefetch
        href={prop.item.canonicalUrl}
      >
        {prop.item.title}
      </Link>
    </div>
  );
};

function getOgpImage(url) {
  return fetch(url).then((res) => res.text()).then((text) => {
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
  }).then((list) =>
    list.filter((header) => header ?? false).find((header) =>
      header.prop == "og:image"
    )
  ).then((image) => {
    console.log(image);
    return image.content;
  });
}
