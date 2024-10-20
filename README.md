# Turbo Shadow

> [!WARNING]
> I've migrated away from using the Hotwire stack (see [this blog post](https://www.bridgetownrb.com/future/road-to-bridgetown-2.0-escaping-burnout/#the-37signals-problem) for the reasons why I now avoid 37signals-owned codebases), so I don't intend to develop this utility any further. I'll be happy to accept PRs and cut a new release, but beyond that, consider this plugin "done".

----

Provides event handling and an HTMLElement mixin for [Declarative Shadow DOM](https://web.dev/declarative-shadow-dom) support in [Hotwire Turbo](https://turbo.hotwired.dev).

Requires Turbo 7.2 or higher.

## Quick Install

Add the NPM library to your project:

```sh
npm i turbo-shadow
# or
yarn add turbo-shadow
```

Add this to your JavaScript entrypoint (likely `index.js`) right after you import Turbo:

```js
import * as TurboShadow from "turbo-shadow"
```

And add this to your HTML head (unfortunately Turbo's client-side caching will strip out all shadow roots).

```html
<meta name="turbo-cache-control" content="no-cache" />
```

Now when you write a web component by subclassing `HTMLElement` (or some subclass of that), you can use the `ShadowRootable` mixin along with the `shadowRootAttached` promise to ensure by the time you run code within your `connectedCallback`, the shadow root with server-sent declarative markup has already been attached.

```html
<!-- HTML sent from the server and intercepted by Turbo -->
<test-dsd>
  <template shadowrootmode="open">
    <p>Your message is:</p>
    <slot></slot>
  </template>

  <p>Greetings from Turbo</p>
</test-dsd>
```

```js
// Client-side JavaScript
import { ShadowRootable } from "turbo-shadow"

class TestDSDElement extends ShadowRootable(HTMLElement) {
  async connectedCallback() {
    // Wait for the promise that the shadow root has been attached
    await this.shadowRootAttached

    // Shadow DOM markup is now loaded and working for the component
    console.log("The shadow root has been attached", this.shadowRoot.innerHTML)
  }
}
customElements.define("test-dsd", TestDSDElement)
```

Something to note: the client-side JavaScript component definition is actually optional. With Declarative Shadow DOM, you can write HTML-only shadow roots and that's perfectly fine. In fact, you don't even need to use custom elements! You can still get all the benefits of encapsulated styles and DOM that's hidden away from the parent document using most built-in HTML elements. This totally works:

```html
<div style="padding: 10px; background: lightcyan">
  <template shadowrootmode="open">
    <p>Just some regular ol' markup.</p>
    <style>
      /* Styles are fully encapsulated because they only apply to the shadow root! */
      p {
        color: lightsalmon;
      }
    </style>
  </template>
</div>
```

Keep reading for further details…

## Rationale for Turbo Shadow

[Hotwire Turbo](https://turbo.hotwired.dev) is an excellent JavaScript library that can take your MPA (Multi-Page Application) and make it feel more like an SPA (Single-Page Application): with fast page changes which you can augment with slick CSS transitions, frame-like support for loading and updating specific regions of a page in real-time, and a feature called Streams which can surgically alter the DOM from server-driven events.

[Declarative Shadow DOM](https://web.dev/declarative-shadow-dom) (DSD) is an emerging spec for Web Components which lets you define the "shadow DOM" template for a component using server-rendered HTML. So instead of writing out this:

```html
<h1>Hello World from a Web Server</h1>

<howdy-folks>
  <!-- Who knows what will get rendered here? Only the client knows! :( -->
</howdy-folks>
```

You can write out this (or generate it automatically from a template engine of some kind):

```html
<h1>Hello World from a Web Server</h1>

<howdy-folks>
  <template shadowrootmode="open">
    <!-- Now we get to provide the shadow DOM! -->
    <p>Isn't this amazing?!</p>

    <style>
      /* Styles are fully encapsulated because they only apply to the shadow root! */
      p { 
        color: green;
      }
    </style>
  </template>
</howdy-folks>
```

**You would think that Declarative Shadow DOM and Turbo would be a match made in heaven! Both resolve around the centrality of HTML. But…you would be wrong. 😭**

First of all, while DSD is natively supported in evergreen browsers, Turbo currently isn't directly compatible with the native DSD support, because standard HTML parsing methods in JavaScript don't support DSD for security reasons. For example, if you were to run this:

```js
(new DOMParser()).parseFromString(htmlContainingDSD, "text/html")
```

Any shadow root templates in the `htmlContainingDSD` would be ignored…aka they'd just remain inert templates in the output node tree. To get real attached shadow DOM roots, you'd need to switch to `parseHTMLUnsafe` API which is fairly new and not widely supported yet.

Will Turbo itself get updated in the future to support this? Possibly. Until that time, you will need a Turbo-specific polyfill to handle full DSD support.

**Introducing: Turbo Shadow.** 😎
