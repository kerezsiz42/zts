import type { Fallible } from "./error.ts";

// https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes
export type GlobalAttribute = "class" | "id" | "style" | "hidden";
export type DataAttribute = `data-${string}`;

export type Attribute =
  | GlobalAttribute
  | DataAttribute
  | "src"
  | "rel"
  | "href"
  | "action"
  | "method"
  | "target"
  | "name"
  | "onload"
  | "onclick"
  | "type"
  | "charset"
  | "content"
  | "lang";

export type Attributes = Partial<{ [key in Attribute]: string[] | string }>;

export type LooseAutocomplete<T extends string> = T | Omit<string, T>;

export type RenderOptions = {
  doctype: string;
  lang: string;
  headers?: HeadersInit;
};

export function render(
  head: string,
  body: string,
  options: RenderOptions = { doctype: "<!DOCTYPE html>", lang: "en" },
): Fallible<Response> {
  const res = new Response(
    `${options.doctype}<html lang=${options.lang}>${head}${body}</html>`,
    {
      headers: { "Content-Type": "text/html", ...options.headers },
    },
  );

  return [res, null] as const;
}

export function attributeToString(
  attr: string,
  values: string[] | string,
): string | undefined {
  if (typeof values === "string") {
    return `${attr}="${values}"`;
  } else if (attr === "style") {
    return `${attr}="${values.join("; ")}"`;
  } else if (attr === "class" || attr === "id") {
    return `${attr}="${values.join(" ")}"`;
  }
}

function $(tag: string, attributes: Attributes, ...children: string[]): string {
  const attributeArray: string[] = [];
  for (const [attribute, value] of Object.entries(attributes)) {
    if (value) {
      const str = attributeToString(attribute, value);
      if (str) {
        attributeArray.push(str);
      }
    }
  }

  const tagWithAttributes = attributeArray.length
    ? `${tag} ${attributeArray.join(" ")}`
    : tag;

  return `<${tagWithAttributes}>${children.join("")}</${tag}>`;
}

export function div(attributes: Attributes, ...children: string[]): string {
  return $("div", attributes, ...children);
}

export function p(attributes: Attributes, ...children: string[]): string {
  return $("p", attributes, ...children);
}

export function head(attributes: Attributes, ...children: string[]): string {
  return $("head", attributes, ...children);
}

export function body(attributes: Attributes, ...children: string[]): string {
  return $("body", attributes, ...children);
}

export function style(attributes: Attributes, ...children: string[]): string {
  return $("style", attributes, ...children);
}

export function script(attributes: Attributes, ...children: string[]): string {
  return $("script", attributes, ...children);
}

export function meta(attributes: Attributes, ...children: string[]): string {
  return $("meta", attributes, ...children);
}

export function link(attributes: Attributes, ...children: string[]): string {
  return $("link", attributes, ...children);
}

export function form(attributes: Attributes, ...children: string[]): string {
  return $("form", attributes, ...children);
}

export function input(attributes: Attributes, ...children: string[]): string {
  return $("input", attributes, ...children);
}

export function iframe(attributes: Attributes, ...children: string[]): string {
  return $("iframe", attributes, ...children);
}

export function header(attributes: Attributes, ...children: string[]): string {
  return $("header", attributes, ...children);
}

export function main(attributes: Attributes, ...children: string[]): string {
  return $("main", attributes, ...children);
}

export function footer(attributes: Attributes, ...children: string[]): string {
  return $("footer", attributes, ...children);
}

export function title(attributes: Attributes, ...children: string[]): string {
  return $("title", attributes, ...children);
}

export function html(attributes: Attributes, ...children: string[]): string {
  return $("html", attributes, ...children);
}

export function a(attributes: Attributes, ...children: string[]): string {
  return $("a", attributes, ...children);
}

export function img(attributes: Attributes, ...children: string[]): string {
  return $("img", attributes, ...children);
}

export function span(attributes: Attributes, ...children: string[]): string {
  return $("span", attributes, ...children);
}

