# Turbo Shadow

Provides event handling and an HTMLElement mixin for [Declarative Shadow DOM](https://web.dev/declarative-shadow-dom) in [Hotwire Turbo](https://turbo.hotwired.dev). (Requires the latest [Turbo 7.2 release](https://github.com/hotwired/turbo/releases), currently as a release candidate.)

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
  <template shadowroot="open">
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
  <template shadowroot="open">
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

You can write out this (or generate it automatically from a template engine):

```html
<h1>Hello World from a Web Server</h1>

<howdy-folks>
  <template shadowroot="open">
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

First of all, DSD is only natively supported in Chromium browsers. You would need to use a polyfill for Firefox and Safari. However, there are no polyfills out there (that I'm aware of) which support Turbo's event system (for Drive, Frames, and Streams). And even if there were, they don't provide extra support for the custom element to get notified when a shadow root has actually been attached. Expecting it to be in place already when `connectedCallback` gets triggered is a no-go, because Turbo has already attached new elements to the document prior to the triggering of Turbo events. Something would need to intercept the Turbo events, run a polyfill, and then notify the elements that the shadow roots are now attached.

In addition, Turbo currently isn't even compatible with the native DSD support in Chromium, because standard HTML parsing methods in JavaScript don't support DSD for security reasons. For example, if you were to run this:

```js
(new DOMParser()).parseFromString(htmlContainingDSD, "text/html")
```

Any shadow root templates in the `htmlContaintingDSD` would be ignored…aka they'd just remain inert templates in the output node tree. To get real attached shadow DOM roots, you'd have to supply an extra argument:

```js
(new DOMParser()).parseFromString(htmlContainingDSD, "text/html", { includeShadowRoots: true })
```

This is all described in the [DSD spec explainer](https://github.com/mfreed7/declarative-shadow-dom#mitigation).

Will Turbo itself get updated in the future to support this? Possibly, but unlikely until the DSD spec is itself supported by all major browsers. Until that time, you will need a Turbo-specific polyfill to handle full DSD support.

**Introducing: Turbo Shadow.** 😎

If you find any bugs or edge cases that need solving, [please file an issue!](https://github.com/whitefusionhq/turbo-shadow/issues) Otherwise, the primary goal of this library is widespread stability, so I am unlikely to add any additional features in the near future.
