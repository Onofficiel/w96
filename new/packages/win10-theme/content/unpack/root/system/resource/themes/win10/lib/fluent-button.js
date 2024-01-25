// Create a custom element with the fluent button style
// (The borders of the button are reactive to the mouse position)

class FluentButton extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });

    // Customization options
    const imageSrc = this.getAttribute("img") || null;
    const imageSize = this.getAttribute("img-size") || "16px";
    const height = this.getAttribute("height") || "40px";

    shadow.innerHTML = `
      <style>
        :host {
          display: inline-flex;

          --mouse-x: 0px;
          --mouse-y: 0px;

          --border-size: 1px;

          --light-radius: 50px;

          --image-size: ${imageSize};
          --padding: calc((${height} - var(--image-size)) / 2);
        }

        * {
          box-sizing: border-box;
        }

        #fluent {
          position: relative;

          font-size: 14px;
          font-family: "Segoe UI", sans-serif;

          padding: var(--border-size);

          display: block;
          overflow: hidden;

          width: 100%;

          transition: all .2s ease;
        }

        #fluent>#fluent-bg {
          position: relative;

          display: flex;
          align-items: center;

          pointer-events: none;

          height: calc(${height} - (var(--border-size) * 2));

          overflow: hidden;
          padding: var(--padding);
          gap: var(--padding);

          transition: all .2s ease;
        }

        #fluent:hover {
          background-color: rgba(89 89 89 / 40%);
          color: #fff;
        }

        #fluent:hover>#fluent-bg {
          background-color: rgba(89 89 89 / 70%);
        }

        #fluent:active>#fluent-bg {
          background-color: rgba(89 89 89 / 50%);
        }

        #fluent::before {
          content: "";

          position: absolute;
          left: var(--mouse-x);
          top: var(--mouse-y);

          width: calc(var(--light-radius) * 2);
          aspect-ratio: 1;

          background-image: none;

          translate: -50% -50%;
        }

        #fluent:hover::before {
          background-image: radial-gradient(
              closest-side circle at 50% 50%,
              #fff 0%, #0000 100%
            )
          ;
        }

        #fluent>#fluent-bg>#image {
          height: var(--image-size);
          aspect-ratio: 1;

          background-image: url(${imageSrc});
          background-repeat: no-repeat;
          background-size: var(--image-size);
          background-position: center;
        }

        #fluent slot {
          position: relative;

          pointer-events: none;
          user-select: none;
        }
      </style>

      <div id="fluent" role="button">
        <div id="fluent-bg">
          ${imageSrc ? `<div id="image"></div>` : ""}
          <slot></slot>
        </div>
      </div>
    `;

    // Set the css vars with the mouse position
    shadow.addEventListener("mousemove", (e) => {
      const box = shadow.querySelector("#fluent").getBoundingClientRect();

      this.style.setProperty("--mouse-x", `${e.clientX - box.left}px`);
      this.style.setProperty("--mouse-y", `${e.clientY - box.top}px`);
    });
  }
}

customElements.define("fluent-button", FluentButton);